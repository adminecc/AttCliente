import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FilePlus2,
  FolderKanban,
  Gauge,
  History,
  Search,
  Settings,
  ShieldCheck
} from "lucide-react";
import { PlainBadge } from "@/components/ui/badges";
import { cases, dashboardMetrics } from "@/lib/data";

const primaryLinks = [
  {
    href: "/app",
    title: "Entrar al dashboard interno",
    description: "Panel operativo con KPIs, SLA, canales y últimos casos.",
    icon: Gauge,
    tone: "bg-[#082f49] text-white"
  },
  {
    href: "/app/casos",
    title: "Revisar bandeja de casos",
    description: "Filtros, tabla operacional, estados, responsables y acciones.",
    icon: FolderKanban,
    tone: "bg-rail text-white"
  },
  {
    href: "/app/casos/OAC-2026-000124",
    title: "Abrir ficha interna crítica",
    description: "Caso de accesibilidad con transcripción, SLA y derivación.",
    icon: ClipboardList,
    tone: "bg-amber-600 text-white"
  }
];

const secondaryLinks = [
  { href: "/app/casos/nuevo", label: "Alta manual", icon: FilePlus2 },
  { href: "/app/reporting", label: "Reporting", icon: BarChart3 },
  { href: "/app/auditoria", label: "Auditoría", icon: History },
  { href: "/app/configuracion", label: "Configuración", icon: Settings },
  { href: "/seguimiento/OAC-2026-000123", label: "Seguimiento público simulado", icon: Search }
];

export default function HomePage() {
  const metrics = dashboardMetrics();

  return (
    <main className="min-h-screen bg-mist">
      <section className="border-b border-line bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#082f49] text-sm font-bold text-white">OAC</span>
            <div>
              <p className="font-semibold text-ink">Plataforma OAC</p>
              <p className="text-sm text-slate-500">Centro interno de demo y navegación</p>
            </div>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-rail px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800" href="/app">
            Abrir aplicación interna
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="surface overflow-hidden">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="page-kicker">Demo interna</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Plataforma OAC para explicar el modelo operativo
              </h1>
              <p className="muted-copy mt-4 max-w-3xl">
                Esta pantalla no representa un portal final para clientes. Es un punto de entrada interno para recorrer
                los flujos de la demo: gestión de casos, SLA, auditoría, roles, reporting y seguimiento público simulado.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <PlainBadge className="bg-teal-50 text-rail">RBAC simulado</PlainBadge>
                <PlainBadge className="bg-sky-50 text-sky-800">Datos mock</PlainBadge>
                <PlainBadge className="bg-amber-50 text-amber-800">SLA visible</PlainBadge>
                <PlainBadge>SharePoint solo documental</PlainBadge>
              </div>
            </div>
            <aside className="rounded-lg bg-[#082f49] p-5 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-100">
                <ShieldCheck aria-hidden className="h-4 w-4" />
                Estado de la demo
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-300">Casos</dt>
                  <dd className="mt-1 text-3xl font-semibold">{cases.length}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-300">Abiertos</dt>
                  <dd className="mt-1 text-3xl font-semibold">{metrics.open}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-300">SLA riesgo</dt>
                  <dd className="mt-1 text-3xl font-semibold">{metrics.dueSoon}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-300">Fuera plazo</dt>
                  <dd className="mt-1 text-3xl font-semibold">{metrics.overdue}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {primaryLinks.map(({ description, href, icon: Icon, title, tone }) => (
            <Link className="surface group block p-5 transition hover:-translate-y-0.5 hover:shadow-lg" href={href} key={href}>
              <span className={`inline-flex rounded-lg p-3 ${tone}`}>
                <Icon aria-hidden className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
              <p className="muted-copy mt-2">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rail">
                Abrir
                <ArrowRight aria-hidden className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <section className="surface mt-6 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title">Accesos rápidos</h2>
              <p className="mt-1 text-sm text-slate-500">Pantallas útiles para enseñar el prototipo sin navegar de memoria.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {secondaryLinks.map(({ href, icon: Icon, label }) => (
              <Link className="focus-ring inline-flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" href={href} key={href}>
                <Icon aria-hidden className="h-4 w-4 text-rail" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
