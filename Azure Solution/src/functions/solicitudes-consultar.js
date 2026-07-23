const { app } = require("@azure/functions");
const { isEmail } = require("../shared/validation");
const { getTypeFromToken } = require("../shared/token");
const {
  getGraphAccessToken,
  findListItemByContactAndToken,
  getListItemAttachments,
  getListItemTimeline,
  buildSolicitudResponse,
} = require("../shared/sharepoint");

app.http("consultarSolicitud", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/consultar",
  handler: async (request, context) => {
    context.log("consultarSolicitud - inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, {
        error: "El cuerpo de la peticion no es JSON valido.",
      });
    }

    const email = normalizeEmail(body.email);
    const telefono = normalizePhone(body.telefono);
    const personalData = String(body.personalData || body.datoConfirmacion || "").trim();
    const token = normalizeToken(body.token);

    context.log(`TOKEN_RECIBIDO='${token}'`);
    
    const contact = buildContact({ email, telefono, personalData });

    if (!contact || !token) {
      return jsonResponse(400, {
        error: "Los campos 'token' y correo electronico o telefono son obligatorios.",
      });
    }

    if (contact.kind === "email" && !isEmail(contact.value)) {
      return jsonResponse(400, {
        error: "El formato del correo electronico no es valido.",
      });
    }

    const type = getTypeFromToken(token);
    if (!type) {
      return jsonResponse(400, {
        error: "El token no permite identificar una lista de consulta valida.",
      });
    }

    let accessToken;
    try {
      accessToken = await getGraphAccessToken();
    } catch (error) {
      context.error("consultarSolicitud - error autenticando con Microsoft Graph:", error.message);
      return jsonResponse(500, {
        error: "Error de autenticacion con Microsoft Graph.",
      });
    }

    let item;
    try {
      item = await findListItemByContactAndToken(
        accessToken,
        type,
        contact,
        token,
        undefined,
        context
      );
    } catch (error) {
      context.error("consultarSolicitud - error consultando SharePoint:", error.message, error.response?.data);
      return jsonResponse(500, {
        error: "Error al consultar la solicitud en SharePoint.",
      });
    }

    if (!item) {
      return jsonResponse(404, {
        encontrado: false,
        mensaje: "No se encontro ninguna solicitud asociada al dato de confirmacion y token indicados.",
      });
    }

    const [attachments, timeline] = await Promise.all([
      getListItemAttachments(accessToken, type, item.id, undefined, context,token),
      getListItemTimeline(accessToken, type, item.id, undefined, context).catch((error) => {
        if (typeof context.warn === "function") {
          context.warn("consultarSolicitud - no se pudo recuperar timeline:", error.message);
        } else {
          context.log("WARNING: consultarSolicitud - no se pudo recuperar timeline:", error.message);
        }
        return [];
      }),
    ]);

    return jsonResponse(200, {
      encontrado: true,
      solicitud: buildSolicitudResponse(item, type.sharePoint.listName, attachments, timeline, type),
    });
  },
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "").replace(/^0034/, "").replace(/^34/, "");
}

function normalizeToken(token) {
  return String(token || "").trim().toUpperCase();
}

function buildContact({ email, telefono, personalData }) {
  if (email) return { kind: "email", value: email };
  if (telefono) return { kind: "phone", value: telefono };

  const value = String(personalData || "").trim();
  if (!value) return null;
  if (value.includes("@")) return { kind: "email", value: normalizeEmail(value) };
  const normalizedPhone = normalizePhone(value);
  return normalizedPhone ? { kind: "phone", value: normalizedPhone } : null;
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
