const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getConfig, assertGraphConfig, getSiteIdForType } = require("./config");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const ATTACHMENT_LIBRARY_NAME = "DocumentosAdjuntos";
const listIdCache = new Map();
const listColumnsCache = new Map();
const lookupItemsCache = new Map();
const documentLibraryCache = new Map();

const TITLE_TYPE_VALUES = {
  "monedero-metro-malaga": "Monedero Metro Málaga",
  "billete-ocasional": "Ocasional Metro de Málaga",
  "masmetro": "Tarjeta MásMetro",
  "tarjeta-consorcio": "Tarjeta Monedero Consorcio de Transportes de Andalucía",
  "tarjeta-consorcio-joven": "Tarjeta Consorcio de Transportes de Andalucía Joven",
  "tarjeta-consorcio-familia-numerosa": "Tarjeta Consorcio de Transportes de Andalucía Familia Numerosa",
  "validacion-emv-fisica": "Validación con sistema EMV (Tarjeta de Crédito/Débito física no registrada)",
  "validacion-emv-movil": "Validación con sistema EMV móvil (Tarjeta de Crédito/Débito con NFC móvil no registrada)",
  "pago-emv-movil": "Validación con sistema EMV móvil (Tarjeta de Crédito/Débito con NFC móvil no registrada)",
  "metropay": "Validación con ABT (Tarjeta de Crédito/Débito registrada en MetroPay)",
};

const LOCATION_VALUES = {
  general: "General / Ninguna específica",
  "l1-gral": "Cualquiera de Línea 1",
  "l2-gral": "Cualquiera de Línea 2",
  "linea-1": "Cualquiera de Línea 1",
  "linea-2": "Cualquiera de Línea 2",
  "guadalmedina-l1": "Guadalmedina",
  "guadalmedina-l2": "Guadalmedina",
  atarazanas: "Atarazanas",
  "andalucia-tech": "Andalucía Tech",
  carranque: "Carranque",
  barbarela: "Barbarela",
  "el-clinico": "El Clínico",
  "la-union": "La Unión",
  universidad: "Universidad",
  "ciudad-justicia": "Ciudad de la Justicia",
  "el-consul": "El Cónsul",
  "el-perchel-l1": "El Perchel",
  "el-perchel-l2": "El Perchel",
  paraninfo: "Paraninfo",
  "portada-alta": "Portada Alta",
  "la-luz-la-paz": "La Luz - La Paz",
  "la-isla": "La Isla",
  "puerta-blanca": "Puerta Blanca",
  "princesa-huelin": "Princesa - Huelin",
  "el-torcal": "El Torcal",
  "palacio-deportes": "Palacio de los Deportes",
  tren: "Interior del tren",
  otro: "Otra ubicación",
  "otra-ubicacion": "Otra ubicación",
};

const OPERATION_LOCATION_VALUES = {
  ...LOCATION_VALUES,
  tren: "Unidad-Tren",
  estacion: "General / Ninguna específica",
  desconocido: "",
};

const LOST_OBJECT_LOCATION_VALUES = {
  estacion: "En una estación",
  tren: "En un tren",
  desconocido: "No lo sé",
};

const METRO_LINE_VALUES = {
  1: "Línea 1",
  2: "Línea 2",
  ambas: "Ambas / No lo sé",
};

const CLAIM_TITLE_TYPE_VALUES = {
  "billete-ocasional": "Ocasional MM",
  "monedero-metro-malaga": "Monedero MM",
  masmetro: "Monedero MM",
  "tarjeta-consorcio": "Monedero Consorcio",
  "tarjeta-consorcio-joven": "Monedero Consorcio",
  "tarjeta-consorcio-familia-numerosa": "Familia numerosa Consorcio",
};
const THANKS_REASON_VALUES = {
  "atencion-personal": "Atención del personal",
  "resolucion-incidencia": "Resolución de incidencia",
  "mejora-servicio": "Mejora del servicio",
  "estado-instalaciones": "Estado de instalaciones",
  "informacion-proporcionada": "Información proporcionada",
  "actuacion-seguridad": "Actuación de seguridad",
  "accesibilidad": "Asistencia sobre accesibilidad",
  "objeto-perdido": "Ayuda para recuperar un objeto",
  otros: "Otros",
};

const THANKS_PLACE_VALUES = {
  estacion: "Una estación",
  tren: "Un tren",
  oac: "Oficina de Atención al Cliente",
};

const THANKS_TARGET_VALUES = {
  "personal-metro": "Personal de Metro de Málaga",
  "personal-estacion": "Personal de Metro de Málaga",
  "personal-tren": "Personal de Metro de Málaga",
  seguridad: "Personal de Vigilancia (Seguridad)",
  limpieza: "Personal de Metro de Málaga",
  mantenimiento: "Personal de Metro de Málaga",
  "personal-oac": "Personal de la Oficina de Atención al Cliente",
  varios: "Quiero agradecer a varios colectivos (indique cuáles)",
  general: "Es un agradecimiento general sobre el servicio",
};

const CLASSIFICATION_VALUES = {
  reclamacion: "Reclamación",
  queja: "Queja",
  sugerencia: "Sugerencia",
  agradecimiento: "Agradecimiento",
};

const INSTALLATION_TYPE_VALUES = {
  dab: "DAB",
  torno: "Torno",
  tren: "Tren",
};

const NOTIFICATION_METHOD_VALUES = {
  email: "Correo",
  impreso: "Impresión",
};

const CONTROL_PAYLOAD_FIELDS = new Set([
  "tipoFormulario",
  "listaDestino",
  "confirmEmail",
  "consentimiento",
  "datosCorrectos",
  "recibirPostal",
  "attachments",
  "signatures",
  "metadata",
  "nombreCompleto",
]);

async function getGraphAccessToken(config = getConfig()) {
  assertGraphConfig(config);

  return requestAccessToken(config, "https://graph.microsoft.com/.default");
}

