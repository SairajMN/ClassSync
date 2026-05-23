-- Create schemas if needed
create schema if not exists public;

-- Enable Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles (extends auth.users via profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text check (role in ('student', 'teacher', 'admin')) default 'student',
  department text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  building text,
  floor integer,
  capacity integer not null,
  room_type text check (room_type in ('classroom', 'lab', 'seminar_hall', 'smart_room')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- resources
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  resource_type text check (resource_type in ('projector','smart_board','microphone','internet','ac','lab_equipment')),
  quantity integer not null default 1,
  is_shared boolean default true,
  created_at timestamptz default now()
);

-- room_resources (Join table for resources physically in a room)
create table if not exists public.room_resources (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  quantity integer not null default 1,
  constraint unique_room_resource unique (room_id, resource_id)
);

-- bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('pending','approved','rejected','cancelled','completed')) default 'pending',
  approval_required boolean default true,
  approved_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- booking_resources (Resources assigned to a specific booking)
create table if not exists public.booking_resources (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  quantity integer not null default 1,
  constraint unique_booking_resource unique (booking_id, resource_id)
);

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS Configuration
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.resources enable row level security;
alter table public.room_resources enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_resources enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES Policies
create policy "Allow public read on profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profiles" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow service-role / admin all actions on profiles" on public.profiles
  using (true) with check (true);

-- ROOMS Policies
create policy "Allow read on active rooms" on public.rooms
  for select using (is_active = true);

create policy "Allow admin all actions on rooms" on public.rooms
  using (true) with check (true);

-- RESOURCES Policies
create policy "Allow read on resources" on public.resources
  for select using (true);

create policy "Allow admin all actions on resources" on public.resources
  using (true) with check (true);

-- ROOM_RESOURCES Policies
create policy "Allow read on room_resources" on public.room_resources
  for select using (true);

create policy "Allow admin all actions on room_resources" on public.room_resources
  using (true) with check (true);

-- BOOKINGS Policies
create policy "Allow read on bookings for all authenticated" on public.bookings
  for select using (auth.role() = 'authenticated');

create policy "Allow users to insert bookings for themselves" on public.bookings
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own pending bookings" on public.bookings
  for update using (auth.uid() = user_id AND status = 'pending') with check (auth.uid() = user_id);

create policy "Allow admin full access on bookings" on public.bookings
  using (true) with check (true);

-- BOOKING_RESOURCES Policies
create policy "Allow read on booking_resources" on public.booking_resources
  for select using (auth.role() = 'authenticated');

create policy "Allow users to insert booking_resources" on public.booking_resources
  for insert with check (exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()
  ));

create policy "Allow users to update/delete their own booking_resources" on public.booking_resources
  for all using (exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()
  ));

-- NOTIFICATIONS Policies
create policy "Allow read notifications of self" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Allow update/delete notifications of self" on public.notifications
  for all using (auth.uid() = user_id);

-- AUDIT_LOGS Policies
create policy "Allow admin all actions on audit_logs" on public.audit_logs
  using (true) with check (true);


-- Trigger: Create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, department, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    true
  )
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Atomic Booking Creation RPC
create or replace function public.create_booking_atomic(
  p_user_id uuid,
  p_room_id uuid,
  p_title text,
  p_description text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_resources jsonb
)
returns uuid as $$
declare
  v_room_capacity integer;
  v_role text;
  v_booking_id uuid;
  v_status text;
  v_approval_required boolean;
  r record;
  v_total_allocated integer;
  v_total_available integer;
  v_resource_name text;
begin
  select capacity into v_room_capacity from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'Room not found';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Profile not found';
  end if;

  if exists (
    select 1 from public.bookings
    where room_id = p_room_id
      and status in ('pending', 'approved')
      and start_time < p_end_time
      and end_time > p_start_time
  ) then
    raise exception 'ROOM_OVERLAP: The room is already booked for the selected time range.';
  end if;

  if p_resources is not null and jsonb_array_length(p_resources) > 0 then
    for r in select * from jsonb_to_recordset(p_resources) as x(resource_id uuid, quantity integer)
    loop
      select quantity, name into v_total_available, v_resource_name from public.resources where id = r.resource_id;
      if not found then
        raise exception 'RESOURCE_NOT_FOUND: Resource not found';
      end if;

      select coalesce(sum(br.quantity), 0) into v_total_allocated
      from public.booking_resources br
      join public.bookings b on br.booking_id = b.id
      where br.resource_id = r.resource_id
        and b.status in ('pending', 'approved')
        and b.start_time < p_end_time
        and b.end_time > p_start_time;

      if (v_total_allocated + r.quantity) > v_total_available then
        raise exception 'RESOURCE_LIMIT_EXCEEDED: Not enough quantity of % available. Requested: %, Available: %',
          v_resource_name, r.quantity, (v_total_available - v_total_allocated);
      end if;
    end loop;
  end if;

  if v_role in ('teacher', 'admin') then
    v_status := 'approved';
    v_approval_required := false;
  else
    v_status := 'pending';
    v_approval_required := true;
  end if;

  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required)
  values (p_user_id, p_room_id, p_title, p_description, p_start_time, p_end_time, v_status, v_approval_required)
  returning id into v_booking_id;

  if p_resources is not null and jsonb_array_length(p_resources) > 0 then
    insert into public.booking_resources (booking_id, resource_id, quantity)
    select v_booking_id, (x->>'resource_id')::uuid, (x->>'quantity')::integer
    from jsonb_array_elements(p_resources) as x;
  end if;

  insert into public.notifications (user_id, type, title, message)
  values (
    p_user_id, 'booking_created', 'Booking Submitted',
    case
      when v_status = 'approved' then 'Your booking for ' || p_title || ' has been automatically approved.'
      else 'Your booking for ' || p_title || ' has been submitted and is pending approval.'
    end
  );

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (
    p_user_id, 'booking_create', 'booking', v_booking_id,
    jsonb_build_object('title', p_title, 'status', v_status, 'room_id', p_room_id)
  );

  return v_booking_id;
end;
$$ language plpgsql security definer;


-- SEED DATA (Rooms, Resources, Room-Resource Assignments only)
-- NOTE: Auth users must be created via Supabase Dashboard (Authentication > Users > Add User)
-- or through the signup API. The signup trigger `on_auth_user_created` will auto-create profiles.

-- Insert Rooms
insert into public.rooms (id, name, building, floor, capacity, room_type, is_active)
values
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Smart Room A', 'Science Block', 2, 60, 'smart_room', true),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lab 3', 'Engineering Lab', 1, 40, 'lab', true),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Seminar Hall', 'Main Auditorium', 1, 150, 'seminar_hall', true)
on conflict (id) do nothing;

-- Insert Resources
insert into public.resources (id, name, resource_type, quantity, is_shared)
values
  ('44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Projector', 'projector', 5, true),
  ('55eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Smart Board', 'smart_board', 3, true),
  ('66eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Microphone', 'microphone', 10, true),
  ('77eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Internet', 'internet', 100, true),
  ('88eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Air Conditioner', 'ac', 12, true),
  ('99eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Lab Equipment Bundle', 'lab_equipment', 30, false)
on conflict (id) do nothing;

-- Assign Room-Resources
insert into public.room_resources (room_id, resource_id, quantity)
values
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1),
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '55eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1),
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '88eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 2),
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '77eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 1),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '99eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 20),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '77eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 1),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '88eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 1),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 2),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '55eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '66eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 4),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '77eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 1),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '88eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 4)
on conflict do nothing;