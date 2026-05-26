import type { AuditEvent, CaseType, Channel, OacCase, Role, TimelineEvent, User } from "./types";

export const roles: Role[] = [
  "Administrador",
  "Supervisor OAC",
  "Operador OAC",
  "Responsable interno",
  "Auditor/Consulta",
  "Usuario externo"
];

export const channels: Channel[] = ["Web", "Papel", "Tablet OAC", "Email", "Teléfono", "WhatsApp"];

export const caseTypes: CaseType[] = [
  "Reclamación",
  "Queja",
  "Consulta",
  "Incidencia",
  "Sugerencia",
  "Agradecimiento"
];

export const departments = [
  "Atención a la Clientela",
  "Operaciones",
  "Infraestructura",
  "Comercial",
  "Seguridad",
  "Tecnología"
];

export const internalStatuses = [
  "Registrada",
  "Pendiente de validación",
  "En análisis",
  "Derivada a área responsable",
  "Pendiente de subsanación",
  "Propuesta de resolución",
  "Notificada",
  "Cerrada"
];

export const publicStatuses = ["Recibida", "En tramitación", "Pendiente de información", "Resuelta", "Cerrada"];

export const users: User[] = [
  {
    name: "Ana Beltrán",
    role: "Administrador",
    department: "Tecnología",
    email: "ana.beltran@metro.example"
  },
  {
    name: "Marta Ríos",
    role: "Supervisor OAC",
    department: "Atención a la Clientela",
    email: "marta.rios@metro.example"
  },
  {
    name: "Javier Ortega",
    role: "Operador OAC",
    department: "Atención a la Clientela",
    email: "javier.ortega@metro.example"
  },
  {
    name: "Carlos Medina",
    role: "Responsable interno",
    department: "Infraestructura",
    email: "carlos.medina@metro.example"
  },
  {
    name: "Lucía Ferrer",
    role: "Auditor/Consulta",
    department: "Cumplimiento",
    email: "lucia.ferrer@metro.example"
  }
];

function publicEvent(id: string, date: string, title: string, description: string): TimelineEvent {
  return {
    id,
    date,
    title,
    description,
    user: "Sistema OAC",
    type: "Evento público",
    visibility: "publico"
  };
}

function internalEvent(
  id: string,
  caseId: string,
  date: string,
  title: string,
  description: string,
  user = "Marta Ríos",
  type = "Cambio operativo"
): TimelineEvent {
  return {
    id,
    caseId,
    date,
    title,
    description,
    user,
    type,
    visibility: "interno"
  };
}