async function getSharePointAccessToken(
  siteUrl,
  config = getConfig()
) {
  assertGraphConfig(config);

  if (!config.certThumbprint) {
    throw new Error(
      "AZURE_CERT_THUMBPRINT no esta configurada."
    );
  }

  if (!config.certPrivateKey) {
    throw new Error(
      "AZURE_CERT_PRIVATE_KEY no esta configurada."
    );
  }

  const origin = new URL(siteUrl).origin;

  const tokenUrl =
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  const params = buildCertificateTokenParams(
    config,
    tokenUrl,
    `${origin}/.default`
  );

  const response = await axios.post(
    tokenUrl,
    params.toString(),
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    }
  );

  if (!response.data?.access_token) {
    throw new Error(
      "Microsoft no devolvio access_token."
    );
  }

  return response.data.access_token;
}



async function requestAccessToken(config, scope) {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const params = config.clientSecret
    ? buildClientSecretTokenParams(config, scope)
    : buildCertificateTokenParams(config, tokenUrl, scope);

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  if (!response.data?.access_token) {
    throw new Error("Microsoft no devolvio access_token.");
  }

  return response.data.access_token;
}

function buildClientSecretTokenParams(config, scope) {
  return new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope,
  });
}

function buildCertificateTokenParams(config, tokenUrl, scope) {
  const now = Math.floor(Date.now() / 1000);
  const assertionPayload = {
    aud: tokenUrl,
    iss: config.clientId,
    sub: config.clientId,
    jti: crypto.randomUUID(),
    nbf: now,
    iat: now,
    exp: now + 300,
  };

  const clientAssertion = jwt.sign(assertionPayload, normalizePem(config.certPrivateKey), {
    algorithm: "RS256",
    header: {
      alg: "RS256",
      typ: "JWT",
      x5t: hexThumbprintToBase64Url(config.certThumbprint),
    },
  });

  return new URLSearchParams({
    client_id: config.clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    grant_type: "client_credentials",
    scope,
  });
}

async function createListItem(accessToken, type, fields, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items`;
  const writableColumns = await resolveWritableColumnDefinitions(accessToken, target, context);
  const lookupReadyFields = await prepareLookupFieldWrites(accessToken, target, fields, writableColumns, context);
  const filteredFields = filterKnownFields(lookupReadyFields, writableColumns, context, target);
  const compatibilityWarnings = buildFieldCompatibilityWarnings(filteredFields, writableColumns);

  for (const message of compatibilityWarnings) {
    warn(context, `createListItem - posible incompatibilidad de tipo en ${target.listName}: ${message}`);
  }

  context?.log?.(`createListItem - POST ${url}`);
  context?.log?.(`createListItem - campos enviados a ${target.listName}: ${Object.keys(filteredFields).join(", ")}`);

  try {
    const response = await axios.post(url, { fields: filteredFields }, {
      headers: graphHeaders(accessToken),
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    error.sharePointDiagnostics = buildSharePointErrorDiagnostics(error, target, filteredFields, compatibilityWarnings);
    warn(context, `createListItem - error Graph en ${target.listName}: ${error.sharePointDiagnostics.summary}`);
    throw error;
  }
}

async function prepareLookupFieldWrites(accessToken, target, fields, writableColumns, context) {
  const prepared = {};

  for (const [name, value] of Object.entries(fields)) {
    const column = writableColumns.get?.(name);
    if (!column?.lookup || isEmptySharePointValue(value)) {
      prepared[name] = value;
      continue;
    }

    const lookupId = await resolveLookupId(accessToken, target, column, value, context);
    if (lookupId !== null) {
      prepared[`${name}LookupId`] = lookupId;
    }
  }

  return prepared;
}

async function resolveLookupId(accessToken, target, column, value, context) {
  if (isNumberLike(value)) {
    return Number(String(value).replace(",", "."));
  }

  const lookupListId = column.lookup?.listId;
  const lookupColumnName = column.lookup?.columnName || "Title";
  if (!lookupListId) {
    warn(context, `prepareLookupFieldWrites - ${column.name} es lookup pero no indica lista auxiliar.`);
    return null;
  }

  const items = await resolveLookupItems(accessToken, target.siteId, lookupListId, context);
  const expected = normalizeComparable(value);
  const match = items.find((item) => {
    const fields = item.fields || {};
    return normalizeComparable(item.id) === expected
      || normalizeComparable(fields.id) === expected
      || normalizeComparable(fields[lookupColumnName]) === expected
      || normalizeComparable(fields.Title) === expected;
  });

  if (!match?.id) {
    warn(context, `prepareLookupFieldWrites - no se encontro valor lookup '${value}' para ${column.name}.`);
    return null;
  }

  return Number(match.id);
}

async function resolveLookupItems(accessToken, siteId, lookupListId, context) {
  const cacheKey = `${siteId}|${lookupListId}|lookup-items`;
  if (lookupItemsCache.has(cacheKey)) {
    return lookupItemsCache.get(cacheKey);
  }

  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(lookupListId)}/items` +
    "?$expand=fields" +
    "&$top=999";

  context?.log?.(`resolveLookupItems - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const items = response.data?.value || [];
  lookupItemsCache.set(cacheKey, items);
  return items;
}

async function findListItemByEmailAndToken(accessToken, type, email, token, config = getConfig(), context) {
  return findListItemByContactAndToken(
    accessToken,
    type,
    { kind: "email", value: email },
    token,
    config,
    context
  );
}

async function findSanctionByExpedienteAndDni(accessToken, expediente, dni, config = getConfig(), context) {
  const sanctionConfig = config.sanctions || {};
  if (!sanctionConfig.siteId) {
    throw new Error("SHAREPOINT_SANCIONES_SITE_ID no esta configurado.");
  }

  const target = {
    siteId: sanctionConfig.siteId,
    listName: sanctionConfig.listName || "Sanciones",
    listUrl: sanctionConfig.listUrl,
  };
  const listId = await resolveListId(accessToken, target.siteId, target, context);
  const filter = `fields/Title eq '${escapeOData(expediente)}' and fields/DNI eq '${escapeOData(dni)}'`;
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(listId)}/items` +
    "?$expand=fields" +
    `&$filter=${encodeURIComponent(filter)}` +
    "&$top=1";

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken, {
      Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
    }),
    timeout: 15000,
  });
  return response.data?.value?.[0] || null;
}

