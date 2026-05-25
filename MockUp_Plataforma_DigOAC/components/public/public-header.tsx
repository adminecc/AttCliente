import Link from "next/link";
import { FileText, Search } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#082f49] text-sm font-bold text-white">OAC</span>
          <div>
            <p className="font-semibold text-ink">Plataforma OAC</p>
            <p className="text-xs text-slate-500">Atención a la Clientela</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link className="focus-ring hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:inline-flex" href="/nueva-reclamacion">
            <FileText aria-hidden className="mr-2 h-4 w-4" />
            Presentar
          </Link>
          <Link className="focus-ring inline-flex rounded-lg px-3 py-2 hover:bg-slate-100" href="/seguimiento">
            <Search aria-hidden className="mr-2 h-4 w-4" />
            Consultar
          </Link>
        </nav>
      </div>
    </header>
  );
}
