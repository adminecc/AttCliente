const { app } = require("@azure/functions");
const { validateSolicitudPayload } = require("../shared/validation");
const { generarTokenForType } = require("../shared/token");
const {
  getAccessTokenConfig,
  validateAccessToken,
  createTableClient,
} = require("../shared/access-token");
const { PUBLIC_ERRORS, getPublicSessionError } = require("../shared/public-errors");
const {
  getGraphAccessToken,
  createListItem,
  buildSharePointFields,
  uploadListItemAttachments,
  uploadNativeListItemAttachments,
} = require("../shared/sharepoint");

app.http("crearSolicitud", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/crear",
  handler: async (request, context) => {
    try {
      return await handleCrearSolicitud(request, context);
    } catch (error) {
      context.error("crearSolicitud - error no controlado:", error.message, error.stack);

      return jsonResponse(500, {
        ok: false,
        error: PUBLIC_ERRORS.serviceUnavailable,
      });
    }
  },
});

async function handleCrearSolicitud(request, context) {
  context.log("crearSolicitud - inicio");

  const accessTokenConfig = getAccessTokenConfig();
  let accessTokenValidation = null;

  // Seguridad: se valida el token antes de procesar la solicitud, pero NO se marca
  // como usado en este punto. Se cerrara solo cuando el item se haya creado.
  if (accessTokenConfig.requireForSolicitudes) {
    try {
      accessTokenValidation = await validateAccessToken(request, {
        config: {
          ...accessTokenConfig,
          singleUse: false,
        },
      });
    } catch (error) {
      context.error("crearSolicitud - error validando token temporal:", error.message);
      return jsonResponse(500, {
        ok: false,
        error: PUBLIC_ERRORS.serviceUnavailable,
      });
    }

    if (!accessTokenValidation.valid) {
      context.warn?.(`crearSolicitud - token temporal rechazado: ${accessTokenValidation.error || "no valido"}`);
      return jsonResponse(accessTokenValidation.status || 401, {
        ok: false,
        error: getPublicSessionError(accessTokenValidation.error),
      });
    }

    if (accessTokenConfig.singleUse && isAccessTokenEntityUsed(accessTokenValidation.entity)) {
      context.warn?.("crearSolicitud - token temporal rechazado: Token de acceso ya utilizado.");
      return jsonResponse(401, {
        ok: false,
        error: PUBLIC_ERRORS.usedSession,
      });
    }
  }

  let body;
  let files = [];
  try {
    const parsedRequest = await parseSolicitudRequest(request);
    body = parsedRequest.payload;
    files = parsedRequest.files;
    context.log(
      `crearSolicitud - payload recibido tipo=${body?.tipoFormulario || "desconocido"} adjuntos=${files.length}`
    );
    files.forEach((file, index) => {
      context.log(
        `crearSolicitud - adjunto[${index}] field=${file.fieldName || ""} nombre='${file.fileName || ""}' tipo=${file.contentType || ""} bytes=${file.sizeBytes || file.content?.length || 0}`
      );
    });
  } catch (error) {
    context.warn?.("crearSolicitud - petición no válida:", error.message);
    return jsonResponse(400, {
      ok: false,
      error: PUBLIC_ERRORS.invalidRequest,
    });
  }

  const validation = validateSolicitudPayload(body);
  if (!validation.valid) {
    context.warn?.(
      `crearSolicitud - ${validation.errors.length} error(es) de validación: ${validation.errors.join(", ")}`
    );
    return jsonResponse(400, {
      ok: false,
      error: PUBLIC_ERRORS.invalidFields,
    });
  }

  const createdAt = new Date().toISOString();
  const token = generarTokenForType(validation.type);
  const fields = buildSharePointFields(validation.payload, validation.type, token, createdAt);

  let accessToken;
  try {
    accessToken = await getGraphAccessToken();
  } catch (error) {
    context.error("crearSolicitud - error autenticando con Microsoft Graph:", error.message);
    return jsonResponse(500, {
      ok: false,
      error: PUBLIC_ERRORS.serviceUnavailable,
    });
  }

  let createdItem;
  try {
    createdItem = await createListItem(
      accessToken,
      validation.type,
      fields,
      undefined,
      context
    );
  } catch (error) {
    context.error("crearSolicitud - error creando item SharePoint:", error.message, error.response?.data);
    return jsonResponse(500, {
      ok: false,
      error: PUBLIC_ERRORS.serviceUnavailable,
    });
  }

  const attachmentWarnings = [];
  const uploadedAttachments = [];

  // Para el resto de formularios se conserva el flujo original.
  // El generador PDF solo se carga y ejecuta para TARJETAS_METRO.
  if (isTarjetaMasMetro(validation.type)) {
    let generatedReport;

    try {
      const {
        generarInformeTarjetaMasMetro,
      } = require("../shared/tarjeta-mas-metro-report");

      generatedReport = await generarInformeTarjetaMasMetro(
        validation.payload,
        {
          createdAt,
          token,
          files,
          itemId: createdItem.id,
          logoPath: process.env.METRO_MALAGA_LOGO_PATH,
        }
      );

      validateGeneratedReport(generatedReport);

      context.log(
        `crearSolicitud - informe Tarjeta Mas Metro generado nombre='${generatedReport.fileName}' bytes=${generatedReport.sizeBytes}`
      );
    } catch (error) {
      context.error(
        "crearSolicitud - item creado, pero no se pudo generar el informe Tarjeta Mas Metro:",
        error.message
      );

      const closeTokenErrorResponse = await closeTemporalAccessTokenAfterItemCreated({
        accessTokenConfig,
        accessTokenValidation,
        solicitudId: createdItem.id,
        token,
        context,
      });
      if (closeTokenErrorResponse) return closeTokenErrorResponse;

      return jsonResponse(500, {
        ok: false,
        partialSuccess: true,
        solicitudId: createdItem.id,
        token,
        error: PUBLIC_ERRORS.partialSuccess,
      });
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      context.log(`Item ID creado: ${createdItem.id}`);

      const uploadResult = await uploadNativeListItemAttachments(
        accessToken,
        validation.type,
        createdItem.id,
        [...files, generatedReport],
        undefined,
        context
      );

      uploadedAttachments.push(...(uploadResult.uploaded || []));
      attachmentWarnings.push(...(uploadResult.warnings || []));

      if ((uploadResult.uploaded || []).length === 0) {
        throw new Error(
          (uploadResult.warnings || []).join(" | ") ||
          "No se pudo adjuntar ningun documento al item."
        );
      }
    } catch (error) {
      context.error(
        "crearSolicitud - item e informe generados, pero no se pudieron subir los adjuntos de Tarjeta Mas Metro:",
        error.message
      );

      const closeTokenErrorResponse = await closeTemporalAccessTokenAfterItemCreated({
        accessTokenConfig,
        accessTokenValidation,
        solicitudId: createdItem.id,
        token,
        context,
      });
      if (closeTokenErrorResponse) return closeTokenErrorResponse;

      return jsonResponse(500, {
        ok: false,
        partialSuccess: true,
        solicitudId: createdItem.id,
        token,
        error: PUBLIC_ERRORS.partialSuccess,
      });
    }
  } else if (files.length > 0) {
    try {
      const uploadResult = await uploadListItemAttachments(
        accessToken,
        validation.type,
        createdItem.id,
        files,
        undefined,
        context,
        token
      );

      uploadedAttachments.push(...(uploadResult.uploaded || []));
      attachmentWarnings.push(...(uploadResult.warnings || []));
    } catch (error) {
      context.warn?.(`crearSolicitud - solicitud creada sin adjuntos por error de subida: ${error.message}`);
      attachmentWarnings.push(PUBLIC_ERRORS.attachmentWarning);
    }
  }

  const closeTokenErrorResponse = await closeTemporalAccessTokenAfterItemCreated({
    accessTokenConfig,
    accessTokenValidation,
    solicitudId: createdItem.id,
    token,
    context,
  });
  if (closeTokenErrorResponse) return closeTokenErrorResponse;

  return jsonResponse(201, {
    ok: true,
    solicitudId: createdItem.id,
    token,
    tipoFormulario: validation.type.formValue,
    creadoEn: createdAt,
    email: validation.payload.CorreoElectronico || validation.payload.EmailCliente,
    adjuntos: uploadedAttachments.map(toPublicAttachment),
    warnings: attachmentWarnings.length > 0 ? [PUBLIC_ERRORS.attachmentWarning] : [],
    mensaje: "Solicitud registrada correctamente. Se enviara el token de consulta al correo indicado.",
  });
}

