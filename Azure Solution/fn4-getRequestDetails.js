/**
 * AZURE FUNCTION 4 — getRequestDetails
 * POST /api/solicitudes/consultar
 *
 * Entrada:
 * {
 *   "email": "usuario@correo.com",
 *   "token": "REC-2026-K7M3PQ9R"
 * }
 */

const { app } = require("@azure/functions");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const CONFIG = {
  tenantId: process.env.AZURE_TENANT_ID,
  clientId: process.env.AZURE_CLIENT_ID,
  certThumbprint: process.env.AZURE_CERT_THUMBPRINT,
  certPrivateKey: process.env.AZURE_CERT_PRIVATE_KEY,
  siteId: process.env.SHAREPOINT_SITE_ID,
  siteUrl: process.env.SHAREPOINT_SITE_URL
};

const PREFIJO_A_LISTA = {
  INC: "Incidencias_Ciudadanas",
  SUG: "Sugerencias_Ciudadanas",
  REC: "Reclamaciones_Ciudadanas",
  INF: "Solicitudes_Informacion",
  OBJ: "Objetos_Perdidos",
  ACC: "Incidencias_Accesibilidad"
};

const CAMPOS_PUBLICOS = [
  "Title",
  "NombreCompleto",
  "Email",
  "Telefono",
  "TokenConsulta",
  "TipoSolicitud",
  "Estado",
  "FechaCreacion",
  "FechaIncidente",
  "Descripcion",
  "LineaAfectada",
  "EstacionAfectada",
  "TipoIncidencia",
  "HoraAproximada",
  "AmbitoSugerencia",
  "TituloSugerencia",
  "Valoracion",
  "TipoReclamacion",
  "ImporteReclamado",
  "AceptaNotificacion",
  "TemaConsulta",
  "DescripcionObjeto",
  "LugarPerdida",
  "ValorEconomico",
  "DescripcionDetallada",
  "TipoProblema",
  "RespuestaOrganizacion",
  "FechaRespuesta"
];

app.http("consultarSolicitud", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/consultar",

  handler: async (request, context) => {
    context.log("consultarSolicitud — inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: "El cuerpo de la petición no es JSON válido." });
    }

    const email = normalizarEmail(body.email);
    const token = normalizarToken(body.token);

    if (!email || !token) {
      return jsonResponse(400, {
        error: "Los campos 'email' y 'token' son obligatorios."
      });
    }

    if (!validarEmail(email)) {
      return jsonResponse(400, {
        error: "El formato del correo electrónico no es válido."
      });
    }

    const prefijo = token.substring(0, 3);
    const nombreLista = PREFIJO_A_LISTA[prefijo];

    if (!nombreLista) {
      return jsonResponse(400, {
        error: "El token no permite identificar una lista de consulta válida."
      });
    }

    let graphToken;
    try {
      graphToken = await obtenerAccessTokenGraph();
    } catch (err) {
      context.log.error("Error obteniendo token Graph:", err.message);
      return jsonResponse(500, { error: "Error de autenticación con Microsoft Graph." });
    }

    let item;
    try {
      item = await buscarItemPorEmailYToken(graphToken, nombreLista, email, token, context);
    } catch (err) {
      context.log.error("Error consultando item:", err.message, err.response?.data);
      return jsonResponse(500, { error: "Error al consultar la solicitud." });
    }

    if (!item) {
      return jsonResponse(404, {
        encontrado: false,
        mensaje: "No se encontró ninguna solicitud asociada al email y token indicados."
      });
    }

    let adjuntos = [];
    let timeline = [];

    try {
      adjuntos = await obtenerAdjuntosSharePoint(graphToken, nombreLista, item.id, context);
    } catch (err) {
      context.log.warn("No se pudieron recuperar adjuntos:", err.message);
    }

    try {
      timeline = await obtenerTimelineVersiones(graphToken, nombreLista, item.id, context);
    } catch (err) {
      context.log.warn("No se pudo recuperar timeline:", err.message);
    }

    const solicitud = construirRespuesta(item, nombreLista, adjuntos, timeline);

    return jsonResponse(200, {
      encontrado: true,
      solicitud
    });
  }
});

async function buscarItemPorEmailYToken(accessToken, nombreLista, email, token, context) {
  const filtro =
    `fields/Email eq '${escapeOData(email)}' and fields/TokenConsulta eq '${escapeOData(token)}'`;

  const url =
    `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${nombreLista}/items` +
    `?$expand=fields($select=${encodeURIComponent(CAMPOS_PUBLICOS.join(","))})` +
    `&$filter=${encodeURIComponent(filtro)}` +
    `&$top=1`;

  context.log(`buscarItemPorEmailYToken — ${url}`);

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    },
    timeout: 15000
  });

  return response.data?.value?.[0] || null;
}

