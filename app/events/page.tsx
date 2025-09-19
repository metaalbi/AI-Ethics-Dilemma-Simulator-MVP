'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  contact_point: string | null;
  region: string | null;
  starts_at: string;
  ends_at: string;
  status: string | null;
}

interface Filters {
  term: string;
  startDate: string;
  endDate: string;
}

const initialFilters: Filters = {
  term: '',
  startDate: '',
  endDate: '',
};

function toStartOfDayIso(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return date.toISOString();
}

function toEndOfDayIso(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59`);
  return date.toISOString();
}

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  });

  if (sameDay) {
    return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }

  return `${dateFormatter.format(start)} ${timeFormatter.format(start)} – ${dateFormatter.format(end)} ${timeFormatter.format(end)}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

export default function EventsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const hasFilters = useMemo(
    () => Boolean(filters.term || filters.startDate || filters.endDate),
    [filters],
  );

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('events').select('*');

      const fromIso = toStartOfDayIso(filters.startDate);
      const toIso = toEndOfDayIso(filters.endDate);

      if (fromIso) {
        query = query.gte('starts_at', fromIso);
      }

      if (toIso) {
        query = query.lte('ends_at', toIso);
      }

      if (filters.term) {
        query = query.ilike('title', `%${filters.term}%`);
      }

      const { data, error: queryError } = await query.order('starts_at', { ascending: true });

      if (queryError) {
        throw queryError;
      }

      setEvents(data ?? []);
    } catch (error) {
      console.error('Error fetching events', error);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function handleInvite(eventId: number) {
    setInviteStatus(null);
    try {
      const res = await fetch('/api/events/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Could not send invitation email.');
      }

      setInviteStatus('Invitation sent to your email.');
    } catch (error) {
      console.error('Failed to send invite', error);
      setInviteStatus(getErrorMessage(error, 'Could not send invitation email.'));
    }
  }

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="text-sm text-muted-foreground">
          Browse upcoming events and request a calendar invitation directly to your inbox.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Filter events</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title contains</span>
            <input
              type="text"
              value={filters.term}
              onChange={event => handleFilterChange('term', event.target.value)}
              className="rounded-md border px-3 py-2"
              placeholder="Search by title"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Start from</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={event => handleFilterChange('startDate', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">End until</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={event => handleFilterChange('endDate', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="mt-4 text-sm text-primary underline"
          >
            Reset filters
          </button>
        )}
      </section>

      {inviteStatus && (
        <div className="rounded-md border border-muted-foreground/20 bg-muted p-3 text-sm">
          {inviteStatus}
        </div>
      )}

      <section className="space-y-4">
        {loading && <p>Loading events…</p>}
        {!loading && error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <p>No events match your filters.</p>
        )}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map(event => (
              <article key={event.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <dl className="grid gap-1 text-sm text-muted-foreground">
                      <div>
                        <dt className="font-medium text-foreground">When</dt>
                        <dd>{formatDateRange(event.starts_at, event.ends_at)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground">Where</dt>
                        <dd>{event.location || 'To be announced'}</dd>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <dt className="font-medium text-foreground">Department</dt>
                          <dd>{event.department || '—'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Region</dt>
                          <dd>{event.region || '—'}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInvite(event.id)}
                    className="h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Email me this event
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
