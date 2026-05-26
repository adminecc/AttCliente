import type { InternalStatus, PublicStatus, SlaRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Registrada: "bg-slate-100 text-slate-700",
  "Pendiente de validación": "bg-amber-100 text-amber-800",
  "En análisis": "bg-sky-100 text-sky-800",
  "Derivada a área responsable": "bg-cyan-100 text-cyan-800",
  "Pendiente de subsanación": "bg-orange-100 text-orange-800",
  "Propuesta de resolución": "bg-indigo-100 text-indigo-800",
  Notificada: "bg-emerald-100 text-emerald-800",
  Cerrada: "bg-slate-200 text-slate-700",
  Recibida: "bg-slate-100 text-slate-700",
  "En tramitación": "bg-sky-100 text-sky-800",
  "Pendiente de información": "bg-orange-100 text-orange-800",
  Resuelta: "bg-emerald-100 text-emerald-800"
};

const slaStyles: Record<SlaRisk, string> = {
  "En plazo": "bg-emerald-100 text-emerald-800",
  "Próximo a vencer": "bg-amber-100 text-amber-800",
  "Fuera de plazo": "bg-red-100 text-red-800",
  Cerrado: "bg-slate-200 text-slate-700"
};

export function StatusBadge({ status }: { status: InternalStatus | PublicStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>{status}</span>;
}

export function SlaBadge({ risk }: { risk: SlaRisk }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", slaStyles[risk])}>{risk}</span>;
}

export function PlainBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700", className)}>{children}</span>;
}
