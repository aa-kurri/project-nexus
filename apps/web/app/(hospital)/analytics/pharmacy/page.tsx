import { TopBar } from "@/components/hospital/TopBar";
import PharmacyDashboard from "@/components/analytics/PharmacyDashboard";

export default function PharmacyAnalyticsPage() {
  return (
    <>
      <TopBar title="Pharmacy & GST Analytics" />
      <main className="flex-1 p-6">
        <PharmacyDashboard />
      </main>
    </>
  );
}
