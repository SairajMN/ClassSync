-- ============================================================
-- CLASSYNC DEMO SEED DATA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. CREATE AUTH USERS (so profiles can reference them) ─────
-- Uses Supabase's internal auth function to create users
-- The trigger `on_auth_user_created` auto-creates profiles

-- Helper: Create auth user + auto-profile via trigger
select
  case when not exists (select 1 from auth.users where email = 'admin@classsync.edu') then
    (select supabase_auth.create_user(
      '{"email":"admin@classsync.edu","password":"admin123","email_confirm":true,"user_metadata":{"name":"Dr. Sarah Chen","role":"admin","department":"Administration"}}'::jsonb
    ))
  end;

select
  case when not exists (select 1 from auth.users where email = 'teacher@classsync.edu') then
    (select supabase_auth.create_user(
      '{"email":"teacher@classsync.edu","password":"teacher123","email_confirm":true,"user_metadata":{"name":"Prof. James Miller","role":"teacher","department":"Computer Science"}}'::jsonb
    ))
  end;

select
  case when not exists (select 1 from auth.users where email = 'student@classsync.edu') then
    (select supabase_auth.create_user(
      '{"email":"student@classsync.edu","password":"student123","email_confirm":true,"user_metadata":{"name":"Emily Davis","role":"student","department":"Physics"}}'::jsonb
    ))
  end;

-- Wait a moment for triggers to fire and profiles to be created
select pg_sleep(0.5);

-- ── 2. ADDITIONAL ROOMS ───────────────────────────────────────
insert into public.rooms (id, name, building, floor, capacity, room_type, is_active)
values
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Lecture Hall A', 'Main Campus', 0, 200, 'classroom', true),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Lecture Hall B', 'Main Campus', 0, 120, 'classroom', true),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Computer Lab 1', 'Engineering Block', 1, 35, 'lab', true),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Physics Lab', 'Science Block', 1, 30, 'lab', true),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Conference Room', 'Admin Building', 2, 20, 'smart_room', true),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Media Studio', 'Arts Block', 3, 25, 'smart_room', true)
on conflict (id) do nothing;

-- ── 3. ADDITIONAL RESOURCES ───────────────────────────────────
insert into public.resources (id, name, resource_type, quantity, is_shared)
values
  ('b1c2d3e4-0001-4000-8000-000000000001', 'HDMI Cable Kit', 'projector', 15, true),
  ('b1c2d3e4-0002-4000-8000-000000000002', 'Wireless Presenter', 'smart_board', 8, true),
  ('b1c2d3e4-0003-4000-8000-000000000003', 'Speaker System', 'microphone', 6, true),
  ('b1c2d3e4-0004-4000-8000-000000000004', 'WiFi Hotspot', 'internet', 5, true),
  ('b1c2d3e4-0005-4000-8000-000000000005', 'Portable AC Unit', 'ac', 4, true),
  ('b1c2d3e4-0006-4000-8000-000000000006', 'Microscope Set', 'lab_equipment', 10, false)
on conflict (id) do nothing;

