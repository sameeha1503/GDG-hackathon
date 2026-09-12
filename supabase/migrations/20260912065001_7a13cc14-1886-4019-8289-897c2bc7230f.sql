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

-- ---------- demo data ----------
INSERT INTO public.patients (id, patient_code, name, phone_number, preferred_language, district, phc, screening_date, status, confirmed_result, report_reference, closed_at) VALUES
 ('11111111-1111-4111-8111-000000000001','NSC-2401','Sunita Netam','9812300001','hi','Bastar','Kondagaon PHC', CURRENT_DATE - 2,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000002','NSC-2402','Ramesh Majhi','9812300002','or','Kalahandi','Bhawanipatna PHC', CURRENT_DATE - 5,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000003','NSC-2403','Kiran Pawara','9812300003','mr','Nandurbar','Akkalkuwa PHC', CURRENT_DATE - 9,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000004','NSC-2404','Devkiben Damor','9812300004','gu','Dahod','Garbada PHC', CURRENT_DATE - 12,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000005','NSC-2405','Anil Bhagat','9812300005','hi','Jhabua','Meghnagar PHC', CURRENT_DATE - 16,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000006','NSC-2406','Laxmi Oram','9812300006','or','Sundargarh','Rajgangpur PHC', CURRENT_DATE - 19,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000007','NSC-2407','Mangal Vasave','9812300007','mr','Nandurbar','Dhadgaon PHC', CURRENT_DATE - 24,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000008','NSC-2408','Phulwanti Korram','9812300008','hi','Bastar','Narayanpur PHC', CURRENT_DATE - 31,'awaiting_confirmation',NULL,NULL,NULL),
 ('11111111-1111-4111-8111-000000000009','NSC-2409','Jagdish Patel','9812300009','gu','Dahod','Limkheda PHC', CURRENT_DATE - 21,'confirmed_unverified',NULL,NULL, now() - interval '3 days'),
 ('11111111-1111-4111-8111-000000000010','NSC-2410','Savitri Munda','9812300010','or','Sundargarh','Bonai PHC', CURRENT_DATE - 27,'confirmed_unverified',NULL,NULL, now() - interval '5 days'),
 ('11111111-1111-4111-8111-000000000011','NSC-2411','Deepa Markam','9812300011','hi','Bastar','Jagdalpur PHC', CURRENT_DATE - 34,'confirmed_documented','Non-carrier','HPLC/BST/1182', now() - interval '20 days'),
 ('11111111-1111-4111-8111-000000000012','NSC-2412','Sanjay Gond','9812300012','hi','Jhabua','Thandla PHC', CURRENT_DATE - 40,'confirmed_documented','Carrier','HPLC/JHB/0774', now() - interval '25 days'),
 ('11111111-1111-4111-8111-000000000013','NSC-2413','Rina Tudu','9812300013','or','Kalahandi','Junagarh PHC', CURRENT_DATE - 46,'confirmed_documented','Disease','HPLC/KLH/0431', now() - interval '30 days'),
 ('11111111-1111-4111-8111-000000000014','NSC-2414','Pratik Valvi','9812300014','mr','Nandurbar','Shahada PHC', CURRENT_DATE - 52,'confirmed_documented','Disease','HPLC/NDB/0298', now() - interval '35 days'),
 ('11111111-1111-4111-8111-000000000015','NSC-2415','Hetal Bariya','9812300015','gu','Dahod','Devgadh Baria PHC', CURRENT_DATE - 60,'confirmed_documented','Disease','HPLC/DHD/0155', now() - interval '40 days');

INSERT INTO public.reminder_log (patient_id, channel, language, message, sent_at) VALUES
 ('11111111-1111-4111-8111-000000000005','SMS','hi','नमस्ते, आपकी सिकल सेल पुष्टि जांच (HPLC) अभी बाकी है। कृपया अपने नजदीकी जिला अस्पताल में जाएँ। - NSCAEM', now() - interval '6 days'),
 ('11111111-1111-4111-8111-000000000006','IVR','or','ନମସ୍କାର, ଆପଣଙ୍କ ସିକଲ ସେଲ ନିଶ୍ଚିତକରଣ ପରୀକ୍ଷା (HPLC) ବାକି ଅଛି। ଦୟାକରି ଜିଲ୍ଲା ଡାକ୍ତରଖାନାକୁ ଯାଆନ୍ତୁ। - NSCAEM', now() - interval '4 days'),
 ('11111111-1111-4111-8111-000000000007','SMS','mr','नमस्कार, तुमची सिकल सेल निश्चिती चाचणी (HPLC) प्रलंबित आहे. कृपया जिल्हा रुग्णालयात भेट द्या. - NSCAEM', now() - interval '9 days'),
 ('11111111-1111-4111-8111-000000000008','SMS','hi','नमस्ते, आपकी सिकल सेल पुष्टि जांच (HPLC) अभी बाकी है। कृपया अपने नजदीकी जिला अस्पताल में जाएँ। - NSCAEM', now() - interval '14 days');

INSERT INTO public.care_records (record_id, patient_id, mock_abha_id, confirmed_result, confirmatory_status, treatment_status, last_updated_facility, last_updated_date) VALUES
 ('RL-8H2K4M','11111111-1111-4111-8111-000000000011','12-3456-7890-1101 (simulated)','Non-carrier','confirmed_documented','No treatment required','District Hospital, Jagdalpur', now() - interval '18 days'),
 ('RL-5T9P1C','11111111-1111-4111-8111-000000000012','12-3456-7890-1102 (simulated)','Carrier','confirmed_documented','Counselling completed','District Hospital, Jhabua', now() - interval '22 days'),
 ('RL-3Q7W6D','11111111-1111-4111-8111-000000000013','12-3456-7890-1103 (simulated)','Disease','confirmed_documented','Hydroxyurea, folic acid; last transfusion 6 weeks ago','District Hospital, Bhawanipatna', now() - interval '9 days'),
 ('RL-9B4N2X','11111111-1111-4111-8111-000000000014','12-3456-7890-1104 (simulated)','Disease','confirmed_documented','Hydroxyurea; on transfusion support','Civil Hospital, Nandurbar', now() - interval '4 days');

INSERT INTO public.donors (id, donor_code, blood_group, general_location, distance_km, availability_status, past_donation_count, response_rate, private_phone) VALUES
 ('22222222-2222-4222-8222-000000000001','DN-1001','O+','Bhawanipatna town',2.1,'Available',7,0.86,'9800000001'),
 ('22222222-2222-4222-8222-000000000002','DN-1002','O+','Junagarh block',8.4,'Available',3,0.62,'9800000002'),
 ('22222222-2222-4222-8222-000000000003','DN-1003','O-','Bhawanipatna town',3.6,'Contact via blood bank',12,0.74,'9800000003'),
 ('22222222-2222-4222-8222-000000000004','DN-1004','A+','Kesinga block',14.2,'Available',5,0.55,'9800000004'),
 ('22222222-2222-4222-8222-000000000005','DN-1005','B+','Bhawanipatna town',4.0,'Currently unavailable',9,0.90,'9800000005'),
 ('22222222-2222-4222-8222-000000000006','DN-1006','O+','Kesinga block',17.5,'Available',1,0.40,'9800000006'),
 ('22222222-2222-4222-8222-000000000007','DN-1007','AB+','Nandurbar town',2.8,'Available',4,0.70,'9800000007'),
 ('22222222-2222-4222-8222-000000000008','DN-1008','A+','Nandurbar town',5.5,'Available',10,0.81,'9800000008'),
 ('22222222-2222-4222-8222-000000000009','DN-1009','A-','Shahada block',12.9,'Contact via blood bank',6,0.58,'9800000009'),
 ('22222222-2222-4222-8222-000000000010','DN-1010','B-','Dahod town',3.2,'Available',2,0.66,'9800000010'),
 ('22222222-2222-4222-8222-000000000011','DN-1011','O+','Dahod town',6.7,'Available',8,0.78,'9800000011'),
 ('22222222-2222-4222-8222-000000000012','DN-1012','AB-','Limkheda block',19.4,'Currently unavailable',3,0.35,'9800000012');

INSERT INTO public.blood_requests (id, request_code, patient_id, blood_group_needed, component, units_needed, hospital_name, required_by, urgency_level, notification_round, status, confirmed_donor_id, created_at) VALUES
 ('33333333-3333-4333-8333-000000000001','BR-5001','11111111-1111-4111-8111-000000000013','O+','Packed red cells',2,'District Hospital, Bhawanipatna', CURRENT_DATE + 1,'Emergency',1,'open',NULL, now() - interval '2 hours'),
 ('33333333-3333-4333-8333-000000000002','BR-5002','11111111-1111-4111-8111-000000000014','A+','Packed red cells',1,'Civil Hospital, Nandurbar', CURRENT_DATE + 3,'Urgent',2,'open',NULL, now() - interval '1 day'),
 ('33333333-3333-4333-8333-000000000003','BR-5003','11111111-1111-4111-8111-000000000015','B-','Packed red cells',1,'District Hospital, Dahod', CURRENT_DATE + 6,'Routine',3,'confirmed','22222222-2222-4222-8222-000000000010', now() - interval '3 days');

INSERT INTO public.request_notifications (request_id, donor_id, round, response, sent_at) VALUES
 ('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000001',1,'pending', now() - interval '2 hours'),
 ('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000003',1,'pending', now() - interval '2 hours'),
 ('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000008',1,'declined', now() - interval '1 day'),
 ('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000007',2,'pending', now() - interval '20 hours'),
 ('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000009',2,'pending', now() - interval '20 hours'),
 ('33333333-3333-4333-8333-000000000003','22222222-2222-4222-8222-000000000010',3,'accepted', now() - interval '2 days');