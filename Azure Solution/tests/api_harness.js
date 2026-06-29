const path = require("path");
const Module = require("module");

const azureDir = path.resolve(__dirname, "..");
const registry = new Map();
const originalLoad = Module._load;

const mockApp = {
  http(name, config) {
    registry.set(name, config);
  },
};

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "@azure/functions") {
    return { app: mockApp };
  }

  if (request === "axios") {
    return {
      get: async () => {
        throw new Error("Llamada axios.get no esperada en smoke test.");
      },
      post: async () => {
        throw new Error("Llamada axios.post no esperada en smoke test.");
      },
    };
  }

  if (request === "jsonwebtoken") {
    return {
      sign: () => "mocked.jwt.token",
    };
  }

  return originalLoad(request, parent, isMain);
};

function loadFunction(fileName) {
  return originalLoad(path.join(azureDir, fileName), module, false);
}

function createContext() {
  const entries = [];
  const log = (...args) => entries.push({ level: "info", message: args.join(" ") });
  const error = (...args) => entries.push({ level: "error", message: args.join(" ") });
  const warn = (...args) => entries.push({ level: "warn", message: args.join(" ") });
  return { log, error, warn, entries };
}

function requestWithJson(payload) {
  return {
    async json() {
      if (payload instanceof Error) {
        throw payload;
      }
      return payload;
    },
  };
}

function parseBody(response) {
  if (!response || typeof response.body !== "string") {
    return response?.body;
  }
  return JSON.parse(response.body);
}

async function invoke(functionName, payload) {
  const config = registry.get(functionName);
  if (!config?.handler) {
    throw new Error(`No se ha registrado el handler ${functionName}.`);
  }

  const context = createContext();
  const response = await config.handler(requestWithJson(payload), context);

  return {
    response,
    body: parseBody(response),
    logs: context.entries,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    return { name, status: "PASS" };
  } catch (error) {
    return {
      name,
      status: "FAIL",
      error: error.message,
    };
  }
}