-- ── 4. ROOM-RESOURCE ASSIGNMENTS ──────────────────────────────
insert into public.room_resources (room_id, resource_id, quantity)
values
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1c2d3e4-0001-4000-8000-000000000001', 2),
  ('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1c2d3e4-0002-4000-8000-000000000002', 1),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b1c2d3e4-0006-4000-8000-000000000006', 5),
  ('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b1c2d3e4-0003-4000-8000-000000000003', 2),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1c2d3e4-0001-4000-8000-000000000001', 3),
  ('a1b2c3d4-0001-4000-8000-000000000001', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1),
  ('a1b2c3d4-0002-4000-8000-000000000002', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1),
  ('a1b2c3d4-0002-4000-8000-000000000002', '55eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1),
  ('a1b2c3d4-0003-4000-8000-000000000003', '99eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 10),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1c2d3e4-0006-4000-8000-000000000006', 5),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1c2d3e4-0002-4000-8000-000000000002', 1),
  ('a1b2c3d4-0005-4000-8000-000000000005', '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1c2d3e4-0003-4000-8000-000000000003', 1),
  ('a1b2c3d4-0006-4000-8000-000000000006', '55eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1)
on conflict do nothing;

-- ── 5. DEMO BOOKINGS ──────────────────────────────────────────
-- Get profile IDs (they were auto-created by the trigger)
do $$
declare
  v_admin_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;
  v_today date := current_date;
begin
  -- Fetch profile IDs
  select id into v_admin_id from public.profiles where email = 'admin@classsync.edu';
  select id into v_teacher_id from public.profiles where email = 'teacher@classsync.edu';
  select id into v_student_id from public.profiles where email = 'student@classsync.edu';

  -- Teacher bookings (auto-approved)
  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required, approved_by)
  values
    (v_teacher_id, '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'CS201 - Data Structures', 'Weekly lecture on binary trees and graph algorithms.',
     v_today + time '09:00', v_today + time '10:30',
     'approved', false, v_admin_id),

    (v_teacher_id, '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
     'PHY101 - Lab Session', 'Optics experiment - refraction and lens analysis.',
     v_today + time '14:00', v_today + time '16:00',
     'approved', false, v_admin_id),

    (v_teacher_id, 'a1b2c3d4-0001-4000-8000-000000000001',
     'MTH301 - Calculus Workshop', 'Advanced integration techniques and problem solving.',
     v_today + 1 + time '11:00', v_today + 1 + time '12:30',
     'approved', false, v_admin_id),

    (v_teacher_id, 'a1b2c3d4-0003-4000-8000-000000000003',
     'CSE Lab - Python Programming', 'Hands-on session on OOP concepts in Python.',
     v_today + 2 + time '09:00', v_today + 2 + time '11:00',
     'approved', false, v_admin_id);

  -- Student bookings (pending — needs admin approval)
  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required)
  values
    (v_student_id, 'a1b2c3d4-0005-4000-8000-000000000005',
     'Study Group - Physics Review', 'Group study session for upcoming physics midterm.',
     v_today + 1 + time '15:00', v_today + 1 + time '17:00',
     'pending', true),

    (v_student_id, 'a1b2c3d4-0002-4000-8000-000000000002',
     'Debate Club Practice', 'Weekly debate team practice and preparation.',
     v_today + 2 + time '13:00', v_today + 2 + time '15:00',
     'pending', true),

    (v_student_id, '33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
     'Cultural Fest Planning', 'Meeting to plan annual college cultural festival.',
     v_today + 3 + time '10:00', v_today + 3 + time '12:00',
     'pending', true);

  -- Past completed bookings
  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required, approved_by)
  values
    (v_teacher_id, '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'CS101 - Intro to Programming', 'Introduction to Python programming fundamentals.',
     v_today - 7 + time '09:00', v_today - 7 + time '10:30',
     'completed', false, v_admin_id),

    (v_teacher_id, '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
     'BIO202 - Genetics Lab', 'DNA extraction and gel electrophoresis experiment.',
     v_today - 5 + time '14:00', v_today - 5 + time '16:00',
     'completed', false, v_admin_id),

    (v_student_id, 'a1b2c3d4-0005-4000-8000-000000000005',
     'Robotics Club Meeting', 'Weekly robotics club planning and assembly.',
     v_today - 3 + time '16:00', v_today - 3 + time '18:00',
     'completed', false, v_admin_id),

    (v_student_id, '33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
     'Math Olympiad Prep', 'Practice session for inter-college math olympiad.',
     v_today - 2 + time '10:00', v_today - 2 + time '12:00',
     'completed', false, v_admin_id);

  -- Cancelled booking
  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required)
  values
    (v_teacher_id, 'a1b2c3d4-0002-4000-8000-000000000002',
     'Guest Lecture - AI Ethics', 'CANCELLED - Guest speaker had an emergency.',
     v_today - 1 + time '14:00', v_today - 1 + time '16:00',
     'cancelled', false);

  -- Rejected booking
  insert into public.bookings (user_id, room_id, title, description, start_time, end_time, status, approval_required)
  values
    (v_student_id, 'a1b2c3d4-0006-4000-8000-000000000006',
     'Personal Project Recording', 'Need media studio for personal video project.',
     v_today + 4 + time '09:00', v_today + 4 + time '11:00',
     'rejected', true);

end $$;


-- ── 6. BOOKING RESOURCES (attach resources to bookings) ───────
do $$
declare
  v_teacher_id uuid;
  v_student_id uuid;
begin
  select id into v_teacher_id from public.profiles where email = 'teacher@classsync.edu';
  select id into v_student_id from public.profiles where email = 'student@classsync.edu';

  -- Attach resources to teacher's approved bookings
  insert into public.booking_resources (booking_id, resource_id, quantity)
  select b.id, r.id, 1
  from public.bookings b, public.resources r
  where b.user_id = v_teacher_id
    and b.title = 'CS201 - Data Structures'
    and r.name = 'Projector'
  on conflict do nothing;

  insert into public.booking_resources (booking_id, resource_id, quantity)
  select b.id, r.id, 1
  from public.bookings b, public.resources r
  where b.user_id = v_teacher_id
    and b.title = 'PHY101 - Lab Session'
    and r.name = 'Lab Equipment Bundle'
  on conflict do nothing;

  -- Attach resources to student's pending booking
  insert into public.booking_resources (booking_id, resource_id, quantity)
  select b.id, r.id, 1
  from public.bookings b, public.resources r
  where b.user_id = v_student_id
    and b.title = 'Study Group - Physics Review'
    and r.name = 'Projector'
  on conflict do nothing;

end $$;


-- ── 7. NOTIFICATIONS ──────────────────────────────────────────
do $$
declare
  v_admin_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;