function buildSancionResponse(item) {
  const fields = item?.fields || {};
  return {
    Title: fields.Title || "",
    NombreCliente: fields.NombreCliente || "",
    DNI: fields.DNI || "",
    NombreTutor: fields.NombreTutor || "",
    DNITutor: fields.DNITutor || "",
    TipoSolicitud: fields.TipoSolicitud || "",
    TipoInfraccion: fields.TipoInfraccion || "",
    CodSancion: fields.CodSancion || "",
    MotivoSancion: fields.MotivoSancion || "",
    FechaInfraccion: fields.FechaInfraccion || "",
    OrigenFraude: fields.OrigenFraude || "",
    Importe: fields.Importe ?? null,
    EstadoDelPago: fields.EstadoDelPago || "",
  };
}

async function findListItemByContactAndToken(accessToken, type, contact, token, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const readableColumns = await resolveColumnNames(accessToken, target, context);
  const identityField = resolveIdentityField(readableColumns, contact.kind);
  const identityValue = normalizeIdentityValue(contact);
  const tokenField = "Title";
  const filter = `fields/${identityField} eq '${escapeOData(identityValue)}' and fields/${tokenField} eq '${escapeOData(token)}'`;
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items` +
    "?$expand=fields" +
    `&$filter=${encodeURIComponent(filter)}` +
    "&$top=1";

  context?.log?.(`findListItemByContactAndToken - GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: graphHeaders(accessToken, {
        Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
      }),
      timeout: 15000,
    });

    const item = response.data?.value?.[0] || null;
    if (item) {
      return item;
    }

    warn(
      context,
      `findListItemByContactAndToken - filtro Graph sin resultados en ${target.listName}, usando busqueda local.`
    );
    return findListItemByEmailAndTokenFallbackOrDocumentFolder(
      accessToken,
      target,
      identityField,
      identityValue,
      token,
      context
    );
  } catch (error) {
    warn(
      context,
      `findListItemByContactAndToken - filtro Graph no disponible, usando busqueda local: ${error.message}`
    );
    return findListItemByEmailAndTokenFallbackOrDocumentFolder(
      accessToken,
      target,
      identityField,
      identityValue,
      token,
      context
    );
  }
}

function resolveIdentityField(readableColumns, kind) {
  const candidates = kind === "phone"
    ? ["Telefono", "TelefonoCliente1", "TelefonoRep1"]
    : ["CorreoElectronico", "EmailCliente", "EmailRep", "Email"];

  return candidates.find((field) => readableColumns.has(field)) || candidates[0];
}

function normalizeIdentityValue(contact = {}) {
  const value = String(contact.value || "").trim();
  return contact.kind === "phone" ? normalizePhoneComparable(value) : value.toLowerCase();
}

async function findListItemByEmailAndTokenFallbackOrDocumentFolder(accessToken, target, emailField, email, token, context) {
  try {
    const item = await findListItemByEmailAndTokenFallback(accessToken, target, emailField, email, token, context);
    if (item) return item;
  } catch (error) {
    warn(
      context,
      `findListItemByEmailAndTokenFallback - busqueda local no disponible: ${error.response?.data?.error?.message || error.message}`
    );
  }

  return findListItemByDocumentFolder(accessToken, target, emailField, email, token, context);
}

async function findListItemByEmailAndTokenFallback(accessToken, target, emailField, email, token, context) {
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items` +
    "?$expand=fields" +
    "&$orderby=createdDateTime desc" +
    "&$top=200";

  context?.log?.(`findListItemByEmailAndTokenFallback - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return (response.data?.value || []).find((item) => {
    const fields = item.fields || {};
    return normalizeComparable(fields.Title) === normalizeComparable(token)
      && identityMatches(fields[emailField], email, emailField);
  }) || null;
}

async function findListItemByDocumentFolder(accessToken, target, emailField, email, token, context) {
  const library = await resolveDocumentLibraryTarget(accessToken, target.siteId, context);
  const folderName = sanitizeDocumentLibraryFolderName(token);
  const folder = await getDriveItemByPath(accessToken, target.siteId, library.driveId, folderName, context);
  if (!folder?.id) {
    return null;
  }

  const fieldsUrl =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/drives/${encodeURIComponent(library.driveId)}` +
    `/items/${encodeURIComponent(folder.id)}/listItem/fields`;
  context?.log?.(`findListItemByDocumentFolder - GET ${fieldsUrl}`);

  const fieldsResponse = await axios.get(fieldsUrl, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const itemId = fieldsResponse.data?.IDRef;
  if (!itemId) {
    warn(context, `findListItemByDocumentFolder - carpeta ${folderName} sin IDRef.`);
    return null;
  }

  const itemUrl =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}` +
    `/items/${encodeURIComponent(itemId)}?$expand=fields`;
  context?.log?.(`findListItemByDocumentFolder - GET ${itemUrl}`);

  const itemResponse = await axios.get(itemUrl, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const fields = itemResponse.data?.fields || {};
  if (
    normalizeComparable(fields.Title) === normalizeComparable(token)
    && identityMatches(fields[emailField], email, emailField)
  ) {
    return itemResponse.data;
  }

  warn(context, `findListItemByDocumentFolder - IDRef encontrado pero no coincide email/token para ${folderName}.`);
  return null;
}

async function getListItemAttachments(accessToken, type, itemId, config = getConfig(), context, referenceToken = itemId) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const token = String(referenceToken || "").trim();
  if (!token) return [];

  const library = await resolveDocumentLibraryTarget(accessToken, target.siteId, context);
  const filterValue = isNumberLike(token) ? String(Number(token)) : `'${escapeOData(token)}'`;
  const filter = `fields/IDRef eq ${filterValue}`;
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(library.listId)}/items` +
    "?$expand=fields,driveItem" +
    `&$filter=${encodeURIComponent(filter)}` +
    "&$top=200";
  context?.log?.(`getListItemAttachments - GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: graphHeaders(accessToken, {
        Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
      }),
      timeout: 15000,
    });

    const attachments = mapDocumentLibraryAttachments(response.data?.value || []);
    if (attachments.length > 0) {
      return attachments;
    }

    warn(
      context,
      `getListItemAttachments - filtro Graph sin resultados para IDRef=${token}, usando busqueda local.`
    );
    return getListItemAttachmentsFallback(accessToken, target.siteId, library.listId, token, context);
  } catch {
    return getListItemAttachmentsFallback(accessToken, target.siteId, library.listId, token, context);
  }
}

