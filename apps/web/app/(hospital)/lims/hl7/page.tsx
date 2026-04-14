import { TopBar } from "@/components/hospital/TopBar";
import HL7Analyzer from "@/components/lims/HL7Analyzer";

export default function Hl7Page() {
  return (
    <>
      <TopBar title="HL7 Analyzer Feed" />
      <main className="flex-1 p-6">
        <HL7Analyzer />
      </main>
    </>
  );
}
