const projectCards = [
  {
    label: "Projects",
    value: "0",
    detail: "Start by creating your first product video brief."
  },
  {
    label: "Scripts Ready",
    value: "0",
    detail: "Generated scripts will appear here for review."
  },
  {
    label: "Videos Rendered",
    value: "0",
    detail: "Completed exports will show up in your library."
  }
];

export default function DashboardPage() {
  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Dashboard</p>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Build faceless product videos that convert
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              This foundation includes authentication, navigation, and the shell for your
              generation workflow. Next phases will attach script generation and rendering jobs.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {projectCards.map((card) => (
            <section
              key={card.label}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6"
            >
              <p className="text-sm text-zinc-400">{card.label}</p>
              <p className="mt-4 text-4xl font-semibold text-white">{card.value}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-500">{card.detail}</p>
            </section>
          ))}
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Next Up</h2>
            <div className="mt-5 grid gap-4">
              {[
                "Paste a product URL or description",
                "Set a target audience and script style",
                "Review AI hooks and choose a voice",
                "Render and download your MP4"
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
                    {index + 1}
                  </div>
                  <p className="text-sm text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Billing</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Stripe is scaffolded as a placeholder so plan upgrades can be wired in without
              reshaping the app shell.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 p-5 text-sm text-blue-200">
              Checkout session endpoint ready for Stripe keys.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
