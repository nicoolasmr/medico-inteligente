-- Users
CREATE INDEX idx_users_clinic ON users(clinic_id);

-- Patients — busca full-text e recência
CREATE INDEX idx_patients_clinic      ON patients(clinic_id);
CREATE INDEX idx_patients_last_visit  ON patients(clinic_id, last_visit_at DESC NULLS LAST);
CREATE INDEX idx_patients_name_trgm   ON patients USING GIN(name gin_trgm_ops);

-- Appointments — agenda semanal
CREATE INDEX idx_appts_clinic_date  ON appointments(clinic_id, scheduled_at DESC);
CREATE INDEX idx_appts_patient      ON appointments(patient_id);
CREATE INDEX idx_appts_status       ON appointments(clinic_id, status);

-- Treatments — Kanban por stage
CREATE INDEX idx_trtmts_clinic_stage ON treatments(clinic_id, stage);
CREATE INDEX idx_trtmts_patient      ON treatments(patient_id);

-- Payments — financeiro
CREATE INDEX idx_payments_clinic_status ON payments(clinic_id, status);
CREATE INDEX idx_payments_clinic_date   ON payments(clinic_id, paid_at DESC NULLS LAST);

-- Automations
CREATE INDEX idx_automations_clinic  ON automations(clinic_id, is_active);
CREATE INDEX idx_auto_logs_clinic    ON automation_logs(clinic_id, created_at DESC);

-- Insights
CREATE INDEX idx_insights_clinic ON ai_insights(clinic_id, generated_at DESC);
