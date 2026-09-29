const { app } = require("@azure/functions");
const { normalizeRequestType } = require("../shared/form-contract");
const { generarTokenForType } = require("../shared/token");
const { PUBLIC_ERRORS } = require("../shared/public-errors");

app.http("generateToken", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/generartoken",
  handler: async (request, context) => {
    context.log("generateToken - inicio");

    let body;
    try {
      body = await request.json();
    } catch (error) {
      context.warn?.("generateToken - petición no válida:", error.message);
      return jsonResponse(400, {
        error: PUBLIC_ERRORS.invalidRequest,
      });
    }

    const type = normalizeRequestType(body);
    if (!type) {
      return jsonResponse(400, {
        error: "El tipo de formulario no es válido.",
      });
    }

    return jsonResponse(200, {
      token: generarTokenForType(type),
      tipoFormulario: type.formValue,
      listaDestino: type.key,
      generadoEn: new Date().toISOString(),
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
