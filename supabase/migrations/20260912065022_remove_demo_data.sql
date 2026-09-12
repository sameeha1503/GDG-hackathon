-- Delete pre-loaded demo data across all three modules
DELETE FROM public.request_notifications WHERE donor_id IN (SELECT id FROM public.donors WHERE donor_code LIKE 'DN-1%');
DELETE FROM public.blood_requests WHERE request_code LIKE 'BR-5%';
DELETE FROM public.donors WHERE donor_code LIKE 'DN-1%';
DELETE FROM public.care_records WHERE record_id IN ('RL-8H2K4M', 'RL-5T9P1C', 'RL-3Q7W6D', 'RL-9B4N2X');
DELETE FROM public.reminder_log WHERE patient_id IN (SELECT id FROM public.patients WHERE patient_code LIKE 'NSC-24%');
DELETE FROM public.patients WHERE patient_code LIKE 'NSC-24%';
