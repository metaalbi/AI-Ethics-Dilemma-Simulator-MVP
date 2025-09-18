import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createEvent } from 'ics';

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location?: string;
  organizer?: string;
  created_at: string;
  updated_at: string;
}

interface RequestBody {
  eventId: number;
}

// Initialize Resend with runtime check
let resend: Resend;
try {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required');
  }
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IACA Alumni//Events//EN',
      'BEGIN:VEVENT',
      `UID:event-${event.id}@iaca-alumni`,
      `DTSTAMP:${formatDateForIcs(new Date())}`,
      `DTSTART:${formatDateForIcs(new Date(event.starts_at))}`,
      `DTEND:${formatDateForIcs(new Date(event.ends_at))}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.location || '')}`,
      `DESCRIPTION:${escapeIcs(event.description || '')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2>${escapeHtml(event.title)}</h2>
        <p><strong>When:</strong> ${new Date(event.starts_at).toLocaleString()} – ${new Date(event.ends_at).toLocaleString()}</p>
        <p><strong>Where:</strong> ${escapeHtml(event.location || 'TBA')}</p>
        <p><strong>Department:</strong> ${escapeHtml(event.department || '—')}</p>
        <p><strong>Region:</strong> ${escapeHtml(event.region || '—')}</p>
        <p><strong>Contact:</strong> ${escapeHtml(event.contact_point || '—')}</p>
        <p>${escapeHtml(event.description || '')}</p>
      </div>
    `;

    const attachments = [
      {
        filename: `event-${event.id}.ics`,
        content: Buffer.from(ics).toString('base64'),
        type: 'text/calendar',
        disposition: 'attachment' as const,
      },
    ];

    const { error: sendError } = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: user.email!,
      subject: `Event: ${event.title}`,
      html,
      attachments,
    });

    if (sendError) {
      throw sendError;
    }

    await supabase
      .from('event_invite_emails')
      .insert([
        {
          event_id: event.id,
          user_id: user.id,
          email_to: user.email,
          status: 'sent',
        },
      ])
      .catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to send event invite', error);
    const message = error instanceof Error && error.message ? error.message : 'Send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!);
}

function escapeIcs(value: string) {
  return value.replace(/[\n\r,;\\]/g, char =>
    ({
      '\n': '\\n',
      '\r': '',
      ',': '\\,',
      ';': '\\;',
      '\\': '\\\\',
    } as const)[char] ?? '',
  );
}

function formatDateForIcs(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
