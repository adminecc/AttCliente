function getConfig() {
  const sanctionsSiteUrl =
    process.env.SHAREPOINT_SANCIONES_SITE_URL ||
    process.env.SHAREPOINT_ATTCLIENTE_SITE_URL ||
    "https://metromalaga.sharepoint.com/sites/ConectaDEV";
  const sanctionsListName =
    process.env.SHAREPOINT_SANCIONES_LIST_NAME || "Sanciones";

  return {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    certThumbprint: process.env.AZURE_CERT_THUMBPRINT,
    certPrivateKey: process.env.AZURE_CERT_PRIVATE_KEY,
    sites: {
      SHAREPOINT_ATTCLIENTE_SITE_ID:
        process.env.SHAREPOINT_ATTCLIENTE_SITE_ID || process.env.SHAREPOINT_SITE_ID,
      SHAREPOINT_TARJETAS_SITE_ID: process.env.SHAREPOINT_TARJETAS_SITE_ID,
    },
    siteUrls: {
      SHAREPOINT_ATTCLIENTE_SITE_ID:
        process.env.SHAREPOINT_ATTCLIENTE_SITE_URL ||
        "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      SHAREPOINT_TARJETAS_SITE_ID:
        process.env.SHAREPOINT_TARJETAS_SITE_URL ||
        "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro",
      SHAREPOINT_SANCIONES_SITE_ID:
        sanctionsSiteUrl,
    },
    sanctions: {
      siteId:
        process.env.SHAREPOINT_SANCIONES_SITE_ID ||
        process.env.SHAREPOINT_ATTCLIENTE_SITE_ID ||
        process.env.SHAREPOINT_SITE_ID,
      siteUrl: sanctionsSiteUrl,
      listName: sanctionsListName,
      listUrl:
        process.env.SHAREPOINT_SANCIONES_LIST_URL ||
        `${sanctionsSiteUrl.replace(/\/$/, "")}/Lists/${encodeURIComponent(sanctionsListName)}/AllItems.aspx`,
    },
  };
}

/**
 * Valida únicamente la configuración común necesaria para obtener un token
 * de Microsoft Graph. Los Site ID se validan después, únicamente para el
 * tipo de formulario que se está procesando.
 *
 * Esto evita que la ausencia de SHAREPOINT_TARJETAS_SITE_ID bloquee las
 * solicitudes que se guardan en ConectaDEV, y viceversa.
 */
function assertGraphConfig(config = getConfig()) {
  const missing = [];

  if (!config.tenantId) {
    missing.push("AZURE_TENANT_ID");
  }

  if (!config.clientId) {
    missing.push("AZURE_CLIENT_ID");
  }

  const hasClientSecret = Boolean(config.clientSecret);
  const hasCertificate = Boolean(
    config.certThumbprint && config.certPrivateKey
  );

  if (!hasClientSecret && !hasCertificate) {
    missing.push(
      "AZURE_CLIENT_SECRET o AZURE_CERT_THUMBPRINT + AZURE_CERT_PRIVATE_KEY"
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de Microsoft Graph no configuradas: ${missing.join(", ")}.`
    );
  }
}

/**
 * Devuelve el Site ID que corresponde al tipo de formulario actual.
 * Solo se exige la variable concreta que ese formulario necesita.
 */
function getSiteIdForType(type, config = getConfig()) {
  const siteEnvKey = type?.sharePoint?.siteEnvKey;

  if (!siteEnvKey) {
    throw new Error(
      `Tipo de formulario sin site SharePoint configurado: ${
        type?.key || "desconocido"
      }.`
    );
  }

  const siteId = config.sites?.[siteEnvKey];

  if (!siteId) {
    throw new Error(`Variable ${siteEnvKey} no configurada.`);
  }

  return siteId;
}

function getSiteUrlForType(type, config = getConfig()) {
  const siteEnvKey = type?.sharePoint?.siteEnvKey;

  if (!siteEnvKey) {
    throw new Error(
      `Tipo de formulario sin site SharePoint configurado: ${
        type?.key || "desconocido"
      }.`
    );
  }

  return config.siteUrls?.[siteEnvKey] || type.sharePoint.siteUrl;
}

module.exports = {
  getConfig,
  assertGraphConfig,
  getSiteIdForType,
  getSiteUrlForType,
};
