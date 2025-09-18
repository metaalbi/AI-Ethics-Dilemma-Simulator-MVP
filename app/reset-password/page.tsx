"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // When user opens this page from the email link, exchange code for a session
  useEffect(() => {
    async function init() {
      try {
        // If there's a code in the URL, this sets a temporary session
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } catch {}
      setReady(true);
    }
    init();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setClientError(null);
    if (password.length < 6) {
      setClientError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setMsg(error.message);
    else setMsg("Password updated. You can now sign in.");
  }

  if (!ready) return <main className="min-h-screen grid place-items-center">Checking link…</main>;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-6 bg-white border rounded-2xl p-8 shadow-md">
          <header className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-semibold">Choose a new password</h1>
            <p className="text-sm text-slate-500">Enter a secure password to finish resetting your account.</p>
          </header>

          {clientError && <div className="text-red-600 text-sm">{clientError}</div>}
          {msg && <div className="text-slate-700 text-sm">{msg}</div>}

          <div className="grid gap-2">
            <label className="text-sm text-slate-700">New password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="New strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-slate-400">Minimum 6 characters.</p>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg px-4 py-2 bg-slate-900 text-white flex items-center justify-center disabled:opacity-60"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
            ) : (
              <span>Update password</span>
            )}
          </button>

          <div className="text-sm text-slate-600">
            <a className="underline" href="/login">Back to sign in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
