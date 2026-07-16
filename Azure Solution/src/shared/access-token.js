const crypto = require("crypto");

const DEFAULT_TABLE_NAME = "FunctionAccessTokens";
const DEFAULT_TTL_MINUTES = 15;
const DEFAULT_PARTITION_KEY = "web-publica";

function getAccessTokenConfig(env = process.env) {
  return {
    tableName: env.ACCESS_TOKEN_TABLE_NAME || DEFAULT_TABLE_NAME,
    ttlMinutes: toPositiveInt(env.ACCESS_TOKEN_TTL_MINUTES, DEFAULT_TTL_MINUTES),
    partitionKey: env.ACCESS_TOKEN_PARTITION_KEY || DEFAULT_PARTITION_KEY,
    allowedOrigins: parseCsv(env.ACCESS_TOKEN_ALLOWED_ORIGINS),
    allowedIps: parseCsv(env.ACCESS_TOKEN_ALLOWED_IPS),
    requireForSolicitudes: String(env.ACCESS_TOKEN_REQUIRED || "false").toLowerCase() === "true",
    singleUse: String(env.ACCESS_TOKEN_SINGLE_USE || "false").toLowerCase() === "true",
    storeDisabled: String(env.ACCESS_TOKEN_STORE_DISABLED || "false").toLowerCase() === "true",
    connectionString: env.ACCESS_TOKEN_STORAGE_CONNECTION_STRING || env.AzureWebJobsStorage,
  };
}

