-- Habilitar RLS
ALTER TABLE clinics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_interactions ENABLE ROW LEVEL SECURITY;

-- Helper: retorna clinic_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_clinic_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$;

-- Policies: cada tabela isolada por clinic_id
CREATE POLICY p_clinics ON clinics FOR SELECT
  USING (id = auth_clinic_id());

CREATE POLICY p_users ON users FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_patients ON patients FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_appointments ON appointments FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_treatments ON treatments FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_payments ON payments FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_automations ON automations FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_auto_logs ON automation_logs FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_ai_insights ON ai_insights FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());

CREATE POLICY p_interactions ON patient_interactions FOR ALL
  USING (clinic_id = auth_clinic_id())
  WITH CHECK (clinic_id = auth_clinic_id());
