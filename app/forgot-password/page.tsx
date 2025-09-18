"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setClientError(null);
    setLoading(true);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setClientError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setMsg(error.message);
    else setMsg("If that email exists, a reset link has been sent.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-6 bg-white border rounded-2xl p-8 shadow-md">
          <header className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="text-sm text-slate-500">Enter your email and we'll send a reset link.</p>
          </header>

          {clientError && <div className="text-red-600 text-sm">{clientError}</div>}
          {msg && <div className="text-slate-700 text-sm">{msg}</div>}

          <div className="grid gap-2">
            <label className="text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
              <span>Send reset link</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
