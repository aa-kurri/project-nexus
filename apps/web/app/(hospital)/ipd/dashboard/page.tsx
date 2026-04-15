import { TopBar } from "@/components/hospital/TopBar";
import IPDashboard from "@/components/ipd/IPDashboard";

export const metadata = { title: "IPD Dashboard — Ayura OS" };

export default function IpdDashboardPage() {
  return (
    <>
      <TopBar
        title="IP Admissions Dashboard"
        action={{ label: "New Admission", href: "/ipd/beds" }}
      />
      <IPDashboard />
    </>
  );
}