async function getListItemAttachmentsFallback(accessToken, siteId, libraryListId, referenceToken, context) {
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(libraryListId)}/items` +
    "?$expand=fields,driveItem" +
    "&$top=200";
  context?.log?.(`getListItemAttachmentsFallback - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return mapDocumentLibraryAttachments((response.data?.value || []).filter((item) => (
    normalizeComparable(item.fields?.IDRef) === normalizeComparable(referenceToken)
  )));
}

function mapDocumentLibraryAttachments(items) {
  return items
    .map((item) => item.driveItem || {})
    .filter((driveItem) => driveItem.file)
    .map((file) => ({
      nombre: file.name,
      tipo: file.file?.mimeType || "",
      tamanioBytes: file.size || 0,
      urlDescarga: file["@microsoft.graph.downloadUrl"] || "",
      webUrl: file.webUrl || "",
    }));
}

async function getListItemTimeline(accessToken, type, itemId, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items/${itemId}/versions?$expand=fields`;
  context?.log?.(`getListItemTimeline - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return (response.data?.value || [])
    .map((version) => {
      const fields = version.fields || {};
      return {
        fecha: version.lastModifiedDateTime || "",
        usuario: version.lastModifiedBy?.user?.displayName || "",
        estado: fields.EstadoCliente || fields.Estado || "",
        respuestaOrganizacion: fields.RespuestaOrganizacion || "",
        fechaRespuesta: fields.FechaRespuesta || "",
        version: version.id || "",
      };
    })
    .filter((item) => item.estado || item.respuestaOrganizacion || item.fechaRespuesta);
}

function buildSharePointFields(payload, type, token, createdAt) {
  const fields = {
    Title: token,
  };

  fields.EstadoCliente = "En trámite";

  if (type.key === "OBJETOS_PERDIDOS") {
    fields.Estado = payload.Estado || "Registrado";
    fields.TipoRegistro = payload.TipoRegistro || "Objeto Perdido Reclamado";
  }

  for (const [payloadField, value] of Object.entries(payload)) {
    if (shouldCopyPayloadField(payloadField, value)) {
      fields[payloadField] = transformSharePointValue(payloadField, value, type);
    }
  }

  return fields;
}

async function uploadListItemAttachments(accessToken, type, itemId, files = [], config = getConfig(), context, referenceToken = itemId) {
  if (!Array.isArray(files) || files.length === 0) {
    return { uploaded: [], warnings: [] };
  }

  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const library = await resolveDocumentLibraryTarget(accessToken, target.siteId, context);
  const folderName = sanitizeDocumentLibraryFolderName(referenceToken || itemId);
  const referenceId = Number(itemId);
  const folder = await ensureDocumentLibraryFolder(accessToken, target.siteId, library.driveId, folderName, context);
  context?.log?.(
    `uploadListItemAttachments - biblioteca=${ATTACHMENT_LIBRARY_NAME} carpeta='${folderName}' item=${itemId} token=${referenceToken} archivos=${files.length}`
  );
  const uploaded = [];
  const warnings = [];

  await updateDocumentLibraryItemFields(accessToken, target.siteId, library.driveId, folder.id, {
    IDRef: referenceId,
    Visible: true,
  }, context);

  for (const file of files) {
    try {
      const plan = buildDocumentLibraryAttachmentPlan({ referenceToken, referenceId, file, folderName });
      const driveItem = await uploadDocumentLibraryFile(accessToken, target.siteId, library.driveId, plan, file, context);
      await updateDocumentLibraryItemFields(accessToken, target.siteId, library.driveId, driveItem.id, plan.fields, context);
      uploaded.push({
        nombre: plan.fileName,
        tipo: file.contentType || "application/octet-stream",
        tamanioBytes: file.sizeBytes || file.content?.length || 0,
        fieldName: file.fieldName || "",
        carpeta: folderName,
        idRef: plan.fields.IDRef,
        visible: plan.fields.Visible,
        webUrl: driveItem.webUrl || "",
      });
    } catch (error) {
      const message = `${file.fileName || file.fieldName || "archivo"}: ${formatAttachmentUploadError(error)}`;
      warnings.push(message);
      warn(context, `uploadListItemAttachments - no se pudo subir ${message}`);
    }
  }

  return { uploaded, warnings };
}