begin
  select id into v_admin_id from public.profiles where email = 'admin@classsync.edu';
  select id into v_teacher_id from public.profiles where email = 'teacher@classsync.edu';
  select id into v_student_id from public.profiles where email = 'student@classsync.edu';

  -- Admin notifications
  insert into public.notifications (user_id, type, title, message, is_read)
  values
    (v_admin_id, 'booking_pending', 'New Pending Booking', 'Emily Davis requested Smart Room A for Study Group - Physics Review', false),
    (v_admin_id, 'booking_pending', 'New Pending Booking', 'Emily Davis requested Lecture Hall B for Debate Club Practice', false),
    (v_admin_id, 'booking_pending', 'New Pending Booking', 'Emily Davis requested Seminar Hall for Cultural Fest Planning', false),
    (v_admin_id, 'booking_approved', 'Auto-Approved Booking', 'Dr. Sarah Chen auto-approved CS201 - Data Structures in Smart Room A', true),
    (v_admin_id, 'booking_approved', 'Auto-Approved Booking', 'Dr. Sarah Chen auto-approved PHY101 - Lab Session in Lab 3', true);

  -- Teacher notifications
  insert into public.notifications (user_id, type, title, message, is_read)
  values
    (v_teacher_id, 'booking_approved', 'Booking Approved', 'CS201 - Data Structures has been automatically approved for Smart Room A', true),
    (v_teacher_id, 'booking_approved', 'Booking Approved', 'PHY101 - Lab Session has been automatically approved for Lab 3', true),
    (v_teacher_id, 'booking_created', 'Booking Confirmed', 'Your booking for MTH301 - Calculus Workshop has been confirmed', true);

  -- Student notifications
  insert into public.notifications (user_id, type, title, message, is_read)
  values
    (v_student_id, 'booking_submitted', 'Booking Submitted', 'Your request for Study Group - Physics Review is pending admin approval', false),
    (v_student_id, 'booking_submitted', 'Booking Submitted', 'Your request for Debate Club Practice is pending admin approval', false),
    (v_student_id, 'booking_submitted', 'Booking Submitted', 'Your request for Cultural Fest Planning is pending admin approval', false),
    (v_student_id, 'booking_rejected', 'Booking Rejected', 'Your request for Personal Project Recording has been rejected by admin', true),
    (v_student_id, 'booking_approved', 'Booking Completed', 'Robotics Club Meeting on ' || (current_date - 3) || ' was completed successfully', true);

end $$;


-- ── 8. AUDIT LOGS ─────────────────────────────────────────────
do $$
declare
  v_admin_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;
begin
  select id into v_admin_id from public.profiles where email = 'admin@classsync.edu';
  select id into v_teacher_id from public.profiles where email = 'teacher@classsync.edu';
  select id into v_student_id from public.profiles where email = 'student@classsync.edu';

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values
    (v_admin_id, 'login', 'session', null, '{"ip":"192.168.1.100","device":"admin-panel"}'::jsonb),
    (v_admin_id, 'booking_approve', 'booking', (select id from public.bookings where title = 'CS201 - Data Structures' limit 1),
     '{"action":"auto-approved","reason":"teacher_privilege"}'::jsonb),
    (v_admin_id, 'booking_approve', 'booking', (select id from public.bookings where title = 'PHY101 - Lab Session' limit 1),
     '{"action":"auto-approved","reason":"teacher_privilege"}'::jsonb),
    (v_teacher_id, 'booking_create', 'booking', (select id from public.bookings where title = 'CS201 - Data Structures' limit 1),
     '{"title":"CS201 - Data Structures","room":"Smart Room A"}'::jsonb),
    (v_teacher_id, 'booking_create', 'booking', (select id from public.bookings where title = 'PHY101 - Lab Session' limit 1),
     '{"title":"PHY101 - Lab Session","room":"Lab 3"}'::jsonb),
    (v_student_id, 'booking_create', 'booking', (select id from public.bookings where title = 'Study Group - Physics Review' limit 1),
     '{"title":"Study Group - Physics Review","room":"Conference Room"}'::jsonb),
    (v_student_id, 'booking_cancel', 'booking', (select id from public.bookings where title like 'Robotics%' limit 1),
     '{"reason":"completed"}'::jsonb);

end $$;


-- ── 9. VERIFICATION QUERY ─────────────────────────────────────
-- Run this to see what got seeded:
-- select 'profiles' as tbl, count(*) from public.profiles
-- union all select 'rooms', count(*) from public.rooms
-- union all select 'resources', count(*) from public.resources
-- union all select 'room_resources', count(*) from public.room_resources
-- union all select 'bookings', count(*) from public.bookings
-- union all select 'booking_resources', count(*) from public.booking_resources
-- union all select 'notifications', count(*) from public.notifications
-- union all select 'audit_logs', count(*) from public.audit_logs;
