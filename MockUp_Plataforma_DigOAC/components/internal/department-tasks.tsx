"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Send } from "lucide-react";
import { cases } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { SlaBadge, StatusBadge } from "@/components/ui/badges";
import { useRole } from "./role-context";

export function DepartmentTasks() {
  const { role } = useRole();
  const [saved, setSaved] = useState<string | null>(null);
  const visibleCases = useMemo(() => {
    if (role === "Responsable interno") {
      return cases.filter((item) => item.department === "Infraestructura");
    }
    return cases.filter((item) => item.internalStatus !== "Cerrada");
  }, [role]);

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <p className="text-sm font-semibold text-rail">Vista de tareas</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Casos asignados</h1>
        <p className="mt-1 text-sm text-slate-500">
          Con rol Responsable interno se simula una vista limitada al departamento Infraestructura.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {visibleCases.map((item) => (
          <section className="surface p-5" key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link className="text-lg font-semibold text-rail hover:underline" href={`/app/casos/${item.id}`}>
                  {item.id}
                </Link>
                <p className="mt-1 text-sm text-slate-600">{item.type} · {item.subtype}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={item.internalStatus} />
                <SlaBadge risk={item.slaRisk} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{item.incident.description}</p>
            <label className="mt-5 block">
              <span className="label">Informe interno</span>
              <textarea
                className="field mt-1 min-h-28"
                defaultValue="Informe técnico simulado: se revisan datos del área responsable y se propone respuesta."
              />
            </label>
            <Button className="mt-4" onClick={() => setSaved(item.id)} type="button" variant="secondary">
              <FileText aria-hidden className="h-4 w-4" />
              Añadir informe interno
            </Button>
            {saved === item.id ? (
              <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
                Informe interno añadido de forma simulada.
              </p>
            ) : null}
          </section>
        ))}
      </div>

      {visibleCases.length === 0 ? (
        <section className="surface p-8 text-center">
          <Send aria-hidden className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-ink">No hay tareas asignadas</h2>
          <p className="mt-1 text-sm text-slate-500">El departamento simulado no tiene casos pendientes.</p>
        </section>
      ) : null}
    </div>
  );
}
