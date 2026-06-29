const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getConfig, assertGraphConfig, getSiteIdForType } = require("./config");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const listIdCache = new Map();
const listColumnsCache = new Map();

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
  "linea-1": "Cualquiera de Línea 1",
  "linea-2": "Cualquiera de Línea 2",
  tren: "Interior del tren",
  otro: "Otra ubicación",
  "otra-ubicacion": "Otra ubicación",
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

const FIELD_MAP = {
  clasificacion: "Clasificacion",
  fechaIncidencia: "FechaIncidencia",
  horaIncidencia: "HoraIncidencia",
  tipologia: "Tipologia",
  subtipologia: "Subtipologia",
  lugarIncidencia: "LugarIncidencia",
  trenIncidencia: "TrenIncidencia",
  otroLugarIncidencia: "OtroLugarIncidencia",
  tipoInstalacion: "TipoInstalacion",
  tipoTitulo: "TipoTitulo",
  importe_reclamado_1: "ImporteReclamado",
  descripcionDetallada: "Descripcion",

  descripcionDetalladaConsulta: "Descripcion",
  tipologiaConsulta: "Tipologia",
  subtipologiaConsulta: "Subtipologia",
  lugarConsulta: "Estacion",
  trenConsulta: "TrenIncidencia",
  otroLugarConsulta: "OtraUbicacion",
  tipoInstalacionConsulta: "TipoInstalacion",
  tipoTituloConsulta: "TipoDeTitulo",
  numeracionTituloConsulta: "NumTituloViaje",

  lugarSugerencia: "Estacion",
  estacionSugerencia: "Estacion",
  otroLugarSugerencia: "OtraUbicacion",
  tipoTituloSugerencia: "TipoDeTitulo",
  numeracionTituloSugerencia: "NumTituloViaje",
  descripcionSugerencia: "Descripcion",

  motivoAgradecimiento: "Motivo",
  fechaAgradecimiento: "FechaEpisodio",
  lugarAgradecimiento: "Lugar",
  estacionAgradecimiento: "Estacion",
  estacionAgradecimientoDetalle: "Estacion",
  trenAgradecimiento: "Tren",
  dirigidoAgradecimiento: "DirigidoA",
  variosColectivos: "Colectivos",
  nombreEmpleado: "NumIdentificacionPersonaTrabajad",
  descripcionAgradecimiento: "Descripcion",

  fechaPerdida: "FechaPerdida",
  horaPerdida: "HoraPerdida",
  lineaMetroObjetos: "LineaMetro",
  dondePerdidoObjetos: "LugarPerdida",
  estacionPerdidaObjetos: "EstacionPerdida",
  numeroTrenObjetos: "NumeroTren",
  estacionOrigenObjetos: "EstacionOrigen",
  estacionDestinoObjetos: "EstacionDestino",
  nombreObjetoObjetos: "NombreObjeto",
  colorObjetoObjetos: "ColorObjeto",
  distintivoObjetoObjetos: "DistintivoObjeto",
  descripcionObjeto: "Descripcion",

  motivoTarjeta: "MotivoTarjeta",
  tipoTarjeta: "TipoTarjeta",
  fechaNacimiento: "FechaNacimiento",
  genero: "Genero",
  direccionCompleta: "DireccionCompleta",
  codigoPostal: "CodigoPostal",
  municipio: "Municipio",
  provincia: "Provincia",
  puntoRecogida: "PuntoRecogida",
};

async function getGraphAccessToken(config = getConfig()) {
  assertGraphConfig(config);

  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const params = config.clientSecret
    ? buildClientSecretTokenParams(config)
    : buildCertificateTokenParams(config, tokenUrl);

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  if (!response.data?.access_token) {
    throw new Error("Microsoft Graph no devolvio access_token.");
  }

  return response.data.access_token;
}

function buildClientSecretTokenParams(config) {
  return new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });
}

function buildCertificateTokenParams(config, tokenUrl) {
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
    scope: "https://graph.microsoft.com/.default",
  });
}

