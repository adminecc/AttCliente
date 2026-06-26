const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getConfig, assertGraphConfig, getSiteIdForType } = require("./config");
const { PUBLIC_SHAREPOINT_FIELDS } = require("./form-contract");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const listIdCache = new Map();

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

  descripcionCortaConsulta: "DescripcionCorta",
  descripcionDetalladaConsulta: "Descripcion",
  tipologiaConsulta: "Tipologia",
  subtipologiaConsulta: "Subtipologia",
  lugarConsulta: "LugarIncidencia",
  trenConsulta: "TrenIncidencia",
  otroLugarConsulta: "OtroLugarIncidencia",
  tipoInstalacionConsulta: "TipoInstalacion",
  tipoTituloConsulta: "TipoTitulo",

  areaSugerencia: "AreaSugerencia",
  estacionSugerencia: "Estacion",
  tituloSugerencia: "TituloSugerencia",
  descripcionSugerencia: "Descripcion",

  motivoAgradecimiento: "MotivoAgradecimiento",
  fechaAgradecimiento: "FechaAgradecimiento",
  estacionAgradecimiento: "Estacion",
  nombreEmpleado: "NombreEmpleado",
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
  context?.log?.(`createListItem - POST ${url}`);

  const response = await axios.post(url, { fields }, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return response.data;
}

async function findListItemByEmailAndToken(accessToken, type, email, token, config = getConfig(), context) {
  const target = await resolveSharePointTarget(accessToken, type, config, context);
  const filter = `fields/Email eq '${escapeOData(email)}' and fields/TokenConsulta eq '${escapeOData(token)}'`;
  const select = encodeURIComponent(PUBLIC_SHAREPOINT_FIELDS.join(","));
  const url =
    `${GRAPH_BASE_URL}/sites/${encodeURIComponent(target.siteId)}/lists/${encodeURIComponent(target.listId)}/items` +
    `?$expand=fields($select=${select})` +
    `&$filter=${encodeURIComponent(filter)}` +
    "&$top=1";

  context?.log?.(`findListItemByEmailAndToken - GET ${url}`);

  const response = await axios.get(url, {
    headers: graphHeaders(accessToken),
    timeout: 15000,
  });

  return response.data?.value?.[0] || null;
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
    Title: buildTitle(payload, type),
    Nombre: payload.nombre || "",
    Apellidos: payload.apellidos || "",
    NombreCompleto: payload.nombreCompleto || "",
    TipoDocumento: payload.tipoDocumento || "",
    NumeroDocumento: payload.numeroDocumento || "",
    Email: payload.email || "",
    Telefono: payload.telefono || "",
    Nacionalidad: payload.nacionalidad || "",
    TokenConsulta: token,
    TipoFormulario: type.formValue,
    TipoSolicitud: type.key,
    Estado: "Recibida",
    FechaCreacion: createdAt,
    RecibirPostal: payload.recibirPostal === true || payload.recibirPostal === "on",
    DireccionContacto: buildPostalAddress(payload),
    PayloadJson: JSON.stringify(payload),
  };

  for (const [payloadField, sharePointField] of Object.entries(FIELD_MAP)) {
    if (payload[payloadField] !== undefined && payload[payloadField] !== "") {
      fields[sharePointField] = payload[payloadField];
    }
  }

  return fields;
}

function buildSolicitudResponse(item, listName, attachments = [], timeline = []) {
  const fields = item.fields || {};

  return {
    id: item.id,
    lista: listName,
    token: fields.TokenConsulta || "",
    estado: fields.Estado || "",
    tipoFormulario: fields.TipoFormulario || "",
    tipoSolicitud: fields.TipoSolicitud || "",
    titulo: fields.Title || "",
    nombreCompleto: fields.NombreCompleto || "",
    email: fields.Email || "",
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

function buildTitle(payload, type) {
  const date = new Date().toLocaleDateString("es-ES");
  const name = payload.nombre || "Solicitante";
  return `${type.label} - ${name} - ${date}`;
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

function graphHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function escapeOData(value) {
  return String(value).replace(/'/g, "''");
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
