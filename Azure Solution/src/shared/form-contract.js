const FORM_TYPES = {
  RECLAMACIONES: {
    key: "RECLAMACIONES",
    formValue: "reclamaciones",
    label: "Reclamaciones y quejas",
    tokenPrefix: "REC",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_ATTCLIENTE_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "ReclamacionesQuejas",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/ReclamacionesQuejas/AllItems.aspx",
    },
    requiredFields: [
      "Clasificacion",
      "FechaYHoraConsulta",
      "Lugar",
      "DescripcionConsulta",
    ],
  },
  CONSULTAS: {
    key: "CONSULTAS",
    formValue: "consultas",
    label: "Consulta de Información",
    tokenPrefix: "CON",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_ATTCLIENTE_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "ConsultaInformacion",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/ConsultaInformacion/AllItems.aspx",
    },
    requiredFields: [
      "Descripcion",
    ],
  },
  SUGERENCIAS: {
    key: "SUGERENCIAS",
    formValue: "sugerencias",
    label: "Sugerencias",
    tokenPrefix: "SUG",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_ATTCLIENTE_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Sugerencias",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Sugerencias/AllItems.aspx",
    },
    requiredFields: [
      "Estacion",
      "Descripcion",
    ],
  },
  AGRADECIMIENTOS: {
    key: "AGRADECIMIENTOS",
    formValue: "agradecimientos",
    label: "Agradecimientos y felicitaciones",
    tokenPrefix: "AGR",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_ATTCLIENTE_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Agradecimientos",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Agradecimientos/AllItems.aspx",
    },
    requiredFields: [
      "Motivo",
      "Descripcion",
    ],
  },
  OBJETOS_PERDIDOS: {
    key: "OBJETOS_PERDIDOS",
    formValue: "objetos",
    label: "Objetos perdidos",
    tokenPrefix: "OBJ",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_ATTCLIENTE_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Objetos Perdidos NUEVA",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Objetos%20Perdidos%20NUEVA/AllItems.aspx",
    },
    requiredFields: [
      "FechaPerdida",
      "LineaMetro",
      "Localizacion",
      "TipoObjeto",
      "Descripcion",
    ],
  },
  TARJETAS_METRO: {
    key: "TARJETAS_METRO",
    formValue: "tarjetas",
    label: "Solicitud de tarjeta +Metro",
    tokenPrefix: "TAR",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_TARJETAS_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro",
      listName: "ClientesTarjetaMetro",
      listUrl: "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro/Lists/ClientesTarjetaMetro/AllItems.aspx",
    },
    commonRequiredFields: [
      "NombreCliente",
      "ApellidoCliente1",
      "DNICliente",
      "EmailCliente",
      "TelefonoCliente1",
      "consentimiento",
    ],
    requiredFields: [
      "MetodoNotificacion",
    ],
  },
};

const TYPE_ALIASES = Object.values(FORM_TYPES).reduce((aliases, type) => {
  aliases[type.key] = type.key;
  aliases[type.formValue] = type.key;
  aliases[type.formValue.toUpperCase()] = type.key;
  return aliases;
}, {
  INFORMACION: "CONSULTAS",
  OBJETOS: "OBJETOS_PERDIDOS",
  TARJETAS: "TARJETAS_METRO",
});

const COMMON_REQUIRED_FIELDS = [
  "Nombre",
  "Apellidos",
  "TipoDeDocumento",
  "NumeroDeDocumento",
  "CorreoElectronico",
  "Telefono",
  "consentimiento",
];

const POSTAL_REQUIRED_FIELDS = [
  "Direccion",
  "CP",
  "Localidad",
  "Provincia",
];

const PUBLIC_SHAREPOINT_FIELDS = [
  "Title",
  "Nombre",
  "Apellidos",
  "TipoDeDocumento",
  "NumeroDeDocumento",
  "CorreoElectronico",
  "Telefono",
  "NombreCliente",
  "ApellidoCliente1",
  "ApellidoCliente2",
  "DNICliente",
  "EmailCliente",
  "TelefonoCliente1",
  "EstadoCliente",
  "Estado",
  "Descripcion",
  "DescripcionConsulta",
  "RespuestaOrganizacion",
  "FechaRespuesta",
];

function normalizeRequestType(payload = {}) {
  const rawType = payload.tipoFormulario || payload.listaDestino || "";
  const normalized = String(rawType).trim();
  const key = TYPE_ALIASES[normalized] || TYPE_ALIASES[normalized.toUpperCase()];
  return key ? FORM_TYPES[key] : null;
}

function getTypeByTokenPrefix(prefix) {
  return Object.values(FORM_TYPES).find((type) => type.tokenPrefix === prefix) || null;
}

function getAcceptedTypeValues() {
  return Object.values(FORM_TYPES).map((type) => type.formValue);
}

module.exports = {
  FORM_TYPES,
  COMMON_REQUIRED_FIELDS,
  POSTAL_REQUIRED_FIELDS,
  PUBLIC_SHAREPOINT_FIELDS,
  normalizeRequestType,
  getTypeByTokenPrefix,
  getAcceptedTypeValues,
};
