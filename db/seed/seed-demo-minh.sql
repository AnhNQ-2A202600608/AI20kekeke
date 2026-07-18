-- ============================================================================
-- Golden happy-case demo seed | Học sinh Trần Minh (lớp 7)
-- Sinh tự động bởi scripts/seed_demo_minh.py — KHÔNG sửa tay.
-- Target: Supabase PostgreSQL. Re-run safe: YES (idempotent).
-- Kịch bản: hổng gốc rễ 'Tính chất cơ bản của phân số' (lớp 5).
-- ============================================================================

BEGIN;

-- 1. Học sinh demo -------------------------------------------------------------
INSERT INTO app.users (id, email, full_name, status, mssv) VALUES
  ('d3b07384-d113-4ec5-a58e-0f2d87e07777', 'minh.demo@edugap.vn', 'Trần Minh', 'active', '2A202600777')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, mssv = EXCLUDED.mssv;

UPDATE app.users SET is_demo_account = true, demo_profile_key = 'full_flow_v1'
 WHERE id = 'd3b07384-d113-4ec5-a58e-0f2d87e07777';

INSERT INTO app.course_members (course_id, user_id, role_code, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'd3b07384-d113-4ec5-a58e-0f2d87e07777', 'student', 'active')
ON CONFLICT (course_id, user_id, role_code) DO NOTHING;

-- 2. Concepts (nodes của đồ thị tri thức) --------------------------------------
INSERT INTO app.concepts (id, course_id, code, name, description, status) VALUES
  ('c929d4ca-6249-5950-97dd-2b435a00c3cb', '00000000-0000-0000-0000-000000000001', 'ti-le-thuc', 'Tỉ lệ thức', 'Vận dụng tính chất tỉ lệ thức và đại lượng tỉ lệ thuận', 'active'::app.concept_status),
  ('9e304aa0-8587-5e90-8885-0039dd48a24e', '00000000-0000-0000-0000-000000000001', 'ti-so', 'Tỉ số', 'Hiểu và tính tỉ số của hai đại lượng', 'active'::app.concept_status),
  ('4393c213-f983-56d4-bc3f-5d7d82c8b00e', '00000000-0000-0000-0000-000000000001', 'tinh-chat-co-ban-cua-phan-so', 'Tính chất cơ bản của phân số', 'Tính chất cơ bản của phân số (nhân/chia cả tử và mẫu cho cùng một số khác 0)', 'active'::app.concept_status),
  ('069e6843-07d3-50ee-9fb8-c037dbfe3b9c', '00000000-0000-0000-0000-000000000001', 'phan-so', 'Phân số', 'Khái niệm phân số: tử số, mẫu số, mẫu khác 0', 'active'::app.concept_status),
  ('121e08a0-c5c7-52f5-a77a-b01741de360f', '00000000-0000-0000-0000-000000000001', 'rut-gon-phan-so', 'Rút gọn phân số', 'Rút gọn phân số về phân số tối giản', 'active'::app.concept_status),
  ('1de49150-3b65-5a1a-bdd1-a41494dab6b2', '00000000-0000-0000-0000-000000000001', 'phan-so-bang-nhau', 'Phân số bằng nhau', 'Nhận biết hai phân số bằng nhau bằng quy tắc tích chéo', 'active'::app.concept_status),
  ('658a5378-4f3e-5c56-bada-221b6b6355d9', '00000000-0000-0000-0000-000000000001', 'ti-so-phan-tram', 'Tỉ số phần trăm', 'Tính tỉ số phần trăm của hai đại lượng', 'active'::app.concept_status),
  ('693c88f8-1685-50f5-92dc-7afaaa38a254', '00000000-0000-0000-0000-000000000001', 'quy-dong-mau-nhieu-phan-so', 'Quy đồng mẫu nhiều phân số', 'Quy đồng mẫu nhiều phân số', 'active'::app.concept_status)
