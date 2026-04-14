import { TopBar } from "@/components/hospital/TopBar";
import ChargeAggregator from "@/components/billing/ChargeAggregator";

interface Props { params: { encounterId: string } }

export default function BillingPage({ params }: Props) {
  return (
    <>
      <TopBar title={`Bill — Encounter ${params.encounterId}`} action={{ label: "Draft Claim", href: "/billing/claims" }} />
      <main className="flex-1 p-6">
        <ChargeAggregator encounterId={params.encounterId} />
      </main>
    </>
  );
}
