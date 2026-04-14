import { TopBar } from "@/components/hospital/TopBar";
import AuditLedger from "@/components/compliance/AuditLedger";

export default function AuditPage() {
  return (
    <>
      <TopBar title="PHI Audit Ledger" />
      <main className="flex-1 p-6">
        <AuditLedger />
      </main>
    </>
  );
}
