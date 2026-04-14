import { Sidebar } from "@/components/hospital/Sidebar";

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-60">
        {children}
      </div>
    </div>
  );
}