function isTarjetaMasMetro(type) {
  return type?.key === "TARJETAS_METRO";
}

function isAccessTokenEntityUsed(entity) {
  return entity?.used === true || String(entity?.used || "").toLowerCase() === "true";
}

async function closeTemporalAccessTokenAfterItemCreated({
  accessTokenConfig,
  accessTokenValidation,
  solicitudId,
  token,
  context,
}) {
  if (
    !accessTokenConfig?.requireForSolicitudes ||
    !accessTokenConfig.singleUse ||
    accessTokenConfig.storeDisabled ||
    !accessTokenValidation?.token
  ) {
    return null;
  }

  try {
    const tableClient = createTableClient(accessTokenConfig);
    await tableClient.updateEntity({
      partitionKey: accessTokenConfig.partitionKey,
      rowKey: accessTokenValidation.token,
      used: true,
      usedAtUtc: new Date().toISOString(),
      solicitudId: String(solicitudId || ""),
      resultado: "created",
    }, "Merge");

    context.log(`crearSolicitud - token temporal marcado como usado solicitudId=${solicitudId}`);
    return null;
  } catch (error) {
    context.error(
      "crearSolicitud - solicitud creada pero no se pudo marcar el token temporal como usado:",
      error.message
    );

    return jsonResponse(500, {
      ok: false,
      partialSuccess: true,
      solicitudId,
      token,
      error: PUBLIC_ERRORS.partialSuccess,
    });
  }
}

