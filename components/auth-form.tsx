import Link from "next/link";
import { login, signup } from "@/lib/auth/actions";

type AuthMode = "login" | "signup";

const config = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to manage projects, scripts, and rendered videos.",
    submitLabel: "Log In",
    alternateHref: "/signup",
    alternateLabel: "Create an account",
    action: login
  },
  signup: {
    title: "Create your account",
    subtitle: "Start generating faceless product videos in minutes.",
    submitLabel: "Create Account",
    alternateHref: "/login",
    alternateLabel: "Already have an account?",
    action: signup
  }
} as const;

export function AuthForm({ mode, error }: { mode: AuthMode; error?: string }) {
  const view = config[mode];

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{view.title}</h1>
        <p className="text-sm text-zinc-400">{view.subtitle}</p>
      </div>
      <form action={view.action} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-zinc-500 focus:border-blue-500"
            placeholder="founder@example.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-zinc-500 focus:border-blue-500"
            placeholder="At least 8 characters"
          />
        </label>
        {error ? (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-blue-400"
        >
          {view.submitLabel}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-400">
        <Link href={view.alternateHref} className="text-blue-400 hover:text-blue-300">
          {view.alternateLabel}
        </Link>
      </p>
    </div>
  );
}
