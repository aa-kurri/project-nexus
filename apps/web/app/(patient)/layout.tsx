import Link from "next/link";
import { FileText, FlaskConical, Pill, LogOut } from "lucide-react";

const NAV = [
  { href: "/patient/records",       label: "Records",       Icon: FileText    },
  { href: "/patient/prescriptions", label: "Prescriptions", Icon: Pill        },
  { href: "/patient/labs",          label: "Lab Reports",   Icon: FlaskConical },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "hsl(220,15%,6%)" }}>
      {/* Top nav */}
      <header style={{ background: "#0F766E" }} className="sticky top-0 z-20">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <span className="text-lg font-bold text-white tracking-tight">Ayura Patient Portal</span>
          <nav className="flex gap-1">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold
                           text-teal-100 transition hover:bg-white/20"
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/auth/logout"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold
                       text-teal-100 hover:bg-white/20 transition"
          >
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
