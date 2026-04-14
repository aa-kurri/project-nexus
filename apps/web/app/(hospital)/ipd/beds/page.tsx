import { TopBar } from "@/components/hospital/TopBar";
import BedBoard from "@/components/ipd/BedBoard";

export default function IpdBedsPage() {
  return (
    <>
      <TopBar title="IPD Bed Board" />
      <main className="flex-1 p-6">
        <BedBoard />
      </main>
    </>
  );
}
