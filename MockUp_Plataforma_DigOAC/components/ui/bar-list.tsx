export function BarList({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div className="grid grid-cols-[120px_1fr_32px] items-center gap-3 text-sm" key={item.name}>
          <span className="truncate font-medium text-slate-600">{item.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-rail" style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold text-ink">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
