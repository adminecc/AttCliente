import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "red" | "blue" | "slate";
};

const tones = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  slate: "bg-slate-100 text-slate-700"
};

export function MetricCard({ title, value, hint, icon: Icon, tone = "slate" }: MetricCardProps) {
  return (
    <section className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
        </div>
        <span className={cn("rounded-lg p-2.5", tones[tone])}>
          <Icon aria-hidden className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{hint}</p>
    </section>
  );
}