export const cases: OacCase[] = [
  {
    id: "OAC-2026-000123",
    type: "Reclamación",
    subtype: "Servicio prestado",
    channel: "Web",
    claimant: {
      name: "Laura Gómez Ruiz",
      document: "12345678L",
      email: "laura.gomez@example.com",
      phone: "612 458 903",
      preferredChannel: "Email"
    },
    incident: {
      date: "2026-04-29T08:20:00",
      line: "Línea C-3",
      station: "Estación Central",
      train: "TR-1842",
      description: "Retraso prolongado en servicio y falta de información en estación."
    },
    priority: "Alta",
    internalStatus: "En análisis",
    publicStatus: "En tramitación",
    createdAt: "2026-04-30T10:12:00",
    updatedAt: "2026-05-05T11:45:00",
    dueAt: "2026-05-14T23:59:00",
    slaRisk: "En plazo",
    department: "Operaciones",
    responsible: "Equipo Operaciones Cercanías",
    nextStep: "El equipo de Operaciones debe contrastar registros de circulación y megafonía.",
    publicTimeline: [
      publicEvent("p-123-1", "2026-04-30T10:12:00", "Reclamación recibida", "Hemos registrado la solicitud y generado el justificante."),
      publicEvent("p-123-2", "2026-05-02T09:10:00", "Documentación validada", "Los datos aportados son suficientes para continuar la tramitación."),
      publicEvent("p-123-3", "2026-05-05T11:45:00", "En análisis por el equipo de atención", "Estamos revisando la información del servicio afectado.")
    ],
    internalTimeline: [
      internalEvent("i-123-1", "OAC-2026-000123", "2026-04-30T10:13:00", "Caso creado", "Alta automática desde formulario web."),
      internalEvent("i-123-2", "OAC-2026-000123", "2026-05-02T09:10:00", "Validación documental", "Datos mínimos completos. Se inicia análisis."),
      internalEvent("i-123-3", "OAC-2026-000123", "2026-05-05T11:45:00", "Departamento asignado", "Derivación a Operaciones para informe de servicio.")
    ],
    comments: [
      {
        id: "c-123-1",
        author: "Javier Ortega",
        role: "Operador OAC",
        date: "2026-05-05T11:46:00",
        body: "La usuaria aporta hora aproximada y estación. Pendiente contraste con datos de circulación.",
        public: false
      }
    ],
    communications: [
      {
        id: "m-123-1",
        author: "Sistema OAC",
        role: "Operador OAC",
        date: "2026-04-30T10:12:00",
        body: "Acuse de recibo enviado por email con código OAC-2026-000123.",
        public: true
      }
    ],
    attachments: [
      {
        id: "a-123-1",
        name: "captura-panel-estacion.jpg",
        kind: "Imagen",
        repository: "SharePoint previsto",
        visibleToPublic: true
      }
    ]
  },
  {
    id: "OAC-2026-000124",
    type: "Incidencia",
    subtype: "Accesibilidad",
    channel: "Teléfono",
    claimant: {
      name: "Manuel Sánchez Pérez",
      document: "87654321M",
      email: "manuel.sanchez@example.com",
      phone: "699 284 115",
      preferredChannel: "Teléfono"
    },
    incident: {
      date: "2026-05-01T17:40:00",
      line: "Línea C-1",
      station: "Ribera Norte",
      description: "Ascensor fuera de servicio en estación."
    },
    priority: "Crítica",
    internalStatus: "Derivada a área responsable",
    publicStatus: "En tramitación",
    createdAt: "2026-05-01T18:05:00",
    updatedAt: "2026-05-06T08:20:00",
    dueAt: "2026-05-07T23:59:00",
    slaRisk: "Próximo a vencer",
    department: "Infraestructura",
    responsible: "Carlos Medina",
    nextStep: "Infraestructura debe confirmar previsión de reparación y medida alternativa de accesibilidad.",
    sourceDetails: {
      callSummary: "El usuario comunica que no pudo acceder al andén por avería del ascensor.",
      callConsent: true,
      transcript:
        "Operador: ¿Puede indicarme la estación afectada? Usuario: Ribera Norte, el ascensor lleva dos días parado y no había aviso visible."
    },
    publicTimeline: [
      publicEvent("p-124-1", "2026-05-01T18:05:00", "Incidencia registrada", "El equipo de atención ha registrado la incidencia comunicada por teléfono."),
      publicEvent("p-124-2", "2026-05-02T12:20:00", "En tramitación", "La incidencia se ha derivado al área responsable.")
    ],
    internalTimeline: [
      internalEvent("i-124-1", "OAC-2026-000124", "2026-05-01T18:05:00", "Caso creado", "Alta manual desde canal telefónico.", "Javier Ortega"),
      internalEvent("i-124-2", "OAC-2026-000124", "2026-05-02T12:20:00", "Responsable asignado", "Asignado a Infraestructura por impacto en accesibilidad."),
      internalEvent("i-124-3", "OAC-2026-000124", "2026-05-06T08:20:00", "Alerta SLA", "Caso próximo a vencer en menos de 48 horas.", "Sistema OAC", "SLA")
    ],
    comments: [
      {
        id: "c-124-1",
        author: "Carlos Medina",
        role: "Responsable interno",
        date: "2026-05-06T08:35:00",
        body: "Solicitada confirmación al proveedor de mantenimiento. Se valorará aviso temporal en estación.",
        public: false
      }
    ],
    communications: [],
    attachments: [
      {
        id: "a-124-1",
        name: "audio-llamada-000124.mp3",
        kind: "Grabación simulada",
        repository: "Mock local",
        visibleToPublic: false
      }
    ]
  },
  {
    id: "OAC-2026-000125",
    type: "Consulta",
    subtype: "Título de transporte",
    channel: "Email",
    claimant: {
      name: "Nadia El Amrani",
      document: "Y1234567Z",
      email: "nadia.amrani@example.com",
      phone: "634 772 001",
      preferredChannel: "Email"
    },
    incident: {
      date: "2026-05-03T09:00:00",
      line: "Red completa",
      description: "Consulta sobre validez de abono combinado en conexión ferroviaria."
    },
    priority: "Media",
    internalStatus: "Pendiente de subsanación",
    publicStatus: "Pendiente de información",
    createdAt: "2026-05-03T09:18:00",
    updatedAt: "2026-05-04T13:05:00",
    dueAt: "2026-05-20T23:59:00",
    slaRisk: "En plazo",
    department: "Comercial",
    responsible: "Equipo Comercial",
    nextStep: "La persona solicitante debe confirmar el tipo exacto de título y zona tarifaria.",
    sourceDetails: {
      emailOriginal:
        "Buenos días, necesito saber si mi abono mensual combinado sirve para el trayecto entre la estación norte y la conexión regional. No encuentro información clara en la web.",
      aiExtraction:
        "Tipo sugerido: Consulta. Subtipo sugerido: Título de transporte. Datos faltantes: número o modalidad del título, zona tarifaria y trayecto exacto."
    },
    publicTimeline: [
      publicEvent("p-125-1", "2026-05-03T09:18:00", "Consulta recibida", "Hemos registrado la consulta enviada por email."),
      publicEvent("p-125-2", "2026-05-04T13:05:00", "Pendiente de información", "Necesitamos un dato adicional para poder responder con precisión.")
    ],
    internalTimeline: [
      internalEvent("i-125-1", "OAC-2026-000125", "2026-05-03T09:18:00", "Email importado", "Se registra email original y extracción IA simulada.", "Sistema OAC", "Canal email"),
      internalEvent("i-125-2", "OAC-2026-000125", "2026-05-04T13:05:00", "Subsanación solicitada", "Solicitado tipo exacto de título y trayecto.")
    ],
    comments: [],
    communications: [
      {
        id: "m-125-1",
        author: "Javier Ortega",
        role: "Operador OAC",
        date: "2026-05-04T13:05:00",
        body: "Para poder responder necesitamos que nos confirme el tipo de abono y el trayecto concreto.",
        public: true
      }
    ],
    attachments: []
  },
  {
    id: "OAC-2026-000126",
    type: "Agradecimiento",
    subtype: "Atención recibida",
    channel: "Tablet OAC",
    claimant: {
      name: "Pedro Martín Velasco",
      document: "44556677P",
      email: "pedro.martin@example.com",
      phone: "644 120 880",
      preferredChannel: "Email"
    },
    incident: {
      date: "2026-04-22T15:30:00",
      station: "Oficina Central OAC",
      description: "Agradecimiento por la atención recibida durante la gestión de un objeto perdido."
    },
    priority: "Baja",
    internalStatus: "Cerrada",
    publicStatus: "Cerrada",
    createdAt: "2026-04-22T15:42:00",
    updatedAt: "2026-04-23T09:00:00",
    dueAt: "2026-05-06T23:59:00",
    slaRisk: "Cerrado",
    department: "Atención a la Clientela",
    responsible: "Marta Ríos",
    nextStep: "Caso cerrado y comunicado internamente al equipo.",
    publicTimeline: [
      publicEvent("p-126-1", "2026-04-22T15:42:00", "Agradecimiento recibido", "Hemos registrado el agradecimiento presentado en tablet OAC."),
      publicEvent("p-126-2", "2026-04-23T09:00:00", "Cerrado", "El agradecimiento ha sido trasladado al equipo correspondiente.")
    ],
    internalTimeline: [
      internalEvent("i-126-1", "OAC-2026-000126", "2026-04-22T15:42:00", "Caso creado", "Alta en tablet de Oficina OAC.", "Javier Ortega"),
      internalEvent("i-126-2", "OAC-2026-000126", "2026-04-23T09:00:00", "Caso cerrado", "Resolución notificada y cierre administrativo.")
    ],
    comments: [
      {
        id: "c-126-1",
        author: "Marta Ríos",
        role: "Supervisor OAC",
        date: "2026-04-23T08:55:00",
        body: "Trasladar reconocimiento a personal de oficina y dejar constancia para informe mensual.",
        public: false
      }
    ],
    communications: [
      {
        id: "m-126-1",
        author: "Sistema OAC",
        role: "Operador OAC",
        date: "2026-04-23T09:00:00",
        body: "Comunicación de agradecimiento trasladado al equipo.",
        public: true
      }
    ],
    attachments: [],
    resolution: {
      text: "Agradecimiento trasladado al equipo de Oficina de Atención a la Clientela.",
      notifiedAt: "2026-04-23T09:00:00"
    }
  },
  {
    id: "OAC-2026-000127",
    type: "Reclamación",
    subtype: "Servicio prestado",
    channel: "Web",
    claimant: {
      name: "Laura Gómez Ruiz",
      document: "12345678L",
      email: "laura.gomez@example.com",
      phone: "612 458 903",
      preferredChannel: "Email"
    },
    incident: {
      date: "2026-05-06T09:00:00",
      line: "Línea C-3",
      station: "Estación Central",
      train: "TR-1842",
      description: "Solicitud creada desde el formulario público de la demo."
    },
    priority: "Media",
    internalStatus: "Registrada",
    publicStatus: "Recibida",
    createdAt: "2026-05-06T09:00:00",
    updatedAt: "2026-05-06T09:00:00",
    dueAt: "2026-06-05T23:59:00",
    slaRisk: "En plazo",
    department: "Atención a la Clientela",
    responsible: "Bandeja OAC",
    nextStep: "El equipo de atención validará la documentación y clasificará la solicitud.",
    publicTimeline: [
      publicEvent("p-127-1", "2026-05-06T09:00:00", "Solicitud recibida", "Hemos registrado la solicitud y generado el justificante."),
      publicEvent("p-127-2", "2026-05-06T09:00:00", "Acuse emitido", "Se ha generado el acuse de recibo con el código de seguimiento.")
    ],
    internalTimeline: [
      internalEvent("i-127-1", "OAC-2026-000127", "2026-05-06T09:00:00", "Caso creado", "Alta desde formulario público de la demo.", "Sistema OAC"),
      internalEvent("i-127-2", "OAC-2026-000127", "2026-05-06T09:00:00", "Acuse generado", "Justificante simulado disponible para consulta pública.", "Sistema OAC", "Notificación")
    ],
    comments: [],
    communications: [
      {
        id: "m-127-1",
        author: "Sistema OAC",
        role: "Operador OAC",
        date: "2026-05-06T09:00:00",
        body: "Acuse de recibo simulado enviado por email.",
        public: true
      }
    ],
    attachments: [
      {
        id: "a-127-1",
        name: "justificante-presentacion.pdf",
        kind: "Justificante",
        repository: "Mock local",
        visibleToPublic: true
      }
    ]
  },
  {
    id: "OAC-2026-000128",
    type: "Queja",
    subtype: "Información en estación",
    channel: "Papel",
    claimant: {
      name: "Cliente de ejemplo",
      document: "00000000T",
      email: "cliente@example.com",
      phone: "600 000 000",
      preferredChannel: "Email"
    },
    incident: {
      date: "2026-05-06T10:20:00",
      line: "Línea C-2",
      station: "Estación Norte",
      description: "Caso creado desde el alta manual asistida para representar digitalización de documento físico."
    },
    priority: "Media",
    internalStatus: "Pendiente de validación",
    publicStatus: "Recibida",
    createdAt: "2026-05-06T10:22:00",
    updatedAt: "2026-05-06T10:22:00",
    dueAt: "2026-05-26T23:59:00",
    slaRisk: "En plazo",
    department: "Atención a la Clientela",
    responsible: "Javier Ortega",
    nextStep: "El operador debe revisar el escaneo y completar los datos mínimos antes de derivar.",
    sourceDetails: {
      physicalDocumentNumber: "PAP-2026-00451",
      scanLabel: "reclamacion-firmada-00451.pdf"
    },
    publicTimeline: [
      publicEvent("p-128-1", "2026-05-06T10:22:00", "Solicitud recibida", "Hemos registrado la solicitud presentada en papel.")
    ],
    internalTimeline: [
      internalEvent("i-128-1", "OAC-2026-000128", "2026-05-06T10:22:00", "Caso creado", "Alta manual desde documento físico.", "Javier Ortega"),
      internalEvent("i-128-2", "OAC-2026-000128", "2026-05-06T10:22:00", "Documento adjuntado", "Escaneo simulado asociado al expediente.", "Javier Ortega", "Documento")
    ],
    comments: [
      {
        id: "c-128-1",
        author: "Javier Ortega",
        role: "Operador OAC",
        date: "2026-05-06T10:23:00",
        body: "Pendiente revisar legibilidad del documento físico y completar clasificación final.",
        public: false
      }
    ],
    communications: [],
    attachments: [
      {
        id: "a-128-1",
        name: "reclamacion-firmada-00451.pdf",
        kind: "Escaneo simulado",
        repository: "SharePoint previsto",
        visibleToPublic: false
      }
    ]
  }
];

