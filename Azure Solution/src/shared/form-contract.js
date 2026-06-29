const FORM_TYPES = {
  RECLAMACIONES: {
    key: "RECLAMACIONES",
    formValue: "reclamaciones",
    label: "Reclamaciones y quejas",
    tokenPrefix: "REC",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_CONNECTA_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "ReclamacionesQuejas",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/ReclamacionesQuejas/AllItems.aspx",
    },
    requiredFields: [
      "clasificacion",
      "fechaIncidencia",
      "tipologia",
      "lugarIncidencia",
      "descripcionDetallada",
    ],
  },
  CONSULTAS: {
    key: "CONSULTAS",
    formValue: "consultas",
    label: "Consulta de informacion",
    tokenPrefix: "CON",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_CONNECTA_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "ConsultaInformacion",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/ConsultaInformacion/AllItems.aspx",
    },
    requiredFields: [
      "descripcionDetalladaConsulta",
    ],
  },
  SUGERENCIAS: {
    key: "SUGERENCIAS",
    formValue: "sugerencias",
    label: "Sugerencias",
    tokenPrefix: "SUG",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_CONNECTA_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Sugerencias",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Sugerencias/AllItems.aspx",
    },
    requiredFields: [
      "areaSugerencia",
      "tituloSugerencia",
      "descripcionSugerencia",
    ],
  },
  AGRADECIMIENTOS: {
    key: "AGRADECIMIENTOS",
    formValue: "agradecimientos",
    label: "Agradecimientos y felicitaciones",
    tokenPrefix: "AGR",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_CONNECTA_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Agradecimientos",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Agradecimientos/AllItems.aspx",
    },
    requiredFields: [
      "motivoAgradecimiento",
      "descripcionAgradecimiento",
    ],
  },
  OBJETOS_PERDIDOS: {
    key: "OBJETOS_PERDIDOS",
    formValue: "objetos",
    label: "Objetos perdidos",
    tokenPrefix: "OBJ",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_CONNECTA_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV",
      listName: "Objetos Perdidos NUEVA",
      listUrl: "https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Objetos%20Perdidos%20NUEVA/AllItems.aspx",
    },
    requiredFields: [
      "fechaPerdida",
      "lineaMetroObjetos",
      "dondePerdidoObjetos",
      "nombreObjetoObjetos",
      "descripcionObjeto",
    ],
  },
  TARJETAS_METRO: {
    key: "TARJETAS_METRO",
    formValue: "tarjetas",
    label: "Datos personales para confeccion de tarjetas +Metro",
    tokenPrefix: "TAR",
    sharePoint: {
      siteEnvKey: "SHAREPOINT_TARJETAS_SITE_ID",
      siteUrl: "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro",
      listName: "ClientesTarjetaMetro",
      listUrl: "https://metromalaga.sharepoint.com/sites/TarjetaMasMetro/Lists/ClientesTarjetaMetro/AllItems.aspx",
    },
    requiredFields: [
      "motivoTarjeta",
      "tipoTarjeta",
      "fechaNacimiento",
      "direccionCompleta",
      "codigoPostal",
      "municipio",
      "provincia",
      "puntoRecogida",
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
  "nombre",
  "apellidos",
  "tipoDocumento",
  "numeroDocumento",
  "email",
  "telefono",
  "consentimiento",
];

const POSTAL_REQUIRED_FIELDS = [
  "viaContacto",
  "cpContacto",
  "municipioContacto",
  "provinciaContacto",
];

const PUBLIC_SHAREPOINT_FIELDS = [
  "Title",
  "Nombre",
  "Apellidos",
  "NombreCompleto",
  "TipoDocumento",
  "NumeroDocumento",
  "Email",
  "CorreoElectronico",
  "Telefono",
  "TokenConsulta",
  "TipoFormulario",
  "Estado",
  "FechaCreacion",
  "Descripcion",
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