function validateGeneratedReport(report) {
  if (!report || typeof report !== "object") {
    throw new Error("El generador no ha devuelto el informe PDF.");
  }

  if (!report.fileName) {
    throw new Error("El informe generado no contiene fileName.");
  }

  if (!Buffer.isBuffer(report.content) || report.content.length === 0) {
    throw new Error("El contenido del informe PDF no es un Buffer valido.");
  }

  report.fieldName = report.fieldName || "InformeTarjetaMasMetro";
  report.contentType = report.contentType || "application/pdf";
  report.sizeBytes = report.sizeBytes || report.content.length;
}

function toPublicAttachment(file = {}) {
  return {
    nombre: file.nombre || "",
    tipo: file.tipo || "",
    tamanioBytes: file.tamanioBytes || 0,
  };
}

async function parseSolicitudRequest(request) {
  const contentType = getRequestHeader(request, "content-type");

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    return parseMultipartSolicitudRequest(request);
  }

  try {
    return {
      payload: await request.json(),
      files: [],
    };
  } catch {
    throw new Error("El cuerpo de la peticion no es JSON valido.");
  }
}

async function parseMultipartSolicitudRequest(request) {
  if (typeof request.arrayBuffer === "function") {
    return parseRawMultipartSolicitudRequest(request);
  }

  if (typeof request.formData === "function") {
    return parseFormDataSolicitudRequest(await request.formData());
  }

  throw new Error("La peticion multipart/form-data no se puede leer en este runtime.");
}

