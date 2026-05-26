"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { OacCase } from "@/lib/types";

export function CaseRowActions({ item }: { item: OacCase }) {
  return (
    <div className="flex items-center gap-1">
      <Link className="focus-ring rounded-lg p-2 text-slate-600 hover:bg-slate-100" href={`/app/casos/${item.id}`} title="Ver ficha">
        <Eye aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  );
}
