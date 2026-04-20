export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "hsl(220 15% 6%)" }}>
      {children}
    </div>
  );
}
