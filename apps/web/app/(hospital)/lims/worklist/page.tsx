import { TopBar } from "@/components/hospital/TopBar";
import BarcodeTracker from "@/components/lims/BarcodeTracker";
import AnomalyFlags from "@/components/lims/AnomalyFlags";
import ReportDispatch from "@/components/lims/ReportDispatch";

export default function LimsWorklistPage() {
  return (
    <>
      <TopBar title="LIMS Worklist" action={{ label: "HL7 Feed", href: "/lims/hl7" }} />
      <main className="flex-1 grid grid-cols-1 gap-6 p-6 xl:grid-cols-2">
        <div className="space-y-6">
          <BarcodeTracker />
          <AnomalyFlags />
        </div>
        <ReportDispatch />
      </main>
    </>
  );
}
