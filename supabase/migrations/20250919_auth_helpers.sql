-- Helper functions for admin checks and profile provisioning
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from roles r
    where r.user_id = uid
      and r.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.ensure_profile_for_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.email();
begin
  if v_uid is null then
    raise exception 'No authenticated user';
  end if;

  insert into alumni (user_id, email_1)
  select v_uid, coalesce(v_email, '')
  where not exists (
    select 1
    from alumni
    where user_id = v_uid
  );
end;
$$;

grant execute on function public.ensure_profile_for_current_user() to authenticated;
