const crypto = require("crypto");
const {
  FORM_TYPES,
  normalizeRequestType,
  getTypeByTokenPrefix,
} = require("./form-contract");

const SAFE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generarTokenForType(type) {
  if (!type?.tokenPrefix) {
    throw new Error("tipoFormulario no valido para generar token.");
  }

  return `${type.tokenPrefix}-${new Date().getFullYear()}-${randomString(8)}`;
}

function generarTokenFromPayload(payload) {
  const type = normalizeRequestType(payload);
  return generarTokenForType(type);
}

function validarFormatoToken(token) {
  if (!token || typeof token !== "string") return false;
  const prefixes = Object.values(FORM_TYPES).map((type) => type.tokenPrefix).join("|");
  return new RegExp(`^(${prefixes})-\\d{4}-[${SAFE_ALPHABET}]{8}$`).test(token);
}

function getTypeFromToken(token) {
  const normalized = String(token || "").trim().toUpperCase();
  if (!validarFormatoToken(normalized)) return null;
  return getTypeByTokenPrefix(normalized.substring(0, 3));
}

function randomString(length) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += SAFE_ALPHABET[crypto.randomInt(0, SAFE_ALPHABET.length)];
  }
  return result;
}

module.exports = {
  SAFE_ALPHABET,
  generarTokenForType,
  generarTokenFromPayload,
  validarFormatoToken,
  getTypeFromToken,
};
