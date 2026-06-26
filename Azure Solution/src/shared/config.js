function getConfig() {
  return {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    certThumbprint: process.env.AZURE_CERT_THUMBPRINT,
    certPrivateKey: process.env.AZURE_CERT_PRIVATE_KEY,
    sites: {
      SHAREPOINT_CONNECTA_SITE_ID: process.env.SHAREPOINT_CONNECTA_SITE_ID || process.env.SHAREPOINT_SITE_ID,
      SHAREPOINT_TARJETAS_SITE_ID: process.env.SHAREPOINT_TARJETAS_SITE_ID,
    },
    siteUrls: {
      SHAREPOINT_CONNECTA_SITE_ID: process.env.SHAREPOINT_CONNECTA_SITE_URL || "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      SHAREPOINT_TARJETAS_SITE_ID: process.env.SHAREPOINT_TARJETAS_SITE_URL || "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro",
    },
  };
}

function assertGraphConfig(config = getConfig()) {
  const missing = [];

  for (const key of ["tenantId", "clientId"]) {
    if (!config[key]) missing.push(key);
  }

  const hasClientSecret = Boolean(config.clientSecret);
  const hasCertificate = Boolean(config.certThumbprint && config.certPrivateKey);
  if (!hasClientSecret && !hasCertificate) {
    missing.push("AZURE_CLIENT_SECRET or AZURE_CERT_THUMBPRINT + AZURE_CERT_PRIVATE_KEY");
  }

  if (!config.sites?.SHAREPOINT_CONNECTA_SITE_ID) {
    missing.push("SHAREPOINT_CONNECTA_SITE_ID");
  }

  if (!config.sites?.SHAREPOINT_TARJETAS_SITE_ID) {
    missing.push("SHAREPOINT_TARJETAS_SITE_ID");
  }

  if (missing.length > 0) {
    throw new Error(`Variables de Microsoft Graph no configuradas: ${missing.join(", ")}.`);
  }
}

function getSiteIdForType(type, config = getConfig()) {
  const siteEnvKey = type?.sharePoint?.siteEnvKey;
  if (!siteEnvKey) {
    throw new Error(`Tipo de formulario sin site SharePoint configurado: ${type?.key || "desconocido"}.`);
  }

  const siteId = config.sites?.[siteEnvKey];
  if (!siteId) {
    throw new Error(`Variable ${siteEnvKey} no configurada.`);
  }

  return siteId;
}

module.exports = {
  getConfig,
  assertGraphConfig,
  getSiteIdForType,
};