export const auditEvents: AuditEvent[] = cases.flatMap((item) =>
  item.internalTimeline.map((event) => ({
    id: event.id,
    caseId: item.id,
    date: event.date,
    user: event.user,
    eventType: event.type,
    detail: `${event.title}: ${event.description}`
  }))
);

export const slaPolicies = [
  { type: "Reclamación", days: 30, alertAt: 7, owner: "Atención a la Clientela" },
  { type: "Queja", days: 20, alertAt: 5, owner: "Atención a la Clientela" },
  { type: "Consulta", days: 15, alertAt: 4, owner: "Comercial" },
  { type: "Incidencia", days: 7, alertAt: 2, owner: "Operaciones / Infraestructura" },
  { type: "Sugerencia", days: 20, alertAt: 5, owner: "Atención a la Clientela" },
  { type: "Agradecimiento", days: 10, alertAt: 2, owner: "Atención a la Clientela" }
];

export const notificationTemplates = [
  "Acuse de recibo",
  "Solicitud de subsanación",
  "Comunicación de derivación",
  "Propuesta de resolución",
  "Notificación de cierre"
];

export function getCaseById(id: string) {
  return cases.find((item) => item.id.toLowerCase() === id.toLowerCase());
}

export function dashboardMetrics() {
  return {
    open: cases.filter((item) => item.internalStatus !== "Cerrada").length,
    pendingValidation: cases.filter((item) => item.internalStatus === "Pendiente de validación").length,
    dueSoon: cases.filter((item) => item.slaRisk === "Próximo a vencer").length,
    overdue: cases.filter((item) => item.slaRisk === "Fuera de plazo").length,
    byChannel: channels.map((channel) => ({
      name: channel,
      value: cases.filter((item) => item.channel === channel).length
    })),
    byType: caseTypes.map((type) => ({
      name: type,
      value: cases.filter((item) => item.type === type).length
    }))
  };
}

export const monthlyEvolution = [
  { month: "Ene", casos: 84, resueltos: 72 },
  { month: "Feb", casos: 91, resueltos: 79 },
  { month: "Mar", casos: 102, resueltos: 90 },
  { month: "Abr", casos: 117, resueltos: 105 },
  { month: "May", casos: 63, resueltos: 48 }
];

export const topReasons = [
  { name: "Retrasos e información", value: 34 },
  { name: "Accesibilidad", value: 18 },
  { name: "Títulos de transporte", value: 16 },
  { name: "Objetos perdidos", value: 11 },
  { name: "Atención recibida", value: 8 }
];
