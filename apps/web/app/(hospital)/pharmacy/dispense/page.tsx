import { TopBar } from "@/components/hospital/TopBar";
import BarcodeDispense from "@/components/pharmacy/BarcodeDispense";

export default function DispensePage() {
  return (
    <>
      <TopBar title="Barcode Dispense" />
      <main className="flex-1 p-6">
        <BarcodeDispense />
      </main>
    </>
  );
}
