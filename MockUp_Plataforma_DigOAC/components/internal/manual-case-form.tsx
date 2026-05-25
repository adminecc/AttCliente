"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, FilePlus2, Phone, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { caseTypes, channels } from "@/lib/data";
import type { Channel } from "@/lib/types";

export function ManualCaseForm() {
  const [channel, setChannel] = useState<Channel>("Papel");
  const [created, setCreated] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  if (created) {
    return (
      <section className="surface p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 aria-hidden className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Alta manual completada</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">OAC-2026-000128</h1>
            <p className="mt-2 text-sm text-slate-600">
              Caso creado desde canal {channel}. Se ha generado acuse interno y justificante simulado.
            </p>
            <Link className="focus-ring mt-5 inline-flex rounded-lg bg-rail px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800" href="/app/casos/OAC-2026-000128">
              Abrir ficha interna
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      className="surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setCreated(true);
      }}
    >
      <div>
        <p className="text-sm font-semibold text-rail">Alta asistida OAC</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Nuevo caso interno</h1>
        <p className="mt-1 text-sm text-slate-500">
          Permite registrar entradas manuales y simular ayudas de extracción, transcripción y digitalización.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label>
          <span className="label">Canal de entrada</span>
          <select className="field mt-1" onChange={(event) => setChannel(event.target.value as Channel)} value={channel}>
            {channels
              .filter((item) => item !== "Web")
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
        </label>
        <label>
          <span className="label">Tipo</span>
          <select className="field mt-1">
            {caseTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Subtipo</span>
          <input className="field mt-1" defaultValue="Servicio prestado" />
        </label>
        <label>
          <span className="label">Prioridad</span>
          <select className="field mt-1">
            <option>Media</option>
            <option>Alta</option>
            <option>Crítica</option>
            <option>Baja</option>
          </select>
        </label>
        <label>
          <span className="label">Nombre del solicitante</span>
          <input className="field mt-1" defaultValue="Cliente de ejemplo" />
        </label>
        <label>
          <span className="label">Email o teléfono</span>
          <input className="field mt-1" defaultValue="cliente@example.com" />
        </label>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-slate-50 p-5">
        {channel === "Teléfono" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Phone aria-hidden className="h-4 w-4 text-rail" />
              Datos de llamada
            </div>
            <label className="block">
              <span className="label">Resumen de llamada</span>
              <textarea className="field mt-1 min-h-24" defaultValue="Persona usuaria comunica incidencia durante el servicio y solicita información de seguimiento." />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input defaultChecked type="checkbox" />
              Consentimiento de grabación registrado
            </label>
            <label className="block">
              <span className="label">Transcripción simulada opcional</span>
              <textarea className="field mt-1 min-h-24" defaultValue="Operador: ¿Puede indicarme estación y hora? Usuario: Ayer por la tarde en la estación central..." />
            </label>
          </div>
        ) : null}

        {channel === "Papel" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <ScanLine aria-hidden className="h-4 w-4 text-rail" />
              Digitalización de documento físico
            </div>
            <label className="block">
              <span className="label">Número de documento físico</span>
              <input className="field mt-1" defaultValue="PAP-2026-00451" />
            </label>
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Escaneo simulado: reclamacion-firmada-00451.pdf
            </div>
          </div>
        ) : null}

        {channel === "Email" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Bot aria-hidden className="h-4 w-4 text-rail" />
              Importación desde email
            </div>
            <label className="block">
              <span className="label">Email original</span>
              <textarea className="field mt-1 min-h-28" defaultValue="Buenos días, escribo porque necesito saber cómo reclamar un retraso y qué documentación debo aportar." />
            </label>
            <Button onClick={() => setAiSuggested(true)} type="button" variant="secondary">
              <Bot aria-hidden className="h-4 w-4" />
              Sugerir campos
            </Button>
            {aiSuggested ? (
              <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
                Extracción IA simulada: Tipo Reclamación, subtipo Servicio prestado, faltan línea y hora exacta.
              </p>
            ) : null}
          </div>
        ) : null}

        {channel === "Tablet OAC" || channel === "WhatsApp" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <FilePlus2 aria-hidden className="h-4 w-4 text-rail" />
              Entrada estructurada
            </div>
            <label className="block">
              <span className="label">{channel === "WhatsApp" ? "Resumen del hilo" : "Resumen de atención presencial"}</span>
              <textarea className="field mt-1 min-h-24" defaultValue="Entrada capturada en canal asistido con datos mínimos validados por operador." />
            </label>
          </div>
        ) : null}
      </div>

      <label className="mt-6 block">
        <span className="label">Descripción</span>
        <textarea className="field mt-1 min-h-32" defaultValue="Descripción del caso registrada por operador OAC." />
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit">
          <FilePlus2 aria-hidden className="h-4 w-4" />
          Crear caso y generar ID
        </Button>
        <p className="text-sm text-slate-500">La acción respeta permisos en la navegación mediante RBAC simulado.</p>
      </div>
    </form>
  );
}
