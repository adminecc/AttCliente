import { formatDateTime } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li className="relative pl-7" key={event.id}>
          <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-rail shadow ring-4 ring-teal-50" />
          <div className="absolute bottom-[-1.1rem] left-[5px] top-5 w-px bg-slate-200 last:hidden" />
          <p className="text-sm font-semibold text-ink">{event.title}</p>
          <p className="mt-1 text-sm text-slate-600">{event.description}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(event.date)} · {event.user}
          </p>
        </li>
      ))}
    </ol>
  );
}
