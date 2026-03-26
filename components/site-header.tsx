import Link from "next/link";

const navItems = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Login" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          ReelForge
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="rounded-full border border-blue-500/50 bg-blue-500 px-4 py-2 font-medium text-white shadow-glow hover:bg-blue-400"
          >
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
