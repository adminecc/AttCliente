import type { OacCase, Role } from "./types";

export type Action =
  | "view:all-cases"
  | "view:department-cases"
  | "create:case"
  | "edit:case"
  | "assign:case"
  | "change:critical-status"
  | "comment:internal"
  | "communicate:public"
  | "request:subsanation"
  | "generate:resolution"
  | "close:case"
  | "view:metrics"
  | "view:audit"
  | "view:config"
  | "edit:config";

const permissions: Record<Role, Action[]> = {
  Administrador: [
    "view:all-cases",
    "view:department-cases",
    "create:case",
    "edit:case",
    "assign:case",
    "change:critical-status",
    "comment:internal",
    "communicate:public",
    "request:subsanation",
    "generate:resolution",
    "close:case",
    "view:metrics",
    "view:audit",
    "view:config",
    "edit:config"
  ],
  "Supervisor OAC": [
    "view:all-cases",
    "view:department-cases",
    "create:case",
    "edit:case",
    "assign:case",
    "change:critical-status",
    "comment:internal",
    "communicate:public",
    "request:subsanation",
    "generate:resolution",
    "close:case",
    "view:metrics",
    "view:audit"
  ],
  "Operador OAC": [
    "view:all-cases",
    "create:case",
    "edit:case",
    "comment:internal",
    "communicate:public",
    "request:subsanation"
  ],
  "Responsable interno": [
    "view:department-cases",
    "comment:internal",
    "generate:resolution",
    "communicate:public"
  ],
  "Auditor/Consulta": ["view:all-cases", "view:department-cases", "view:metrics", "view:audit"],
  "Usuario externo": []
};

export function canAccess(role: Role, action: Action, resource?: OacCase) {
  if (!permissions[role].includes(action)) {
    return false;
  }

  if (role === "Responsable interno" && resource) {
    return resource.department === "Infraestructura";
  }

  return true;
}

export function roleDescription(role: Role) {
  const descriptions: Record<Role, string> = {
    Administrador: "Acceso completo a operación, configuración, auditoría y métricas.",
    "Supervisor OAC": "Controla la bandeja completa, reasignaciones, estados críticos y métricas.",
    "Operador OAC": "Registra casos, completa expedientes y gestiona comunicaciones operativas.",
    "Responsable interno": "Trabaja solo casos derivados a su departamento simulado.",
    "Auditor/Consulta": "Consulta casos, eventos y reporting sin modificar datos.",
    "Usuario externo": "Solo consulta estado público con código y documento o email."
  };

  return descriptions[role];
}
