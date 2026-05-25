/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AZURE FUNCTION 1 — validateRequest
 *  Metro Málaga · Portal de Atención al Cliente
 * ───────────────────────────────────────────────────────────────────────────
 *  Responsabilidad:
 *    Valida el objeto JSON recibido desde el portal web.
 *    CAPTCHA y honeypot ya fueron verificados en la capa web antes del submit.
 *    Esta función valida únicamente la integridad y coherencia del payload:
 *      - Campos obligatorios comunes
 *      - Campos obligatorios según listaDestino
 *      - Formatos (email, teléfono, fechas)
 *      - Longitudes de texto
 *      - Coherencia de valores (fechas no futuras, valores en enum, etc.)
 *
 *  Entrada (HTTP POST, body JSON):
 *    { listaDestino, nombreCompleto, email, ...camposEspecificos }
 *
 *  Salida:
 *    200 OK  → { valid: true, sanitizedPayload: {...} }
 *    400 BAD → { valid: false, errors: ["..."] }
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { app } = require("@azure/functions");

// ─── Constantes ───────────────────────────────────────────────────────────────

const LISTAS_VALIDAS = [
  "INCIDENCIAS",
  "SUGERENCIAS",
  "RECLAMACIONES",
  "INFORMACION",
  "OBJETOS_PERDIDOS",
  "ACCESIBILIDAD",
];

const CAMPOS_COMUNES_OBLIGATORIOS = [
  "listaDestino",
  "nombreCompleto",
  "email",
];

const CAMPOS_OBLIGATORIOS_POR_LISTA = {
  INCIDENCIAS:      ["lineaAfectada", "tipoIncidencia", "descripcion"],
  SUGERENCIAS:      ["ambitoSugerencia", "titulo", "descripcion"],
  RECLAMACIONES:    ["tipoReclamacion", "descripcion", "aceptaNotificacionEmail"],
  INFORMACION:      ["temaConsulta", "descripcion"],
  OBJETOS_PERDIDOS: ["descripcionObjeto", "lugarPerdida"],
  ACCESIBILIDAD:    ["tipoProblema", "estacionAfectada", "descripcion"],
};

const LIMITES_DESCRIPCION = {
  INCIDENCIAS:      { min: 20,  max: 2000 },
  SUGERENCIAS:      { min: 30,  max: 3000 },
  RECLAMACIONES:    { min: 50,  max: 4000 },
  INFORMACION:      { min: 10,  max: 1000 },
  OBJETOS_PERDIDOS: { min: 0,   max: 500  },
  ACCESIBILIDAD:    { min: 10,  max: 1000 },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

app.http("validateRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "solicitudes/validar",

  handler: async (request, context) => {
    context.log("validateRequest — inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ["El cuerpo de la petición no es JSON válido."]);
    }

    const errors = [];

    // ── 1. Campos comunes obligatorios ────────────────────────────────────
    for (const campo of CAMPOS_COMUNES_OBLIGATORIOS) {
      if (!body[campo] || String(body[campo]).trim() === "") {
        errors.push(`El campo '${campo}' es obligatorio.`);
      }
    }

    // ── 2. listaDestino válida ─────────────────────────────────────────────
    if (body.listaDestino && !LISTAS_VALIDAS.includes(body.listaDestino)) {
      errors.push(`Valor de listaDestino no reconocido: '${body.listaDestino}'.`);
    }

    // ── 3. Formato email ───────────────────────────────────────────────────
    if (body.email && !validarEmail(body.email)) {
      errors.push("El formato del correo electrónico no es válido.");
    }

    // ── 4. Formato teléfono (campo opcional) ──────────────────────────────
    if (body.telefonoContacto && body.telefonoContacto !== "") {
      if (!validarTelefonoES(body.telefonoContacto)) {
        errors.push("El formato del teléfono no es válido (use formato español: 6XXXXXXXX).");
      }
    }

    // ── 5. Nombre: longitud y caracteres permitidos ───────────────────────
    if (body.nombreCompleto) {
      const nombre = String(body.nombreCompleto).trim();
      if (nombre.length < 3 || nombre.length > 120) {
        errors.push("El nombre completo debe tener entre 3 y 120 caracteres.");
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s''-]+$/.test(nombre)) {
        errors.push("El nombre solo puede contener letras, espacios y guiones.");
      }
    }

    // ── 6. Campos específicos obligatorios según listaDestino ─────────────
    if (body.listaDestino && LISTAS_VALIDAS.includes(body.listaDestino)) {
      const requeridos = CAMPOS_OBLIGATORIOS_POR_LISTA[body.listaDestino] || [];
      for (const campo of requeridos) {
        const valor = body[campo];
        if (valor === undefined || valor === null || String(valor).trim() === "") {
          errors.push(`El campo '${campo}' es obligatorio para solicitudes de tipo ${body.listaDestino}.`);
        }
      }
    }

    // ── 7. Longitud de descripción ────────────────────────────────────────
    if (body.descripcion && body.listaDestino) {
      const limites = LIMITES_DESCRIPCION[body.listaDestino];
      if (limites) {
        const len = String(body.descripcion).trim().length;
        if (limites.min > 0 && len < limites.min) {
          errors.push(`La descripción debe tener al menos ${limites.min} caracteres.`);
        }
        if (len > limites.max) {
          errors.push(`La descripción no puede superar los ${limites.max} caracteres.`);
        }
      }
    }

    // ── 8. Fecha del incidente no futura ──────────────────────────────────
    if (body.fechaIncidente) {
      const fecha = new Date(body.fechaIncidente);
      if (isNaN(fecha.getTime())) {
        errors.push("Formato de fecha inválido (use YYYY-MM-DD).");
      } else if (fecha > new Date()) {
        errors.push("La fecha del incidente no puede ser futura.");
      }
    }

    // ── 9. Reclamaciones: checkbox de aceptación obligatorio ──────────────
    if (body.listaDestino === "RECLAMACIONES" && body.aceptaNotificacionEmail !== true) {
      errors.push("Debe aceptar la recepción de notificaciones por email para presentar una reclamación.");
    }

    // ── Resultado ─────────────────────────────────────────────────────────
    if (errors.length > 0) {
      context.log(`validateRequest — ${errors.length} error(es) de validación`);
      return errorResponse(400, errors);
    }

    context.log("validateRequest — payload válido");
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valid: true,
        sanitizedPayload: sanitizarPayload(body),
      }),
    };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

function validarTelefonoES(telefono) {
  return /^(\+34|0034|34)?[6789][0-9]{8}$/.test(String(telefono).replace(/\s/g, ""));
}

/** Trim en strings y eliminación de campos que no deben persistir */
function sanitizarPayload(body) {
  const sanitized = {};
  for (const [k, v] of Object.entries(body)) {
    sanitized[k] = typeof v === "string" ? v.trim() : v;
  }
  return sanitized;
}

function errorResponse(status, errors) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valid: false, errors }),
  };
}
