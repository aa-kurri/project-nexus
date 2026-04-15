import { TopBar } from "@/components/hospital/TopBar";
import TeleConsult from "@/components/opd/TeleConsult";
import { startSession, endSession, savePrescription } from "./actions";

interface Props {
  params: { appointmentId: string };
}

export default function TeleConsultPage({ params }: Props) {
  return (
    <>
      <TopBar title="Tele-Consultation" />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TeleConsult
          appointmentId={params.appointmentId}
          onStartSession={startSession}
          onEndSession={endSession}
          onSavePrescription={savePrescription}
        />
      </main>
    </>
  );
}
