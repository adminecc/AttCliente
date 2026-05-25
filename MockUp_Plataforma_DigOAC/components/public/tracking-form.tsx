"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackingForm() {
  const router = useRouter();
  const [code, setCode] = useState("OAC-2026-000123");

  return (
    <form
      className="surface overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/seguimiento/${encodeURIComponent(code.trim())}`);
      }}
    >
      <div className="border-b border-line bg-slate-50 px-6 py-5">
        <p className="text-sm font-semibold text-rail">Seguimiento externo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Consultar estado</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Introduce el código de caso y el email o documento asociado. La vista pública oculta datos internos.
        </p>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px]">
        <div>
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="label">Código de caso</span>
          <input className="field mt-1" onChange={(event) => setCode(event.target.value)} required value={code} />
        </label>
        <label>
          <span className="label">Email o documento</span>
          <input className="field mt-1" defaultValue="laura.gomez@example.com" required />
        </label>
      </div>
      <Button className="mt-6" type="submit">
        <Search aria-hidden className="h-4 w-4" />
        Consultar
      </Button>
        </div>
        <aside className="rounded-lg border border-line bg-white p-4">
          <FileSearch aria-hidden className="h-6 w-6 text-rail" />
          <h2 className="mt-3 text-sm font-semibold text-ink">Códigos de demo</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <button className="block rounded-lg bg-slate-50 px-3 py-2 text-left font-semibold text-rail hover:bg-teal-50" onClick={() => setCode("OAC-2026-000123")} type="button">
              OAC-2026-000123
            </button>
            <button className="block rounded-lg bg-slate-50 px-3 py-2 text-left font-semibold text-rail hover:bg-teal-50" onClick={() => setCode("OAC-2026-000127")} type="button">
              OAC-2026-000127
            </button>
          </div>
          <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rail" />
            No se muestran notas internas, responsables ni auditoría completa.
          </p>
        </aside>
      </div>
    </form>
  );
}
