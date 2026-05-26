export type Role =
  | "Administrador"
  | "Supervisor OAC"
  | "Operador OAC"
  | "Responsable interno"
  | "Auditor/Consulta"
  | "Usuario externo";

export type CaseType =
  | "Reclamación"
  | "Queja"
  | "Consulta"
  | "Incidencia"
  | "Sugerencia"
  | "Agradecimiento";

export type Channel =
  | "Web"
  | "Papel"
  | "Tablet OAC"
  | "Email"
  | "Teléfono"
  | "WhatsApp";

export type InternalStatus =
  | "Registrada"
  | "Pendiente de validación"
  | "En análisis"
  | "Derivada a área responsable"
  | "Pendiente de subsanación"
  | "Propuesta de resolución"
  | "Notificada"
  | "Cerrada";

export type PublicStatus =
  | "Recibida"
  | "En tramitación"
  | "Pendiente de información"
  | "Resuelta"
  | "Cerrada";

export type SlaRisk = "En plazo" | "Próximo a vencer" | "Fuera de plazo" | "Cerrado";

export type Priority = "Baja" | "Media" | "Alta" | "Crítica";

export type TimelineVisibility = "publico" | "interno";

export type TimelineEvent = {
  id: string;
  caseId?: string;
  date: string;
  title: string;
  description: string;
  user: string;
  type: string;
  visibility: TimelineVisibility;
};

export type Claimant = {
  name: string;
  document: string;
  email: string;
  phone: string;
  preferredChannel: string;
};

export type IncidentData = {
  date: string;
  line?: string;
  station?: string;
  train?: string;
  description: string;
};

export type CaseSourceDetails = {
  callSummary?: string;
  callConsent?: boolean;
  transcript?: string;
  physicalDocumentNumber?: string;
  scanLabel?: string;
  emailOriginal?: string;
  aiExtraction?: string;
  whatsappSummary?: string;
};

export type Attachment = {
  id: string;
  name: string;
  kind: string;
  repository: "Mock local" | "SharePoint previsto" | "Azure Blob previsto";
  visibleToPublic: boolean;
};

export type CaseComment = {
  id: string;
  author: string;
  role: Role;
  date: string;
  body: string;
  public: boolean;
};

export type OacCase = {
  id: string;
  type: CaseType;
  subtype: string;
  channel: Channel;
  claimant: Claimant;
  incident: IncidentData;
  priority: Priority;
  internalStatus: InternalStatus;
  publicStatus: PublicStatus;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  slaRisk: SlaRisk;
  department: string;
  responsible: string;
  publicTimeline: TimelineEvent[];
  internalTimeline: TimelineEvent[];
  comments: CaseComment[];
  communications: CaseComment[];
  attachments: Attachment[];
  sourceDetails?: CaseSourceDetails;
  resolution?: {
    text: string;
    notifiedAt?: string;
  };
  nextStep: string;
};

export type User = {
  name: string;
  role: Role;
  department: string;
  email: string;
};

export type AuditEvent = {
  id: string;
  caseId: string;
  date: string;
  user: string;
  eventType: string;
  detail: string;
};
