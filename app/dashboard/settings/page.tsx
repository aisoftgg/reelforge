export default function SettingsPage() {
  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Settings</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Workspace configuration
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Plan management, API keys, and profile settings will be added as billing and generation
          features come online.
        </p>
      </div>
    </main>
  );
}
