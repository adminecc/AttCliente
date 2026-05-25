import Link from "next/link";
import { AlertTriangle, CheckSquare, Clock, FolderOpen, ShieldCheck, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { PlainBadge, StatusBadge, SlaBadge } from "@/components/ui/badges";
import { BarList } from "@/components/ui/bar-list";
import { cases, dashboardMetrics } from "@/lib/data";
import { daysUntil, formatDate } from "@/lib/utils";

export default function InternalDashboardPage() {
  const metrics = dashboardMetrics();
  const latestCases = [...cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const slaAlerts = cases.filter((item) => item.slaRisk === "Próximo a vencer" || item.slaRisk === "Fuera de plazo");
  const byDepartment = Array.from(new Set(cases.map((item) => item.department))).map((department) => ({
    name: department,
    value: cases.filter((item) => item.department === department).length
  }));

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden">
        <div className="grid gap-5 p-5 xl:grid-cols-[1fr_320px]">
          <div>
            <p className="page-kicker">Resumen general</p>
            <h1 className="page-title mt-1">Panel operativo OAC</h1>
            <p className="muted-copy mt-2 max-w-3xl">
              Vista de control para explicar volumen, trazabilidad, plazos y canales de entrada en una sola plataforma.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PlainBadge className="bg-teal-50 text-rail">Multicanal</PlainBadge>
              <PlainBadge className="bg-sky-50 text-sky-800">Portal externo</PlainBadge>
              <PlainBadge className="bg-amber-50 text-amber-800">SLA activo</PlainBadge>
              <PlainBadge className="bg-slate-100 text-slate-700">Auditoría completa</PlainBadge>
            </div>
          </div>
          <div className="rounded-lg bg-[#082f49] p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-100">
              <ShieldCheck aria-hidden className="h-4 w-4" />
              Salud del servicio
            </div>
            <p className="mt-3 text-3xl font-semibold">92%</p>
            <p className="mt-1 text-sm text-slate-300">SLA cumplidos este mes</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <TrendingUp aria-hidden className="h-4 w-4" />
              +4% frente al mes anterior
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard hint="Casos no cerrados en la bandeja global" icon={FolderOpen} title="Casos abiertos" tone="blue" value={metrics.open} />
        <MetricCard hint="Necesitan revisión de datos mínimos" icon={CheckSquare} title="Pendientes de validación" tone="slate" value={metrics.pendingValidation} />
        <MetricCard hint="Vencimiento dentro del umbral configurado" icon={Clock} title="Próximos a vencer" tone="amber" value={metrics.dueSoon} />
        <MetricCard hint="Fuera de plazo objetivo" icon={AlertTriangle} title="Fuera de plazo" tone="red" value={metrics.overdue} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Casos por canal</h2>
            <span className="text-xs font-semibold text-slate-500">Mock</span>
          </div>
          <div className="mt-5">
            <BarList data={metrics.byChannel} />
          </div>
        </section>
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Casos por tipo</h2>
            <span className="text-xs font-semibold text-slate-500">Mock</span>
          </div>
          <div className="mt-5">
            <BarList data={metrics.byType} />
          </div>
        </section>
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Asignación por área</h2>
            <span className="text-xs font-semibold text-slate-500">Mock</span>
          </div>
          <div className="mt-5">
            <BarList data={byDepartment} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-5">
            <h2 className="text-lg font-semibold text-ink">Últimos casos</h2>
            <Link className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-rail hover:bg-teal-50" href="/app/casos">
              Ver bandeja
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Límite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {latestCases.map((item) => (
                  <tr className="hover:bg-slate-50" key={item.id}>
                    <td className="px-4 py-3 font-semibold text-rail">
                      <Link href={`/app/casos/${item.id}`}>{item.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.type}</td>
                    <td className="px-4 py-3 text-slate-700">{item.claimant.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.internalStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(item.dueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">Alertas de SLA</h2>
          <div className="mt-4 space-y-3">
            {slaAlerts.map((item) => (
              <Link className="block rounded-lg border border-line p-3 hover:bg-slate-50" href={`/app/casos/${item.id}`} key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{item.id}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.subtype}</p>
                  </div>
                  <SlaBadge risk={item.slaRisk} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">Vence en {daysUntil(item.dueAt)} días</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
