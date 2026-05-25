import { Activity, Clock3, Gauge, Percent } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { ReportingCharts } from "@/components/internal/reporting-charts";

export default function ReportingPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <p className="text-sm font-semibold text-rail">Reporting</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Métricas simuladas</h1>
        <p className="mt-1 text-sm text-slate-500">Base para evolucionar hacia Power BI o cuadros operativos conectados a base relacional.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard hint="Promedio simulado de casos resueltos" icon={Clock3} title="Tiempo medio" tone="blue" value="8,4 días" />
        <MetricCard hint="Dentro del plazo objetivo" icon={Percent} title="SLA cumplidos" tone="teal" value="91%" />
        <MetricCard hint="Fuera de plazo o en riesgo alto" icon={Gauge} title="SLA incumplidos" tone="amber" value="9%" />
        <MetricCard hint="Volumen mensual de entrada" icon={Activity} title="Casos mayo" tone="slate" value="63" />
      </div>
      <ReportingCharts />
    </div>
  );
}
