-- Realtime and presence setup for Shift Management app
-- Creates profiles, shifts, shift_sessions; RLS policies; heartbeat and expiry functions; indexes; example seeds

-- 1) Profiles table (map auth.uid() -> profile data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  username text,
  department text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- 2) Shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start timestamptz NOT NULL,
  "end" timestamptz,
  assigned_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'open',
  payload jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Ensure column exists for older schemas where shifts may not have assigned_user_id
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure all other columns used by the INSERT exist (safe, nullable/defaults where appropriate)
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS "start" timestamptz;

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS "end" timestamptz;


ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Some older schemas may have extra columns on `shifts` (e.g. user_name) that are NOT NULL.
-- Make sure those columns exist and are nullable (drop NOT NULL) so our sample INSERT won't fail.
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS user_name text;

-- If the column exists and is NOT NULL, make it nullable so INSERT without user_name succeeds.
ALTER TABLE public.shifts
  ALTER COLUMN user_name DROP NOT NULL;

-- 3) Presence / sessions table
CREATE TABLE IF NOT EXISTS public.shift_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, shift_id)
);

-- 4) Enable RLS on shifts and shift_sessions
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_sessions ENABLE ROW LEVEL SECURITY;

-- 5) Policies for shifts
-- SELECT: user can see shift if they are assigned, in same department, or admin
DROP POLICY IF EXISTS select_shifts_for_user ON public.shifts;
CREATE POLICY select_shifts_for_user ON public.shifts
  FOR SELECT
  USING (
    (assigned_user_id = auth.uid()::uuid)
    OR (department = (SELECT department FROM public.profiles p WHERE p.id = auth.uid()::uuid))
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

-- INSERT: allow creating shifts for own department or admin
DROP POLICY IF EXISTS insert_shifts_for_user ON public.shifts;
CREATE POLICY insert_shifts_for_user ON public.shifts
  FOR INSERT
  WITH CHECK (
    (department = (SELECT department FROM public.profiles p WHERE p.id = auth.uid()::uuid))
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

-- UPDATE: allow update if assigned or admin
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

-- DELETE: only admins
DROP POLICY IF EXISTS delete_shifts_admin_only ON public.shifts;
CREATE POLICY delete_shifts_admin_only ON public.shifts
  FOR DELETE
  USING (
    ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

-- 6) Policies for shift_sessions
-- Insert only for own user
DROP POLICY IF EXISTS insert_own_shift_session ON public.shift_sessions;
CREATE POLICY insert_own_shift_session ON public.shift_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- Update only for own user
DROP POLICY IF EXISTS update_own_shift_session ON public.shift_sessions;
CREATE POLICY update_own_shift_session ON public.shift_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

-- Select: allow user to see own sessions and sessions for shifts in their department
DROP POLICY IF EXISTS select_shift_sessions_for_user ON public.shift_sessions;
CREATE POLICY select_shift_sessions_for_user ON public.shift_sessions
  FOR SELECT
  USING (
    (user_id = auth.uid()::uuid)
    OR (shift_id IN (SELECT id FROM public.shifts s WHERE s.assigned_user_id = auth.uid()::uuid))
    OR ((SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid) = 'admin')
  );

-- 7) Heartbeat RPC (upsert)
CREATE OR REPLACE FUNCTION public.heartbeat_shift_session(p_shift_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.shift_sessions(user_id, shift_id, last_seen_at, is_active)
  VALUES (auth.uid()::uuid, p_shift_id, now(), true)
  ON CONFLICT (user_id, shift_id) DO UPDATE
    SET last_seen_at = now(), is_active = true;
END;
$$;

-- 8) Expire sessions (mark inactive)
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

-- 9) Cleanup old sessions (delete)
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

-- 10) Indexes
CREATE INDEX IF NOT EXISTS idx_shift_sessions_user_id ON public.shift_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_shift_id ON public.shift_sessions(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_last_seen_at ON public.shift_sessions(last_seen_at);
-- shifts no longer contain department/location; indexed fields should be added as needed (e.g., assigned_user_id)
CREATE INDEX IF NOT EXISTS idx_shifts_assigned_user_id ON public.shifts(assigned_user_id);

-- 11) Patients table (used by the app)
-- This creates a canonical patients table and a trigger to keep `updated_at` fresh.
-- Adjust constraints/defaults to match your production needs before running in prod.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  birth_year integer NOT NULL,
  gender text NOT NULL,
  country text NOT NULL,
  room_number text NOT NULL,
  department text NOT NULL,
  condition text NOT NULL,
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
  risk_factors jsonb DEFAULT '{"obesity": false, "smoking": false, "diabetes": false, "dyslipidemia": false, "hypertension": false}',
  pci_access jsonb DEFAULT '{"radial": false, "femoral": false, "periproceduralHeparin": false}',
  added_by text NOT NULL,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT patients_gender_check CHECK (gender = ANY (ARRAY['Male','Female'])),
  CONSTRAINT patients_priority_check CHECK (priority = ANY (ARRAY['Low','Medium','High','Critical'])),
  CONSTRAINT patients_status_check CHECK (status = ANY (ARRAY['active','discharged','deceased']))
);

CREATE INDEX IF NOT EXISTS patients_department_idx ON public.patients(department);
CREATE INDEX IF NOT EXISTS patients_status_idx ON public.patients(status);
CREATE INDEX IF NOT EXISTS patients_added_at_idx ON public.patients(added_at);

-- Ensure trigger exists to update `updated_at` automatically
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 12) Example seed data (adjust ids as needed)
-- Insert two example profiles (use existing auth.uids in production)
INSERT INTO public.profiles (id, full_name, username, department, role)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Admin User', 'admin', 'Administration', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, department, role)
VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Dr Labi', 'dr.labi', 'Cardiology', 'doctor')
ON CONFLICT (id) DO NOTHING;

-- Insert a sample shift for Cardiology
INSERT INTO public.shifts (id, start, "end", assigned_user_id, status, payload)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, now(), now() + interval '8 hours', '22222222-2222-2222-2222-222222222222'::uuid, 'open', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Done

-- Notes:
--  * Ensure your Supabase project has Realtime enabled for the public schema/tables.
--  * You may want to replace auth.uid()::uuid checks with JWT claim checks if you store department/role in token.
--  * Adjust expiry intervals (30s heartbeat/expiry) for your desired freshness and cost tradeoffs.
