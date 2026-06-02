-- Función RPC para insertar un Lead y su reporte de diagnóstico asociado en una transacción segura
CREATE OR REPLACE FUNCTION public.create_lead_with_diagnostic(
    p_full_name TEXT,
    p_company_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_position TEXT,
    p_city TEXT,
    p_service_type TEXT,
    p_environment_type TEXT,
    p_urgency_level TEXT,
    p_status TEXT,
    p_source TEXT,
    p_estimated_budget_min INTEGER,
    p_estimated_budget_max INTEGER,
    p_complexity_score INTEGER,
    p_severity_score INTEGER,
    p_notes TEXT,
    p_lead_score INTEGER,
    p_risk_level TEXT,
    p_airflow INTEGER,
    p_dimensions JSONB,
    p_technical_observations TEXT,
    p_material_suggestions TEXT,
    p_inspection_protocol TEXT,
    p_recommendations TEXT,
    p_currency TEXT
) RETURNS jsonb AS $$
DECLARE
    new_lead_id uuid;
    result jsonb;
BEGIN
    -- 1. Insertar el Lead
    INSERT INTO public.leads (
        full_name, company_name, email, phone, position, city, service_type, 
        environment_type, urgency_level, status, source, estimated_budget_min, 
        estimated_budget_max, complexity_score, severity_score, notes, 
        lead_score, risk_level
    ) VALUES (
        p_full_name, p_company_name, p_email, p_phone, p_position, p_city, p_service_type, 
        p_environment_type, p_urgency_level, p_status, p_source, p_estimated_budget_min, 
        p_estimated_budget_max, p_complexity_score, p_severity_score, p_notes, 
        p_lead_score, p_risk_level
    ) RETURNING id INTO new_lead_id;

    -- 2. Insertar el Diagnostic Report
    INSERT INTO public.diagnostic_reports (
        lead_id, airflow, dimensions, technical_observations, material_suggestions, 
        inspection_protocol, recommendations, currency
    ) VALUES (
        new_lead_id, p_airflow, p_dimensions, p_technical_observations, p_material_suggestions, 
        p_inspection_protocol, p_recommendations, p_currency
    );

    -- 3. Crear registro inicial en CRM Pipeline
    INSERT INTO public.crm_pipeline (
        lead_id, stage, priority, probability
    ) VALUES (
        new_lead_id, p_status, 'media', 10
    );

    -- Construir respuesta de éxito
    result := json_build_object(
        'success', true,
        'lead_id', new_lead_id
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, la transacción hace rollback automático
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'state', SQLSTATE
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
