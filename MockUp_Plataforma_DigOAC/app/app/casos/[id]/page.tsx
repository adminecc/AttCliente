import { notFound } from "next/navigation";
import { CaseActionPanel } from "@/components/internal/case-action-panel";
import { PlainBadge, SlaBadge, StatusBadge } from "@/components/ui/badges";
import { Timeline } from "@/components/ui/timeline";
import { cases, getCaseById } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/utils";

export function generateStaticParams() {
  return cases.map((item) => ({ id: item.id }));
}

export default async function InternalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getCaseById(decodeURIComponent(id));

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden">
        <div className="border-b border-line bg-slate-50 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-rail">Ficha interna completa</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{item.id}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.incident.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.internalStatus} />
            <SlaBadge risk={item.slaRisk} />
            <PlainBadge>{item.priority}</PlainBadge>
          </div>
        </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-5 py-3 text-sm font-semibold text-slate-600">
          {["Resumen", "Comunicación", "Evidencia", "Historial y auditoría"].map((tab, index) => (
            <span className={`whitespace-nowrap rounded-lg px-3 py-2 ${index === 0 ? "bg-teal-50 text-rail" : "hover:bg-slate-100"}`} key={tab}>
              {tab}
            </span>
          ))}
        </nav>
      </section>

      <CaseActionPanel item={item} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Resumen</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <dt className="label">Tipo</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.type}</dd>
              </div>
              <div>
                <dt className="label">Subtipo</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.subtype}</dd>
              </div>
              <div>
                <dt className="label">Canal</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.channel}</dd>
              </div>
              <div>
                <dt className="label">Alta</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{formatDateTime(item.createdAt)}</dd>
              </div>
              <div>
                <dt className="label">Última actualización</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{formatDateTime(item.updatedAt)}</dd>
              </div>
              <div>
                <dt className="label">Fecha límite</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{formatDate(item.dueAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Datos del solicitante</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="label">Nombre</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.claimant.name}</dd>
              </div>
              <div>
                <dt className="label">Documento</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.claimant.document}</dd>
              </div>
              <div>
                <dt className="label">Email</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.claimant.email}</dd>
              </div>
              <div>
                <dt className="label">Teléfono</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.claimant.phone}</dd>
              </div>
              <div>
                <dt className="label">Canal preferente</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.claimant.preferredChannel}</dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Datos del hecho</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="label">Fecha del hecho</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{formatDateTime(item.incident.date)}</dd>
              </div>
              <div>
                <dt className="label">Línea / estación / tren</dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {[item.incident.line, item.incident.station, item.incident.train].filter(Boolean).join(" · ") || "No aplica"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.incident.description}</p>
          </section>

          {item.sourceDetails ? (
            <section className="surface p-5">
              <h2 className="text-lg font-semibold text-ink">Datos del canal</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {item.sourceDetails.callSummary ? <p><strong>Resumen llamada:</strong> {item.sourceDetails.callSummary}</p> : null}
                {item.sourceDetails.callConsent !== undefined ? <p><strong>Consentimiento grabación:</strong> {item.sourceDetails.callConsent ? "Sí" : "No"}</p> : null}
                {item.sourceDetails.transcript ? <p className="rounded-lg bg-slate-50 p-3"><strong>Transcripción:</strong> {item.sourceDetails.transcript}</p> : null}
                {item.sourceDetails.physicalDocumentNumber ? <p><strong>Documento físico:</strong> {item.sourceDetails.physicalDocumentNumber}</p> : null}
                {item.sourceDetails.scanLabel ? <p className="rounded-lg bg-slate-50 p-3"><strong>Escaneo:</strong> {item.sourceDetails.scanLabel}</p> : null}
                {item.sourceDetails.emailOriginal ? <p className="rounded-lg bg-slate-50 p-3"><strong>Email original:</strong> {item.sourceDetails.emailOriginal}</p> : null}
                {item.sourceDetails.aiExtraction ? <p className="rounded-lg bg-teal-50 p-3 text-teal-900"><strong>Extracción IA simulada:</strong> {item.sourceDetails.aiExtraction}</p> : null}
              </div>
            </section>
          ) : null}

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Comentarios internos</h2>
            <div className="mt-4 space-y-3">
              {item.comments.length ? (
                item.comments.map((comment) => (
                  <article className="rounded-lg bg-slate-50 p-4" key={comment.id}>
                    <p className="text-sm font-semibold text-ink">
                      {comment.author} · {comment.role}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(comment.date)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{comment.body}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sin comentarios internos todavía.</p>
              )}
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Comunicaciones con usuario</h2>
            <div className="mt-4 space-y-3">
              {item.communications.length ? (
                item.communications.map((message) => (
                  <article className="rounded-lg bg-slate-50 p-4" key={message.id}>
                    <p className="text-sm font-semibold text-ink">{message.author}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(message.date)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{message.body}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sin comunicaciones públicas adicionales.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Clasificación</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="label">Estado interno</dt>
                <dd className="mt-1"><StatusBadge status={item.internalStatus} /></dd>
              </div>
              <div>
                <dt className="label">Estado público</dt>
                <dd className="mt-1"><StatusBadge status={item.publicStatus} /></dd>
              </div>
              <div>
                <dt className="label">SLA</dt>
                <dd className="mt-1"><SlaBadge risk={item.slaRisk} /></dd>
              </div>
              <div>
                <dt className="label">Departamento</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.department}</dd>
              </div>
              <div>
                <dt className="label">Responsable</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{item.responsible}</dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Adjuntos / evidencias</h2>
            <div className="mt-4 space-y-3">
              {item.attachments.length ? (
                item.attachments.map((attachment) => (
                  <div className="rounded-lg border border-line p-3" key={attachment.id}>
                    <p className="text-sm font-semibold text-ink">{attachment.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {attachment.kind} · {attachment.repository}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      {attachment.visibleToPublic ? "Visible en portal público" : "Solo interno"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sin adjuntos.</p>
              )}
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Resolución</h2>
            {item.resolution ? (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                <p>{item.resolution.text}</p>
                {item.resolution.notifiedAt ? <p className="mt-2 text-xs font-semibold">Notificada: {formatDateTime(item.resolution.notifiedAt)}</p> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No existe resolución todavía.</p>
            )}
          </section>

          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-ink">Timeline completo</h2>
            <div className="mt-5">
              <Timeline events={[...item.internalTimeline, ...item.publicTimeline].sort((a, b) => a.date.localeCompare(b.date))} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