async function createListItem(accessToken, type, fields, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items`;
  const writableColumns = await resolveWritableColumnNames(accessToken, target, context);
  const filteredFields = filterKnownFields(fields, writableColumns, context, target);

  context?.log?.(`createListItem - POST ${url}`);

  const response = await axios.post(url, { fields: filteredFields }, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return response.data;
}

async function findListItemByEmailAndToken(accessToken, type, email, token, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const readableColumns = await resolveColumnNames(accessToken, target, context);
  const emailField = readableColumns.has("CorreoElectronico") ? "CorreoElectronico" : "Email";
  const tokenField = "Title";
  const filter = `fields/${emailField} eq '${escapeOData(email)}' and fields/${tokenField} eq '${escapeOData(token)}'`;
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items` +
    "?$expand=fields" +
    `&$filter=${encodeURIComponent(filter)}` +
    "&$top=1";

  context?.log?.(`findListItemByEmailAndToken - GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: graphHeaders(accessToken, {
        Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
      }),
      timeout: 15000,
    });

    return response.data?.value?.[0] || null;
  } catch (error) {
    warn(
      context,
      `findListItemByEmailAndToken - filtro Graph no disponible, usando busqueda local: ${error.message}`
    );
    return findListItemByEmailAndTokenFallback(accessToken, target, emailField, email, token, context);
  }
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
      && normalizeComparable(fields[emailField]) === normalizeComparable(email);
  }) || null;
}

async function getListItemAttachments(accessToken, type, itemId, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items/${itemId}/driveItem/children`;
  context?.log?.(`getListItemAttachments - GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: graphHeaders(accessToken),
      timeout: 15000,
    });

    return (response.data?.value || []).map((file) => ({
      nombre: file.name,
      tipo: file.file?.mimeType || "",
      tamanioBytes: file.size || 0,
      urlDescarga: file["@microsoft.graph.downloadUrl"] || "",
      webUrl: file.webUrl || "",
    }));
  } catch {
    return [];
  }
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
        estado: fields.Estado || "",
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
    Nombre: payload.nombre || "",
    Apellidos: payload.apellidos || "",
    TipoDeDocumento: payload.tipoDocumento || "",
    NumeroDeDocumento: payload.numeroDocumento || "",
    CorreoElectronico: payload.email || "",
    Telefono: payload.telefono || "",
    Nacionalidad: payload.nacionalidad || "",
    TokenConsulta: token,
    TipoFormulario: type.formValue,
    TipoSolicitud: type.key,
    EstadoCliente: "En tramite",
    FechaCreacion: createdAt,
    RecibirPostal: payload.recibirPostal === true || payload.recibirPostal === "on",
    Direccion: payload.viaContacto || "",
    Numero: payload.numContacto || "",
    Escalera: payload.escContacto || "",
    Piso: payload.pisoContacto || "",
    Puerta: payload.puerContacto || "",
    CP: payload.cpContacto || "",
    Localidad: payload.municipioContacto || "",
    Provincia: payload.provinciaContacto || "",
    PayloadJson: JSON.stringify(payload),
  };

  for (const [payloadField, sharePointField] of Object.entries(FIELD_MAP)) {
    if (payload[payloadField] !== undefined && payload[payloadField] !== "") {
      fields[sharePointField] = transformSharePointValue(sharePointField, payload[payloadField]);
    }
  }

  return fields;
}

async function resolveWritableColumnNames(accessToken, target, context) {
  const cacheKey = `${target.siteId}|${target.listId}|columns`;
  if (listColumnsCache.has(cacheKey)) {
    return listColumnsCache.get(cacheKey);
  }

  const url = `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/columns?$select=name,hidden,readOnly`;
  context?.log?.(`resolveWritableColumnNames - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  const columns = new Set(
    (response.data?.value || [])
      .filter((column) => !column.hidden && column.readOnly !== true)
      .map((column) => column.name)
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

    if (writableColumns.has(name)) {
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

function transformSharePointValue(sharePointField, value) {
  if (sharePointField === "TipoDeTitulo") {
    return TITLE_TYPE_VALUES[value] || value;
  }

  if (sharePointField === "Estacion") {
    return LOCATION_VALUES[value] || value;
  }

  if (sharePointField === "Motivo") {
    return THANKS_REASON_VALUES[value] || value;
  }

  if (sharePointField === "Lugar") {
    return THANKS_PLACE_VALUES[value] || value;
  }

  if (sharePointField === "DirigidoA") {
    return THANKS_TARGET_VALUES[value] || value;
  }

  return value;
}

function buildSolicitudResponse(item, listName, attachments = [], timeline = []) {
  const fields = item.fields || {};

  return {
    id: item.id,
    lista: listName,
    token: fields.Title || fields.TokenConsulta || "",
    estado: fields.Estado || "",
    tipoFormulario: fields.TipoFormulario || "",
    tipoSolicitud: fields.TipoSolicitud || "",
    titulo: fields.Title || "",
    nombreCompleto: fields.NombreCompleto || "",
    email: fields.CorreoElectronico || fields.Email || "",
    telefono: fields.Telefono || "",
    fechaCreacion: fields.FechaCreacion || "",
    descripcion: fields.Descripcion || "",
    respuestaOrganizacion: {
      texto: fields.RespuestaOrganizacion || "",
      fecha: fields.FechaRespuesta || "",
    },
    adjuntos: attachments,
    timeline,
  };
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

function escapeOData(value) {
  return String(value).replace(/'/g, "''");
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
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
  createListItem,
  findListItemByEmailAndToken,
  getListItemAttachments,
  getListItemTimeline,
  buildSharePointFields,
  buildSolicitudResponse,
  resolveSharePointTarget,
  hexThumbprintToBase64Url,
  normalizePem,
};
