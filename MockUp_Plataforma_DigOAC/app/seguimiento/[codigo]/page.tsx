import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ClipboardCheck, Clock3, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { StatusBadge, PlainBadge } from "@/components/ui/badges";
import { Timeline } from "@/components/ui/timeline";
import { cases, getCaseById } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/utils";

export function generateStaticParams() {
  return cases.map((item) => ({ codigo: item.id }));
}

export default async function PublicCasePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const item = getCaseById(decodeURIComponent(codigo));

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-mist">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section className="surface overflow-hidden">
          <div className="border-b border-line bg-slate-50 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-rail">Seguimiento del caso</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{item.id}</h1>
              </div>
              <StatusBadge status={item.publicStatus} />
            </div>
          </div>

          <div className="p-6">
          <dl className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-line bg-white p-4">
              <dt className="label">Fecha de alta</dt>
              <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays aria-hidden className="h-4 w-4 text-rail" />
                {formatDate(item.createdAt)}
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <dt className="label">Última actualización</dt>
              <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock3 aria-hidden className="h-4 w-4 text-rail" />
                {formatDateTime(item.updatedAt)}
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <dt className="label">Canal de entrada</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">{item.channel}</dd>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <dt className="label">Tipo</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">
                {item.type} · {item.subtype}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px]">
            <div className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Línea de tiempo</h2>
              <div className="mt-5">
                <Timeline events={item.publicTimeline} />
              </div>
            </div>
            <div className="rounded-lg border border-line bg-slate-50 p-5">
              <ClipboardCheck aria-hidden className="h-6 w-6 text-rail" />
              <h2 className="mt-4 text-lg font-semibold text-ink">Próximo paso</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.nextStep}</p>
            </div>
          </div>

          {item.resolution ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h2 className="text-lg font-semibold text-emerald-900">Resolución</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{item.resolution.text}</p>
            </div>
          ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="surface p-5">
            <ShieldCheck aria-hidden className="h-6 w-6 text-rail" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Vista protegida</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No se muestran notas internas, responsables, departamentos, adjuntos no públicos ni auditoría completa.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PlainBadge>Datos públicos</PlainBadge>
              <PlainBadge>Sin auditoría interna</PlainBadge>
              <PlainBadge>Sin responsable</PlainBadge>
            </div>
          </section>
          <section className="surface p-5">
            <Mail aria-hidden className="h-6 w-6 text-rail" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Comunicaciones visibles</h2>
            <div className="mt-3 space-y-3">
              {item.communications.filter((message) => message.public).length ? (
                item.communications
                  .filter((message) => message.public)
                  .map((message) => (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600" key={message.id}>
                      {message.body}
                    </p>
                  ))
              ) : (
                <p className="text-sm text-slate-500">Todavía no hay comunicaciones públicas adicionales.</p>
              )}
            </div>
          </section>
          <Link className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink shadow-soft hover:bg-slate-50" href="/seguimiento">
            <LockKeyhole aria-hidden className="h-4 w-4" />
            Consultar otro caso
          </Link>
        </aside>
      </main>
    </div>
  );
}
