CREATE INDEX idx_leads_status ON leads (status);  
CREATE INDEX idx_leads_created_at ON leads (created_at DESC);  
CREATE INDEX idx_crm_pipeline_stage ON crm_pipeline (stage);  
CREATE INDEX idx_crm_pipeline_assigned_to ON crm_pipeline (assigned_to); 
