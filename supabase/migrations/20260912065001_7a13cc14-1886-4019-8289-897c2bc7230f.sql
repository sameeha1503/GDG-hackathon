-- roles
CREATE TYPE public.app_role AS ENUM ('health_worker', 'blood_bank');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  facility text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- module 1
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code text NOT NULL UNIQUE,
  name text NOT NULL,
  phone_number text NOT NULL,
  preferred_language text NOT NULL DEFAULT 'hi',
  district text NOT NULL,
  phc text NOT NULL,
  screening_date date NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_confirmation'
    CHECK (status IN ('awaiting_confirmation','confirmed_unverified','confirmed_documented')),
  confirmed_result text CHECK (confirmed_result IN ('Non-carrier','Carrier','Disease')),
  report_reference text,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update patients" ON public.patients FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'SMS' CHECK (channel IN ('SMS','IVR')),
  language text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid
);
GRANT SELECT, INSERT ON public.reminder_log TO authenticated;
GRANT ALL ON public.reminder_log TO service_role;
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read reminders" ON public.reminder_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert reminders" ON public.reminder_log FOR INSERT TO authenticated WITH CHECK (true);

-- module 2
CREATE TABLE public.care_records (
  record_id text PRIMARY KEY,
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  mock_abha_id text NOT NULL,
  confirmed_result text NOT NULL,
  confirmatory_status text NOT NULL,
  treatment_status text NOT NULL DEFAULT 'Not started',
  last_updated_facility text NOT NULL,
  last_updated_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.care_records TO authenticated;
GRANT ALL ON public.care_records TO service_role;
ALTER TABLE public.care_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read records" ON public.care_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert records" ON public.care_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update records" ON public.care_records FOR UPDATE TO authenticated USING (true);

-- module 3
CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_code text NOT NULL UNIQUE,
  blood_group text NOT NULL,
  general_location text NOT NULL,
  distance_km numeric NOT NULL DEFAULT 5,
  availability_status text NOT NULL DEFAULT 'Available'
    CHECK (availability_status IN ('Available','Contact via blood bank','Currently unavailable')),
  past_donation_count int NOT NULL DEFAULT 0,
  response_rate numeric NOT NULL DEFAULT 0.5,
  private_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.donors TO authenticated;
GRANT ALL ON public.donors TO service_role;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read donors" ON public.donors FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert donors" ON public.donors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update donors" ON public.donors FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  blood_group_needed text NOT NULL,
  component text NOT NULL DEFAULT 'Packed red cells',
  units_needed int NOT NULL DEFAULT 1,
  hospital_name text NOT NULL,
  required_by date NOT NULL,
  urgency_level text NOT NULL DEFAULT 'Routine' CHECK (urgency_level IN ('Emergency','Urgent','Routine')),
  notification_round int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','closed')),
  confirmed_donor_id uuid REFERENCES public.donors(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.blood_requests TO authenticated;
GRANT ALL ON public.blood_requests TO service_role;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read requests" ON public.blood_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert requests" ON public.blood_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update requests" ON public.blood_requests FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.request_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  round int NOT NULL DEFAULT 1,
  response text NOT NULL DEFAULT 'pending' CHECK (response IN ('pending','accepted','declined')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, donor_id)
);
GRANT SELECT, INSERT, UPDATE ON public.request_notifications TO authenticated;
GRANT ALL ON public.request_notifications TO service_role;
ALTER TABLE public.request_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notifications" ON public.request_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert notifications" ON public.request_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update notifications" ON public.request_notifications FOR UPDATE TO authenticated USING (true);