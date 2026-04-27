-- Adamas University: Do-Fetch Institutional Registry Schema
-- Zero-Cost PostgreSQL Architecture (Supabase Compatible)

-- 1. Profiles Table (Clerk Identity Mapping)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Clerk User ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'faculty', 'admin')),
    department TEXT, -- e.g., 'CSE', 'ECE'
    batch TEXT, -- For Students (e.g., '2022')
    section TEXT, -- For Students (e.g., 'A', 'B')
    sections_managed TEXT[], -- For Faculty (e.g., ['A', 'C'])
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Certificates Table (Telegram + Metadata)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES public.profiles(id),
    telegram_file_id TEXT NOT NULL, -- Permanent link to Telegram Binary
    telegram_message_id BIGINT, -- Required for deletion/management
    title TEXT NOT NULL,
    issuer TEXT,
    type TEXT,
    issue_date DATE,
    score NUMERIC(5,2), -- AI Calculated Weightage
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    extracted_text JSONB, -- Full OCR output in JSON/CSV structure
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
-- We are using Clerk for authentication, so Supabase auth.uid() will be null.
-- Security is enforced at the application level (Next.js server routes).
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;

-- Drop previous policies if they exist so they don't interfere if RLS is re-enabled
DROP POLICY IF EXISTS "student_view_own" ON public.certificates;
DROP POLICY IF EXISTS "student_insert_own" ON public.certificates;
DROP POLICY IF EXISTS "faculty_view_assigned_sections" ON public.certificates;
DROP POLICY IF EXISTS "faculty_update_assigned_sections" ON public.certificates;


-- 4. Triggers for Updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
