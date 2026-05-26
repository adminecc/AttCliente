"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { roleDescription } from "@/lib/permissions";
import type { Role } from "@/lib/types";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  description: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("Administrador");

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      setRole(nextRole) {
        setRoleState(nextRole);
      },
      description: roleDescription(role)
    }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }

  return context;
}
