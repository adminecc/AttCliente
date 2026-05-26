"use client";

import { useState } from "react";
import { AdminOnly } from "./role-gates";
import { caseTypes, channels, departments, internalStatuses, notificationTemplates, roles, slaPolicies, users } from "@/lib/data";

const tabs = [
  "Tipologías",
  "Canales",
  "Estados",
  "SLA",
  "Usuarios",
  "Roles",
  "Departamentos",
  "Plantillas",
  "Parámetros"
];

export function ConfigTabs() {
  const [active, setActive] = useState(tabs[0]);

  return (
    <AdminOnly>
      <div className="space-y-6">
        <section className="surface p-5">
          <p className="text-sm font-semibold text-rail">Administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Configuración</h1>
          <p className="mt-1 text-sm text-slate-500">Zona preparada para tipologías, canales, estados, SLA, usuarios, roles y plantillas.</p>
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                className={`focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active === tab ? "bg-rail text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                key={tab}
                onClick={() => setActive(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">{active}</h2>
          <div className="mt-5">
            {active === "Tipologías" ? <SimpleList items={caseTypes.map((item) => `${item} · formulario específico previsto`)} /> : null}
            {active === "Canales" ? <SimpleList items={channels.map((item) => `${item} · entrada centralizada`)} /> : null}
            {active === "Estados" ? <SimpleList items={internalStatuses.map((item) => `${item} · mapeo público configurable`)} /> : null}
            {active === "SLA" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Días</th>
                      <th className="px-4 py-3">Alerta</th>
                      <th className="px-4 py-3">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {slaPolicies.map((item) => (
                      <tr key={item.type}>
                        <td className="px-4 py-3 font-medium text-ink">{item.type}</td>
                        <td className="px-4 py-3 text-slate-700">{item.days}</td>
                        <td className="px-4 py-3 text-slate-700">{item.alertAt} días antes</td>
                        <td className="px-4 py-3 text-slate-700">{item.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {active === "Usuarios" ? <SimpleList items={users.map((item) => `${item.name} · ${item.role} · ${item.department}`)} /> : null}
            {active === "Roles" ? <SimpleList items={roles.map((item) => `${item} · permisos RBAC simulados`)} /> : null}
            {active === "Departamentos" ? <SimpleList items={departments.map((item) => `${item} · cola de asignación prevista`)} /> : null}
            {active === "Plantillas" ? <SimpleList items={notificationTemplates.map((item) => `${item} · editable en producción`)} /> : null}
            {active === "Parámetros" ? (
              <SimpleList
                items={[
                  "Formato de identificador: OAC-AAAA-NNNNNN",
                  "SharePoint configurado como repositorio documental previsto",
                  "Portal externo con validación por código y email/documento",
                  "Retención y auditoría avanzada pendientes de diseño productivo"
                ]}
              />
            ) : null}
          </div>
        </section>
      </div>
    </AdminOnly>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div className="rounded-lg border border-line bg-slate-50 p-4 text-sm font-medium text-slate-700" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
