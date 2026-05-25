"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  FolderKanban,
  Gauge,
  History,
  Settings,
  ShieldCheck
} from "lucide-react";
import { roles } from "@/lib/data";
import { canAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { RoleProvider, useRole } from "./role-context";

const navItems = [
  { href: "/app", label: "Inicio", icon: Gauge, action: "view:all-cases" as const },
  { href: "/app/casos", label: "Bandeja de casos", icon: FolderKanban, action: "view:all-cases" as const },
  { href: "/app/casos/nuevo", label: "Alta manual", icon: FilePlus2, action: "create:case" as const },
  { href: "/app/tareas", label: "Tareas", icon: ClipboardList, action: "view:department-cases" as const },
  { href: "/app/reporting", label: "Reporting", icon: BarChart3, action: "view:metrics" as const },
  { href: "/app/auditoria", label: "Auditoría", icon: History, action: "view:audit" as const },
  { href: "/app/configuracion", label: "Configuración", icon: Settings, action: "view:config" as const }
];

function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  return (
    <aside className="relative hidden w-72 bg-[#082f49] text-white lg:block">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#082f49]">OAC</span>
        <div>
          <p className="font-semibold text-white">Plataforma OAC</p>
          <p className="text-xs text-slate-300">Oficina de Atención a la Clientela</p>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {navItems
          .filter((item) => canAccess(role, item.action))
          .map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href === "/app/casos" && pathname.startsWith("/app/casos/") && pathname !== "/app/casos/nuevo");
            return (
              <Link
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-white text-[#082f49]" : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="absolute bottom-4 hidden w-72 px-4 lg:block">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <p className="font-semibold text-white">Demo operacional</p>
          <p className="mt-1">RBAC, SLA y auditoría simulados sobre datos mock.</p>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const { role, setRole, description } = useRole();

  return (
    <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-rail">Demo navegable</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Oficina de Atención a la Clientela</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="label" htmlFor="role-select">
            Rol simulado
          </label>
          <select
            className="field min-w-64"
            id="role-select"
            onChange={(event) => setRole(event.target.value as typeof role)}
            value={role}
          >
            {roles
              .filter((item) => item !== "Usuario externo")
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            <ShieldCheck aria-hidden className="h-4 w-4" />
            RBAC simulado
          </span>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { role } = useRole();

  return (
    <nav className="border-b border-line bg-white p-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {navItems
          .filter((item) => canAccess(role, item.action))
          .map((item) => (
            <Link
              className="focus-ring whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
      </div>
    </nav>
  );
}

export function InternalShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-mist lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          <MobileNav />
          <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
