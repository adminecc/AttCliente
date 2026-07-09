const { app } = require("@azure/functions");
const { validateSolicitudPayload } = require("../shared/validation");
const { generarTokenForType } = require("../shared/token");
const { getAccessTokenConfig, validateAccessToken } = require("../shared/access-token");
const {
  getGraphAccessToken,
  createListItem,
  buildSharePointFields,
  uploadListItemAttachments,
} = require("../shared/sharepoint");

app.http("crearSolicitud", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/crear",
  handler: async (request, context) => {
    context.log("crearSolicitud - inicio");

    // Seguridad: validar el token temporal antes de procesar el body, adjuntos, firmas o SharePoint.
    const accessTokenConfig = getAccessTokenConfig();
    if (accessTokenConfig.requireForSolicitudes) {
      let accessTokenValidation;
      try {
        accessTokenValidation = await validateAccessToken(request, { config: accessTokenConfig });
      } catch (error) {
        context.error("crearSolicitud - error validando token temporal:", error.message);
        return jsonResponse(500, {
          ok: false,
          error: "Error validando el token temporal.",
        });
      }

      if (!accessTokenValidation.valid) {
        context.warn?.(`crearSolicitud - token temporal rechazado: ${accessTokenValidation.error || "no valido"}`);
        return jsonResponse(accessTokenValidation.status || 401, {
          ok: false,
          error: accessTokenValidation.error || "Token temporal no valido.",
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
      return jsonResponse(400, {
        ok: false,
        error: error.message || "El cuerpo de la peticion no es valido.",
      });
    }


    const validation = validateSolicitudPayload(body);
    if (!validation.valid) {
      context.log(`crearSolicitud - ${validation.errors.length} error(es) de validacion`);
      return jsonResponse(400, {
        ok: false,
        errors: validation.errors,
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
        error: "Error de autenticacion con Microsoft Graph.",
        diagnostics: buildDiagnostics(error),
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
        error: "Error al registrar la solicitud en SharePoint.",
        diagnostics: buildDiagnostics(error),
      });
    }

    const attachmentWarnings = [];
    const uploadedAttachments = [];
    if (files.length > 0) {
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
        uploadedAttachments.push(...uploadResult.uploaded);
        attachmentWarnings.push(...uploadResult.warnings);
      } catch (error) {
        context.warn?.(`crearSolicitud - solicitud creada sin adjuntos por error de subida: ${error.message}`);
        attachmentWarnings.push(`Solicitud creada, pero no se pudieron subir adjuntos: ${error.message}`);
      }
    }

    return jsonResponse(201, {
      ok: true,
      solicitudId: createdItem.id,
      token,
      tipoFormulario: validation.type.formValue,
      listaDestino: validation.type.key,
      nombreLista: validation.type.sharePoint.listName,
      siteDestino: validation.type.sharePoint.siteUrl,
      listaUrl: validation.type.sharePoint.listUrl,
      creadoEn: createdAt,
      email: validation.payload.CorreoElectronico || validation.payload.EmailCliente,
      adjuntos: uploadedAttachments,
      warnings: attachmentWarnings,
      debug: {
        adjuntosRecibidos: describeFilesForDebug(files),
      },
      mensaje: "Solicitud registrada correctamente. Se enviara el token de consulta al correo indicado.",
    });
  },
});

function describeFilesForDebug(files = []) {
  return files.map((file) => ({
    fieldName: file.fieldName || "",
    fileName: file.fileName || "",
    contentType: file.contentType || "",
    sizeBytes: file.sizeBytes || file.content?.length || 0,
  }));
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
      if (disposition.filename) {
        files.push({
          fieldName: disposition.name,
          fileName: disposition.filename,
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

function buildDiagnostics(error) {
  if (process.env.DEBUG_ERRORS !== "true") return undefined;

  return {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    sharePoint: error.sharePointDiagnostics,
  };
}

module.exports = {
  parseSolicitudRequest,
};
