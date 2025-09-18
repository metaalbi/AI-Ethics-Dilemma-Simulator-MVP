"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setClientError(null);
    setSuccess(false);

    // simple client-side validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setClientError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setClientError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`, // dynamic redirect (works on localhost and hosted)
      },
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
    } else {
      setMsg("Check your email to confirm your account, then sign in.");
      setSuccess(true);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-6 bg-white border rounded-2xl p-8 shadow-md">
          <header className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="text-sm text-slate-500">Join the IACA alumni portal — it only takes a minute.</p>
          </header>

          {clientError && <div className="text-red-600 text-sm">{clientError}</div>}
          {msg && !success && <div className="text-red-700 text-sm">{msg}</div>}
          {success && (
            <div className="text-green-700 text-sm bg-green-50 p-3 rounded">{msg}</div>
          )}

          <div className="grid gap-2">
            <label className="text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-700">Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
            <p className="text-xs text-slate-400">Minimum 6 characters.</p>
          </div>

          <button
            disabled={loading || success}
            className="w-full rounded-lg px-4 py-2 bg-slate-900 text-white flex items-center justify-center disabled:opacity-60"
            aria-live="polite"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
            ) : (
              <span>{success ? "Check your email" : "Create account"}</span>
            )}
          </button>

          <div className="text-sm text-slate-600 text-center">
            Already have an account? <a className="underline text-slate-900" href="/login">Sign in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
