import { TopBar } from "@/components/hospital/TopBar";
import WhatsAppConcierge from "@/components/app/WhatsAppConcierge";

export default function ConciergePage() {
  return (
    <>
      <TopBar title="WhatsApp AI Concierge" />
      <main className="flex-1 p-6">
        <WhatsAppConcierge />
      </main>
    </>
  );
}
