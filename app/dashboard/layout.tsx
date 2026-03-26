import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 md:flex">
      <DashboardSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
