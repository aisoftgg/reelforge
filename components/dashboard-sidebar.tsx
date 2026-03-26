import Link from "next/link";
import { logout } from "@/lib/auth/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/new-video", label: "New Video" },
  { href: "/dashboard/library", label: "Library" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function DashboardSidebar() {
  return (
    <aside className="flex w-full max-w-xs flex-col border-r border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-blue-400">ReelForge</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Video Command Center</h2>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="mt-auto pt-8">
        <button
          type="submit"
          className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
        >
          Sign Out
        </button>
      </form>
    </aside>
  );
}
