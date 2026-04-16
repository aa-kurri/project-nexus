import { TopBar } from "@/components/hospital/TopBar";
import NurseStation from "@/components/ipd/NurseStation";

export const metadata = { title: "Nurse Station — Ayura OS" };

export default function NurseStationPage() {
  return (
    <>
      <TopBar title="IPD Nurse Station" />
      <NurseStation />
    </>
  );
}