async function parseFormDataSolicitudRequest(formData) {
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string" || payloadRaw.trim() === "") {
    throw new Error("La peticion multipart/form-data debe incluir un campo 'payload' JSON.");
  }

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error("El campo multipart 'payload' no contiene JSON valido.");
  }

  const files = [];
  for (const [fieldName, value] of formData.entries()) {
    if (fieldName === "payload" || !isMultipartFile(value)) continue;

    const content = Buffer.from(await value.arrayBuffer());
    files.push({
      fieldName,
      fileName: value.name || `${fieldName}.bin`,
      contentType: value.type || "application/octet-stream",
      sizeBytes: Number.isFinite(value.size) ? value.size : content.length,
      content,
    });
  }

  return { payload, files };
}

async function parseRawMultipartSolicitudRequest(request) {
  const contentType = getRequestHeader(request, "content-type");
  const boundary = getMultipartBoundary(contentType);
  if (!boundary) {
    throw new Error("La peticion multipart/form-data no incluye boundary.");
  }

  const body = Buffer.from(await request.arrayBuffer());
  const parts = parseMultipartBuffer(body, boundary);
  const payloadRaw = parts.fields.payload;
  if (typeof payloadRaw !== "string" || payloadRaw.trim() === "") {
    throw new Error("La peticion multipart/form-data debe incluir un campo 'payload' JSON.");
  }

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error("El campo multipart 'payload' no contiene JSON valido.");
  }

  return {
    payload,
    files: parts.files,
  };
}

function parseMultipartBuffer(body, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const lineBreak = Buffer.from("\r\n");
  const fields = {};
  const files = [];
  let cursor = body.indexOf(boundaryBuffer);

  while (cursor !== -1) {
    cursor += boundaryBuffer.length;
    if (body.slice(cursor, cursor + 2).toString("utf8") === "--") break;
    if (body.slice(cursor, cursor + 2).equals(lineBreak)) cursor += 2;

    const headerEnd = body.indexOf(headerSeparator, cursor);
    if (headerEnd === -1) break;

    const headers = parseMultipartHeaders(body.slice(cursor, headerEnd).toString("utf8"));
    const contentStart = headerEnd + headerSeparator.length;
    const nextBoundary = body.indexOf(boundaryBuffer, contentStart);
    if (nextBoundary === -1) break;

    let contentEnd = nextBoundary;
    if (body.slice(contentEnd - 2, contentEnd).equals(lineBreak)) {
      contentEnd -= 2;
    }
    const content = body.slice(contentStart, contentEnd);
    const disposition = parseContentDisposition(headers["content-disposition"]);

    if (disposition.name) {
      const fileName = getDispositionFileName(disposition);
      if (fileName) {
        files.push({
          fieldName: disposition.name,
          fileName,
          contentType: headers["content-type"] || "application/octet-stream",
          sizeBytes: content.length,
          content,
        });
      } else {
        fields[disposition.name] = content.toString("utf8");
      }
    }

    cursor = nextBoundary;
  }

  return { fields, files };
}

function parseMultipartHeaders(rawHeaders) {
  return rawHeaders.split(/\r?\n/).reduce((headers, line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return headers;
    headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
    return headers;
  }, {});
}

function parseContentDisposition(header) {
  const result = {};
  for (const part of String(header || "").split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    const key = rawKey.trim().toLowerCase();
    if (!rawValue.length) continue;
    result[key] = rawValue.join("=").trim().replace(/^"|"$/g, "");
  }
  return result;
}

function getDispositionFileName(disposition = {}) {
  return decodeRfc5987FileName(disposition["filename*"]) || disposition.filename || "";
}

function decodeRfc5987FileName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const match = /^([^']*)'[^']*'(.*)$/.exec(raw);
  const encoded = match ? match[2] : raw;

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function getMultipartBoundary(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  return match ? (match[1] || match[2]).trim() : "";
}

function getRequestHeader(request, name) {
  if (typeof request.headers?.get === "function") {
    return request.headers.get(name) || "";
  }

  return request.headers?.[name] || request.headers?.[name.toLowerCase()] || "";
}

function isMultipartFile(value) {
  return value
    && typeof value === "object"
    && typeof value.arrayBuffer === "function"
    && typeof value.name === "string";
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

module.exports = {
  parseSolicitudRequest,
};
