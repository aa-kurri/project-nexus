import { TopBar } from "@/components/hospital/TopBar";
import StockTransfer from "@/components/pharmacy/StockTransfer";

export default function TransfersPage() {
  return (
    <>
      <TopBar title="Stock Transfers" action={{ label: "New Indent", href: "/pharmacy/transfers" }} />
      <main className="flex-1 p-6 max-w-3xl">
        <StockTransfer />
      </main>
    </>
  );
}
