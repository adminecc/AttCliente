const PUBLIC_ERRORS = Object.freeze({
  invalidRequest: "La información enviada no es válida. Revisa el formulario e inténtalo de nuevo.",
  invalidFields: "Revisa los campos obligatorios y el formato de los datos.",
  invalidSession: "No se ha podido validar la sesión del formulario. Recarga la página e inténtalo de nuevo.",
  expiredSession: "La sesión del formulario ha caducado. Recarga la página e inténtalo de nuevo.",
  usedSession: "Este formulario ya se ha enviado. Recarga la página para iniciar una nueva solicitud.",
  serviceUnavailable: "No hemos podido completar la operación en este momento. Inténtalo de nuevo más tarde.",
  partialSuccess: "La solicitud se ha registrado, pero no hemos podido completar todo el proceso. Conserva el número de solicitud.",
  attachmentWarning: "La solicitud se ha registrado, pero uno o varios archivos no se pudieron adjuntar.",
});

function getPublicSessionError(error) {
  const normalized = String(error || "").toLowerCase();
  if (normalized.includes("caduc")) return PUBLIC_ERRORS.expiredSession;
  if (normalized.includes("utilizado")) return PUBLIC_ERRORS.usedSession;
  return PUBLIC_ERRORS.invalidSession;
}

module.exports = {
  PUBLIC_ERRORS,
  getPublicSessionError,
};
