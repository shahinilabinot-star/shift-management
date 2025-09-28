-- Full DB schema for Shift Management (run as project owner in Supabase SQL editor)
-- This script provisions tables, indexes, functions, and RLS policies used by the app.
-- IMPORTANT: Run as DB owner (or a role with CREATE privileges). It will create extensions, schemas, and tables.

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Profiles (maps auth.uid() to profile metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  department text,
  role text DEFAULT 'staff',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2) Patients
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  birth_year integer NOT NULL,
  gender text NOT NULL,
  country text,
  room_number text,
  department text NOT NULL,
  condition text,
  symptoms text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'active',
  allergies text,
  medications text,
  ecg text,
  lab_results text,
  pci_data text,
  notes text,
  is_new_patient boolean DEFAULT true,
  admission_type text DEFAULT 'new',
  risk_factors jsonb DEFAULT '{}'::jsonb,
  pci_access jsonb DEFAULT '{}'::jsonb,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patients_department_idx ON public.patients(department);
CREATE INDEX IF NOT EXISTS patients_status_idx ON public.patients(status);
CREATE INDEX IF NOT EXISTS patients_added_at_idx ON public.patients(added_at);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start timestamptz NOT NULL DEFAULT now(),
  "end" timestamptz,
  assigned_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'open',
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- shifts no longer include department/location; index assigned_user_id instead
CREATE INDEX IF NOT EXISTS idx_shifts_assigned_user_id ON public.shifts(assigned_user_id);

-- 4) Shift sessions (presence)
CREATE TABLE IF NOT EXISTS public.shift_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, shift_id)
);

CREATE INDEX IF NOT EXISTS idx_shift_sessions_user_id ON public.shift_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_shift_id ON public.shift_sessions(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_last_seen_at ON public.shift_sessions(last_seen_at);

-- 5) Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text,
  due_time timestamptz,
  priority text DEFAULT 'medium',
  completed boolean DEFAULT false,
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at timestamptz,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auto_generated boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS tasks_patient_idx ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS tasks_added_at_idx ON public.tasks(added_at);

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  related_id uuid
);

CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON public.activity_logs(timestamp);

-- 7) RLS & Policies
-- Enable RLS on tables we want to protect
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: typically read-only by clients but admins can manage
-- Allow clients to select their own profile by matching auth.uid()
DROP POLICY IF EXISTS select_own_profile ON public.profiles;
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT
  USING (id = auth.uid()::uuid);

-- Patients: allow insert by authenticated users and select by department
DROP POLICY IF EXISTS insert_patients_by_profile ON public.patients;
CREATE POLICY insert_patients_by_profile ON public.patients
  FOR INSERT
  WITH CHECK (added_by = auth.uid()::uuid);

