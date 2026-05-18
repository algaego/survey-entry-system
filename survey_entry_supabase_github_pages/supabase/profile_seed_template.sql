-- Profile seed template
-- Step 1: In Supabase Dashboard -> Authentication -> Users, create these users manually first.
-- Step 2: Edit the emails below to exactly match the Auth user emails.
-- Step 3: Run this file in SQL Editor.

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'ADMIN', 'Administrator', 'admin'
from auth.users where email = 'admin@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'A', 'Recorder A', 'clerk'
from auth.users where email = 'recorder-a@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'B', 'Recorder B', 'clerk'
from auth.users where email = 'recorder-b@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'C', 'Recorder C', 'clerk'
from auth.users where email = 'recorder-c@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'D', 'Recorder D', 'clerk'
from auth.users where email = 'recorder-d@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'E', 'Recorder E', 'clerk'
from auth.users where email = 'recorder-e@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'F', 'Recorder F', 'clerk'
from auth.users where email = 'recorder-f@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'G', 'Recorder G', 'clerk'
from auth.users where email = 'recorder-g@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'H', 'Recorder H', 'clerk'
from auth.users where email = 'recorder-h@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'I', 'Recorder I', 'clerk'
from auth.users where email = 'recorder-i@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, recorder_code, display_name, role)
select id, email, 'J', 'Recorder J', 'clerk'
from auth.users where email = 'recorder-j@example.com'
on conflict (id) do update set recorder_code = excluded.recorder_code, display_name = excluded.display_name, role = excluded.role, email = excluded.email;
