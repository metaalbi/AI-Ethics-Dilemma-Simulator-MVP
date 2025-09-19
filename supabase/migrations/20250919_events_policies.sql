-- RLS policies for events and invite logs

-- Ensure RLS is enabled on events
alter table if exists public.events enable row level security;

-- Read for any authenticated user
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_select_authenticated'
  ) then
    create policy "events_select_authenticated" on public.events
      for select to authenticated
      using (true);
  end if;
end $$;

-- Insert only for admins (WITH CHECK is evaluated on INSERT)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_insert_admin'
  ) then
    create policy "events_insert_admin" on public.events
      for insert to authenticated
      with check (public.is_admin(auth.uid()));
  end if;
end $$;

-- Update only for admins
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_update_admin'
  ) then
    create policy "events_update_admin" on public.events
      for update to authenticated
      using (public.is_admin(auth.uid()));
  end if;
end $$;

-- Delete only for admins
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_delete_admin'
  ) then
    create policy "events_delete_admin" on public.events
      for delete to authenticated
      using (public.is_admin(auth.uid()));
  end if;
end $$;

