"use client";

import type { Action } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import type { OacCase } from "@/lib/types";
import { useRole } from "./role-context";

export function Can({
  action,
  resource,
  children,
  fallback = null
}: {
  action: Action;
  resource?: OacCase;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role } = useRole();
  return canAccess(role, action, resource) ? <>{children}</> : <>{fallback}</>;
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  if (!canAccess(role, "view:config")) {
    return (
      <section className="surface p-8">
        <p className="text-sm font-semibold text-red-700">Acceso restringido</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Configuración solo disponible para Administrador</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          El selector de rol simula permisos de interfaz. Cambia a Administrador para ver tipologías, canales,
          estados, SLA, usuarios, roles, departamentos y plantillas.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
