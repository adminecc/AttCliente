const {
  COMMON_REQUIRED_FIELDS,
  POSTAL_REQUIRED_FIELDS,
  normalizeRequestType,
} = require("./form-contract");

function validateSolicitudPayload(rawPayload) {
  const payload = sanitizePayload(rawPayload || {});
  const errors = [];
  const type = normalizeRequestType(payload);

  if (!type) {
    errors.push("tipoFormulario");
  }

  for (const field of COMMON_REQUIRED_FIELDS) {
    if (isMissing(payload[field])) {
      errors.push(field);
    }
  }

  if (type) {
    for (const field of type.requiredFields) {
      if (isMissing(payload[field])) {
        errors.push(field);
      }
    }
  }

  if (payload.recibirPostal === true || payload.recibirPostal === "on") {
    for (const field of POSTAL_REQUIRED_FIELDS) {
      if (isMissing(payload[field])) {
        errors.push(field);
      }
    }
  }

  if (payload.email && !isEmail(payload.email)) {
    errors.push("email");
  }

  if (payload.confirmEmail && payload.email !== payload.confirmEmail) {
    errors.push("confirmEmail");
  }

  if (payload.telefono && !isSpanishPhone(payload.telefono)) {
    errors.push("telefono");
  }

  for (const field of ["fechaIncidencia", "fechaPerdida", "fechaNacimiento", "fechaAgradecimiento"]) {
    if (payload[field] && !isValidDateNotFuture(payload[field])) {
      errors.push(field);
    }
  }

  payload.tipoFormulario = type?.formValue || payload.tipoFormulario;
  payload.listaDestino = type?.key || payload.listaDestino;
  payload.nombreCompleto = [payload.nombre, payload.apellidos].filter(Boolean).join(" ").trim();

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    payload,
    type,
  };
}

function sanitizePayload(body) {
  const sanitized = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (typeof value === "string") {
      sanitized[key] = key.toLowerCase().includes("email")
        ? value.trim().toLowerCase()
        : value.trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function isMissing(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return value !== true;
  return String(value).trim() === "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

function isSpanishPhone(value) {
  return /^(\+34|0034|34)?[6789][0-9]{8}$/.test(String(value).replace(/\s/g, ""));
}

function isValidDateNotFuture(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

module.exports = {
  validateSolicitudPayload,
  sanitizePayload,
  isEmail,
  isSpanishPhone,
};
