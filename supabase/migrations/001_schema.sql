-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- CLINICS (Tenant Root)
-- ==========================================
CREATE TABLE clinics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  plan       TEXT NOT NULL DEFAULT 'free'
               CHECK (plan IN ('free','starter','pro','enterprise')),
  logo_url   TEXT,
  phone      TEXT,
  address    TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  settings   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id  UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'doctor'
               CHECK (role IN ('owner','doctor','secretary','admin')),
  avatar_url TEXT,
  crm        TEXT,
  specialty  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- PATIENTS (CRM Core)
-- ==========================================
CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  birth_date    DATE,
  gender        TEXT CHECK (gender IN ('M','F','other')),
  cpf           TEXT,
  origin        TEXT,
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  last_visit_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- APPOINTMENTS (Agenda)
-- ==========================================
CREATE TABLE appointments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id      UUID REFERENCES users(id),
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_min   INT NOT NULL DEFAULT 30,
  type           TEXT,
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','confirmed','completed','cancelled', 'no_show')),
  notes          TEXT,
  reminder_sent  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- TREATMENTS (Pipeline Kanban)
-- ==========================================
CREATE TABLE treatments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  value         NUMERIC(12,2),
  stage         TEXT NOT NULL DEFAULT 'lead'
                   CHECK (stage IN (
                     'lead','consulta_realizada','tratamento_indicado',
                     'orcamento_enviado','aprovado','realizado'
                   )),
  stage_order   INT NOT NULL DEFAULT 0,
  probability   INT DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_date DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- PAYMENTS (Financeiro)
-- ==========================================
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id   UUID REFERENCES treatments(id),
  appointment_id UUID REFERENCES appointments(id),
  description    TEXT,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method         TEXT CHECK (method IN ('cash','pix','credit','debit','transfer','insurance')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','overdue','refunded','cancelled')),
  due_date       DATE,
  paid_at        TIMESTAMPTZ,
  receipt_url    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- AUTOMATIONS
-- ==========================================
CREATE TABLE automations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  trigger_event TEXT NOT NULL
                  CHECK (trigger_event IN (
                    'appointment_created','appointment_completed','appointment_cancelled',
                    'treatment_indicated','treatment_approved','payment_received',
                    'patient_no_return_30','patient_no_return_60','patient_no_return_90'
                  )),
  action_type   TEXT NOT NULL
                  CHECK (action_type IN ('whatsapp','sms','email','task','internal_notification')),
  config        JSONB NOT NULL DEFAULT '{}',
  delay_minutes INT DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  executions    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE automation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES automations(id),
  patient_id    UUID REFERENCES patients(id),
  trigger_event TEXT NOT NULL,
  action_type   TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','sent','failed')),
  response      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- AI INSIGHTS
-- ==========================================
CREATE TABLE ai_insights (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  impact       TEXT CHECK (impact IN ('high','medium','low')),
  data         JSONB,
  is_read      BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- PATIENT INTERACTIONS (Histórico CRM)
-- ==========================================
CREATE TABLE patient_interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id  UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  type       TEXT NOT NULL CHECK (type IN ('note','whatsapp','sms','email','call')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinics_upd   BEFORE UPDATE ON clinics   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_upd     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_upd  BEFORE UPDATE ON patients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appts_upd     BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trtmts_upd    BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_upd  BEFORE UPDATE ON payments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