async function main() {
  loadFunction("src/functions/solicitudes-create.js");
  loadFunction("src/functions/solicitudes-consultar.js");
  loadFunction("src/functions/token-generate.js");
  const { FORM_TYPES } = require("../src/shared/form-contract");
  const { assertGraphConfig } = require("../src/shared/config");
  const { buildSharePointFields, buildFieldCompatibilityWarnings } = require("../src/shared/sharepoint");
  const { validateSolicitudPayload } = require("../src/shared/validation");

  const tests = [
    runTest("crearSolicitud rechaza payload incompleto con contrato real", async () => {
      const { response, body } = await invoke("crearSolicitud", {
        tipoFormulario: "reclamaciones",
        email: "maria.lopez@example.com",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(Array.isArray(body.errors), "Se esperaba lista de errores.");
      assert(body.errors.includes("nombre"), "Se esperaba error del campo nombre.");
      assert(body.errors.includes("apellidos"), "Se esperaba error del campo apellidos.");
      assert(body.errors.includes("telefono"), "Se esperaba error del campo telefono.");
    }),

    runTest("crearSolicitud acepta contrato real y falla despues al no tener credenciales Graph", async () => {
      const { response, body } = await invoke("crearSolicitud", {
        tipoFormulario: "reclamaciones",
        nombre: "  Maria  ",
        apellidos: "Lopez Garcia",
        tipoDocumento: "NIF",
        numeroDocumento: "12345678Z",
        email: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        telefono: "600123456",
        clasificacion: "reclamacion",
        fechaIncidencia: "2026-06-01",
        tipologia: "servicio",
        lugarIncidencia: "estacion",
        descripcionDetallada: "El servicio sufrio una interrupcion prolongada y solicito revision del caso.",
        consentimiento: true,
      });

      assert(response.status === 500, `Se esperaba 500 por credenciales no configuradas y llego ${response.status}.`);
      assert(String(body.error || "").includes("Microsoft Graph"), "Se esperaba error controlado de Graph.");
    }),

    runTest("generateToken genera token con formato esperado para reclamaciones", async () => {
      const { response, body } = await invoke("generateToken", {
        tipoFormulario: "reclamaciones",
      });

      assert(response.status === 200, `Se esperaba 200 y llego ${response.status}.`);
      assert(
        /^REC-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(body.token),
        `Token con formato inesperado: ${body.token}.`
      );
      assert(Boolean(body.generadoEn), "Se esperaba fecha generadoEn.");
    }),

    runTest("generateToken rechaza tipo de formulario invalido", async () => {
      const { response, body } = await invoke("generateToken", {
        tipoFormulario: "lista-inexistente",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("tipoFormulario"), "Se esperaba mensaje de tipoFormulario invalido.");
    }),

    runTest("SharePoint guarda el token en Title como numero de solicitud", async () => {
      const fields = buildSharePointFields(
        {
          tipoFormulario: "sugerencias",
          nombre: "Maria",
          apellidos: "Lopez",
          tipoDocumento: "NIF",
          numeroDocumento: "12345678Z",
          email: "maria.lopez@example.com",
          telefono: "600123456",
          consentimiento: true,
          descripcionSugerencia: "Texto de prueba.",
        },
        FORM_TYPES.SUGERENCIAS,
        "SUG-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.Title === "SUG-2026-ABCDEFGH", "Title debe contener el token de solicitud.");
      assert(fields.EstadoCliente === "En trámite", "EstadoCliente inicial debe ser En trámite.");
    }),

    runTest("consultas no exige descripcion corta y mapea titulo de viaje", async () => {
      const payload = {
        tipoFormulario: "consultas",
        nombre: "Maria",
        apellidos: "Lopez",
        tipoDocumento: "NIF",
        numeroDocumento: "12345678Z",
        email: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        telefono: "600123456",
        consentimiento: true,
        tipoTituloConsulta: "tarjeta-consorcio",
        numeracionTituloConsulta: "12345678900",
        descripcionDetalladaConsulta: "Necesito informacion sobre mi titulo de viaje.",
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(
        validation.payload,
        FORM_TYPES.CONSULTAS,
        "CON-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.TipoDeTitulo === "Tarjeta Monedero Consorcio de Transportes de Andalucía", "Se esperaba TipoDeTitulo normalizado.");
      assert(fields.NumTituloViaje === "12345678900", "Se esperaba NumTituloViaje.");
      assert(fields.Descripcion === "Necesito informacion sobre mi titulo de viaje.", "Se esperaba Descripcion desde descripcionDetalladaConsulta.");
    }),

    runTest("sugerencias mapea campos reales de ubicacion y titulo de viaje", async () => {
      const validation = validateSolicitudPayload({
        tipoFormulario: "sugerencias",
        nombre: "Maria",
        apellidos: "Lopez",
        tipoDocumento: "NIF",
        numeroDocumento: "12345678Z",
        email: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        telefono: "600123456",
        consentimiento: true,
        lugarSugerencia: "general",
        descripcionSugerencia: "Texto de prueba.",
      });
      const fields = buildSharePointFields(
        {
          tipoFormulario: "sugerencias",
          nombre: "Maria",
          apellidos: "Lopez",
          tipoDocumento: "NIF",
          numeroDocumento: "12345678Z",
          email: "maria.lopez@example.com",
          telefono: "600123456",
          consentimiento: true,
          lugarSugerencia: "general",
          otroLugarSugerencia: "Anden de pruebas",
          tipoTituloSugerencia: "tarjeta-consorcio",
          numeracionTituloSugerencia: "12345678900",
          descripcionSugerencia: "Texto de prueba.",
        },
        FORM_TYPES.SUGERENCIAS,
        "SUG-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.Estacion === "General / Ninguna específica", "Se esperaba Estacion normalizada.");
      assert(fields.OtraUbicacion === "Anden de pruebas", "Se esperaba OtraUbicacion.");
      assert(fields.TipoDeTitulo === "Tarjeta Monedero Consorcio de Transportes de Andalucía", "Se esperaba TipoDeTitulo.");
      assert(fields.NumTituloViaje === "12345678900", "Se esperaba NumTituloViaje.");
      assert(fields.Descripcion === "Texto de prueba.", "Se esperaba Descripcion.");
    }),

    runTest("agradecimientos mapea columnas internas reales de SharePoint", async () => {
      const fields = buildSharePointFields(
        {
          tipoFormulario: "agradecimientos",
          nombre: "Maria",
          apellidos: "Lopez",
          tipoDocumento: "NIF",
          numeroDocumento: "12345678Z",
          email: "maria.lopez@example.com",
          telefono: "600123456",
          consentimiento: true,
          motivoAgradecimiento: "atencion-personal",
          fechaAgradecimiento: "2026-06-29",
          lugarAgradecimiento: "estacion",
          estacionAgradecimientoDetalle: "general",
          trenAgradecimiento: "UT-3010",
          dirigidoAgradecimiento: "varios",
          variosColectivos: "Personal de estacion y seguridad",
          nombreEmpleado: "233",
          descripcionAgradecimiento: "Texto de agradecimiento.",
        },
        FORM_TYPES.AGRADECIMIENTOS,
        "AGR-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.Motivo === "Atención del personal", "Se esperaba Motivo normalizado.");
      assert(fields.FechaEpisodio === "2026-06-29", "Se esperaba FechaEpisodio.");
      assert(fields.Lugar === "Una estación", "Se esperaba Lugar normalizado.");
      assert(fields.Estacion === "General / Ninguna específica", "Se esperaba Estacion normalizada.");
      assert(fields.Tren === "UT-3010", "Se esperaba Tren.");
      assert(fields.DirigidoA === "Quiero agradecer a varios colectivos (indique cuáles)", "Se esperaba DirigidoA normalizado.");
      assert(fields.Colectivos === "Personal de estacion y seguridad", "Se esperaba Colectivos.");
      assert(fields.NumIdentificacionPersonaTrabajad === "233", "Se esperaba NumIdentificacionPersonaTrabajadora.");
      assert(fields.Descripcion === "Texto de agradecimiento.", "Se esperaba Descripcion.");
    }),

    runTest("diagnostico SharePoint avisa de valores incompatibles con columnas", async () => {
      const columns = new Map([
        ["TipoDeTitulo", { name: "TipoDeTitulo", choice: { choices: ["Monedero Metro Málaga"] } }],
        ["NumIdentificacionPersonaTrabajad", { name: "NumIdentificacionPersonaTrabajad", number: {} }],
        ["FechaEpisodio", { name: "FechaEpisodio", dateTime: {} }],
        ["RecibirPostal", { name: "RecibirPostal", boolean: {} }],
      ]);
      const warnings = buildFieldCompatibilityWarnings({
        TipoDeTitulo: "valor-no-configurado",
        NumIdentificacionPersonaTrabajad: "ABC",
        FechaEpisodio: "no-es-fecha",
        RecibirPostal: "si",
      }, columns);

      assert(warnings.length === 4, `Se esperaban 4 warnings y llegaron ${warnings.length}.`);
      assert(warnings.some((warning) => warning.includes("TipoDeTitulo")), "Se esperaba warning de Choice.");
      assert(warnings.some((warning) => warning.includes("NumIdentificacionPersonaTrabajad")), "Se esperaba warning de Number.");
      assert(warnings.some((warning) => warning.includes("FechaEpisodio")), "Se esperaba warning de DateTime.");
      assert(warnings.some((warning) => warning.includes("RecibirPostal")), "Se esperaba warning de Boolean.");
    }),

    runTest("diagnostico SharePoint acepta formatos compatibles", async () => {
      const columns = new Map([
        ["TipoDeTitulo", { name: "TipoDeTitulo", choice: { choices: ["Monedero Metro Málaga"] } }],
        ["NumIdentificacionPersonaTrabajad", { name: "NumIdentificacionPersonaTrabajad", number: {} }],
        ["FechaEpisodio", { name: "FechaEpisodio", dateTime: {} }],
        ["RecibirPostal", { name: "RecibirPostal", boolean: {} }],
      ]);
      const warnings = buildFieldCompatibilityWarnings({
        TipoDeTitulo: "Monedero Metro Málaga",
        NumIdentificacionPersonaTrabajad: "233",
        FechaEpisodio: "2026-06-29",
        RecibirPostal: true,
      }, columns);

      assert(warnings.length === 0, `No se esperaban warnings y llegaron ${warnings.join(", ")}.`);
    }),

    runTest("consultarSolicitud exige email y token", async () => {
      const { response, body } = await invoke("consultarSolicitud", {});

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("obligatorios"), "Se esperaba mensaje de campos obligatorios.");
    }),

    runTest("consultarSolicitud rechaza token con prefijo desconocido sin llamar a Graph", async () => {
      const { response, body } = await invoke("consultarSolicitud", {
        email: "consulta@example.com",
        token: "ZZZ-2026-ABCDEFGH",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("lista de consulta valida"), "Se esperaba mensaje de token no consultable.");
    }),

    runTest("consultarSolicitud acepta prefijo real y falla despues al no tener credenciales Graph", async () => {
      const { response, body } = await invoke("consultarSolicitud", {
        email: "consulta@example.com",
        token: "REC-2026-ABCDEFGH",
      });

      assert(response.status === 500, `Se esperaba 500 por credenciales no configuradas y llego ${response.status}.`);
      assert(String(body.error || "").includes("Microsoft Graph"), "Se esperaba error controlado de Graph.");
    }),

    runTest("contrato SharePoint apunta a las listas reales", async () => {
      const expected = {
        RECLAMACIONES: ["SHAREPOINT_CONNECTA_SITE_ID", "ReclamacionesQuejas"],
        CONSULTAS: ["SHAREPOINT_CONNECTA_SITE_ID", "ConsultaInformacion"],
        SUGERENCIAS: ["SHAREPOINT_CONNECTA_SITE_ID", "Sugerencias"],
        AGRADECIMIENTOS: ["SHAREPOINT_CONNECTA_SITE_ID", "Agradecimientos"],
        OBJETOS_PERDIDOS: ["SHAREPOINT_CONNECTA_SITE_ID", "Objetos Perdidos NUEVA"],
        TARJETAS_METRO: ["SHAREPOINT_TARJETAS_SITE_ID", "ClientesTarjetaMetro"],
      };

      for (const [key, [siteEnvKey, listName]] of Object.entries(expected)) {
        assert(FORM_TYPES[key].sharePoint.siteEnvKey === siteEnvKey, `${key} debe usar ${siteEnvKey}.`);
        assert(FORM_TYPES[key].sharePoint.listName === listName, `${key} debe usar lista ${listName}.`);
      }
    }),

    runTest("configuracion Graph acepta client secret sin certificado", async () => {
      assertGraphConfig({
        tenantId: "tenant",
        clientId: "client",
        clientSecret: "secret",
        sites: {
          SHAREPOINT_CONNECTA_SITE_ID: "connecta-site",
          SHAREPOINT_TARJETAS_SITE_ID: "tarjetas-site",
        },
      });
    }),

    runTest("configuracion Graph acepta certificado sin client secret", async () => {
      assertGraphConfig({
        tenantId: "tenant",
        clientId: "client",
        certThumbprint: "thumbprint",
        certPrivateKey: "private-key",
        sites: {
          SHAREPOINT_CONNECTA_SITE_ID: "connecta-site",
          SHAREPOINT_TARJETAS_SITE_ID: "tarjetas-site",
        },
      });
    }),
  ];

  const results = await Promise.all(tests);
  const failed = results.filter((result) => result.status === "FAIL").length;

  console.log(JSON.stringify({
    summary: {
      total: results.length,
      passed: results.length - failed,
      failed,
    },
    warnings: [],
    results,
  }, null, 2));

  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
