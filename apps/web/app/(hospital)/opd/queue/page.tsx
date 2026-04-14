import { TopBar } from "@/components/hospital/TopBar";
import LiveQueueBoard from "@/components/opd/LiveQueueBoard";

export default function OpdQueuePage() {
  return (
    <>
      <TopBar
        title="OPD Queue"
        action={{ label: "New Patient", href: "/opd/new-patient" }}
      />
      <main className="flex-1 p-0">
        <LiveQueueBoard />
      </main>
    </>
  );
}
