import { TopBar } from "@/components/hospital/TopBar";
import AutoPO from "@/components/pharmacy/AutoPO";

export default function PurchaseOrdersPage() {
  return (
    <>
      <TopBar title="Purchase Orders" />
      <main className="flex-1 p-6 max-w-3xl">
        <AutoPO />
      </main>
    </>
  );
}
