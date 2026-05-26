const path = require("path");
const Module = require("module");

const azureDir = path.resolve(__dirname, "..");
const registry = new Map();
const warnings = [];
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
  log.error = (...args) => entries.push({ level: "error", message: args.join(" ") });
  log.warn = (...args) => entries.push({ level: "warn", message: args.join(" ") });
  return { log, entries };
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
  loadFunction("fn1-validateRequest.js");
  loadFunction("fn2-generateToken.js");
  loadFunction("fn3-createSharePointItem.js");
  loadFunction("fn4-getRequestDetails.js");

  const tests = [
    runTest("validateRequest acepta una incidencia valida", async () => {
      const { response, body } = await invoke("validateRequest", {
        listaDestino: "INCIDENCIAS",
        nombreCompleto: "  Maria Lopez  ",
        email: "maria.lopez@example.com",
        telefonoContacto: "600123456",
        lineaAfectada: "L1",
        tipoIncidencia: "Retraso",
        descripcion: "El tren llego con bastante retraso esta mañana.",
      });

      assert(response.status === 200, `Se esperaba 200 y llego ${response.status}.`);
      assert(body.valid === true, "Se esperaba valid=true.");
      assert(body.sanitizedPayload.nombreCompleto === "Maria Lopez", "El nombre debe llegar sin espacios extra.");
    }),

    runTest("validateRequest rechaza payload incompleto", async () => {
      const { response, body } = await invoke("validateRequest", {
        listaDestino: "INCIDENCIAS",
        nombreCompleto: "",
        email: "correo-no-valido",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(body.valid === false, "Se esperaba valid=false.");
      assert(Array.isArray(body.errors) && body.errors.length > 0, "Se esperaban errores de validacion.");
    }),

    runTest("generateToken genera token con formato esperado", async () => {
      const { response, body } = await invoke("generateToken", {
        listaDestino: "INCIDENCIAS",
      });

      assert(response.status === 200, `Se esperaba 200 y llego ${response.status}.`);
      assert(
        /^INC-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(body.token),
        `Token con formato inesperado: ${body.token}.`
      );
      assert(Boolean(body.generadoEn), "Se esperaba fecha generadoEn.");
    }),

    runTest("generateToken rechaza listaDestino invalida", async () => {
      const { response, body } = await invoke("generateToken", {
        listaDestino: "LISTA_INEXISTENTE",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("no es valida") || String(body.error || "").includes("no es válida"), "Se esperaba mensaje de lista invalida.");
    }),

    runTest("createSharePointItem rechaza listaDestino invalida sin llamar a Graph", async () => {
      const { response, body } = await invoke("createSharePointItem", {
        listaDestino: "LISTA_INEXISTENTE",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("no reconocida"), "Se esperaba mensaje de lista no reconocida.");
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
      assert(String(body.error || "").includes("lista de consulta valida") || String(body.error || "").includes("lista de consulta válida"), "Se esperaba mensaje de token no consultable.");
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
    warnings,
    results,
  }, null, 2));

  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