DROP POLICY IF EXISTS select_patients_by_department ON public.patients;
CREATE POLICY select_patients_by_department ON public.patients
  FOR SELECT
  USING (department = (SELECT department FROM public.profiles p WHERE p.id = auth.uid()::uuid) OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin'));

DROP POLICY IF EXISTS update_patients_by_owner ON public.patients;
CREATE POLICY update_patients_by_owner ON public.patients
  FOR UPDATE
  USING (added_by = auth.uid()::uuid OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin'))
  WITH CHECK (added_by = auth.uid()::uuid OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin'));

-- Tasks: allow insert by authenticated users in department or admin
DROP POLICY IF EXISTS insert_tasks_by_profile ON public.tasks;
CREATE POLICY insert_tasks_by_profile ON public.tasks
  FOR INSERT
  WITH CHECK (added_by = auth.uid()::uuid);

DROP POLICY IF EXISTS select_tasks_by_department ON public.tasks;
CREATE POLICY select_tasks_by_department ON public.tasks
  FOR SELECT
  USING (
    (added_by = auth.uid()::uuid)
    OR (patient_id IN (SELECT id FROM public.patients p WHERE p.department = (SELECT department FROM public.profiles pr WHERE pr.id = auth.uid()::uuid)))
    OR ((SELECT role FROM public.profiles pr WHERE pr.id = auth.uid()::uuid) = 'admin')
  );

DROP POLICY IF EXISTS update_tasks_by_owner ON public.tasks;
CREATE POLICY update_tasks_by_owner ON public.tasks
  FOR UPDATE
  USING (added_by = auth.uid()::uuid OR ((SELECT role FROM public.profiles pr WHERE pr.id = auth.uid()::uuid) = 'admin'))
  WITH CHECK (added_by = auth.uid()::uuid OR ((SELECT role FROM public.profiles pr WHERE pr.id = auth.uid()::uuid) = 'admin'));

-- Activity logs: allow insert by authenticated users; select by department or admin
DROP POLICY IF EXISTS insert_activity_logs_by_profile ON public.activity_logs;
CREATE POLICY insert_activity_logs_by_profile ON public.activity_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS select_activity_logs_by_department ON public.activity_logs;
CREATE POLICY select_activity_logs_by_department ON public.activity_logs
  FOR SELECT
  USING (
    (user_id = auth.uid()::uuid)
    OR ((SELECT role FROM public.profiles pr WHERE pr.id = auth.uid()::uuid) = 'admin')
  );

-- Shifts/shift_sessions policies (reuse earlier logic)
DROP POLICY IF EXISTS select_shifts_for_user ON public.shifts;
CREATE POLICY select_shifts_for_user ON public.shifts
  FOR SELECT
  USING (
    (assigned_user_id = auth.uid()::uuid)
    -- users can see a shift if they are assigned or if they are admin
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

DROP POLICY IF EXISTS insert_shifts_for_user ON public.shifts;
CREATE POLICY insert_shifts_for_user ON public.shifts
  FOR INSERT
  WITH CHECK (
    -- allow insert if assigning self or if admin
    (assigned_user_id = auth.uid()::uuid)
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

DROP POLICY IF EXISTS update_shifts_for_assignee_or_admin ON public.shifts;
CREATE POLICY update_shifts_for_assignee_or_admin ON public.shifts
  FOR UPDATE
  USING (
    (assigned_user_id = auth.uid()::uuid)
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  )
  WITH CHECK (
    (assigned_user_id = auth.uid()::uuid)
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

DROP POLICY IF EXISTS delete_shifts_admin_only ON public.shifts;
CREATE POLICY delete_shifts_admin_only ON public.shifts
  FOR DELETE
  USING (
    ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

DROP POLICY IF EXISTS insert_own_shift_session ON public.shift_sessions;
CREATE POLICY insert_own_shift_session ON public.shift_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS update_own_shift_session ON public.shift_sessions;
CREATE POLICY update_own_shift_session ON public.shift_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS select_shift_sessions_for_user ON public.shift_sessions;

CREATE POLICY select_shift_sessions_for_user ON public.shift_sessions
  FOR SELECT
  USING (
    (user_id = auth.uid()::uuid)
    -- allow users to see their own sessions or sessions for shifts where they are the assigned user
    OR (shift_id IN (SELECT id FROM public.shifts s WHERE s.assigned_user_id = auth.uid()::uuid))
  );

-- 8) Heartbeat and session helpers
CREATE OR REPLACE FUNCTION public.heartbeat_shift_session(p_shift_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.shift_sessions(user_id, shift_id, last_seen_at, is_active, created_at)
  VALUES (auth.uid()::uuid, p_shift_id, now(), true, now())
  ON CONFLICT (user_id, shift_id) DO UPDATE
    SET last_seen_at = now(), is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_shift_sessions(max_age_seconds int DEFAULT 30)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  cutoff timestamptz := now() - (max_age_seconds || ' seconds')::interval;
  expired_count int;
BEGIN
  UPDATE public.shift_sessions
  SET is_active = false
  WHERE last_seen_at < cutoff AND is_active = true;
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_shift_sessions(max_age_seconds int DEFAULT 3600)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  cutoff timestamptz := now() - (max_age_seconds || ' seconds')::interval;
  deleted_count int;
BEGIN
  DELETE FROM public.shift_sessions
  WHERE last_seen_at < cutoff;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 9) Example seed data (optional)
INSERT INTO public.profiles (id, full_name, username, department, role, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Admin User', 'admin', 'Administration', 'admin', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, department, role, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Dr Labi', 'dr.labi', 'Cardiology', 'doctor', true)
ON CONFLICT (id) DO NOTHING;

-- Create a sample shift
INSERT INTO public.shifts (id, start, "end", assigned_user_id, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, now(), now() + interval '8 hours', '22222222-2222-2222-2222-222222222222'::uuid, 'open')
ON CONFLICT (id) DO NOTHING;

-- Done

-- Notes:
--  * Run this script as the project owner in Supabase SQL editor.
--  * Realtime should be enabled for the public schema to use realtime subscriptions.
--  * Tune expiry/heartbeat intervals to your requirements.