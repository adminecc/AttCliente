const { app } = require("@azure/functions");
const { getGraphAccessToken, findSanctionByExpedienteAndDni, buildSancionResponse } = require("../shared/sharepoint");
const { PUBLIC_ERRORS } = require("../shared/public-errors");

app.http("consultarSancion", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "sanciones/consultar",
  handler: async (request, context) => {
    context.log("consultarSancion - inicio");

    let body;
    try {
      body = await request.json();
    } catch (error) {
      context.warn?.("consultarSancion - petición no válida:", error.message);
      return jsonResponse(400, {
        error: PUBLIC_ERRORS.invalidRequest,
      });
    }

    const expediente = String(body?.Title || "").trim().toUpperCase();
    const dni = String(body?.DNI || "").replace(/[\s-]/g, "").toUpperCase();
    if (!expediente || !dni) {
      return jsonResponse(400, {
        error: "Indica el número de expediente y el documento de identidad.",
      });
    }

    if (!/^SAN-\d{4}-[A-Z0-9]{6}$/.test(expediente)) {
      return jsonResponse(400, {
        error: "El número de expediente no tiene un formato válido.",
      });
    }

    try {
      const accessToken = await getGraphAccessToken();
      const item = await findSanctionByExpedienteAndDni(
        accessToken,
        expediente,
        dni,
        undefined,
        context
      );
      if (!item) {
        return jsonResponse(404, {
          encontrado: false,
          mensaje: "No se encontro la sancion indicada.",
        });
      }

      return jsonResponse(200, {
        encontrado: true,
        sancion: buildSancionResponse(item),
      });
    } catch (error) {
      context.error(
        "consultarSancion - error consultando SharePoint:",
        error.message,
        error.response?.data
      );
      return jsonResponse(500, { error: PUBLIC_ERRORS.serviceUnavailable });
    }
  },
});

function jsonResponse(status, body) {
  return {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}