async function obtenerAdjuntosSharePoint(accessToken, nombreLista, itemId, context) {
  const url =
    `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${nombreLista}/items/${itemId}/driveItem/children`;

  context.log(`obtenerAdjuntosSharePoint — ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      timeout: 15000
    });

    return (response.data?.value || []).map(file => ({
      nombre: file.name,
      tipo: file.file?.mimeType || "",
      tamanioBytes: file.size || 0,
      urlDescarga: file["@microsoft.graph.downloadUrl"] || "",
      webUrl: file.webUrl || ""
    }));
  } catch {
    return [];
  }
}

async function obtenerTimelineVersiones(accessToken, nombreLista, itemId, context) {
  const url =
    `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${nombreLista}/items/${itemId}/versions` +
    `?$expand=fields`;

  context.log(`obtenerTimelineVersiones — ${url}`);

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    },
    timeout: 15000
  });

  const versiones = response.data?.value || [];

  return versiones
    .map(version => {
      const f = version.fields || {};

      return {
        fecha: version.lastModifiedDateTime || "",
        usuario: version.lastModifiedBy?.user?.displayName || "",
        estado: f.Estado || "",
        respuestaOrganizacion: f.RespuestaOrganizacion || "",
        fechaRespuesta: f.FechaRespuesta || "",
        version: version.id || ""
      };
    })
    .filter(x => x.estado || x.respuestaOrganizacion || x.fechaRespuesta);
}

function construirRespuesta(item, nombreLista, adjuntos, timeline) {
  const f = item.fields || {};

  return {
    id: item.id,
    lista: nombreLista,
    token: f.TokenConsulta || "",
    estado: f.Estado || "",
    tipoSolicitud: f.TipoSolicitud || "",
    titulo: f.Title || "",
    nombreCompleto: f.NombreCompleto || "",
    email: f.Email || "",
    telefono: f.Telefono || "",
    fechaCreacion: f.FechaCreacion || "",
    fechaIncidente: f.FechaIncidente || "",
    descripcion: f.Descripcion || "",

    datosEspecificos: {
      lineaAfectada: f.LineaAfectada || "",
      estacionAfectada: f.EstacionAfectada || "",
      tipoIncidencia: f.TipoIncidencia || "",
      horaAproximada: f.HoraAproximada || "",
      ambitoSugerencia: f.AmbitoSugerencia || "",
      tituloSugerencia: f.TituloSugerencia || "",
      valoracion: f.Valoracion || null,
      tipoReclamacion: f.TipoReclamacion || "",
      importeReclamado: f.ImporteReclamado || null,
      aceptaNotificacion: f.AceptaNotificacion === true,
      temaConsulta: f.TemaConsulta || "",
      descripcionObjeto: f.DescripcionObjeto || "",
      lugarPerdida: f.LugarPerdida || "",
      valorEconomico: f.ValorEconomico || "",
      descripcionDetallada: f.DescripcionDetallada || "",
      tipoProblema: f.TipoProblema || ""
    },

    respuestaOrganizacion: {
      texto: f.RespuestaOrganizacion || "",
      fecha: f.FechaRespuesta || ""
    },

    adjuntos,
    timeline
  };
}

async function obtenerAccessTokenGraph() {
  const { tenantId, clientId, certThumbprint, certPrivateKey } = CONFIG;

  if (!tenantId || !clientId || !certThumbprint || !certPrivateKey) {
    throw new Error("Variables de entorno de autenticación no configuradas.");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const thumbprintBase64 = hexThumbprintToBase64Url(certThumbprint);
  const ahora = Math.floor(Date.now() / 1000);

  const assertionPayload = {
    aud: tokenUrl,
    iss: clientId,
    sub: clientId,
    jti: crypto.randomUUID(),
    nbf: ahora,
    iat: ahora,
    exp: ahora + 300
  };

  const clientAssertion = jwt.sign(assertionPayload, normalizarPem(certPrivateKey), {
    algorithm: "RS256",
    header: {
      alg: "RS256",
      typ: "JWT",
      x5t: thumbprintBase64
    }
  });

  const params = new URLSearchParams({
    client_id: clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default"
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    timeout: 10000
  });

  if (!response.data?.access_token) {
    throw new Error("Microsoft Entra ID no devolvió access_token.");
  }

  return response.data.access_token;
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizarToken(token) {
  return String(token || "").trim().toUpperCase();
}

function escapeOData(value) {
  return String(value).replace(/'/g, "''");
}

function hexThumbprintToBase64Url(thumbprintHex) {
  const hexLimpio = thumbprintHex.replace(/[\s:.-]/g, "").toUpperCase();

  if (hexLimpio.length !== 40) {
    throw new Error("Thumbprint inválido. Debe tener 40 caracteres hexadecimales.");
  }

  return Buffer.from(hexLimpio, "hex")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function normalizarPem(rawKey) {
  if (!rawKey) {
    throw new Error("AZURE_CERT_PRIVATE_KEY no está configurada.");
  }

  if (rawKey.includes("\n")) return rawKey;
  if (rawKey.includes("\\n")) return rawKey.replace(/\\n/g, "\n");

  const cuerpo = rawKey
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s/g, "");

  const lineas = cuerpo.match(/.{1,64}/g)?.join("\n") || cuerpo;

  return `-----BEGIN RSA PRIVATE KEY-----\n${lineas}\n-----END RSA PRIVATE KEY-----`;
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}