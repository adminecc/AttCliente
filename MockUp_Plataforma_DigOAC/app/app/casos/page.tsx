import { CasesInbox } from "@/components/internal/cases-inbox";
import { cases, channels, caseTypes, departments, internalStatuses } from "@/lib/data";

export default function CasesInboxPage() {
  return <CasesInbox cases={cases} caseTypes={caseTypes} channels={channels} departments={departments} statuses={internalStatuses} />;
}
