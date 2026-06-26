const { app } = require("@azure/functions");
const { isEmail } = require("../shared/validation");
const { getTypeFromToken } = require("../shared/token");
const {
  getGraphAccessToken,
  findListItemByEmailAndToken,
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
    const token = normalizeToken(body.token);

    if (!email || !token) {
      return jsonResponse(400, {
        error: "Los campos 'email' y 'token' son obligatorios.",
      });
    }

    if (!isEmail(email)) {
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
      context.log.error("consultarSolicitud - error autenticando con Microsoft Graph:", error.message);
      return jsonResponse(500, {
        error: "Error de autenticacion con Microsoft Graph.",
      });
    }

    let item;
    try {
      item = await findListItemByEmailAndToken(
        accessToken,
        type,
        email,
        token,
        undefined,
        context
      );
    } catch (error) {
      context.log.error("consultarSolicitud - error consultando SharePoint:", error.message, error.response?.data);
      return jsonResponse(500, {
        error: "Error al consultar la solicitud en SharePoint.",
      });
    }

    if (!item) {
      return jsonResponse(404, {
        encontrado: false,
        mensaje: "No se encontro ninguna solicitud asociada al email y token indicados.",
      });
    }

    const [attachments, timeline] = await Promise.all([
      getListItemAttachments(accessToken, type, item.id, undefined, context),
      getListItemTimeline(accessToken, type, item.id, undefined, context).catch((error) => {
        context.log.warn("consultarSolicitud - no se pudo recuperar timeline:", error.message);
        return [];
      }),
    ]);

    return jsonResponse(200, {
      encontrado: true,
      solicitud: buildSolicitudResponse(item, type.sharePoint.listName, attachments, timeline),
    });
  },
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeToken(token) {
  return String(token || "").trim().toUpperCase();
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
