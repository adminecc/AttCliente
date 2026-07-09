const { app } = require("@azure/functions");
const { deleteExpiredAccessTokens, getAccessTokenConfig } = require("../shared/access-token");

app.timer("cleanupAccessTokens", {
  schedule: "0 */30 * * * *",
  handler: async (_timer, context) => {
    const config = getAccessTokenConfig();

    if (config.storeDisabled) {
      context.log("cleanupAccessTokens - almacen deshabilitado, no se ejecuta limpieza.");
      return;
    }

    try {
      const deleted = await deleteExpiredAccessTokens(config);
      context.log(`cleanupAccessTokens - tokens caducados eliminados=${deleted}`);
    } catch (error) {
      context.error("cleanupAccessTokens - error limpiando tokens caducados:", error.message);
      throw error;
    }
  },
});
