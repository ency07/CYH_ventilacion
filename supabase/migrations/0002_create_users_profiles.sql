-- Tabla de Perfiles Extendidos vinculada a Supabase Auth
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'comercial' CHECK (role IN ('administrador', 'comercial', 'tecnico')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en Perfiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

-- Trigger para automatizar actualizacion de timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_profile_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS para Leads y CRM (Fase 6)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo usuarios autenticados pueden ver leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Administradores pueden borrar leads" ON public.leads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );
