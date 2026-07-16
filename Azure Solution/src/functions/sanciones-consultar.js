const { app } = require("@azure/functions");
const { getGraphAccessToken, findSanctionByExpedienteAndDni, buildSancionResponse } = require("../shared/sharepoint");

app.http("consultarSancion", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "sanciones/consultar",
  handler: async (request, context) => {
    context.log("consultarSancion - inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, {
        error: "El cuerpo de la peticion no es JSON valido.",
      });
    }

    const expediente = String(body?.Title || "").trim().toUpperCase();
    const dni = String(body?.DNI || "").replace(/[\s-]/g, "").toUpperCase();
    if (!expediente || !dni) {
      return jsonResponse(400, {
        error: "Los campos 'Title' y 'DNI' son obligatorios.",
      });
    }

    if (!/^SAN-\d{4}-[A-Z0-9]{6}$/.test(expediente)) {
      return jsonResponse(400, {
        error: "El campo 'Title' no tiene un formato de expediente valido.",
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
        error.message
      );
      return jsonResponse(500, { error: "Error al consultar la sancion en SharePoint." });
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
