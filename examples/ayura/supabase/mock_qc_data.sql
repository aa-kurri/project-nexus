-- Insert dummy analyser and sample QC runs for Glucose
DO $$
DECLARE
  v_tenant_id UUID;
  v_analyser_id UUID;
  v_glucose_mean NUMERIC := 105.0;
  v_glucose_sd NUMERIC := 3.0;
  v_i INT;
  v_val NUMERIC;
BEGIN
  -- Get the first available tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  -- Create a dummy analyser if it doesn't exist
  INSERT INTO lims_analysers (tenant_id, name, model, serial_no, department)
  VALUES (v_tenant_id, 'Roche Cobas c311', 'Cobas c311', 'SN-2026-ROC', 'Biochemistry')
  ON CONFLICT (tenant_id, serial_no) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_analyser_id;

  -- Create QC target for Glucose
  INSERT INTO lims_qc_targets (tenant_id, analyser_id, analyte_code, analyte_name, unit, level, target_mean, target_sd)
  VALUES (v_tenant_id, v_analyser_id, 'GLU', 'Glucose', 'mg/dL', 'L1', v_glucose_mean, v_glucose_sd)
  ON CONFLICT DO NOTHING;

  -- Insert 20 runs with some variation, including one that breaks 2s and one that breaks 3s
  FOR v_i IN 1..20 LOOP
    -- Random value around mean +/- 1.5 SD
    v_val := v_glucose_mean + (random() * 2 - 1) * (v_glucose_sd * 1.5);
    
    -- Inject a 2s warning at run 15
    IF v_i = 15 THEN
      v_val := v_glucose_mean + (v_glucose_sd * 2.2);
    END IF;
    
    -- Inject a 3s error at run 19
    IF v_i = 19 THEN
      v_val := v_glucose_mean - (v_glucose_sd * 3.5);
    END IF;

    INSERT INTO lims_qc_results (
      tenant_id, analyser_id, analyte_code, level, run_number, value, mean, sd, run_at, accepted
    ) VALUES (
      v_tenant_id, v_analyser_id, 'GLU', 'L1', v_i, v_val, v_glucose_mean, v_glucose_sd, 
      NOW() - ((21 - v_i) * interval '12 hours'),
      CASE WHEN v_i = 19 THEN false ELSE true END
    );
  END LOOP;
END $$;
