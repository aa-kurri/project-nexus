import { TopBar } from "@/components/hospital/TopBar";
import BlindStockSync from "@/components/pharmacy/BlindStockSync";

export default function PharmacyStockPage() {
  return (
    <>
      <TopBar title="Pharmacy — Stock Reconciliation" />
      <main className="flex-1 p-6">
        <BlindStockSync />
      </main>
    </>
  );
}