function parseCsv(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function generateGuidToken() {
  return crypto.randomUUID();
}

function getRequestHeader(request, name) {
  if (typeof request.headers?.get === "function") {
    return request.headers.get(name) || "";
  }

  const lower = name.toLowerCase();
  return request.headers?.[name] || request.headers?.[lower] || "";
}

function getRequestOrigin(request) {
  return String(getRequestHeader(request, "origin") || getRequestHeader(request, "referer") || "").trim();
}

function normalizeOrigin(origin) {
  const raw = String(origin || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return raw.replace(/\/$/, "").toLowerCase();
  }
}

function getClientIp(request) {
  const forwardedFor = String(getRequestHeader(request, "x-forwarded-for") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  const candidate = forwardedFor
    || getRequestHeader(request, "x-real-ip")
    || request.ip
    || request.socket?.remoteAddress
    || request.connection?.remoteAddress
    || request.httpRequest?.socket?.remoteAddress
    || request.context?.req?.socket?.remoteAddress
    || "";

  return normalizeIp(candidate);
}

function normalizeIp(ip) {
  return String(ip || "")
    .trim()
    .replace(/^::ffff:/, "");
}

function isIpAllowed(clientIp, allowedIps = []) {
  if (!allowedIps.length) return true;
  const normalizedClientIp = normalizeIp(clientIp);
  return allowedIps.some((allowed) => normalizeIp(allowed) === normalizedClientIp);
}

function isOriginAllowed(origin, allowedOrigins = []) {
  if (!allowedOrigins.length) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.some((allowed) => normalizeOrigin(allowed) === normalizedOrigin);
}

function isRequesterAllowed(request, config = getAccessTokenConfig()) {
  const clientIp = getClientIp(request);
  const origin = getRequestOrigin(request);

  return {
    allowed: isIpAllowed(clientIp, config.allowedIps) && isOriginAllowed(origin, config.allowedOrigins),
    clientIp,
    origin: normalizeOrigin(origin),
  };
}

function getBearerToken(request) {
  const authorization = String(getRequestHeader(request, "authorization") || "").trim();
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization);
  if (bearer) return bearer[1].trim();

  return String(
    getRequestHeader(request, "x-mm-access-token")
    || getRequestHeader(request, "x-access-token")
    || ""
  ).trim();
}

function assertStorageConfigured(config = getAccessTokenConfig()) {
  if (config.storeDisabled) return;
  if (!config.connectionString) {
    throw new Error("ACCESS_TOKEN_STORAGE_CONNECTION_STRING o AzureWebJobsStorage no esta configurado.");
  }
}

function createTableClient(config = getAccessTokenConfig()) {
  assertStorageConfigured(config);
  const { TableClient } = require("@azure/data-tables");
  return TableClient.fromConnectionString(config.connectionString, config.tableName);
}

async function ensureTokenTable(config = getAccessTokenConfig(), client) {
  if (config.storeDisabled) return;
  const tableClient = client || createTableClient(config);
  await tableClient.createTable().catch((error) => {
    const code = error.code || error.details?.odataError?.code;
    if (code !== "TableAlreadyExists") throw error;
  });
}

async function saveAccessToken({ token, request, purpose }, config = getAccessTokenConfig(), client) {
  const tableClient = client || createTableClient(config);
  await ensureTokenTable(config, tableClient);

  const now = new Date();
  const expiresAtUtc = new Date(now.getTime() + config.ttlMinutes * 60 * 1000);
  const requester = isRequesterAllowed(request, config);

  const entity = {
    partitionKey: config.partitionKey,
    rowKey: token,
    createdAtUtc: now.toISOString(),
    expiresAtUtc: expiresAtUtc.toISOString(),
    clientIp: requester.clientIp || "",
    origin: requester.origin || "",
    purpose: String(purpose || "").slice(0, 128),
    used: false,
  };

  await tableClient.createEntity(entity);
  return entity;
}

async function validateAccessToken(request, options = {}) {
  const config = options.config || getAccessTokenConfig();
  const token = String(options.token || getBearerToken(request) || "").trim();

  if (!token) {
    return { valid: false, status: 401, error: "No se ha informado token de acceso." };
  }

  if (!isGuid(token)) {
    return { valid: false, status: 401, error: "El token de acceso no tiene un formato valido." };
  }

  const requester = isRequesterAllowed(request, config);
  if (!requester.allowed) {
    return { valid: false, status: 403, error: "Origen no autorizado.", requester };
  }

  const tableClient = options.client || createTableClient(config);
  let entity;
  try {
    entity = await tableClient.getEntity(config.partitionKey, token);
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status;
    if (statusCode === 404) {
      return { valid: false, status: 401, error: "Token de acceso inexistente o caducado." };
    }
    throw error;
  }

  const now = Date.now();
  const expiresAt = Date.parse(entity.expiresAtUtc);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return { valid: false, status: 401, error: "Token de acceso caducado." };
  }

  if (config.singleUse && entity.used === true) {
    return { valid: false, status: 401, error: "Token de acceso ya utilizado." };
  }

   // DESHABILITADA LA VALIDACION POR IP
 /* if (entity.clientIp && requester.clientIp && normalizeIp(entity.clientIp) !== normalizeIp(requester.clientIp)) {
    return { valid: false, status: 403, error: "La IP actual no coincide con la IP emisora del token." };
  }*/

  if (entity.origin && requester.origin && normalizeOrigin(entity.origin) !== normalizeOrigin(requester.origin)) {
    return { valid: false, status: 403, error: "El origen actual no coincide con el origen emisor del token." };
  }

  if (config.singleUse) {
    await tableClient.updateEntity({
      partitionKey: config.partitionKey,
      rowKey: token,
      used: true,
      usedAtUtc: new Date().toISOString(),
    }, "Merge");
  }

  return { valid: true, token, entity, requester };
}

async function deleteExpiredAccessTokens(config = getAccessTokenConfig(), client) {
  const tableClient = client || createTableClient(config);
  await ensureTokenTable(config, tableClient);

  const nowIso = new Date().toISOString();
  const filter = `PartitionKey eq '${escapeODataString(config.partitionKey)}' and expiresAtUtc lt '${escapeODataString(nowIso)}'`;
  let deleted = 0;

  for await (const entity of tableClient.listEntities({ queryOptions: { filter } })) {
    await tableClient.deleteEntity(entity.partitionKey, entity.rowKey);
    deleted += 1;
  }

  return deleted;
}

function escapeODataString(value) {
  return String(value || "").replace(/'/g, "''");
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

module.exports = {
  DEFAULT_TABLE_NAME,
  DEFAULT_TTL_MINUTES,
  getAccessTokenConfig,
  generateGuidToken,
  getRequestHeader,
  getRequestOrigin,
  getClientIp,
  normalizeOrigin,
  normalizeIp,
  isRequesterAllowed,
  getBearerToken,
  createTableClient,
  ensureTokenTable,
  saveAccessToken,
  validateAccessToken,
  deleteExpiredAccessTokens,
  isGuid,
};
