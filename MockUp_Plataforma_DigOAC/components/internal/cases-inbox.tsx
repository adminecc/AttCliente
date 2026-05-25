"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CaseRowActions } from "@/components/internal/case-row-actions";
import { Button } from "@/components/ui/button";
import { PlainBadge, SlaBadge, StatusBadge } from "@/components/ui/badges";
import { filterCases, type CaseFilters } from "@/lib/filtering";
import type { Channel, InternalStatus, OacCase, Priority, SlaRisk } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CasesInboxProps = {
  cases: OacCase[];
  channels: Channel[];
  caseTypes: OacCase["type"][];
  departments: string[];
  statuses: string[];
};

const priorities: Priority[] = ["Baja", "Media", "Alta", "Crítica"];
const slaRisks: SlaRisk[] = ["En plazo", "Próximo a vencer", "Fuera de plazo", "Cerrado"];

const initialFilters: CaseFilters = {
  status: "",
  channel: "",
  type: "",
  responsible: "",
  department: "",
  priority: "",
  slaRisk: "",
  search: ""
};

export function CasesInbox({ cases, caseTypes, channels, departments, statuses }: CasesInboxProps) {
  const [filters, setFilters] = useState<CaseFilters>(initialFilters);
  const responsibles = useMemo(() => [...new Set(cases.map((item) => item.responsible))].sort(), [cases]);
  const filteredCases = useMemo(() => filterCases(cases, filters), [cases, filters]);
  const hasFilters = Object.values(filters).some(Boolean);

  function updateFilter<Key extends keyof CaseFilters>(key: Key, value: CaseFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="page-kicker">Bandeja interna</p>
            <h1 className="page-title mt-1">Casos</h1>
            <p className="mt-1 text-sm text-slate-500">Filtros funcionales por estado, canal, tipo, responsable, departamento, prioridad y SLA.</p>
          </div>
          <Link href="/app/casos/nuevo">
            <Button type="button">
              <Plus aria-hidden className="h-4 w-4" />
              Alta manual
            </Button>
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <PlainBadge className="bg-teal-50 text-rail">{filteredCases.length} resultados</PlainBadge>
          <PlainBadge className="bg-amber-50 text-amber-800">SLA próximo</PlainBadge>
          <PlainBadge>Vista operacional</PlainBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="field" onChange={(event) => updateFilter("status", event.target.value as InternalStatus | "")} value={filters.status}>
            <option value="">Todos los estados</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("channel", event.target.value as Channel | "")} value={filters.channel}>
            <option value="">Todos los canales</option>
            {channels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("type", event.target.value as OacCase["type"] | "")} value={filters.type}>
            <option value="">Todos los tipos</option>
            {caseTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("responsible", event.target.value)} value={filters.responsible}>
            <option value="">Todos los responsables</option>
            {responsibles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("department", event.target.value)} value={filters.department}>
            <option value="">Todos los departamentos</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("priority", event.target.value as Priority | "")} value={filters.priority}>
            <option value="">Todas las prioridades</option>
            {priorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" onChange={(event) => updateFilter("slaRisk", event.target.value as SlaRisk | "")} value={filters.slaRisk}>
            <option value="">Todos los SLA</option>
            {slaRisks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="relative xl:col-span-2">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Buscar por ID, solicitante, subtipo, área..."
              value={filters.search}
            />
          </label>
          {hasFilters ? (
            <Button className="w-full" onClick={() => setFilters(initialFilters)} type="button" variant="secondary">
              <X aria-hidden className="h-4 w-4" />
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Resultados</h2>
            <p className="text-sm text-slate-500">
              Mostrando {filteredCases.length} de {cases.length} casos
            </p>
          </div>
        </div>
        {filteredCases.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Fecha alta</th>
                  <th className="px-4 py-3">Fecha límite</th>
                  <th className="px-4 py-3">Riesgo SLA</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCases.map((item) => (
                  <tr className="hover:bg-slate-50" key={item.id}>
                    <td className="px-4 py-3 font-semibold text-rail">
                      <Link href={`/app/casos/${item.id}`}>{item.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-medium">{item.type}</span>
                      <br />
                      <span className="text-xs text-slate-500">{item.subtype}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.claimant.name}</td>
                    <td className="px-4 py-3 text-slate-700">{item.channel}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.internalStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.responsible}
                      <br />
                      <span className="text-xs text-slate-500">{item.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PlainBadge>{item.priority}</PlainBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(item.dueAt)}</td>
                    <td className="px-4 py-3">
                      <SlaBadge risk={item.slaRisk} />
                    </td>
                    <td className="px-4 py-3">
                      <CaseRowActions item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-ink">Sin resultados</h3>
            <p className="mt-2 text-sm text-slate-500">Ajusta los filtros o limpia la búsqueda para volver a ver la bandeja.</p>
            <Button className="mt-4" onClick={() => setFilters(initialFilters)} type="button" variant="secondary">
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