async function uploadNativeListItemAttachments(
  graphAccessToken,
  type,
  itemId,
  files = [],
  config = getConfig(),
  context
) {
  if (!Array.isArray(files) || files.length === 0) {
    return { uploaded: [], warnings: [] };
  }

  const target = await resolveSharePointTarget(
    graphAccessToken,
    type,
    config,
    context
  );

  if (!target.siteUrl) {
    throw new Error(
      `No se ha configurado la URL del sitio SharePoint para ${type?.key || "el formulario"}.`
    );
  }

  const sharePointAccessToken = await getSharePointAccessToken(
    target.siteUrl,
    config
  );

  const payload =
  decodeJwtPayload(
    sharePointAccessToken
  );

context.log(
  "SP_TOKEN=" +
  JSON.stringify(
    {
      aud: payload.aud,
      appidacr: payload.appidacr,
      roles: payload.roles,
    },
    null,
    2
  )
);

  const uploaded = [];
  const warnings = [];

  for (const file of files) {
    try {
      validateNativeAttachment(file);

      const fileName = sanitizeAttachmentFileName(
        file.fileName || `${file.fieldName || "documento"}.bin`
      );

      const siteUrl = normalizeSiteUrl(target.siteUrl);
      const numericItemId = Number(itemId);

      if (!Number.isFinite(numericItemId)) {
        throw new Error(`El ID del item '${itemId}' no es valido.`);
      }

      const escapedListName =
  escapeSharePointRestString(target.listName);

const escapedFileName =
  escapeSharePointRestString(fileName);

const url =
  `${siteUrl}/_api/web/lists/getbytitle('${escapedListName}')` +
  `/items(${numericItemId})/AttachmentFiles/add(FileName='${escapedFileName}')`;

context?.log?.(
  `ATTACHMENT_ADD=${url}`
);

const response = await axios.post(
  url,
  file.content,
  {
    headers: {
      Authorization: `Bearer ${sharePointAccessToken}`,
      Accept: "application/json;odata=nometadata",
      "Content-Type":
        file.contentType || "application/octet-stream",
    },
    maxBodyLength: Infinity,
    timeout: 30000,
  }
);

const attachment =
  response.data?.d ||
  response.data ||
  {};

      uploaded.push({
        nombre: fileName,
        tipo: file.contentType || "application/octet-stream",
        tamanioBytes: file.sizeBytes || file.content.length,
        fieldName: file.fieldName || "",
        itemId: numericItemId,
        url:
          attachment?.ServerRelativeUrl ||
          attachment?.serverRelativeUrl ||
          "",
      });

    } catch (error) {

      context.error(
        "ATTACHMENT_ADD_ERROR=" +
        JSON.stringify({
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
        })
      );

      const fileName =
        file?.fileName ||
        file?.fieldName ||
        "archivo";

      warnings.push(
        `${fileName}: ${formatNativeAttachmentError(error)}`
      );

      throw error;
    }
  }

  return {
    uploaded,
    warnings,
  };
}
  

function validateNativeAttachment(file) {
  if (!file || typeof file !== "object") {
    throw new Error("El adjunto no es valido.");
  }

  if (!Buffer.isBuffer(file.content)) {
    throw new Error("El adjunto no contiene un Buffer valido.");
  }

  if (file.content.length === 0) {
    throw new Error("El adjunto esta vacio.");
  }
}

function formatNativeAttachmentError(error) {
  const status = error.response?.status;
  const detail =
    error.response?.data?.error?.message?.value ||
    error.response?.data?.error?.message ||
    error.response?.data?.["odata.error"]?.message?.value ||
    error.message ||
    "Error desconocido subiendo el adjunto.";

  const requestId =
    error.response?.headers?.sprequestguid ||
    error.response?.headers?.["sprequestguid"] ||
    error.response?.headers?.["request-id"];

  const parts = [];
  if (status) parts.push(`HTTP ${status}`);
  if (detail) parts.push(String(detail));
  if (requestId) parts.push(`sprequestguid=${requestId}`);

  if (status === 401 || status === 403) {
    parts.push(
      "Revisar permisos de aplicacion sobre el sitio SharePoint de Tarjeta Mas Metro."
    );
  }

  return parts.join(" | ") || "Error desconocido subiendo el adjunto.";
}

function formatAttachmentUploadError(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.error?.message?.value
    || error.response?.data?.error?.message
    || error.message;
  const headers = error.response?.headers || {};
  const requestId = headers.sprequestguid
    || headers["sprequestguid"]
    || headers["request-id"]
    || headers["x-ms-request-id"];
  const authenticate = headers["www-authenticate"] || headers["WWW-Authenticate"];

  const parts = [];
  if (status) parts.push(`HTTP ${status}`);
  if (detail) parts.push(String(detail));
  if (requestId) parts.push(`sprequestguid=${requestId}`);
  if (authenticate) parts.push(`WWW-Authenticate=${String(authenticate).slice(0, 500)}`);

  if (status === 401 || status === 403) {
    parts.push("Revisar audiencia del token, roles SharePoint y admin consent para la app registrada.");
  }

  return parts.join(" | ") || "Error desconocido subiendo adjunto.";
}

function buildDocumentLibraryAttachmentPlan({ referenceToken, referenceId, file, folderName }) {
  const safeFolderName = sanitizeDocumentLibraryFolderName(folderName || referenceToken || "sin-referencia");
  const fileName = sanitizeDocumentLibraryFileName(file?.fileName || `${file?.fieldName || "documento"}.bin`);
  const numericReferenceId = Number(referenceId);

  return {
    folderName: safeFolderName,
    fileName,
    fields: {
      IDRef: Number.isFinite(numericReferenceId) ? numericReferenceId : null,
      Visible: true,
    },
  };
}

