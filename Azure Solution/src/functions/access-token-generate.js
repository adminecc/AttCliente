const { app } = require("@azure/functions");
const {
  getAccessTokenConfig,
  generateGuidToken,
  isRequesterAllowed,
  saveAccessToken,
} = require("../shared/access-token");

app.http("generateAccessToken", {
  methods: ["POST", "GET"],
  authLevel: "anonymous",
  route: "seguridad/token",
  handler: async (request, context) => {
    context.log("generateAccessToken - inicio");

    const config = getAccessTokenConfig();
    const requester = isRequesterAllowed(request, config);
    
    context.log(
      "REQUESTER=" +
      JSON.stringify(requester, null, 2)
    );


    if (!requester.allowed) {
      context.warn?.(
        `generateAccessToken - origen no autorizado ip=${requester.clientIp || ""} origin=${requester.origin || ""}`
      );
      return jsonResponse(403, {
        ok: false,
        error: "Origen no autorizado.",
      });
    }

    let purpose = "";
    if (request.method === "POST") {
      try {
        const body = await request.json();
        purpose = body?.purpose || body?.tipoFormulario || "";
      } catch {
        purpose = "";
      }
    }

    const token = generateGuidToken();

    if (!config.storeDisabled) {
      try {
        await saveAccessToken({ token, request, purpose }, config);
      } catch (error) {
        context.error("generateAccessToken - error guardando token temporal:", error.message);
        return jsonResponse(500, {
          ok: false,
          error: "No se pudo generar el token temporal.",
        });
      }
    }

    return jsonResponse(200, {
      ok: true,
      token,
      tokenType: "Bearer",
      expiresInMinutes: config.ttlMinutes,
      expiresAtUtc: new Date(Date.now() + config.ttlMinutes * 60 * 1000).toISOString(),
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
