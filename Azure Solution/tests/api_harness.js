const path = require("path");
const Module = require("module");

const azureDir = path.resolve(__dirname, "..");
const registry = new Map();
const originalLoad = Module._load;

const mockApp = {
  http(name, config) {
    registry.set(name, config);
  },
  timer(name, config) {
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

function requestWithJson(payload, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json",
    ...Object.fromEntries(Object.entries(extraHeaders).map(([key, value]) => [key.toLowerCase(), value])),
  };

  return {
    headers: {
      get(name) {
        return headers[String(name).toLowerCase()] || "";
      },
    },
    async json() {
      if (payload instanceof Error) {
        throw payload;
      }
      return payload;
    },
  };
}

function requestWithMultipart(payload, files = []) {
  const entries = [
    ["payload", JSON.stringify(payload)],
    ...files.map((file) => [file.fieldName, file]),
  ];

  return {
    headers: {
      get(name) {
        return String(name).toLowerCase() === "content-type"
          ? "multipart/form-data; boundary=test"
          : "";
      },
    },
    async formData() {
      return {
        get(name) {
          const match = entries.find(([key]) => key === name);
          return match ? match[1] : null;
        },
        entries() {
          return entries[Symbol.iterator]();
        },
      };
    },
  };
}

function requestWithRawMultipart(payload, files = [], boundary = "test-boundary") {
  const chunks = [];
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="payload"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n`));

  for (const file of files) {
    chunks.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`
    ));
    chunks.push(Buffer.from(file.content));
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);

  return {
    headers: {
      get(name) {
        return String(name).toLowerCase() === "content-type"
          ? `multipart/form-data; boundary=${boundary}`
          : "";
      },
    },
    async formData() {
      throw new Error("Failed to parse body as FormData.");
    },
    async arrayBuffer() {
      return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    },
  };
}

function createFileLike({ fieldName, name, type, content }) {
  const buffer = Buffer.from(content);
  return {
    fieldName,
    name,
    type,
    size: buffer.length,
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  };
}

function parseBody(response) {
  if (!response || typeof response.body !== "string") {
    return response?.body;
  }
  return JSON.parse(response.body);
}

async function invoke(functionName, payload, extraHeaders = {}) {
  const config = registry.get(functionName);
  if (!config?.handler) {
    throw new Error(`No se ha registrado el handler ${functionName}.`);
  }

  const context = createContext();
  const response = await config.handler(requestWithJson(payload, extraHeaders), context);

  return {
    response,
    body: parseBody(response),
    logs: context.entries,
  };
}

