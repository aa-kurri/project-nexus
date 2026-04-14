import { TopBar } from "@/components/hospital/TopBar";
import PatientTimeline from "@/components/emr/PatientTimeline";
import CopilotPanel from "@/components/ai/CopilotPanel";

interface Props {
  params: { id: string };
}

export default function PatientPage({ params }: Props) {
  return (
    <>
      <TopBar title={`Patient · ${params.id}`} />
      <main className="flex-1 grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_400px]">
        <PatientTimeline />
        <CopilotPanel />
      </main>
    </>
  );
}
