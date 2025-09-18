"use client";
import { useEffect, useState } from "react";

export default function DebugAuth() {
  const [out, setOut] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        const text = await resp.text();
        setOut({ status: resp.status, ok: resp.ok, text: text.slice(0, 300) });
      } catch (e: any) {
        setOut({ ok: false, error: e?.message || String(e) });
      }
    })();
  }, []);

  return <pre style={{ padding: 16 }}>{JSON.stringify(out, null, 2)}</pre>;
}