ON CONFLICT (course_id, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Quan hệ tiền quyết (source Prerequisite_of target) ------------------------
INSERT INTO app.concept_relations
  (id, course_id, source_concept_id, target_concept_id, relation_type, weight, status) VALUES
  ('40c3eda1-c035-506b-a472-59d9cef85241', '00000000-0000-0000-0000-000000000001', '9e304aa0-8587-5e90-8885-0039dd48a24e', 'c929d4ca-6249-5950-97dd-2b435a00c3cb', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- ti-so -[Prerequisite_of]-> ti-le-thuc
  ('f652f1b1-fd6e-5d39-af57-5db968226f33', '00000000-0000-0000-0000-000000000001', '4393c213-f983-56d4-bc3f-5d7d82c8b00e', '9e304aa0-8587-5e90-8885-0039dd48a24e', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- tinh-chat-co-ban-cua-phan-so -[Prerequisite_of]-> ti-so
  ('60294923-a08b-5177-9852-db870a6888d9', '00000000-0000-0000-0000-000000000001', '069e6843-07d3-50ee-9fb8-c037dbfe3b9c', '4393c213-f983-56d4-bc3f-5d7d82c8b00e', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- phan-so -[Prerequisite_of]-> tinh-chat-co-ban-cua-phan-so
  ('5d245010-62b3-5e3d-9b78-62cff9779210', '00000000-0000-0000-0000-000000000001', '4393c213-f983-56d4-bc3f-5d7d82c8b00e', '121e08a0-c5c7-52f5-a77a-b01741de360f', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- tinh-chat-co-ban-cua-phan-so -[Prerequisite_of]-> rut-gon-phan-so
  ('4b7af43c-c5f4-5973-8055-5b31ee0861b1', '00000000-0000-0000-0000-000000000001', '4393c213-f983-56d4-bc3f-5d7d82c8b00e', '1de49150-3b65-5a1a-bdd1-a41494dab6b2', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- tinh-chat-co-ban-cua-phan-so -[Prerequisite_of]-> phan-so-bang-nhau
  ('7fe6cca2-ad77-571f-9d95-c9243d239ca1', '00000000-0000-0000-0000-000000000001', '9e304aa0-8587-5e90-8885-0039dd48a24e', '658a5378-4f3e-5c56-bada-221b6b6355d9', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status),  -- ti-so -[Prerequisite_of]-> ti-so-phan-tram
  ('1073f20f-11d6-5e78-9d84-7081982954d6', '00000000-0000-0000-0000-000000000001', '069e6843-07d3-50ee-9fb8-c037dbfe3b9c', '693c88f8-1685-50f5-92dc-7afaaa38a254', 'Prerequisite_of'::app.concept_relation_type, 1.0, 'approved'::app.concept_relation_status)  -- phan-so -[Prerequisite_of]-> quy-dong-mau-nhieu-phan-so
ON CONFLICT (id) DO NOTHING;

-- 4. Mastery của Minh (mirror kết quả DiagnosticEngine) ------------------------
INSERT INTO app.student_concept_mastery
  (student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
   mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, updated_at) VALUES
  ('d3b07384-d113-4ec5-a58e-0f2d87e07777', '00000000-0000-0000-0000-000000000001', '069e6843-07d3-50ee-9fb8-c037dbfe3b9c', 1180.0, 0.95,
   'mastered'::app.mastery_state, false, 2, 2, now(), now()),
  ('d3b07384-d113-4ec5-a58e-0f2d87e07777', '00000000-0000-0000-0000-000000000001', '4393c213-f983-56d4-bc3f-5d7d82c8b00e', 1075.0, 0.169,
   'weak'::app.mastery_state, true, 2, 0, now(), now()),
  ('d3b07384-d113-4ec5-a58e-0f2d87e07777', '00000000-0000-0000-0000-000000000001', '9e304aa0-8587-5e90-8885-0039dd48a24e', 1100.0, 0.2,
   'weak'::app.mastery_state, true, 2, 0, now(), now()),
  ('d3b07384-d113-4ec5-a58e-0f2d87e07777', '00000000-0000-0000-0000-000000000001', 'c929d4ca-6249-5950-97dd-2b435a00c3cb', 1150.0, 0.22,
   'learning'::app.mastery_state, true, 2, 0, now(), now())
ON CONFLICT (student_id, course_id, concept_id) DO UPDATE SET
  elo_score = EXCLUDED.elo_score,
  bkt_mastery_probability = EXCLUDED.bkt_mastery_probability,
  mastery_state = EXCLUDED.mastery_state,
  weakness_flag = EXCLUDED.weakness_flag,
  attempt_count = EXCLUDED.attempt_count,
  correct_count = EXCLUDED.correct_count,
  last_practiced_at = EXCLUDED.last_practiced_at,
  updated_at = EXCLUDED.updated_at;

COMMIT;