async function resolveDocumentLibraryTarget(accessToken, siteId, context) {
  const cacheKey = `${siteId}|${ATTACHMENT_LIBRARY_NAME}`;
  if (documentLibraryCache.has(cacheKey)) {
    return documentLibraryCache.get(cacheKey);
  }

  const list = await resolveListByName(accessToken, siteId, ATTACHMENT_LIBRARY_NAME, context);
  const driveUrl = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(list.id)}/drive`;
  context?.log?.(`resolveDocumentLibraryTarget - GET ${driveUrl}`);

  const driveResponse = await axios.get(driveUrl, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const target = {
    listId: list.id,
    listName: list.displayName || list.name || ATTACHMENT_LIBRARY_NAME,
    driveId: driveResponse.data?.id,
  };

  if (!target.driveId) {
    throw new Error(`La biblioteca ${ATTACHMENT_LIBRARY_NAME} no tiene drive asociado.`);
  }

  documentLibraryCache.set(cacheKey, target);
  return target;
}

async function ensureDocumentLibraryFolder(accessToken, siteId, driveId, folderName, context) {
  const existing = await getDriveItemByPath(accessToken, siteId, driveId, folderName, context);
  if (existing?.id) {
    return existing;
  }

  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}/root/children`;
  context?.log?.(`ensureDocumentLibraryFolder - POST ${url}`);

  const response = await axios.post(url, {
    name: folderName,
    folder: {},
    "@microsoft.graph.conflictBehavior": "fail",
  }, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return response.data;
}

async function getDriveItemByPath(accessToken, siteId, driveId, itemPath, context) {
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}/root:/${encodeGraphPath(itemPath)}`;
  context?.log?.(`getDriveItemByPath - GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: graphHeaders(accessToken),
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function uploadDocumentLibraryFile(accessToken, siteId, driveId, plan, file, context) {
  const itemPath = `${plan.folderName}/${plan.fileName}`;
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}/root:/${encodeGraphPath(itemPath)}:/content`;
  context?.log?.(
    `uploadDocumentLibraryFile - PUT ${url} bytes=${file.sizeBytes || file.content?.length || 0} tipo=${file.contentType || "application/octet-stream"}`
  );

  const response = await axios.put(url, file.content, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.contentType || "application/octet-stream",
    },
    maxBodyLength: Infinity,
    timeout: 30000,
  });

  return response.data;
}

async function updateDocumentLibraryItemFields(accessToken, siteId, driveId, driveItemId, fields, context) {
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}` +
    `/items/${encodeURIComponent(driveItemId)}/listItem/fields`;
  context?.log?.(`updateDocumentLibraryItemFields - PATCH ${url} campos=${Object.keys(fields).join(",")}`);

  await axios.patch(url, fields, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });
}

function shouldCopyPayloadField(name, value) {
  return !CONTROL_PAYLOAD_FIELDS.has(name) && !isEmptySharePointValue(value);
}

async function resolveWritableColumnNames(accessToken, target, context) {
  const columns = await resolveWritableColumnDefinitions(accessToken, target, context);
  return new Set(columns.keys());
}

async function resolveWritableColumnDefinitions(accessToken, target, context) {
  const cacheKey = `${target.siteId}|${target.listId}|columns`;
  if (listColumnsCache.has(cacheKey)) {
    return listColumnsCache.get(cacheKey);
  }

  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/columns`;
  context?.log?.(`resolveWritableColumnNames - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const columns = new Map(
    (response.data?.value || [])
      .filter((column) => !column.hidden && column.readOnly !== true)
      .map((column) => [column.name, column])
  );

  listColumnsCache.set(cacheKey, columns);
  return columns;
}

async function resolveColumnNames(accessToken, target, context) {
  const writableColumns = await resolveWritableColumnNames(accessToken, target, context);
  return new Set([...writableColumns, "Title"]);
}

function filterKnownFields(fields, writableColumns, context, target) {
  const filtered = {};
  const omitted = [];

  for (const [name, value] of Object.entries(fields)) {
    if (isEmptySharePointValue(value)) {
      continue;
    }

    if (writableColumns.has(name) || isLookupIdWriteField(name, writableColumns)) {
      filtered[name] = value;
    } else {
      omitted.push(name);
    }
  }

  if (omitted.length > 0) {
    warn(
      context,
      `filterKnownFields - campos omitidos porque no existen en la lista ${target?.listName || "desconocida"}: ${omitted.join(", ")}`
    );
  }

  return filtered;
}

function isLookupIdWriteField(name, writableColumns) {
  if (!name.endsWith("LookupId")) return false;
  const baseName = name.slice(0, -"LookupId".length);
  return Boolean(writableColumns.get?.(baseName)?.lookup);
}

function buildFieldCompatibilityWarnings(fields, writableColumns) {
  const warnings = [];

  for (const [name, value] of Object.entries(fields)) {
    const column = writableColumns.get?.(name);
    if (!column || isEmptySharePointValue(value)) continue;

    const warning = getFieldCompatibilityWarning(name, value, column);
    if (warning) warnings.push(warning);
  }

  return warnings;
}

function getFieldCompatibilityWarning(name, value, column) {
  if (column.choice?.choices?.length && !column.choice.choices.includes(value)) {
    return `${name}: valor '${value}' no aparece entre las opciones configuradas (${column.choice.choices.join(" | ")}).`;
  }

  if (column.number && !isNumberLike(value)) {
    return `${name}: se esperaba numero y llega '${value}' (${typeof value}).`;
  }

  if (column.dateTime && !isDateLike(value)) {
    return `${name}: se esperaba fecha/hora valida y llega '${value}'.`;
  }

  if (column.boolean && typeof value !== "boolean") {
    return `${name}: se esperaba booleano y llega '${value}' (${typeof value}).`;
  }

  return "";
}

function isNumberLike(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  const normalized = value.trim().replace(",", ".");
  return normalized !== "" && Number.isFinite(Number(normalized));
}

function isDateLike(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== "string") return false;
  return value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function buildSharePointErrorDiagnostics(error, target, fields, compatibilityWarnings = []) {
  const graphError = error.response?.data?.error || error.response?.data || {};
  const graphMessage = graphError.message || error.message;

  return {
    summary: `status=${error.response?.status || "sin-status"}; message=${graphMessage}; campos=${Object.keys(fields).join(", ")}`,
    listName: target?.listName,
    listUrl: target?.listUrl,
    status: error.response?.status,
    graphMessage,
    graphCode: graphError.code,
    compatibilityWarnings,
    fieldSummary: Object.entries(fields).map(([name, value]) => ({
      name,
      type: Array.isArray(value) ? "array" : typeof value,
      preview: previewValue(value),
    })),
  };
}

