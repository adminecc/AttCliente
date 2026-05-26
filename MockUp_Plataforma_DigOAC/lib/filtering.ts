import type { AuditEvent, Channel, InternalStatus, OacCase, Priority, SlaRisk } from "./types";

export type CaseFilters = {
  status?: InternalStatus | "";
  channel?: Channel | "";
  type?: OacCase["type"] | "";
  responsible?: string;
  department?: string;
  priority?: Priority | "";
  slaRisk?: SlaRisk | "";
  search?: string;
};

export type AuditFilters = {
  user?: string;
  caseSearch?: string;
  date?: string;
  eventType?: string;
};

function includesNormalized(value: string | undefined, search: string) {
  return (value ?? "").toLocaleLowerCase("es-ES").includes(search.toLocaleLowerCase("es-ES"));
}

export function filterCases(items: OacCase[], filters: CaseFilters) {
  const search = filters.search?.trim() ?? "";

  return items.filter((item) => {
    if (filters.status && item.internalStatus !== filters.status) return false;
    if (filters.channel && item.channel !== filters.channel) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.responsible && item.responsible !== filters.responsible) return false;
    if (filters.department && item.department !== filters.department) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.slaRisk && item.slaRisk !== filters.slaRisk) return false;

    if (!search) return true;

    return [
      item.id,
      item.claimant.name,
      item.claimant.email,
      item.type,
      item.subtype,
      item.channel,
      item.internalStatus,
      item.department,
      item.responsible,
      item.priority,
      item.slaRisk,
      item.incident.description
    ].some((value) => includesNormalized(value, search));
  });
}

export function getAuditEventTypes(items: AuditEvent[]) {
  return [...new Set(items.map((item) => item.eventType))].sort((a, b) => a.localeCompare(b, "es-ES"));
}

export function filterAuditEvents(items: AuditEvent[], filters: AuditFilters) {
  const caseSearch = filters.caseSearch?.trim() ?? "";

  return items.filter((item) => {
    if (filters.user && item.user !== filters.user) return false;
    if (filters.eventType && item.eventType !== filters.eventType) return false;
    if (filters.date && !item.date.startsWith(filters.date)) return false;
    if (caseSearch && ![item.caseId, item.detail, item.eventType, item.user].some((value) => includesNormalized(value, caseSearch))) {
      return false;
    }

    return true;
  });
}
