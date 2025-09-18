-- Enable RLS on news table
alter table news enable row level security;

-- Create policy to allow authenticated users to read news
create policy "Allow authenticated users to read news"
on news
for select
to authenticated
using (true);

-- Create policy to allow admins to manage news
create policy "Allow admins to manage news"
on news
for all
to authenticated
using (
  auth.uid() in (
    select user_id 
    from admin_users 
    where user_id = auth.uid()
  )
);