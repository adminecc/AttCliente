/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AZURE FUNCTION 3 — createSharePointItem
 *  Metro Málaga · Portal de Atención al Cliente
 * ───────────────────────────────────────────────────────────────────────────
 *  Responsabilidad:
 *    Crea un ítem en la lista de SharePoint Online que corresponde al tipo
 *    de solicitud recibida, usando autenticación via App Registration de
 *    Entra ID con certificado X.509 (thumbprint).
 *
 *  Flujo interno:
 *    1. Recibe payload validado (procedente de fn1)
 *    2. Genera el token de consulta (invoca fn2 directamente)
 *    3. Obtiene access_token de Entra ID via Client Credentials + certificado
 *    4. Determina la lista de SharePoint según listaDestino
 *    5. Construye el ítem con los campos estándar + específicos
 *    6. Realiza POST a MS Graph API para crear el ítem
 *    7. Devuelve el ID del ítem creado y el token al llamador
 *       (el llamador enviará el email con el token)
 *
 *  Variables de entorno requeridas (App Settings en Azure):
 *    AZURE_TENANT_ID            → ID del tenant de Entra ID
 *    AZURE_CLIENT_ID            → Application (client) ID del App Registration
 *    AZURE_CERT_THUMBPRINT      → Thumbprint SHA-1 del certificado X.509
 *    AZURE_CERT_PRIVATE_KEY     → Clave privada PEM (sin cabeceras, en una línea o multilinea)
 *    SHAREPOINT_SITE_ID         → ID del site de SharePoint (o URL relativa)
 *    SHAREPOINT_SITE_URL        → URL base del site (ej: https://tenant.sharepoint.com/sites/MetroMalaga)
 *
 *  Entrada (HTTP POST):
 *    Payload sanitizado de fn1 + captcha ya verificado
 *
 *  Salida:
 *    201 Created → { solicitudId, token, listaDestino, creadoEn }
 *    400         → { error: "..." }
 *    500         → { error: "Error interno" }
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { app }  = require("@azure/functions");
const axios    = require("axios");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const { generarToken } = require("../fn2-generateToken/index");

// ─── Configuración desde variables de entorno ─────────────────────────────────

const CONFIG = {
  tenantId:        process.env.AZURE_TENANT_ID,
  clientId:        process.env.AZURE_CLIENT_ID,
  certThumbprint:  process.env.AZURE_CERT_THUMBPRINT,
  certPrivateKey:  process.env.AZURE_CERT_PRIVATE_KEY,  // PEM
  siteId:          process.env.SHAREPOINT_SITE_ID,
  siteUrl:         process.env.SHAREPOINT_SITE_URL,
};

// ─── Mapeo listaDestino → nombre interno de lista SharePoint ─────────────────
//
//   Estos son los nombres EXACTOS de las listas en SharePoint Online.
//   Deben coincidir con los nombres internos (no los títulos de visualización).
//
const SHAREPOINT_LISTAS = {
  INCIDENCIAS:      "Incidencias_Ciudadanas",
  SUGERENCIAS:      "Sugerencias_Ciudadanas",
  RECLAMACIONES:    "Reclamaciones_Ciudadanas",
  INFORMACION:      "Solicitudes_Informacion",
  OBJETOS_PERDIDOS: "Objetos_Perdidos",
  ACCESIBILIDAD:    "Incidencias_Accesibilidad",
};

// ─── Función principal ────────────────────────────────────────────────────────

app.http("createSharePointItem", {
  methods: ["POST"],
  authLevel: "anonymous", // Auth por APIM JWT
  route: "solicitudes/crear",

  handler: async (request, context) => {
    context.log("createSharePointItem — inicio");

    let payload;
    try {
      payload = await request.json();
    } catch {
      return errorResponse(400, "Cuerpo de petición JSON inválido.");
    }

    // ── Validar que llega listaDestino ────────────────────────────────────
    const { listaDestino } = payload;
    if (!listaDestino || !SHAREPOINT_LISTAS[listaDestino]) {
      return errorResponse(400, `listaDestino '${listaDestino}' no reconocida.`);
    }

    // ── Step 1: Generar token de consulta (fn2) ───────────────────────────
    let tokenConsulta;
    try {
      tokenConsulta = generarToken(listaDestino);
      context.log(`createSharePointItem — token generado: ${tokenConsulta}`);
    } catch (err) {
      context.log.error("Error generando token:", err.message);
      return errorResponse(500, "Error al generar el token de consulta.");
    }

    // ── Step 2: Obtener access_token de Entra ID ──────────────────────────
    let accessToken;
    try {
      accessToken = await obtenerAccessToken(context);
      context.log("createSharePointItem — access_token obtenido de Entra ID");
    } catch (err) {
      context.log.error("Error obteniendo access_token:", err.message);
      return errorResponse(500, "Error de autenticación con Entra ID.");
    }

    // ── Step 3: Determinar nombre de lista SharePoint ─────────────────────
    const nombreLista = SHAREPOINT_LISTAS[listaDestino];
    context.log(`createSharePointItem — lista destino: ${nombreLista}`);

    // ── Step 4: Construir ítem SharePoint ─────────────────────────────────
    const ahora = new Date().toISOString();
    const itemSharePoint = construirItemSharePoint(payload, tokenConsulta, ahora);

    // ── Step 5: Crear ítem en SharePoint via MS Graph ─────────────────────
    let itemCreado;
    try {
      itemCreado = await crearItemEnSharePoint(
        accessToken,
        CONFIG.siteId,
        nombreLista,
        itemSharePoint,
        context
      );
      context.log(`createSharePointItem — ítem creado con ID: ${itemCreado.id}`);
    } catch (err) {
      context.log.error("Error creando ítem en SharePoint:", err.message, err.response?.data);
      return errorResponse(500, "Error al registrar la solicitud en el sistema.");
    }

    // ── Respuesta exitosa ─────────────────────────────────────────────────
    return {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitudId:   itemCreado.id,
        token:         tokenConsulta,
        listaDestino,
        nombreLista,
        creadoEn:      ahora,
        email:         payload.email,   // El orquestador usará esto para enviar el email
        mensaje:       "Solicitud registrada correctamente. Se enviará el token de consulta a su correo.",
      }),
    };
  },
});

