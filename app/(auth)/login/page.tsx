"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Prevent static prerender; this page depends on client-only hooks
export const dynamic = "force-dynamic";

const FALLBACK_REDIRECT = "/news";

function sanitizeRedirectTarget(raw: string | null): string {
  if (!raw) return FALLBACK_REDIRECT;
  if (!raw.startsWith("/")) return FALLBACK_REDIRECT;
  if (raw.startsWith("//")) return FALLBACK_REDIRECT;
  return raw;
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const target = searchParams?.get("returnUrl") ?? searchParams?.get("redirectedFrom");
    return sanitizeRedirectTarget(target);
  }, [searchParams]);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(redirectTo);
      }
    };
    checkUser();
  }, [router, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setClientError(null);

    // Client-side validation
    if (!email.trim()) {
      setClientError("Email is required.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setClientError("Password is required.");
      setLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setClientError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // Only try to create profile if sign-in was successful
      if (data?.user) {
        try {
          // Check if the RPC function exists, or use a regular query
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.warn('Profile creation failed:', profileError);
            // Don't block login for profile creation errors
          }
        } catch (profileErr) {
          console.warn('Profile creation error:', profileErr);
          // Don't block login
        }

        // Use Next.js router for navigation
        router.replace(redirectTo);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-6 bg-white border rounded-2xl p-8 shadow-md">
          <header className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="text-sm text-slate-500">Welcome back — sign in to continue.</p>
          </header>

          {clientError && <div className="text-red-600 text-sm">{clientError}</div>}
          {msg && <div className="text-red-700 text-sm">{msg}</div>}

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2 bg-slate-900 text-white flex items-center justify-center disabled:opacity-60 transition-opacity"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
            ) : (
              <span>Sign in</span>
            )}
          </button>

          <div className="text-sm text-slate-600 text-center">
            <a href="/register" className="underline mr-4 hover:text-slate-800 transition-colors">
              Create account
            </a>
            <a href="/forgot-password" className="underline hover:text-slate-800 transition-colors">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center">Loading…</main>}>
      <LoginContent />
    </Suspense>
  );
}
