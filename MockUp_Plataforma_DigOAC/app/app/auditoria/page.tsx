import { AuditLog } from "@/components/internal/audit-log";
import { auditEvents, users } from "@/lib/data";

export default function AuditPage() {
  return <AuditLog events={auditEvents} users={users} />;
}
