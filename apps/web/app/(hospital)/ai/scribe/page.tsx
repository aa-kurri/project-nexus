import { TopBar } from "@/components/hospital/TopBar";
import ClinicalScribe from "@/components/ai/ClinicalScribe";

export default function AiScribePage() {
  return (
    <>
      <TopBar title="Ambient Clinical Scribe" />
      <main className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-2xl">
          <ClinicalScribe />
        </div>
      </main>
    </>
  );
}