function previewValue(value) {
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  }

  if (value === null || value === undefined) return value;
  if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
  return value;
}

function warn(context, message) {
  if (typeof context?.warn === "function") {
    context.warn(message);
    return;
  }

  context?.log?.(`WARNING: ${message}`);
}

function isEmptySharePointValue(value) {
  return value === undefined || value === null || value === "";
}

function transformSharePointValue(sharePointField, value, type) {
  if (sharePointField === "TipoDeTitulo") {
    if (type?.key === "RECLAMACIONES") {
      return CLAIM_TITLE_TYPE_VALUES[value] || value;
    }
    return TITLE_TYPE_VALUES[value] || value;
  }

  if (sharePointField === "Localizacion" && type?.key === "OBJETOS_PERDIDOS") {
    return LOST_OBJECT_LOCATION_VALUES[value] || value;
  }

  if (sharePointField === "LineaMetro") {
    return METRO_LINE_VALUES[value] || value;
  }

  if (["Localizacion", "LugarEntrega", "Origen", "Destino", "PuntoDeVenta"].includes(sharePointField)) {
    return OPERATION_LOCATION_VALUES[value] || value;
  }

  if (["Estacion", "EstPerdida", "EstOrig", "EstDest"].includes(sharePointField)) {
    return LOCATION_VALUES[value] || value;
  }

  if (sharePointField === "Clasificacion") {
    return CLASSIFICATION_VALUES[value] || value;
  }

  if (sharePointField === "TipoDeInstalacion") {
    return INSTALLATION_TYPE_VALUES[value] || value;
  }

  if (sharePointField === "Motivo") {
    return THANKS_REASON_VALUES[value] || value;
  }

  if (sharePointField === "Lugar") {
    return type?.key === "AGRADECIMIENTOS"
      ? THANKS_PLACE_VALUES[value] || value
      : OPERATION_LOCATION_VALUES[value] || value;
  }

  if (sharePointField === "DirigidoA") {
    return THANKS_TARGET_VALUES[value] || value;
  }

  if (sharePointField === "Tren" && value === "desconocido") {
    return "No sé qué tren es";
  }

  if (sharePointField === "MetodoNotificacion") {
    return NOTIFICATION_METHOD_VALUES[value] || value;
  }

  return value;
}

function buildSolicitudResponse(item, listName, attachments = [], timeline = [], type) {
  const fields = item.fields || {};
  const token = fields.Title || "";
  const estado = fields.EstadoCliente || fields.Estado || "En tramite";
  const submittedAt = toIsoDateTime(item.createdDateTime || fields.Created || fields.FechaCreacion);
  const updatedAt = toIsoDateTime(item.lastModifiedDateTime || fields.Modified || fields.FechaModificacionEstadoCliente || submittedAt);
  const responseText = fields.RespuestaOrganizacion || fields.Respuesta || "";
  const normalizedAttachments = attachments.map(mapAttachmentForResponse);

  return {
    id: item.id,
    lista: listName,
    token,
    estado,
    tipoFormulario: fields.TipoFormulario || "",
    tipoSolicitud: "",
    titulo: token,
    nombreCompleto: fields.NombreCliente
      ? [fields.NombreCliente, fields.ApellidoCliente1, fields.ApellidoCliente2].filter(Boolean).join(" ")
      : [fields.Nombre, fields.Apellidos].filter(Boolean).join(" "),
    email: fields.CorreoElectronico || fields.EmailCliente || "",
    telefono: fields.Telefono || fields.TelefonoCliente1 || "",
    fechaCreacion: submittedAt,
    descripcion: fields.Descripcion || fields.DescripcionConsulta || "",
    respuestaOrganizacion: {
      texto: responseText,
      fecha: fields.FechaRespuesta || "",
    },
    adjuntos: attachments,
    timeline,
    caseId: token,
    type: type?.label || fields.TipoFormulario || listName,
    status: estado,
    submittedAt,
    updatedAt,
    resolutionSummary: responseText || buildDefaultStatusSummary(estado),
    nextStep: buildNextStep(estado, responseText),
    attachments: normalizedAttachments,
  };
}

function mapAttachmentForResponse(attachment) {
  return {
    id: attachment.id || attachment.nombre || attachment.name || "",
    name: attachment.nombre || attachment.name || "Adjunto",
    url: attachment.urlDescarga || attachment.webUrl || attachment.url || "",
    mimeType: attachment.tipo || attachment.mimeType || "",
    size: attachment.size || formatFileSize(attachment.tamanioBytes || attachment.sizeBytes || 0),
  };
}

function toIsoDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString();
}

function buildDefaultStatusSummary(status) {
  if (normalizeComparable(status).includes("tram")) {
    return "La solicitud esta registrada y pendiente de revision por el area responsable.";
  }

  return "La solicitud tiene una actualizacion registrada.";
}

function buildNextStep(status, responseText) {
  if (responseText) {
    return "Revise la informacion de estado indicada por Metro de Malaga.";
  }

  if (normalizeComparable(status).includes("tram")) {
    return "Recibira una notificacion cuando se incorpore una respuesta al expediente.";
  }

  return "";
}

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

async function resolveSharePointTarget(accessToken, type, config = getConfig(), context) {
  if (!type?.sharePoint?.listName) {
    throw new Error(`Tipo de formulario sin lista SharePoint configurada: ${type?.key || "desconocido"}.`);
  }

  const siteId = getSiteIdForType(type, config);
  const listId = await resolveListId(accessToken, siteId, type.sharePoint, context);

  return {
    siteId,
    siteEnvKey: type.sharePoint.siteEnvKey,
    siteUrl: type.sharePoint.siteUrl,
    listName: type.sharePoint.listName,
    listId,
    listUrl: type.sharePoint.listUrl,
  };
}

