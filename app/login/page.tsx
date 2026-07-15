"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, KeyRound, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Try one of the demo accounts.");
      setIsSubmitting(false);
      return;
    }

    router.replace(callbackUrl);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(135deg,_#020617,_#111827)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Enterprise Login
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white">
              Secure access to your KPI command center
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Monitor progress, approve updates, review performance, and manage delivery across your organization.
            </p>

            <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="font-medium text-white">Demo accounts</div>
              <div className="space-y-2">
                <div>Admin: admin@example.com / Password123</div>
                <div>Executive: executive@example.com / Password123</div>
                <div>Manager: manager@example.com / Password123</div>
                <div>Employee: employee@example.com / Password123</div>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none ring-0 transition focus:border-blue-500"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-sm text-slate-400">
              <span className="mr-2">Need a quick demo?</span>
              <button
                type="button"
                className="font-medium text-blue-400 transition hover:text-blue-300"
                onClick={() => {
                  setEmail("admin@example.com");
                  setPassword("Password123");
                }}
              >
                Fill demo credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(135deg,_#020617,_#111827)]">
        <div className="text-white">Loading...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
