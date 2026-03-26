export default function LibraryPage() {
  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Library</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Rendered videos</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Completed exports, thumbnails, and download actions will live here once rendering is
          connected.
        </p>
      </div>
    </main>
  );
}
