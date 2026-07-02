insert into facilities (id, name, code, facility_type, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Bamenda General', 'BMG', 'acute_care', 'active')
on conflict (id) do nothing;

insert into departments (id, facility_id, name, code)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Medical-Surgical', 'MEDSURG'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Emergency', 'ER')
on conflict (id) do nothing;

insert into rooms (id, facility_id, department_id, name, room_type)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '3B-12', 'inpatient'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'ER-04', 'emergency')
on conflict (id) do nothing;

insert into beds (id, facility_id, room_id, name, status)
values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Bed 2', 'occupied'),
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Bed 1', 'available')
on conflict (id) do nothing;

insert into patients (id, facility_id, mrn, account_number, first_name, last_name, dob, gender, code_status)
values
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'MRN-10482', 'ACC-10482', 'Amina', 'Njie', '1987-04-12', 'F', 'full'),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'MRN-10483', 'ACC-10483', 'Kofi', 'Agyemang', '1959-10-03', 'M', 'full')
on conflict (id) do nothing;

insert into patient_contacts (id, facility_id, patient_id, contact_type, full_name, phone, relationship)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'emergency', 'Binta Njie', '+237-650-000-001', 'Sibling')
on conflict (id) do nothing;

insert into patient_insurances (id, facility_id, patient_id, payer_name, plan_name, member_id, policy_number)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Mutuelle Santé', 'Prime Care', 'M-1001', 'POL-2001')
on conflict (id) do nothing;

insert into encounters (id, facility_id, patient_id, encounter_type, status, admitted_at)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'inpatient', 'active', now())
on conflict (id) do nothing;

insert into admissions (id, facility_id, encounter_id, patient_id, admission_status, admission_date, expected_discharge_date)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'admitted', now(), current_date + interval '2 days')
on conflict (id) do nothing;

insert into clinical_flags (id, facility_id, patient_id, encounter_id, flag_type, description, severity)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'fall_risk', 'History of falls', 'high')
on conflict (id) do nothing;

insert into allergies (id, facility_id, patient_id, substance, reaction, severity)
values
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Penicillin', 'Rash', 'moderate')
on conflict (id) do nothing;

insert into precautions (id, facility_id, patient_id, precaution_type, description)
values
  ('10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'isolation', 'Contact precautions')
on conflict (id) do nothing;

insert into diagnoses (id, facility_id, patient_id, encounter_id, diagnosis_code, diagnosis_name, status)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'E11.9', 'Type 2 diabetes mellitus', 'active')
on conflict (id) do nothing;

insert into medications (id, facility_id, patient_id, encounter_id, medication_name, route, frequency, status)
values
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Metformin 500mg', 'PO', 'BID', 'active')
on conflict (id) do nothing;

insert into orders (id, facility_id, patient_id, encounter_id, order_type, category, description, status, assigned_role, due_at)
values
  ('13131313-1313-1313-1313-131313131313', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'wound', 'wound', 'Dressing change every shift', 'active', 'NURSE', now() + interval '2 hours')
on conflict (id) do nothing;

insert into order_sets (id, facility_id, name, category)
values
  ('14141414-1414-1414-1414-141414141414', '11111111-1111-1111-1111-111111111111', 'Wound Care Admission', 'wound')
on conflict (id) do nothing;

insert into tasks (id, facility_id, patient_id, encounter_id, assigned_role, source_type, source_id, title, description, priority, due_at, status)
values
  ('15151515-1515-1515-1515-151515151515', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'NURSE', 'order', '13131313-1313-1313-1313-131313131313', 'Wound dressing due', 'Assess and complete dressing change', 'high', now() + interval '2 hours', 'pending')
on conflict (id) do nothing;

insert into worklists (id, facility_id, name, role_name)
values
  ('16161616-1616-1616-1616-161616161616', '11111111-1111-1111-1111-111111111111', 'Nurse Morning Worklist', 'NURSE')
on conflict (id) do nothing;

insert into nursing_assessments (id, facility_id, patient_id, encounter_id, assessment_type, assessment_value)
values
  ('17171717-1717-1717-1717-171717171717', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'braden_scale', '17')
on conflict (id) do nothing;

insert into flowsheet_templates (id, facility_id, name, description)
values
  ('18181818-1818-1818-1818-181818181818', '11111111-1111-1111-1111-111111111111', 'Vital Signs', 'Core vital signs flowsheet')
on conflict (id) do nothing;

insert into flowsheet_rows (id, facility_id, template_id, label, required_documentation)
values
  ('19191919-1919-1919-1919-191919191919', '11111111-1111-1111-1111-111111111111', '18181818-1818-1818-1818-181818181818', 'Temperature', true)
