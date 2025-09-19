'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { FormEvent } from 'react';

interface EventRecord {
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
  created_by: string | null;
}

interface Filters {
  term: string;
  startDate: string;
  endDate: string;
}

interface EditableEvent {
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: string | null;
}

interface CreateForm {
  title: string;
  description: string;
  location: string;
  department: string;
  contact_point: string;
  region: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const initialFilters: Filters = {
  term: '',
  startDate: '',
  endDate: '',
};

const initialCreateForm: CreateForm = {
  title: '',
  description: '',
  location: '',
  department: '',
  contact_point: '',
  region: '',
  status: 'scheduled',
  starts_at: '',
  ends_at: '',
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

function toLocalInputValue(value: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown, fallback: string) {
  // Handle JS Errors
  if (error instanceof Error && error.message) return error.message;
  // Handle Supabase/PostgREST style objects
  if (
    error &&
    typeof error === 'object' &&
    'message' in (error as Record<string, unknown>) &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    const e = error as { message: string; details?: string | null; hint?: string | null };
    const extras = [e.details, e.hint].filter(Boolean).join(' ');
    return [e.message, extras].filter(Boolean).join(' — ');
  }
  if (typeof error === 'string') return error;
  return fallback;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [filters, setFilters] = useState(initialFilters);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [editing, setEditing] = useState<Record<number, EditableEvent>>({});
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [rowSaving, setRowSaving] = useState<Record<number, boolean>>({});
  const [rowError, setRowError] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let ignore = false;

    async function verifyAdmin() {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          router.replace('/login');
          return;
        }

        const { data: adminResult, error: adminError } = await supabase.rpc('is_admin', {
          uid: currentUser.id,
        });

        if (adminError || !adminResult) {
          router.replace('/events');
          return;
        }

        if (!ignore) {
          setUser(currentUser);
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Failed to verify admin status', error);
        router.replace('/events');
      } finally {
        if (!ignore) {
          setCheckingAdmin(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      ignore = true;
    };
  }, [router]);

  const fetchEvents = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingEvents(true);
    setFeedback(null);

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

      const { data, error } = await query.order('starts_at', { ascending: true });

      if (error) {
        throw error;
      }

      setEvents(data ?? []);
      const editingState: Record<number, EditableEvent> = {};
      for (const event of data ?? []) {
        editingState[event.id] = {
          title: event.title,
          starts_at: toLocalInputValue(event.starts_at),
          ends_at: toLocalInputValue(event.ends_at),
          location: event.location,
          status: event.status || 'scheduled',
        };
      }
      setEditing(editingState);
      setRowError({});
    } catch (error) {
      console.error('Failed to load events', error);
      setFeedback('Unable to load events. Please try again.');
      setFeedbackType('error');
    } finally {
      setLoadingEvents(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleCreateFieldChange<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  }

  function handleEditFieldChange(id: number, key: keyof EditableEvent, value: string) {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFeedbackType(null);

    const trimmedTitle = createForm.title.trim();
    if (!trimmedTitle) {
      setFeedback('Title is required.');
      setFeedbackType('error');
      return;
    }

    if (!createForm.starts_at || !createForm.ends_at) {
      setFeedback('Start and end dates are required.');
      setFeedbackType('error');
      return;
    }

    const start = new Date(createForm.starts_at);
    const end = new Date(createForm.ends_at);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      setFeedback('Invalid start or end date.');
      setFeedbackType('error');
      return;
    }

    if (end < start) {
      setFeedback('End date must be the same as or after the start date.');
      setFeedbackType('error');
      return;
    }

    setCreateSubmitting(true);

    try {
      const payload: any = {
        title: trimmedTitle,
        description: createForm.description || null,
        location: createForm.location || null,
        department: createForm.department || null,
        contact_point: createForm.contact_point || null,
        region: createForm.region || null,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        created_by: user?.id ?? null,
        status: createForm.status,
      };

      let { error } = await supabase.from('events').insert([payload]);

      // Fallback for environments missing the `status` column
      if (error && typeof (error as any).message === 'string' && (error as any).message.includes("'status'")) {
        delete payload.status;
        const retry = await supabase.from('events').insert([payload]);
        error = retry.error;
      }

      if (error) throw error;

      setCreateForm(initialCreateForm);
      setFeedback('Event created successfully.');
      setFeedbackType('success');
      await fetchEvents();
    } catch (error) {
      console.error('Failed to create event', error);
      setFeedback(getErrorMessage(error, 'Failed to create event.'));
      setFeedbackType('error');
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleSave(id: number) {
    const editingEvent = editing[id];
    if (!editingEvent) return;

    setRowError(prev => ({ ...prev, [id]: null }));

    const trimmedTitle = editingEvent.title.trim();
    if (!trimmedTitle) {
      setRowError(prev => ({ ...prev, [id]: 'Title is required.' }));
      return;
    }

    if (!editingEvent.starts_at || !editingEvent.ends_at) {
      setRowError(prev => ({ ...prev, [id]: 'Start and end times are required.' }));
      return;
    }

    const start = new Date(editingEvent.starts_at);
    const end = new Date(editingEvent.ends_at);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      setRowError(prev => ({ ...prev, [id]: 'Invalid dates supplied.' }));
      return;
    }

    if (end < start) {
      setRowError(prev => ({ ...prev, [id]: 'End date must be the same as or after the start date.' }));
      return;
    }

    setRowSaving(prev => ({ ...prev, [id]: true }));

    try {
      const updateData: any = {
        title: trimmedTitle,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location: editingEvent.location || null,
        status: editingEvent.status || 'scheduled',
      };

      let { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error && typeof (error as any).message === 'string' && (error as any).message.includes("'status'")) {
        delete updateData.status;
        const retry = await supabase
          .from('events')
          .update(updateData)
          .eq('id', id);
        error = retry.error;
      }

      if (error) throw error;

      setFeedback('Event updated successfully.');
      setFeedbackType('success');
      await fetchEvents();
    } catch (error) {
      console.error('Failed to update event', error);
      const message = getErrorMessage(error, 'Failed to update event.');
      setRowError(prev => ({ ...prev, [id]: message }));
      setFeedback('Failed to update event.');
      setFeedbackType('error');
    } finally {
      setRowSaving(prev => ({ ...prev, [id]: false }));
    }
  }

  async function handleDelete(id: number) {
    const eventRecord = events.find(event => event.id === id);
    if (!eventRecord) return;

    const confirmed = window.confirm(`Delete event "${eventRecord.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setRowSaving(prev => ({ ...prev, [id]: true }));
    setRowError(prev => ({ ...prev, [id]: null }));

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setFeedback('Event deleted.');
      setFeedbackType('success');
      await fetchEvents();
    } catch (error) {
      console.error('Failed to delete event', error);
      const message = getErrorMessage(error, 'Failed to delete event.');
      setRowError(prev => ({ ...prev, [id]: message }));
      setFeedback('Failed to delete event.');
      setFeedbackType('error');
    } finally {
      setRowSaving(prev => ({ ...prev, [id]: false }));
    }
  }

  if (checkingAdmin) {
    return (
      <div className="p-6">
        <p>Checking permissions…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Manage events</h1>
        <p className="text-sm text-muted-foreground">
          Create, update and remove events. Filters apply to the list below.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Filters</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
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
          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={() => setFilters(initialFilters)}
              className="text-sm text-primary underline"
            >
              Reset filters
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Create new event</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Title *</span>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={event => handleCreateFieldChange('title', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Description</span>
            <textarea
              value={createForm.description}
              onChange={event => handleCreateFieldChange('description', event.target.value)}
              className="min-h-[120px] rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Location</span>
            <input
              type="text"
              value={createForm.location}
              onChange={event => handleCreateFieldChange('location', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Department</span>
            <input
              type="text"
              value={createForm.department}
              onChange={event => handleCreateFieldChange('department', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Contact point</span>
            <input
              type="text"
              value={createForm.contact_point}
              onChange={event => handleCreateFieldChange('contact_point', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Region</span>
            <input
              type="text"
              value={createForm.region}
              onChange={event => handleCreateFieldChange('region', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Status</span>
            <select
              value={createForm.status}
              onChange={event => handleCreateFieldChange('status', event.target.value)}
              className="rounded-md border px-3 py-2"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Starts at *</span>
            <input
              type="datetime-local"
              required
              value={createForm.starts_at}
              onChange={event => handleCreateFieldChange('starts_at', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ends at *</span>
            <input
              type="datetime-local"
              required
              value={createForm.ends_at}
              onChange={event => handleCreateFieldChange('ends_at', event.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {createSubmitting ? 'Creating…' : 'Create event'}
            </button>
          </div>
        </form>
      </section>

      {feedback && (
        <div
          className={`rounded-md border p-3 text-sm ${
            feedbackType === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {feedback}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Existing events</h2>
        {loadingEvents && <p>Loading events…</p>}
        {!loadingEvents && events.length === 0 && <p>No events found.</p>}
        {!loadingEvents && events.length > 0 && (
          <div className="space-y-4">
            {events.map(event => {
              const editingState = editing[event.id];
              return (
                <article key={event.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm md:col-span-2">
                      <span className="font-medium">Title</span>
                      <input
                        type="text"
                        value={editingState?.title ?? ''}
                        onChange={e => handleEditFieldChange(event.id, 'title', e.target.value)}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Starts at</span>
                      <input
                        type="datetime-local"
                        value={editingState?.starts_at ?? ''}
                        onChange={e => handleEditFieldChange(event.id, 'starts_at', e.target.value)}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Ends at</span>
                      <input
                        type="datetime-local"
                        value={editingState?.ends_at ?? ''}
                        onChange={e => handleEditFieldChange(event.id, 'ends_at', e.target.value)}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Location</span>
                      <input
                        type="text"
                        value={editingState?.location ?? ''}
                        onChange={e => handleEditFieldChange(event.id, 'location', e.target.value)}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Status</span>
                      <select
                        value={editingState?.status ?? 'scheduled'}
                        onChange={e => handleEditFieldChange(event.id, 'status', e.target.value)}
                        className="rounded-md border px-3 py-2"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {rowError[event.id] && (
                    <p className="mt-3 text-sm text-destructive">{rowError[event.id]}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(event.id)}
                      disabled={rowSaving[event.id]}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      {rowSaving[event.id] ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      disabled={rowSaving[event.id]}
                      className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
