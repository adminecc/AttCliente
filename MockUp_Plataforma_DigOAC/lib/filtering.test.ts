import { describe, expect, it } from "vitest";
import { auditEvents, cases } from "./data";
import { filterAuditEvents, filterCases, getAuditEventTypes } from "./filtering";

describe("filterCases", () => {
  it("filters by internal status", () => {
    const result = filterCases(cases, { status: "En análisis" });

    expect(result.map((item) => item.id)).toEqual(["OAC-2026-000123"]);
  });

  it("combines channel, priority and search filters", () => {
    const result = filterCases(cases, {
      channel: "Papel",
      priority: "Media",
      search: "000128"
    });

    expect(result.map((item) => item.id)).toEqual(["OAC-2026-000128"]);
  });

  it("matches search against claimant, subtype and department", () => {
    const result = filterCases(cases, { search: "infraestructura" });

    expect(result.map((item) => item.id)).toEqual(["OAC-2026-000124"]);
  });
});

describe("filterAuditEvents", () => {
  it("derives every event type present in audit data", () => {
    expect(getAuditEventTypes(auditEvents)).toEqual([
      "Cambio operativo",
      "Canal email",
      "Documento",
      "Notificación",
      "SLA"
    ]);
  });

  it("filters by event type", () => {
    const result = filterAuditEvents(auditEvents, { eventType: "SLA" });

    expect(result).toHaveLength(1);
    expect(result[0]?.caseId).toBe("OAC-2026-000124");
  });

  it("combines user, case and date filters", () => {
    const result = filterAuditEvents(auditEvents, {
      user: "Javier Ortega",
      caseSearch: "000128",
      date: "2026-05-06"
    });

    expect(result.map((item) => item.id)).toEqual(["i-128-1", "i-128-2"]);
  });
});
