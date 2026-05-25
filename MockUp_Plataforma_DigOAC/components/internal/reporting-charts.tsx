"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardMetrics, monthlyEvolution, topReasons } from "@/lib/data";

const colors = ["#0f766e", "#0369a1", "#b45309", "#475569", "#be123c", "#4d7c0f"];

export function ReportingCharts() {
  const metrics = dashboardMetrics();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="surface p-5">
        <h2 className="text-lg font-semibold text-ink">Casos por canal</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={metrics.byChannel}>
              <CartesianGrid stroke="#d8e1e6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {metrics.byChannel.map((_, index) => (
                  <Cell fill={colors[index % colors.length]} key={index} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold text-ink">Casos por tipo</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie data={metrics.byType} dataKey="value" innerRadius={58} nameKey="name" outerRadius={92} paddingAngle={3}>
                {metrics.byType.map((_, index) => (
                  <Cell fill={colors[index % colors.length]} key={index} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold text-ink">Evolución mensual</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={monthlyEvolution}>
              <CartesianGrid stroke="#d8e1e6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line dataKey="casos" stroke="#0f766e" strokeWidth={3} type="monotone" />
              <Line dataKey="resueltos" stroke="#0369a1" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold text-ink">Top motivos</h2>
        <div className="mt-5 space-y-3">
          {topReasons.map((item, index) => (
            <div className="grid grid-cols-[1fr_48px] items-center gap-4" key={item.name}>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length], width: `${item.value * 2}%` }} />
                </div>
              </div>
              <span className="text-right text-sm font-semibold text-ink">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