on conflict (id) do nothing;

insert into flowsheet_entries (id, facility_id, patient_id, encounter_id, row_id, entry_time, value, comment, signed, audit_ref)
values
  ('20202020-2020-2020-2020-202020202020', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '19191919-1919-1919-1919-191919191919', now(), '37.2', 'Stable', true, 'audit-001')
on conflict (id) do nothing;

insert into wounds (id, facility_id, patient_id, encounter_id, location, wound_type, stage, length_cm, width_cm, depth_cm, status)
values
  ('21212121-2121-2121-2121-212121212121', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Right heel', 'pressure injury', 'Stage 2', 4.5, 2.2, 1.1, 'open')
on conflict (id) do nothing;

insert into wound_assessments (id, facility_id, wound_id, assessment_time, drainage, odor, pain_score, provider_notified)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '21212121-2121-2121-2121-212121212121', now(), 'small', 'none', 3, true)
on conflict (id) do nothing;

insert into wound_photos (id, facility_id, wound_id, file_path)
values
  ('23232323-2323-2323-2323-232323232323', '11111111-1111-1111-1111-111111111111', '21212121-2121-2121-2121-212121212121', '/photos/wound-10482.jpg')
on conflict (id) do nothing;

insert into wound_orders (id, facility_id, wound_id, order_id, dressing_type, frequency, follow_up_date)
values
  ('24242424-2424-2424-2424-242424242424', '11111111-1111-1111-1111-111111111111', '21212121-2121-2121-2121-212121212121', '13131313-1313-1313-1313-131313131313', 'Foam dressing', 'Every shift', current_date + interval '7 days')
on conflict (id) do nothing;

insert into body_map_markers (id, facility_id, patient_id, encounter_id, marker_type, body_region, laterality, view_type, x_position, y_position, severity, status, linked_entity_type, linked_entity_id, created_by)
values
  ('25252525-2525-2525-2525-252525252525', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pressure injury', 'heel', 'right', 'posterior', 42, 78, 'moderate', 'active', 'wound', '21212121-2121-2121-2121-212121212121', 'nurse-1')
on conflict (id) do nothing;

insert into clinical_notes (id, facility_id, patient_id, encounter_id, note_type, status, content, created_by)
values
  ('26262626-2626-2626-2626-262626262626', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'nursing_note', 'signed', 'Initial nursing assessment completed and wound dressing plan reviewed.', 'nurse-1')
on conflict (id) do nothing;

insert into care_plans (id, facility_id, patient_id, encounter_id, title, status)
values
  ('27272727-2727-2727-2727-272727272727', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pressure injury prevention', 'active')
on conflict (id) do nothing;

insert into education_records (id, facility_id, patient_id, encounter_id, topic, delivered_by)
values
  ('28282828-2828-2828-2828-282828282828', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Wound care education', 'nurse-1')
on conflict (id) do nothing;

insert into documents (id, facility_id, patient_id, encounter_id, document_type, file_path, uploaded_by)
values
  ('29292929-2929-2929-2929-292929292929', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'consent', '/documents/consent-10482.pdf', 'reception-1')
on conflict (id) do nothing;

insert into blood_administration_records (id, facility_id, patient_id, encounter_id, blood_product, status)
values
  ('30303030-3030-3030-3030-303030303030', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Packed RBC', 'ordered')
on conflict (id) do nothing;

insert into transfusion_checks (id, facility_id, blood_record_id, check_type, completed)
values
  ('31313131-3131-3131-3131-313131313131', '11111111-1111-1111-1111-111111111111', '30303030-3030-3030-3030-303030303030', 'blood_consent', true)
on conflict (id) do nothing;

insert into procedure_checklists (id, facility_id, patient_id, encounter_id, checklist_name, completed)
values
  ('32323232-3232-3232-3232-323232323232', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Admission checklist', true)
on conflict (id) do nothing;

insert into discharge_plans (id, facility_id, patient_id, encounter_id, expected_discharge_date, expected_discharge_time, status)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + interval '2 days', '14:00', 'pending')
on conflict (id) do nothing;

insert into team_conferences (id, facility_id, patient_id, encounter_id, topic, note)
values
  ('34343434-3434-3434-3434-343434343434', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Daily rounding', 'Wound plan updated and discharge readiness reviewed.')
on conflict (id) do nothing;

insert into audit_logs (id, facility_id, patient_id, actor_role, actor_user_id, action, entity_type, entity_id, details)
values
  ('35353535-3535-3535-3535-353535353535', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'NURSE', 'nurse-1', 'created', 'task', '15151515-1515-1515-1515-151515151515', '{"source":"seed"}'::jsonb)
on conflict (id) do nothing;
