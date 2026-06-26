const { app } = require("@azure/functions");
const { normalizeRequestType, getAcceptedTypeValues } = require("../shared/form-contract");
const { generarTokenForType } = require("../shared/token");

app.http("generateToken", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/generartoken",
  handler: async (request, context) => {
    context.log("generateToken - inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, {
        error: "El cuerpo de la peticion no es JSON valido.",
      });
    }

    const type = normalizeRequestType(body);
    if (!type) {
      return jsonResponse(400, {
        error: `tipoFormulario no valido. Valores aceptados: ${getAcceptedTypeValues().join(", ")}`,
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
