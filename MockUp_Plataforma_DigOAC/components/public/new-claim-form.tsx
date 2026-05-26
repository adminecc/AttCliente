"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Download, FileCheck2, Paperclip, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { caseTypes } from "@/lib/data";

const subtypes = [
  "Servicio prestado",
  "Accesibilidad",
  "Título de transporte",
  "Información en estación",
  "Atención recibida",
  "Objeto perdido",
  "Otros"
];

const steps = ["Datos", "Detalle", "Adjuntos", "Confirmación"];

export function NewClaimForm() {
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState("Reclamación");
  const generatedId = useMemo(() => "OAC-2026-000127", []);

  if (submitted) {
    return (
      <section className="surface overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold text-emerald-700">Solicitud registrada</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{generatedId}</h1>
        </div>
        <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 aria-hidden className="h-7 w-7" />
          </span>
          <div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Hemos generado el justificante de presentación y enviado un acuse de recibo simulado al email indicado.
              Este prototipo no guarda datos reales ni envía comunicaciones externas.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-line bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <FileCheck2 aria-hidden className="h-5 w-5 text-rail" />
            <h2 className="text-lg font-semibold text-ink">Justificante simulado</h2>
          </div>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Código de seguimiento</dt>
              <dd className="mt-1 text-ink">{generatedId}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Fecha de presentación</dt>
              <dd className="mt-1 text-ink">06/05/2026 09:00</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Canal</dt>
              <dd className="mt-1 text-ink">Web</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Estado público inicial</dt>
              <dd className="mt-1 text-ink">Recibida</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-rail px-4 py-2 text-sm font-semibold text-white" href={`/seguimiento/${generatedId}`}>
            Consultar seguimiento
          </Link>
          <Button onClick={() => window.print()} type="button" variant="secondary">
            <Download aria-hidden className="h-4 w-4" />
            Imprimir justificante
          </Button>
        </div>
        </div>
      </section>
    );
  }

  return (
    <form
      className="surface overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="border-b border-line bg-slate-50 px-6 py-5">
        <p className="text-sm font-semibold text-rail">Formulario externo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Presentar solicitud</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Campos de ejemplo para digitalizar entradas bien tipadas desde el portal público.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600" key={step}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${index === 0 ? "bg-rail text-white" : "bg-white text-slate-500 ring-1 ring-line"}`}>
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-6">
      <fieldset>
        <legend className="label">Tipo de solicitud</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {caseTypes.map((item) => (
            <button
              className={`focus-ring rounded-lg border px-3 py-2 text-sm font-semibold transition ${type === item ? "border-rail bg-teal-50 text-rail" : "border-line bg-white text-slate-700 hover:bg-slate-50"}`}
              key={item}
              onClick={() => setType(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="hidden">
          <span className="label">Tipo de solicitud</span>
          <select className="field mt-1" onChange={(event) => setType(event.target.value)} value={type}>
            {caseTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Subtipo</span>
          <select className="field mt-1">
            {subtypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Nombre y apellidos</span>
          <input className="field mt-1" defaultValue="Laura Gómez Ruiz" required />
        </label>
        <label>
          <span className="label">Documento identificativo</span>
          <input className="field mt-1" defaultValue="12345678L" required />
        </label>
        <label>
          <span className="label">Email</span>
          <input className="field mt-1" defaultValue="laura.gomez@example.com" required type="email" />
        </label>
        <label>
          <span className="label">Teléfono</span>
          <input className="field mt-1" defaultValue="612 458 903" />
        </label>
        <label>
          <span className="label">Canal preferente de comunicación</span>
          <select className="field mt-1">
            <option>Email</option>
            <option>Teléfono</option>
            <option>Correo postal</option>
          </select>
        </label>
        <label>
          <span className="label">Fecha del hecho</span>
          <span className="relative mt-1 block">
            <CalendarDays aria-hidden className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field pr-10" defaultValue="2026-04-29" type="date" />
          </span>
        </label>
        <label>
          <span className="label">Línea</span>
          <input className="field mt-1" defaultValue="Línea C-3" />
        </label>
        <label>
          <span className="label">Estación / tren si aplica</span>
          <input className="field mt-1" defaultValue="Estación Central · TR-1842" />
        </label>
      </div>

      <label className="mt-5 block">
        <span className="label">Descripción</span>
        <textarea
          className="field mt-1 min-h-36"
          defaultValue="Retraso prolongado en servicio y falta de información en estación."
          required
        />
      </label>

      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <Paperclip aria-hidden className="h-4 w-4" />
          Adjuntos simulados
        </div>
        <p className="mt-2 text-sm text-slate-500">captura-panel-estacion.jpg · justificante-billete.pdf</p>
      </div>

        <label className="mt-5 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <input className="mt-1" defaultChecked required type="checkbox" />
        <span>
          Acepto el tratamiento de datos personales para la tramitación de esta solicitud.
          <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-rail">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
            Política de privacidad aplicada en demo
          </span>
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit">Enviar y generar justificante</Button>
        <p className="text-sm text-slate-500">Se generará un código único y un acuse de recibo simulado.</p>
      </div>
      </div>
    </form>
  );
}
