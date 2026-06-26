const { app } = require("@azure/functions");
const { validateSolicitudPayload } = require("../shared/validation");
const { generarTokenForType } = require("../shared/token");
const {
  getGraphAccessToken,
  createListItem,
  buildSharePointFields,
} = require("../shared/sharepoint");

app.http("crearSolicitud", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/crear",
  handler: async (request, context) => {
    context.log("crearSolicitud - inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, {
        ok: false,
        error: "El cuerpo de la peticion no es JSON valido.",
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
      context.log.error("crearSolicitud - error autenticando con Microsoft Graph:", error.message);
      return jsonResponse(500, {
        ok: false,
        error: "Error de autenticacion con Microsoft Graph.",
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
      context.log.error("crearSolicitud - error creando item SharePoint:", error.message, error.response?.data);
      return jsonResponse(500, {
        ok: false,
        error: "Error al registrar la solicitud en SharePoint.",
      });
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
      email: validation.payload.email,
      mensaje: "Solicitud registrada correctamente. Se enviara el token de consulta al correo indicado.",
    });
  },
});

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