// ─── Autenticación Entra ID con Certificado X.509 ────────────────────────────

/**
 * Obtiene un access_token de Microsoft Entra ID usando el flujo
 * Client Credentials con autenticación por certificado (más seguro que client_secret).
 *
 * Flujo:
 *   1. Genera un JWT firmado con la clave privada del certificado (client_assertion)
 *   2. POST a https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
 *   3. Devuelve el access_token con scope https://graph.microsoft.com/.default
 *
 * Referencia: https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow
 */
async function obtenerAccessToken(context) {
  const { tenantId, clientId, certThumbprint, certPrivateKey } = CONFIG;

  if (!tenantId || !clientId || !certThumbprint || !certPrivateKey) {
    throw new Error("Variables de entorno de autenticación no configuradas (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CERT_THUMBPRINT, AZURE_CERT_PRIVATE_KEY).");
  }

  // ── Generar thumbprint en Base64URL (x5t) ────────────────────────────────
  // El thumbprint que Azure muestra es SHA-1 hex. Debemos convertirlo a Base64URL.
  const thumbprintBase64 = hexThumbprintToBase64Url(certThumbprint);

  // ── Construir el client_assertion JWT ────────────────────────────────────
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const ahora = Math.floor(Date.now() / 1000);

  const payload = {
    aud: tokenUrl,
    iss: clientId,
    sub: clientId,
    jti: crypto.randomUUID(),
    nbf: ahora,
    iat: ahora,
    exp: ahora + 300, // 5 minutos de validez
  };

  const privateKeyPem = normalizarPem(certPrivateKey);

  const clientAssertion = jwt.sign(payload, privateKeyPem, {
    algorithm: "RS256",
    header: {
      alg: "RS256",
      typ: "JWT",
      x5t: thumbprintBase64,   // Entra ID busca el certificado por este thumbprint
    },
  });

  // ── Solicitar access_token ────────────────────────────────────────────────
  const params = new URLSearchParams({
    client_id:             clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion:      clientAssertion,
    grant_type:            "client_credentials",
    scope:                 "https://graph.microsoft.com/.default",
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  if (!response.data?.access_token) {
    throw new Error("Entra ID no devolvió access_token: " + JSON.stringify(response.data));
  }

  return response.data.access_token;
}

// ─── Crear ítem en SharePoint via MS Graph ────────────────────────────────────

/**
 * Llama a la API de MS Graph para insertar un ítem en una lista de SharePoint.
 *
 * Endpoint: POST /sites/{siteId}/lists/{listName}/items
 *
 * @param {string} accessToken  - Bearer token de Entra ID
 * @param {string} siteId       - ID del site SharePoint (ej: "tenant.sharepoint.com,{guid},{guid}")
 * @param {string} nombreLista  - Nombre interno de la lista
 * @param {object} campos       - Objeto con los campos del ítem
 * @param {object} context      - Azure Functions context para logging
 * @returns {object}            - Ítem creado (con id)
 */
async function crearItemEnSharePoint(accessToken, siteId, nombreLista, campos, context) {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${nombreLista}/items`;

  context.log(`crearItemEnSharePoint — POST ${url}`);

  const body = {
    fields: campos,
  };

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept:         "application/json",
    },
    timeout: 15000,
  });

  return response.data;
}

// ─── Construcción del ítem SharePoint ────────────────────────────────────────

/**
 * Mapea el payload del formulario a los campos de la lista de SharePoint.
 * Los nombres de los campos deben coincidir con los InternalName de las columnas.
 *
 * Campos COMUNES a todas las listas:
 *   Title              → Resumen / título del ítem (campo estándar obligatorio SP)
 *   NombreCompleto     → Nombre y apellidos del solicitante
 *   Email              → Correo electrónico
 *   Telefono           → Teléfono de contacto (opcional)
 *   TokenConsulta      → Token único para consultar el estado
 *   TipoSolicitud      → Valor de listaDestino
 *   Estado             → Estado inicial: "Recibida"
 *   FechaCreacion      → ISO timestamp de creación
 *   FechaIncidente     → Fecha del incidente (si aplica)
 *   IPOrigen           → IP del solicitante (si disponible en headers)
 *
 * Campos ESPECÍFICOS se añaden dinámicamente según listaDestino.
 */
function construirItemSharePoint(payload, tokenConsulta, ahora) {
  const campos = {
    // ── Campos comunes ──────────────────────────────────────────────────
    Title:           generarTituloItem(payload),
    NombreCompleto:  payload.nombreCompleto,
    Email:           payload.email,
    Telefono:        payload.telefonoContacto || "",
    TokenConsulta:   tokenConsulta,
    TipoSolicitud:   payload.listaDestino,
    Estado:          "Recibida",
    FechaCreacion:   ahora,
    FechaIncidente:  payload.fechaIncidente || "",
    Descripcion:     payload.descripcion    || "",
  };

  // ── Campos específicos por tipo ─────────────────────────────────────
  switch (payload.listaDestino) {

    case "INCIDENCIAS":
      Object.assign(campos, {
        LineaAfectada:    payload.lineaAfectada    || "",
        EstacionAfectada: payload.estacionAfectada || "",
        TipoIncidencia:   payload.tipoIncidencia   || "",
        HoraAproximada:   payload.horaAproximada   || "",
      });
      break;

    case "SUGERENCIAS":
      Object.assign(campos, {
        AmbitoSugerencia: payload.ambitoSugerencia || "",
        TituloSugerencia: payload.titulo           || "",
        Valoracion:       payload.valoracion       || null,
      });
      break;

    case "RECLAMACIONES":
      Object.assign(campos, {
        TipoReclamacion:       payload.tipoReclamacion       || "",
        ImporteReclamado:      payload.importeReclamado      || null,
        AceptaNotificacion:    payload.aceptaNotificacionEmail === true,
      });
      break;

    case "INFORMACION":
      Object.assign(campos, {
        TemaConsulta: payload.temaConsulta || "",
      });
      break;

    case "OBJETOS_PERDIDOS":
      Object.assign(campos, {
        DescripcionObjeto:     payload.descripcionObjeto     || "",
        LugarPerdida:          payload.lugarPerdida          || "",
        ValorEconomico:        payload.valorEconomico        || "",
        DescripcionDetallada:  payload.descripcionDetallada  || "",
      });
      break;

    case "ACCESIBILIDAD":
      Object.assign(campos, {
        TipoProblema:     payload.tipoProblema     || "",
        EstacionAfectada: payload.estacionAfectada || "",
      });
      break;
  }

  return campos;
}

/**
 * Genera el campo Title (resumen) del ítem según el tipo.
 * SharePoint requiere siempre Title, así que lo construimos de forma legible.
 */
function generarTituloItem(payload) {
  const fecha = new Date().toLocaleDateString("es-ES");
  const tipo  = payload.listaDestino?.replace("_", " ") || "SOLICITUD";
  const nombre = payload.nombreCompleto?.split(" ")[0] || "Ciudadano";
  return `${tipo} – ${nombre} – ${fecha}`;
}

// ─── Utilidades de certificado ────────────────────────────────────────────────

/**
 * Convierte el thumbprint SHA-1 hexadecimal (como lo muestra Azure Portal)
 * al formato Base64URL que requiere el campo x5t del JWT header.
 *
 * Azure Portal muestra: "A1B2C3D4E5F6..."  (40 hex chars)
 * x5t requiere:         base64url(SHA1_bytes)
 *
 * @param {string} thumbprintHex - Thumbprint en formato hex (con o sin espacios/colones)
 * @returns {string} Base64URL
 */
function hexThumbprintToBase64Url(thumbprintHex) {
  // Limpiar separadores opcionales (espacios, colones, guiones)
  const hexLimpio = thumbprintHex.replace(/[\s:.-]/g, "").toUpperCase();

  if (hexLimpio.length !== 40) {
    throw new Error(`Thumbprint inválido: longitud ${hexLimpio.length} (se esperan 40 hex chars)`);
  }

  const buffer = Buffer.from(hexLimpio, "hex");

  // Base64URL = Base64 sin padding, con + → - y / → _
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Normaliza la clave privada PEM.
 * En App Settings de Azure Functions los saltos de línea a veces se pierden.
 * Esta función restaura el formato PEM correcto si la clave viene en una sola línea.
 *
 * @param {string} rawKey - Clave privada (PEM, posiblemente sin saltos de línea)
 * @returns {string} PEM bien formateado
 */
function normalizarPem(rawKey) {
  if (!rawKey) throw new Error("AZURE_CERT_PRIVATE_KEY no está configurada.");

  // Si ya tiene saltos de línea, probablemente está bien
  if (rawKey.includes("\n")) return rawKey;

  // Si viene como literal \n (string escapado en JSON/env)
  if (rawKey.includes("\\n")) return rawKey.replace(/\\n/g, "\n");

  // Si viene sin cabeceras ni saltos: añadir estructura PEM mínima
  // (los 64 caracteres por línea es el estándar PEM)
  const cuerpo = rawKey
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s/g, "");

  const lineas = cuerpo.match(/.{1,64}/g)?.join("\n") || cuerpo;
  return `-----BEGIN RSA PRIVATE KEY-----\n${lineas}\n-----END RSA PRIVATE KEY-----`;
}

/** Respuesta de error estándar */
function errorResponse(status, mensaje) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: mensaje }),
  };
}
