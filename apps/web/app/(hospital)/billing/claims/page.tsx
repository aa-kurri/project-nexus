import { TopBar } from "@/components/hospital/TopBar";
import AgenticClaimDrafter from "@/components/billing/AgenticClaimDrafter";

export default function ClaimsPage() {
  return (
    <>
      <TopBar title="Agentic Claim Drafter" />
      <main className="flex-1 p-6">
        <AgenticClaimDrafter />
      </main>
    </>
  );
}
