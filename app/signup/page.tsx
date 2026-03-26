import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <AuthForm mode="signup" error={params.error} />
    </main>
  );
}