async function resolveListId(accessToken, siteId, sharePointTarget, context) {
  const cacheKey = `${siteId}|${sharePointTarget.listUrl || sharePointTarget.listName}`;
  if (listIdCache.has(cacheKey)) {
    return listIdCache.get(cacheKey);
  }

  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/lists?$select=id,name,displayName,webUrl`;
  context?.log?.(`resolveListId - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const lists = response.data?.value || [];
  const match = lists.find((list) => listMatchesTarget(list, sharePointTarget));
  if (!match?.id) {
    throw new Error(`No se encontro la lista SharePoint '${sharePointTarget.listName}' en ${sharePointTarget.siteUrl}.`);
  }

  listIdCache.set(cacheKey, match.id);
  return match.id;
}

async function resolveListByName(accessToken, siteId, listName, context) {
  const cacheKey = `${siteId}|name:${listName}`;
  if (listIdCache.has(cacheKey)) {
    return listIdCache.get(cacheKey);
  }

  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(siteId)}/lists?$select=id,name,displayName,webUrl`;
  context?.log?.(`resolveListByName - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const lists = response.data?.value || [];
  const match = lists.find((list) => list.displayName === listName || list.name === listName);
  if (!match?.id) {
    throw new Error(`No se encontro la biblioteca SharePoint '${listName}'.`);
  }

  listIdCache.set(cacheKey, match);
  return match;
}

function listMatchesTarget(list, sharePointTarget) {
  const expectedUrl = normalizeSharePointUrl(sharePointTarget.listUrl);
  const actualUrl = normalizeSharePointUrl(list.webUrl);

  return actualUrl === expectedUrl
    || actualUrl.endsWith(`/${encodeURIComponent(sharePointTarget.listName).replace(/%20/g, " ")}`)
    || list.displayName === sharePointTarget.listName
    || list.name === sharePointTarget.listName;
}

function normalizeSharePointUrl(url) {
  return String(url || "")
    .replace(/\/Forms\/AllItems\.aspx$/i, "")
    .replace(/\/AllItems\.aspx$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function buildPostalAddress(payload) {
  if (!(payload.recibirPostal === true || payload.recibirPostal === "on")) return "";

  return [
    payload.viaContacto,
    payload.numContacto,
    payload.escContacto,
    payload.pisoContacto,
    payload.puerContacto,
    payload.cpContacto,
    payload.municipioContacto,
    payload.provinciaContacto,
  ].filter(Boolean).join(", ");
}

function graphHeaders(accessToken, extraHeaders = {}) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders,
  };
}

function encodeGraphPath(pathValue) {
  return String(pathValue || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function sanitizeDocumentLibraryFolderName(name) {
  return String(name || "sin-referencia")
    .replace(/[~"#%&*:<>?/\\{|}\x00-\x1F]/g, "_")
    .trim()
    .slice(0, 128)
    || "sin-referencia";
}

function sanitizeDocumentLibraryFileName(name) {
  return String(name || "documento.bin")
    .replace(/[~"#%&*:<>?/\\{|}\x00-\x1F]/g, "_")
    .trim()
    .slice(0, 128)
    || "documento.bin";
}

function normalizeSiteUrl(siteUrl) {
  return String(siteUrl || "").replace(/\/$/, "");
}

function sanitizeAttachmentFileName(fileName) {
  return String(fileName || "adjunto.bin")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .slice(0, 128);
}

function escapeSharePointRestString(value) {
  return String(value || "").replace(/'/g, "''");
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function formatTokenRoles(payload) {
  if (Array.isArray(payload?.roles)) return payload.roles.join(",");
  if (payload?.roles) return String(payload.roles);
  if (payload?.scp) return `scp:${payload.scp}`;
  return "sin roles/scp";
}

function escapeOData(value) {
  return String(value).replace(/'/g, "''");
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function identityMatches(actual, expected, fieldName = "") {
  if (String(fieldName).toLowerCase().includes("telefono")) {
    return normalizePhoneComparable(actual) === normalizePhoneComparable(expected);
  }

  return normalizeComparable(actual) === normalizeComparable(expected);
}

function normalizePhoneComparable(value) {
  return String(value || "").replace(/[^\d]/g, "").replace(/^0034/, "").replace(/^34/, "");
}

function hexThumbprintToBase64Url(thumbprintHex) {
  const cleanHex = String(thumbprintHex || "").replace(/[\s:.-]/g, "").toUpperCase();
  if (cleanHex.length !== 40) {
    throw new Error("Thumbprint invalido. Debe tener 40 caracteres hexadecimales.");
  }

  return Buffer.from(cleanHex, "hex")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function normalizePem(rawKey) {
  if (!rawKey) {
    throw new Error("AZURE_CERT_PRIVATE_KEY no esta configurada.");
  }

  if (rawKey.includes("\n")) return rawKey;
  if (rawKey.includes("\\n")) return rawKey.replace(/\\n/g, "\n");

  const body = rawKey
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s/g, "");

  const lines = body.match(/.{1,64}/g)?.join("\n") || body;
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines}\n-----END RSA PRIVATE KEY-----`;
}

module.exports = {
  getGraphAccessToken,
  getSharePointAccessToken,
  createListItem,
  uploadListItemAttachments,
  uploadNativeListItemAttachments,
  formatAttachmentUploadError,
  buildDocumentLibraryAttachmentPlan,
  prepareLookupFieldWrites,
  findListItemByEmailAndToken,
  findListItemByContactAndToken,
  findSanctionByExpedienteAndDni,
  buildSancionResponse,
  getListItemAttachments,
  getListItemTimeline,
  buildSharePointFields,
  buildFieldCompatibilityWarnings,
  buildSolicitudResponse,
  resolveSharePointTarget,
  hexThumbprintToBase64Url,
  normalizePem,
};
