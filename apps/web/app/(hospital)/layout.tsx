import { Sidebar } from "@/components/hospital/Sidebar";
import RegionalAssistant from "@/components/ai/RegionalAssistant";

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-0 md:pl-60 w-full overflow-x-hidden">
        {children}
      </div>
      <RegionalAssistant />
    </div>
  );
}
