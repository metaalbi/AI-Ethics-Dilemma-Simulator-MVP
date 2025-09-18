"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Alumni = {
  id: number;
  user_id: string | null;
  email_1: string | null;
  f_name: string | null;
  l_name: string | null;
  gender: string | null;
  country: string | null;
  country2: string | null;
  address: string | null;
  birthday: string | null;      // stored as date in DB, we'll bind to input[type=date]
  job_title: string | null;
  programme_name: string | null;
  tr_name: string | null;       // from earlier schema; optional to show
  tr_name_text: string | null;  // optional
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      // 1) ensure user is logged in
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        window.location.href = "/login";
        return;
      }
      const uid = userData.user.id;

      // 2) fetch (or provision) their profile row
      let { data, error } = await supabase
        .from("alumni")
        .select("*")
        .eq("user_id", uid)
        .single();

      // if no row yet, create one via RPC then refetch
      if (error && (error as any).code === "PGRST116") {
        await supabase.rpc("ensure_profile_for_current_user");
        const again = await supabase
          .from("alumni")
          .select("*")
          .eq("user_id", uid)
          .single();
        data = again.data as any;
        error = again.error as any;
      }

      if (error) {
        setError(error.message || "Failed to load profile");
      } else {
        setAlumni(data as any);
      }
      setLoading(false);
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!alumni) return;

    setSaving(true);
    setError(null);

    const { id, ...rest } = alumni;

    // IMPORTANT: Restrict update to the row with this user_id (RLS will also enforce)
    const { error } = await supabase
      .from("alumni")
      .update({
        f_name: alumni.f_name,
        l_name: alumni.l_name,
        gender: alumni.gender,
        country: alumni.country,
        country2: alumni.country2,
        address: alumni.address,
        birthday: alumni.birthday ? alumni.birthday : null,
        job_title: alumni.job_title,
        programme_name: alumni.programme_name,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      // optional: toast/success UI
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p>Loading profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Profile</h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!alumni) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <p>No profile row found. Try logging out and back in.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="glass-button px-4 py-2 text-iaca-blue"
        >
          {isEditing ? 'View Profile' : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-4 bg-white border rounded-xl p-6">
        {isEditing ? (
          <form onSubmit={onSave} className="space-y-4">
            {/* Read-only auth email */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Account Email</label>
              <input
                className="w-full border rounded px-3 py-2 bg-slate-100"
                value={alumni.email_1 ?? ""}
                readOnly
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">First name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={alumni.f_name ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, f_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Last name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={alumni.l_name ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, l_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={alumni.gender ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, gender: e.target.value })}
                >
                  <option value="">—</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Birthday</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={alumni.birthday ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, birthday: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Job title</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={alumni.job_title ?? ""}
                onChange={(e) => setAlumni({ ...alumni, job_title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Country</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={alumni.country ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, country: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Country 2 (optional)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={alumni.country2 ?? ""}
                  onChange={(e) => setAlumni({ ...alumni, country2: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Address</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={alumni.address ?? ""}
                onChange={(e) => setAlumni({ ...alumni, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Programme name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={alumni.programme_name ?? alumni.tr_name ?? ""}
                onChange={(e) => setAlumni({ ...alumni, programme_name: e.target.value })}
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md px-4 py-2 bg-iaca-blue text-white disabled:opacity-60 hover:bg-opacity-90 transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-slate-600 mb-1">Account Email</h3>
              <p className="text-gray-900">{alumni.email_1}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-slate-600 mb-1">Full Name</h3>
                <p className="text-gray-900">{alumni.title} {alumni.f_name} {alumni.l_name}</p>
              </div>
              <div>
                <h3 className="text-sm text-slate-600 mb-1">Gender</h3>
                <p className="text-gray-900">{alumni.gender || "Not specified"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-slate-600 mb-1">Birthday</h3>
                <p className="text-gray-900">
                  {alumni.birthday ? new Date(alumni.birthday).toLocaleDateString() : "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-slate-600 mb-1">Job Title</h3>
                <p className="text-gray-900">{alumni.job_title || "Not specified"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-600 mb-1">Countries</h3>
              <p className="text-gray-900">
                {alumni.country}
                {alumni.country2 && `, ${alumni.country2}`}
              </p>
            </div>

            <div>
              <h3 className="text-sm text-slate-600 mb-1">Address</h3>
              <p className="text-gray-900">{alumni.address || "Not specified"}</p>
            </div>

            <div>
              <h3 className="text-sm text-slate-600 mb-1">Programme</h3>
              <p className="text-gray-900">{alumni.programme_name || alumni.tr_name || "Not specified"}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
