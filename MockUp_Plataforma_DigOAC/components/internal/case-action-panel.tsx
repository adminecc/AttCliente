"use client";

import { useState } from "react";
import { CheckCircle2, FileCog, MessageSquarePlus, Route, Send, UserPlus } from "lucide-react";
import { canAccess } from "@/lib/permissions";
import type { InternalStatus, OacCase, PublicStatus, TimelineEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badges";
import { Timeline } from "@/components/ui/timeline";
import { useRole } from "./role-context";

const actions = [
  { label: "Cambiar estado", permission: "edit:case", icon: Route },
  { label: "Asignar departamento", permission: "assign:case", icon: UserPlus },
  { label: "Comentario interno", permission: "comment:internal", icon: MessageSquarePlus },
  { label: "Comunicación pública", permission: "communicate:public", icon: Send },
  { label: "Solicitar subsanación", permission: "request:subsanation", icon: FileCog },
  { label: "Cerrar caso", permission: "close:case", icon: CheckCircle2 }
] as const;

export function CaseActionPanel({ item }: { item: OacCase }) {
  const { role } = useRole();
  const [message, setMessage] = useState("");
  const [internalStatus, setInternalStatus] = useState<InternalStatus>(item.internalStatus);
  const [publicStatus, setPublicStatus] = useState<PublicStatus>(item.publicStatus);
  const [department, setDepartment] = useState(item.department);
  const [responsible, setResponsible] = useState(item.responsible);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  function addSessionEvent(title: string, description: string, type = "Acción simulada") {
    const event: TimelineEvent = {
      id: `session-${events.length + 1}`,
      caseId: item.id,
      date: new Date().toISOString(),
      title,
      description,
      user: role,
      type,
      visibility: "interno"
    };
    setEvents((current) => [event, ...current]);
    setMessage(description);
  }

  function runAction(label: (typeof actions)[number]["label"]) {
    if (label === "Cambiar estado") {
      setInternalStatus("Propuesta de resolución");
      setPublicStatus("En tramitación");
      addSessionEvent("Estado cambiado", "Estado simulado cambiado a Propuesta de resolución.", "Estado");
      return;
    }

    if (label === "Asignar departamento") {
      setDepartment("Operaciones");
      setResponsible("Equipo Operaciones Cercanías");
      addSessionEvent("Responsable asignado", "Asignación simulada a Operaciones / Equipo Operaciones Cercanías.", "Asignación");
      return;
    }

    if (label === "Comentario interno") {
      addSessionEvent("Comentario añadido", "Comentario interno simulado añadido al expediente.", "Comentario");
      return;
    }

    if (label === "Comunicación pública") {
      addSessionEvent("Notificación enviada", "Comunicación pública simulada añadida para la persona solicitante.", "Notificación");
      return;
    }

    if (label === "Solicitar subsanación") {
      setInternalStatus("Pendiente de subsanación");
      setPublicStatus("Pendiente de información");
      addSessionEvent("Subsanación solicitada", "Se ha solicitado subsanación de forma simulada.", "Subsanación");
      return;
    }

    setInternalStatus("Cerrada");
    setPublicStatus("Cerrada");
    addSessionEvent("Caso cerrado", "Caso cerrado de forma simulada en esta sesión.", "Cierre");
  }

  return (
    <section className="surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Acciones disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">Los botones se muestran según el rol simulado seleccionado.</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{role}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const allowed = canAccess(role, action.permission, item);
          return (
            <Button
              disabled={!allowed}
              key={action.label}
              onClick={() => runAction(action.label)}
              type="button"
              variant={action.label === "Cerrar caso" ? "danger" : "secondary"}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
      {canAccess(role, "generate:resolution", item) ? (
        <Button
          className="mt-3 w-full sm:w-auto"
          onClick={() => addSessionEvent("Propuesta generada", "Propuesta de resolución generada con contenido simulado.", "Resolución")}
          type="button"
        >
          <FileCog aria-hidden className="h-4 w-4" />
          Generar propuesta de resolución
        </Button>
      ) : null}
      {message ? <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">{message}</p> : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-line bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-ink">Estado simulado de sesión</h3>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="label">Estado interno</dt>
              <dd className="mt-1">
                <StatusBadge status={internalStatus} />
              </dd>
            </div>
            <div>
              <dt className="label">Estado público</dt>
              <dd className="mt-1">
                <StatusBadge status={publicStatus} />
              </dd>
            </div>
            <div>
              <dt className="label">Departamento</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{department}</dd>
            </div>
            <div>
              <dt className="label">Responsable</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{responsible}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <h3 className="text-sm font-semibold text-ink">Timeline de acciones de esta sesión</h3>
          <div className="mt-4">
            {events.length ? <Timeline events={events} /> : <p className="text-sm text-slate-500">Ejecuta una acción para ver el evento simulado.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
