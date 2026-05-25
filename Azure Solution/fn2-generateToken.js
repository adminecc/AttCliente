/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AZURE FUNCTION 2 — generateToken
 *  Metro Málaga · Portal de Atención al Cliente
 * ───────────────────────────────────────────────────────────────────────────
 *  Responsabilidad:
 *    Genera el token de consulta asociado a una solicitud.
 *
 *  Formato del token:  XXX-YYYY-CCCCCCCC
 *    · XXX      → Código de 3 letras derivado de listaDestino
 *                   INC / SUG / REC / INF / OBJ / ACC
 *    · YYYY     → Año en curso (4 dígitos)
 *    · CCCCCCCC → 8 caracteres alfanuméricos aleatorios criptográficamente seguros
 *                   (mayúsculas + dígitos, sin caracteres ambiguos: O, 0, I, 1)
 *
 *  Ejemplo real:  INC-2025-K7M3PQ9R
 *
 *  Método de invocación:
 *    - Puede llamarse como función HTTP independiente, o bien ser importada
 *      y usada directamente desde fn3-createSharePointItem.
 *    - La invocación directa (import) es lo recomendado para evitar latencia
 *      de red entre funciones.
 *
 *  Entrada (HTTP POST):
 *    { listaDestino: "INCIDENCIAS" }
 *
 *  Salida:
 *    200 OK → { token: "INC-2025-K7M3PQ9R", generadoEn: "2025-05-20T10:30:00Z" }
 *    400    → { error: "listaDestino inválida" }
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { app }    = require("@azure/functions");
const crypto     = require("crypto");

// ─── Mapeo listaDestino → prefijo XXX ────────────────────────────────────────

const PREFIJOS = {
  INCIDENCIAS:      "INC",
  SUGERENCIAS:      "SUG",
  RECLAMACIONES:    "REC",
  INFORMACION:      "INF",
  OBJETOS_PERDIDOS: "OBJ",
  ACCESIBILIDAD:    "ACC",
};

/**
 * Alfabeto seguro para los 8 caracteres aleatorios.
 * Se excluyen caracteres visualmente ambiguos: O (oh), 0 (cero), I (i mayúscula), 1 (uno), l (ele minúscula).
 * Resultado: 30 caracteres distintos → entropía ~47 bits (más que suficiente para un token de consulta).
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// ─── Función principal ────────────────────────────────────────────────────────

app.http("generateToken", {
  methods: ["POST"],
  authLevel: "anonymous", // Auth gestionada por APIM (JWT)
  route: "solicitudes/generartoken",

  handler: async (request, context) => {
    context.log("generateToken — inicio");

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "El cuerpo de la petición no es JSON válido.");
    }

    const { listaDestino } = body;

    if (!listaDestino || !PREFIJOS[listaDestino]) {
      return errorResponse(400, `listaDestino '${listaDestino}' no es válida. Valores aceptados: ${Object.keys(PREFIJOS).join(", ")}`);
    }

    const token = generarToken(listaDestino);
    context.log(`generateToken — token generado: ${token}`);

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        generadoEn: new Date().toISOString(),
      }),
    };
  },
});

// ─── Lógica de generación (exportada para uso directo desde fn3) ──────────────

/**
 * Genera un token con formato XXX-YYYY-CCCCCCCC.
 *
 * @param {string} listaDestino  - Clave de lista (ej: "INCIDENCIAS")
 * @returns {string}             - Token completo (ej: "INC-2025-K7M3PQ9R")
 */
function generarToken(listaDestino) {
  const prefijo = PREFIJOS[listaDestino];
  const año     = new Date().getFullYear().toString();
  const aleatorio = generarAleatorio(8);
  return `${prefijo}-${año}-${aleatorio}`;
}

/**
 * Genera una cadena de N caracteres aleatorios criptográficamente seguros
 * tomados del ALFABETO definido.
 *
 * Uso de crypto.randomInt (Node ≥ 14.10) con módulo uniforme para evitar
 * sesgo (modulo bias) al mapear bytes a caracteres.
 *
 * @param {number} longitud - Número de caracteres a generar
 * @returns {string}
 */
function generarAleatorio(longitud) {
  let resultado = "";
  for (let i = 0; i < longitud; i++) {
    // crypto.randomInt(min, max) devuelve un entero en [min, max)
    const indice = crypto.randomInt(0, ALFABETO.length);
    resultado += ALFABETO[indice];
  }
  return resultado;
}

/**
 * Valida que un token tenga el formato correcto.
 * Útil para la función de consulta de estado.
 *
 * @param {string} token
 * @returns {boolean}
 */
function validarFormatoToken(token) {
  if (!token || typeof token !== "string") return false;
  // Regex: 3 letras mayúsculas - 4 dígitos - 8 chars del alfabeto
  return /^(INC|SUG|REC|INF|OBJ|ACC)-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(token);
}

/** Respuesta de error estándar */
function errorResponse(status, mensaje) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: mensaje }),
  };
}

// Exportar para uso interno desde fn3
module.exports = { generarToken, validarFormatoToken, PREFIJOS };