async function invokeWithRequest(functionName, request) {
  const config = registry.get(functionName);
  if (!config?.handler) {
    throw new Error(`No se ha registrado el handler ${functionName}.`);
  }

  const context = createContext();
  const response = await config.handler(request, context);

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

function setOrDeleteEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
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
  const createModule = loadFunction("src/functions/solicitudes-create.js");
  loadFunction("src/functions/solicitudes-consultar.js");
  loadFunction("src/functions/sanciones-consultar.js");
  loadFunction("src/functions/token-generate.js");
  loadFunction("src/functions/access-token-generate.js");
  loadFunction("src/functions/access-token-cleanup.js");
  const { FORM_TYPES } = require("../src/shared/form-contract");
  const { getConfig, assertGraphConfig } = require("../src/shared/config");
  const {
    buildSharePointFields,
    buildFieldCompatibilityWarnings,
    prepareLookupFieldWrites,
    formatAttachmentUploadError,
    buildSolicitudResponse,
    buildSancionResponse,
  } = require("../src/shared/sharepoint");
  const { validateSolicitudPayload } = require("../src/shared/validation");
  const { isGuid, normalizeOrigin, isRequesterAllowed } = require("../src/shared/access-token");

  const tests = [
    runTest("generateAccessToken genera GUID temporal cuando el origen esta permitido", async () => {
      const previousStoreDisabled = process.env.ACCESS_TOKEN_STORE_DISABLED;
      const previousAllowedOrigins = process.env.ACCESS_TOKEN_ALLOWED_ORIGINS;
      process.env.ACCESS_TOKEN_STORE_DISABLED = "true";
      process.env.ACCESS_TOKEN_ALLOWED_ORIGINS = "https://formularios.metromalaga.es";

      try {
        const result = await invoke(
          "generateAccessToken",
          { purpose: "reclamaciones" },
          { origin: "https://formularios.metromalaga.es" }
        );

        assert(result.response.status === 200, `Se esperaba 200 y llego ${result.response.status}.`);
        assert(result.body.ok === true, "Se esperaba ok=true.");
        assert(isGuid(result.body.token), "Se esperaba token GUID.");
        assert(result.body.expiresInMinutes === 15, "Se esperaba validez por defecto de 15 minutos.");
      } finally {
        process.env.ACCESS_TOKEN_STORE_DISABLED = previousStoreDisabled;
        process.env.ACCESS_TOKEN_ALLOWED_ORIGINS = previousAllowedOrigins;
      }
    }),

    runTest("generateAccessToken rechaza origen no permitido", async () => {
      const previousStoreDisabled = process.env.ACCESS_TOKEN_STORE_DISABLED;
      const previousAllowedOrigins = process.env.ACCESS_TOKEN_ALLOWED_ORIGINS;
      process.env.ACCESS_TOKEN_STORE_DISABLED = "true";
      process.env.ACCESS_TOKEN_ALLOWED_ORIGINS = "https://formularios.metromalaga.es";

      try {
        const result = await invoke(
          "generateAccessToken",
          { purpose: "reclamaciones" },
          { origin: "https://malicioso.example" }
        );

        assert(result.response.status === 403, `Se esperaba 403 y llego ${result.response.status}.`);
      } finally {
        process.env.ACCESS_TOKEN_STORE_DISABLED = previousStoreDisabled;
        process.env.ACCESS_TOKEN_ALLOWED_ORIGINS = previousAllowedOrigins;
      }
    }),

    runTest("isRequesterAllowed valida Origin normalizado", async () => {
      const request = requestWithJson({}, { origin: "https://FORMULARIOS.metromalaga.es/ruta" });
      const result = isRequesterAllowed(request, { allowedOrigins: ["https://formularios.metromalaga.es"], allowedIps: [] });
      assert(result.allowed === true, "Se esperaba origen permitido tras normalizar.");
      assert(normalizeOrigin(result.origin) === "https://formularios.metromalaga.es", "Se esperaba origin normalizado.");
    }),

    runTest("parseSolicitudRequest mantiene compatibilidad con JSON", async () => {
      const { payload, files } = await createModule.parseSolicitudRequest(requestWithJson({
        tipoFormulario: "consultas",
        Nombre: "Maria",
      }));

      assert(payload.tipoFormulario === "consultas", "Se esperaba payload JSON.");
      assert(payload.Nombre === "Maria", "Se esperaba Nombre desde JSON.");
      assert(Array.isArray(files) && files.length === 0, "JSON no debe devolver archivos.");
    }),

    runTest("parseSolicitudRequest extrae payload y archivos multipart", async () => {
      const file = createFileLike({
        fieldName: "file_adjuntos_0",
        name: "prueba.txt",
        type: "text/plain",
        content: "contenido de prueba",
      });

      const { payload, files } = await createModule.parseSolicitudRequest(requestWithMultipart({
        tipoFormulario: "sugerencias",
        Nombre: "Maria",
      }, [file]));

      assert(payload.tipoFormulario === "sugerencias", "Se esperaba payload desde campo multipart payload.");
      assert(files.length === 1, `Se esperaba 1 archivo y llegaron ${files.length}.`);
      assert(files[0].fieldName === "file_adjuntos_0", "Se esperaba fieldName multipart.");
      assert(files[0].fileName === "prueba.txt", "Se esperaba nombre de archivo.");
      assert(files[0].contentType === "text/plain", "Se esperaba contentType.");
      assert(Buffer.isBuffer(files[0].content), "Se esperaba contenido Buffer.");
    }),

    runTest("parseSolicitudRequest usa fallback multipart si formData falla", async () => {
      const { payload, files } = await createModule.parseSolicitudRequest(requestWithRawMultipart({
        tipoFormulario: "objetos",
        Nombre: "Luis",
      }, [{
        fieldName: "file_fotoObjeto_0",
        name: "objeto.jpg",
        type: "image/jpeg",
        content: "jpg-data",
      }]));

      assert(payload.tipoFormulario === "objetos", "Se esperaba payload desde fallback multipart.");
      assert(files.length === 1, `Se esperaba 1 archivo y llegaron ${files.length}.`);
      assert(files[0].fieldName === "file_fotoObjeto_0", "Se esperaba fieldName de archivo.");
      assert(files[0].fileName === "objeto.jpg", "Se esperaba nombre de archivo.");
      assert(files[0].content.toString("utf8") === "jpg-data", "Se esperaba contenido de archivo.");
    }),


    runTest("crearSolicitud rechaza payload incompleto con contrato real", async () => {
      const { response, body } = await invoke("crearSolicitud", {
        tipoFormulario: "reclamaciones",
        CorreoElectronico: "maria.lopez@example.com",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(Array.isArray(body.errors), "Se esperaba lista de errores.");
      assert(body.errors.includes("Nombre"), "Se esperaba error del campo Nombre.");
      assert(body.errors.includes("Apellidos"), "Se esperaba error del campo Apellidos.");
      assert(body.errors.includes("Telefono"), "Se esperaba error del campo Telefono.");
    }),

    runTest("crearSolicitud acepta contrato real y falla despues al no tener credenciales Graph", async () => {
      const { response, body } = await invoke("crearSolicitud", {
        tipoFormulario: "reclamaciones",
        Nombre: "  Maria  ",
        Apellidos: "Lopez Garcia",
        TipoDeDocumento: "NIF",
        NumeroDeDocumento: "12345678Z",
        CorreoElectronico: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        Telefono: "600123456",
        Clasificacion: "reclamacion",
        FechaYHoraConsulta: "2026-06-01T10:00:00",
        Lugar: "estacion",
        DescripcionConsulta: "El servicio sufrio una interrupcion prolongada y solicito revision del caso.",
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
        /^REC-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ123456789]{8}$/.test(body.token),
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
          Nombre: "Maria",
          Apellidos: "Lopez",
          TipoDeDocumento: "NIF",
          NumeroDeDocumento: "12345678Z",
          CorreoElectronico: "maria.lopez@example.com",
          Telefono: "600123456",
          consentimiento: true,
          Estacion: "general",
          Descripcion: "Texto de prueba.",
        },
        FORM_TYPES.SUGERENCIAS,
        "SUG-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.Title === "SUG-2026-ABCDEFGH", "Title debe contener el token de solicitud.");
      assert(fields.EstadoCliente === "En tr\u00e1mite", "EstadoCliente inicial debe ser En tramite.");
    }),

    runTest("consultas usa nombres directos de SharePoint", async () => {
      const payload = {
        tipoFormulario: "consultas",
        Nombre: "Maria",
        Apellidos: "Lopez",
        TipoDeDocumento: "NIF",
        NumeroDeDocumento: "12345678Z",
        CorreoElectronico: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        Telefono: "600123456",
        consentimiento: true,
        TipoDeTitulo: "tarjeta-consorcio",
        NumTituloViaje: "12345678900",
        Descripcion: "Necesito informacion sobre mi titulo de viaje.",
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(
        validation.payload,
        FORM_TYPES.CONSULTAS,
        "CON-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.TipoDeTitulo === "Tarjeta Monedero Consorcio de Transportes de Andaluc\u00eda", "Se esperaba TipoDeTitulo normalizado.");
      assert(fields.NumTituloViaje === "12345678900", "Se esperaba NumTituloViaje.");
      assert(fields.Descripcion === "Necesito informacion sobre mi titulo de viaje.", "Se esperaba Descripcion directa.");
    }),

    runTest("sugerencias usa nombres directos de SharePoint", async () => {
      const payload = {
        tipoFormulario: "sugerencias",
        Nombre: "Maria",
        Apellidos: "Lopez",
        TipoDeDocumento: "NIF",
        NumeroDeDocumento: "12345678Z",
        CorreoElectronico: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        Telefono: "600123456",
        consentimiento: true,
        Estacion: "general",
        OtraUbicacion: "Anden de pruebas",
        TipoDeTitulo: "tarjeta-consorcio",
        NumTituloViaje: "12345678900",
        Descripcion: "Texto de prueba.",
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(
        validation.payload,
        FORM_TYPES.SUGERENCIAS,
        "SUG-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.Estacion === "Toda la red de Metro M\u00e1laga", "Se esperaba Estacion normalizada.");
      assert(fields.OtraUbicacion === "Anden de pruebas", "Se esperaba OtraUbicacion.");
      assert(fields.TipoDeTitulo === "Tarjeta Monedero Consorcio de Transportes de Andaluc\u00eda", "Se esperaba TipoDeTitulo.");
      assert(fields.NumTituloViaje === "12345678900", "Se esperaba NumTituloViaje.");
      assert(fields.Descripcion === "Texto de prueba.", "Se esperaba Descripcion.");
    }),

    runTest("sugerencias permite ubicar la solicitud fuera de una estacion", async () => {
      const payload = {
        tipoFormulario: "sugerencias",
        Nombre: "Maria",
        Apellidos: "Lopez",
        TipoDeDocumento: "NIF",
        NumeroDeDocumento: "12345678Z",
        CorreoElectronico: "maria.lopez@example.com",
        Telefono: "600123456",
        consentimiento: true,
        OtraUbicacion: "Interior del tren - UT-3010",
        Descripcion: "Texto de prueba.",
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(validation.payload, FORM_TYPES.SUGERENCIAS, "SUG-2026-ABCDEFGH", "2026-06-29T08:00:00.000Z");

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(!Object.prototype.hasOwnProperty.call(fields, "Estacion"), "Estacion debe quedar vacia fuera de una estacion.");
      assert(fields.OtraUbicacion === "Interior del tren - UT-3010", "Se esperaba la ubicacion y el tren en OtraUbicacion.");
    }),

    runTest("agradecimientos usa nombres directos de SharePoint", async () => {
      const fields = buildSharePointFields(
        {
          tipoFormulario: "agradecimientos",
          Nombre: "Maria",
          Apellidos: "Lopez",
          TipoDeDocumento: "NIF",
          NumeroDeDocumento: "12345678Z",
          CorreoElectronico: "maria.lopez@example.com",
          Telefono: "600123456",
          consentimiento: true,
          Motivo: "instalaciones",
          FechaEpisodio: "2026-06-29",
          Lugar: "estacion",
          Estacion: "cualquiera-l1",
          Tren: "UT-3010",
          DirigidoA: "varios",
          Colectivos: "Personal de estacion y seguridad",
          NumIdentificacionPersonaTrabajad: "233",
          Descripcion: "Texto de agradecimiento.",
        },
        FORM_TYPES.AGRADECIMIENTOS,
        "AGR-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.Motivo === "Estado de instalaciones", "Se esperaba Motivo normalizado.");
      assert(fields.FechaEpisodio === "2026-06-29", "Se esperaba FechaEpisodio.");
      assert(fields.Lugar === "Una estaci\u00f3n", "Se esperaba Lugar normalizado.");
      assert(fields.Estacion === "Cualquiera de L\u00ednea 1", "Se esperaba Estacion normalizada.");
      assert(fields.Tren === "UT-3010", "Se esperaba Tren.");
      assert(fields.DirigidoA === "Quiero agradecer a varios colectivos (indique cu\u00e1les)", "Se esperaba DirigidoA normalizado.");
      assert(fields.Colectivos === "Personal de estacion y seguridad", "Se esperaba Colectivos.");
      assert(fields.NumIdentificacionPersonaTrabajad === "233", "Se esperaba NumIdentificacionPersonaTrabajadora.");
      assert(fields.Descripcion === "Texto de agradecimiento.", "Se esperaba Descripcion.");
    }),

    runTest("objetos usa nombres directos de SharePoint", async () => {
      const payload = {
        tipoFormulario: "objetos",
        Nombre: "Maria",
        Apellidos: "Lopez",
        TipoDeDocumento: "NIF",
        NumeroDeDocumento: "12345678Z",
        CorreoElectronico: "maria.lopez@example.com",
        confirmEmail: "maria.lopez@example.com",
        Telefono: "600123456",
        consentimiento: true,
        FechaPerdida: "2026-06-29",
        LineaMetro: "1",
        Localizacion: "tren",
        NUnidadTren: "UT-3010",
        EstOrig: "atarazanas",
        EstDest: "universidad",
        TipoObjeto: "Mochila",
        ColorObj: "Negro",
        DistintivoObj: "Llavero rojo",
        Descripcion: "Mochila negra con documentacion.",
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(validation.payload, FORM_TYPES.OBJETOS_PERDIDOS, "OBJ-2026-ABCDEFGH", "2026-06-29T08:00:00.000Z");

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.Title === "OBJ-2026-ABCDEFGH", "Title debe contener el token de solicitud.");
      assert(fields.LineaMetro.includes("1"), "Se esperaba LineaMetro normalizada.");
      assert(fields.Localizacion === "En un tren", "Se esperaba Localizacion normalizada.");
      assert(fields.EstOrig === "Atarazanas", "Se esperaba EstOrig normalizado.");
      assert(fields.EstDest === "Universidad", "Se esperaba EstDest normalizado.");
      assert(fields.TipoObjeto === "Mochila", "Se esperaba TipoObjeto directo.");
      assert(fields.ColorObj === "Negro", "Se esperaba ColorObj directo.");
      assert(fields.DistintivoObj === "Llavero rojo", "Se esperaba DistintivoObj directo.");
    }),

    runTest("tarjetas usa nombres directos de ClientesTarjetaMetro", async () => {
      const payload = {
        tipoFormulario: "tarjetas",
        NombreCliente: "Luis",
        ApellidoCliente1: "Martin",
        ApellidoCliente2: "Gomez",
        DNICliente: "87654321Q",
        EmailCliente: "luis.martin@example.com",
        confirmEmail: "luis.martin@example.com",
        TelefonoCliente1: "677112233",
        MetodoNotificacion: "email",
        consentimiento: true,
      };
      const validation = validateSolicitudPayload(payload);
      const fields = buildSharePointFields(validation.payload, FORM_TYPES.TARJETAS_METRO, "TAR-2026-ABCDEFGH", "2026-06-29T08:00:00.000Z");

      assert(validation.valid, `No se esperaban errores de validacion: ${validation.errors.join(", ")}.`);
      assert(fields.Title === "TAR-2026-ABCDEFGH", "Title debe contener el token de solicitud.");
      assert(fields.NombreCliente === "Luis", "Se esperaba NombreCliente directo.");
      assert(fields.MetodoNotificacion === "Correo", "Se esperaba MetodoNotificacion normalizado.");
      assert(String(fields.EstadoCliente || "").toLowerCase().includes("tr"), "ClientesTarjetaMetro debe recibir EstadoCliente por defecto.");
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

    runTest("lookups SharePoint se escriben como CampoLookupId", async () => {
      const columns = new Map([
        ["DAB", { name: "DAB", lookup: { listId: "lookup-list-id", columnName: "Title" } }],
        ["DescripcionConsulta", { name: "DescripcionConsulta" }],
      ]);
      const fields = await prepareLookupFieldWrites(
        "access-token",
        { siteId: "site-id", listName: "ReclamacionesQuejas" },
        {
          DAB: "42",
          DescripcionConsulta: "Texto de prueba.",
        },
        columns
      );

      assert(fields.DAB === undefined, "No debe enviarse el campo lookup textual original.");
      assert(fields.DABLookupId === 42, "Se esperaba DABLookupId numerico.");
      assert(fields.DescripcionConsulta === "Texto de prueba.", "Se esperaba conservar campos no lookup.");
    }),

    runTest("DAB del prototipo conserva el nombre enviado", async () => {
      const fields = buildSharePointFields(
        {
          tipoFormulario: "reclamaciones",
          Nombre: "Maria",
          Apellidos: "Lopez",
          TipoDeDocumento: "NIF",
          NumeroDeDocumento: "12345678Z",
          CorreoElectronico: "maria.lopez@example.com",
          Telefono: "600123456",
          consentimiento: true,
          Clasificacion: "queja",
          FechaYHoraConsulta: "2026-06-29T10:00:00",
          Lugar: "atarazanas",
          DAB: "ATZ-DAB-101",
          DescripcionConsulta: "Texto de prueba.",
        },
        FORM_TYPES.RECLAMACIONES,
        "REC-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.DAB === "ATZ-DAB-101", `Se esperaba ATZ-DAB-101 y llego ${fields.DAB}.`);
    }),

    runTest("Reclamaciones conserva los campos bancarios especificos", async () => {
      const expected = {
        ModoPago: "Tarjeta bancaria en el móvil",
        TipoTarjetaBancaria: "Una tarjeta personalizada",
        PANFisicaPrimeros6: "012345",
        PANFisicaUltimos4: "6789",
        PANVirtualPrimeros6: "987654",
        PANVirtualUltimos4: "3210",
        EmailMetroPay: "usuario@example.com",
      };
      const fields = buildSharePointFields(
        {
          tipoFormulario: "reclamaciones",
          Nombre: "Maria",
          Apellidos: "Lopez",
          TipoDeDocumento: "NIF",
          NumeroDeDocumento: "12345678Z",
          CorreoElectronico: "maria.lopez@example.com",
          Telefono: "600123456",
          consentimiento: true,
          Clasificacion: "reclamacion",
          FechaYHoraConsulta: "2026-07-21T10:00:00",
          Lugar: "El Perchel",
          DescripcionConsulta: "Texto de prueba.",
          ...expected,
        },
        FORM_TYPES.RECLAMACIONES,
        "REC-2026-ABCDEFGH",
        "2026-07-21T08:00:00.000Z"
      );

      Object.entries(expected).forEach(([name, value]) => {
        assert(fields[name] === value, `Se esperaba conservar ${name}.`);
      });
      assert(fields.NClienteNTarjCredito === undefined, "No debe reutilizarse NClienteNTarjCredito para EmailMetroPay.");
    }),

    runTest("Firma de tarjetas se guarda como data URL", async () => {
      const fields = buildSharePointFields(
        {
          tipoFormulario: "tarjetas",
          NombreCliente: "Luis",
          ApellidoCliente1: "Martin",
          DNICliente: "87654321Q",
          EmailCliente: "luis.martin@example.com",
          TelefonoCliente1: "677112233",
          MetodoNotificacion: "email",
          Firma: "data:image/png;base64,AAAABBBB",
          consentimiento: true,
        },
        FORM_TYPES.TARJETAS_METRO,
        "TAR-2026-ABCDEFGH",
        "2026-06-29T08:00:00.000Z"
      );

      assert(fields.Firma === "data:image/png;base64,AAAABBBB", "La firma debe conservar el data URL completo.");
    }),

    runTest("diagnostico de adjuntos incluye detalle REST de SharePoint", async () => {
      const detail = formatAttachmentUploadError({
        message: "Request failed with status code 401",
        response: {
          status: 401,
          headers: {
            "www-authenticate": "Bearer realm=\"tenant\", client_id=\"00000003-0000-0ff1-ce00-000000000000\"",
            "sprequestguid": "11111111-2222-3333-4444-555555555555",
          },
          data: {
            error: {
              message: {
                value: "Access denied",
              },
            },
          },
        },
      });

      assert(detail.includes("HTTP 401"), "Se esperaba estado HTTP.");
      assert(detail.includes("sprequestguid=11111111-2222-3333-4444-555555555555"), "Se esperaba request id de SharePoint.");
      assert(detail.includes("WWW-Authenticate"), "Se esperaba cabecera WWW-Authenticate.");
      assert(detail.includes("Access denied"), "Se esperaba mensaje REST.");
    }),

    runTest("biblioteca documental usa token como carpeta e IDRef numerico", async () => {
      const {
        buildDocumentLibraryAttachmentPlan,
      } = require("../src/shared/sharepoint");
      const plan = buildDocumentLibraryAttachmentPlan({
        referenceToken: "REC-2026-A/B:C",
        referenceId: "123",
        file: {
          fieldName: "file_adjuntos_0",
          fileName: "informe: prueba?.pdf",
          contentType: "application/pdf",
          sizeBytes: 1234,
        },
      });

      assert(plan.folderName === "REC-2026-A_B_C", `Carpeta inesperada: ${plan.folderName}.`);
      assert(plan.fileName === "informe_ prueba_.pdf", `Archivo inesperado: ${plan.fileName}.`);
      assert(plan.fields.IDRef === 123, "IDRef debe guardar el ID numerico del item creado.");
      assert(plan.fields.Visible === true, "Visible debe marcarse a true.");
    }),

    runTest("consultarSolicitud exige dato de confirmacion y token", async () => {
      const { response, body } = await invoke("consultarSolicitud", {});

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("obligatorios"), "Se esperaba mensaje de campos obligatorios.");
    }),

    runTest("consultarSancion valida expediente y DNI", async () => {
      const missing = await invoke("consultarSancion", { Title: "", DNI: "" });
      assert(missing.response.status === 400, "Se esperaba 400 para datos vacios.");

      const invalid = await invoke("consultarSancion", {
        Title: "SAN-2026-INVALIDO",
        DNI: "12345678Z",
      });
      assert(invalid.response.status === 400, "Se esperaba 400 para expediente invalido.");
    }),

    runTest("respuesta de sancion conserva los nombres internos de SharePoint", async () => {
      const response = buildSancionResponse({
        fields: {
          Title: "SAN-2026-000001",
          DNI: "12345678Z",
          NombreCliente: "Lucia Garcia Lopez",
          FechaInfraccion: "2026-06-03T18:42:00+02:00",
          Importe: 50,
        },
      });

      assert(response.Title === "SAN-2026-000001", "Se esperaba Title como expediente.");
      assert(response.FechaInfraccion === "2026-06-03T18:42:00+02:00", "Se esperaba fecha y hora de la sancion.");
      assert(response.Importe === 50, "Se esperaba importe numerico.");
      assert(Object.prototype.hasOwnProperty.call(response, "EstadoDelPago"), "Se esperaba EstadoDelPago en el contrato.");
    }),

    runTest("respuesta de sancion usa la fecha canonica de infraccion", async () => {
      const response = buildSancionResponse({
        fields: {
          FechaInfraccion: "2026-06-03T18:42:00+02:00",
        },
      });

      assert(response.FechaInfraccion === "2026-06-03T18:42:00+02:00", "Se esperaba FechaInfraccion.");
    }),

    runTest("consultarSolicitud rechaza token con prefijo desconocido sin llamar a Graph", async () => {
      const { response, body } = await invoke("consultarSolicitud", {
        personalData: "consulta@example.com",
        token: "ZZZ-2026-ABCDEFGH",
      });

      assert(response.status === 400, `Se esperaba 400 y llego ${response.status}.`);
      assert(String(body.error || "").includes("lista de consulta valida"), "Se esperaba mensaje de token no consultable.");
    }),

    runTest("consultarSolicitud acepta prefijo real y falla despues al no tener credenciales Graph", async () => {
      const { response, body } = await invoke("consultarSolicitud", {
        personalData: "consulta@example.com",
        token: "REC-2026-ABCDEFGH",
      });

      assert(response.status === 500, `Se esperaba 500 por credenciales no configuradas y llego ${response.status}.`);
      assert(String(body.error || "").includes("Microsoft Graph"), "Se esperaba error controlado de Graph.");
    }),

    runTest("respuesta de consulta incluye contrato del prototipo", async () => {
      const response = buildSolicitudResponse(
        {
          id: "8014",
          createdDateTime: "2026-06-29T08:00:00.000Z",
          lastModifiedDateTime: "2026-06-30T09:00:00.000Z",
          fields: {
            Title: "SUG-2026-ABCDEFGH",
            EstadoCliente: "En tramite",
            UltActEstadoCliente: "2026-06-30T09:00:00.000Z",
            InfoParaCliente: "Mensaje preparado para el cliente.",
            Nombre: "Maria",
            Apellidos: "Lopez",
            CorreoElectronico: "maria@example.com",
            Telefono: "600123456",
            Descripcion: "Texto de prueba.",
          },
        },
        "Sugerencias",
        [{
          nombre: "documento.pdf",
          tipo: "application/pdf",
          tamanioBytes: 2048,
          webUrl: "https://example.test/documento.pdf",
        }],
        [],
        FORM_TYPES.SUGERENCIAS
      );

      assert(response.caseId === "SUG-2026-ABCDEFGH", "Se esperaba caseId con el token.");
      assert(response.type === "Sugerencias", "Se esperaba label del tipo de formulario.");
      assert(response.status === "En tramite", "Se esperaba estado para tracking.");
      assert(response.submittedAt === "2026-06-29T08:00:00.000Z", "Se esperaba fecha y hora de creacion normalizada.");
      assert(response.updatedAt === "2026-06-30T09:00:00.000Z", "Se esperaba UltActEstadoCliente como fecha de actualizacion.");
      assert(response.resolutionSummary === "Mensaje preparado para el cliente.", "Se esperaba InfoParaCliente en resolutionSummary.");
      assert(response.attachments.length === 1, "Se esperaba adjunto normalizado.");
      assert(response.attachments[0].name === "documento.pdf", "Se esperaba nombre de adjunto.");
    }),

    runTest("respuesta de consulta conserva fecha y hora en todas las listas", async () => {
      for (const type of Object.values(FORM_TYPES)) {
        const response = buildSolicitudResponse(
          {
            id: `item-${type.key}`,
            createdDateTime: "2026-07-06T06:15:30.000Z",
            lastModifiedDateTime: "2026-07-06T07:45:10.000Z",
            fields: {
              Title: `${type.tokenPrefix}-2026-ABCDEFGH`,
              EstadoCliente: "En tramite",
              UltActEstadoCliente: "2026-07-06T07:45:10.000Z",
              CorreoElectronico: "consulta@example.com",
              Telefono: "600123456",
              Descripcion: "Texto de prueba.",
            },
          },
          type.sharePoint.listName,
          [],
          [],
          type
        );

        assert(response.submittedAt === "2026-07-06T06:15:30.000Z", `${type.key} debe conservar fecha y hora de creacion.`);
        assert(response.updatedAt === "2026-07-06T07:45:10.000Z", `${type.key} debe conservar fecha y hora de modificacion.`);
        assert(response.type === type.label, `${type.key} debe devolver el nombre estandar de tipo.`);
      }
    }),

    runTest("respuesta de consulta aplica los textos por defecto del estado", async () => {
      const inProgress = buildSolicitudResponse({
        createdDateTime: "2026-07-17T08:00:00.000Z",
        fields: { Title: "REC-2026-ABCDEFGH", EstadoCliente: "En trámite" },
      }, "ReclamacionesQuejas");
      const resolved = buildSolicitudResponse({
        createdDateTime: "2026-07-17T08:00:00.000Z",
        fields: { Title: "REC-2026-ABCDEFGH", EstadoCliente: "Resuelta aceptada" },
      }, "ReclamacionesQuejas");

      assert(inProgress.resolutionSummary === "La solicitud se ha registrado y está siendo tramitada.", "Se esperaba texto por defecto para En tramite.");
      assert(resolved.resolutionSummary === "La solicitud ha sido revisada y resuelta", "Se esperaba texto por defecto para estados Resuelta.");
    }),

    runTest("respuesta de consulta descarta fechas de actualizacion no validas", async () => {
      for (const UltActEstadoCliente of ["", "fecha-invalida", "2026-07-16T08:00:00.000Z"]) {
        const response = buildSolicitudResponse({
          createdDateTime: "2026-07-17T08:00:00.000Z",
          lastModifiedDateTime: "2026-07-18T08:00:00.000Z",
          fields: { Title: "REC-2026-ABCDEFGH", EstadoCliente: "En trámite", UltActEstadoCliente },
        }, "ReclamacionesQuejas");

        assert(response.updatedAt === response.submittedAt, `Se esperaba la fecha de solicitud para '${UltActEstadoCliente}'.`);
      }
    }),

    runTest("contrato SharePoint apunta a las listas reales", async () => {
      const expected = {
        RECLAMACIONES: ["SHAREPOINT_ATTCLIENTE_SITE_ID", "ReclamacionesQuejas"],
        CONSULTAS: ["SHAREPOINT_ATTCLIENTE_SITE_ID", "ConsultaInformacion"],
        SUGERENCIAS: ["SHAREPOINT_ATTCLIENTE_SITE_ID", "Sugerencias"],
        AGRADECIMIENTOS: ["SHAREPOINT_ATTCLIENTE_SITE_ID", "Agradecimientos"],
        OBJETOS_PERDIDOS: ["SHAREPOINT_ATTCLIENTE_SITE_ID", "Objetos Perdidos NUEVA"],
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
          SHAREPOINT_ATTCLIENTE_SITE_ID: "attcliente-site",
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
          SHAREPOINT_ATTCLIENTE_SITE_ID: "attcliente-site",
          SHAREPOINT_TARJETAS_SITE_ID: "tarjetas-site",
        },
      });
    }),

    runTest("configuracion de sanciones usa las variables de entorno propias", async () => {
      const previous = {
        siteId: process.env.SHAREPOINT_SANCIONES_SITE_ID,
        siteUrl: process.env.SHAREPOINT_SANCIONES_SITE_URL,
        listName: process.env.SHAREPOINT_SANCIONES_LIST_NAME,
        listUrl: process.env.SHAREPOINT_SANCIONES_LIST_URL,
      };
      process.env.SHAREPOINT_SANCIONES_SITE_ID = "sanciones-site";
      process.env.SHAREPOINT_SANCIONES_SITE_URL = "https://example.sharepoint.com/sites/SancionesDEV";
      process.env.SHAREPOINT_SANCIONES_LIST_NAME = "Sanciones";
      delete process.env.SHAREPOINT_SANCIONES_LIST_URL;

      try {
        const config = getConfig();
        assert(config.sanctions.siteId === "sanciones-site", "Se esperaba el site ID de sanciones.");
        assert(config.sanctions.siteUrl === "https://example.sharepoint.com/sites/SancionesDEV", "Se esperaba la URL del site de sanciones.");
        assert(
          config.sanctions.listUrl === "https://example.sharepoint.com/sites/SancionesDEV/Lists/Sanciones/AllItems.aspx",
          "La URL de lista debe derivarse del site configurado."
        );
      } finally {
        setOrDeleteEnv("SHAREPOINT_SANCIONES_SITE_ID", previous.siteId);
        setOrDeleteEnv("SHAREPOINT_SANCIONES_SITE_URL", previous.siteUrl);
        setOrDeleteEnv("SHAREPOINT_SANCIONES_LIST_NAME", previous.listName);
        setOrDeleteEnv("SHAREPOINT_SANCIONES_LIST_URL", previous.listUrl);
      }
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
