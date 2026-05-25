"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { filterAuditEvents, getAuditEventTypes, type AuditFilters } from "@/lib/filtering";
import type { AuditEvent, User } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const initialFilters: AuditFilters = {
  user: "",
  caseSearch: "",
  date: "",
  eventType: ""
};

export function AuditLog({ events, users }: { events: AuditEvent[]; users: User[] }) {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const eventTypes = useMemo(() => getAuditEventTypes(events), [events]);
  const filteredEvents = useMemo(() => filterAuditEvents(events, filters), [events, filters]);
  const hasFilters = Object.values(filters).some(Boolean);

  function updateFilter<Key extends keyof AuditFilters>(key: Key, value: AuditFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <p className="text-sm font-semibold text-rail">Auditoría</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Eventos del sistema</h1>
        <p className="mt-1 text-sm text-slate-500">Histórico operativo completo para trazabilidad, cambios de estado y notificaciones.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="field" onChange={(event) => updateFilter("user", event.target.value)} value={filters.user}>
            <option value="">Todos los usuarios</option>
            {users.map((user) => (
              <option key={user.email} value={user.name}>
                {user.name}
              </option>
            ))}
            {[...new Set(events.map((event) => event.user))]
              .filter((user) => !users.some((item) => item.name === user))
              .map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
          </select>
          <label className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              onChange={(event) => updateFilter("caseSearch", event.target.value)}
              placeholder="Caso, detalle, usuario..."
              value={filters.caseSearch}
            />
          </label>
          <input className="field" onChange={(event) => updateFilter("date", event.target.value)} type="date" value={filters.date} />
          <select className="field" onChange={(event) => updateFilter("eventType", event.target.value)} value={filters.eventType}>
            <option value="">Todos los eventos</option>
            {eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </select>
          {hasFilters ? (
            <Button className="w-full" onClick={() => setFilters(initialFilters)} type="button" variant="secondary">
              <X aria-hidden className="h-4 w-4" />
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-5 py-4">
          <h2 className="section-title">Resultados</h2>
          <p className="mt-1 text-sm text-slate-500">
            Mostrando {filteredEvents.length} de {events.length} eventos
          </p>
        </div>
        {filteredEvents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Caso</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredEvents.map((event) => (
                  <tr className="hover:bg-slate-50" key={event.id}>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(event.date)}</td>
                    <td className="px-4 py-3 font-semibold text-rail">
                      <Link href={`/app/casos/${event.caseId}`}>{event.caseId}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{event.user}</td>
                    <td className="px-4 py-3 text-slate-700">{event.eventType}</td>
                    <td className="px-4 py-3 text-slate-700">{event.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-ink">Sin eventos</h3>
            <p className="mt-2 text-sm text-slate-500">No hay eventos que coincidan con los filtros actuales.</p>
            <Button className="mt-4" onClick={() => setFilters(initialFilters)} type="button" variant="secondary">
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
