-- Admin Dashboard Security Schema

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id),
    password_hash TEXT, -- To be set on first login
    permissions TEXT[] DEFAULT '{overview}', -- list of tabs they can access
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admin Access Requests Table
CREATE TABLE IF NOT EXISTS public.admin_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.profiles(id),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Initial Superuser (Sayan Mukherjee and Abhishek Singh)
-- Note: We can't insert directly into profiles here because we don't know the Clerk ID yet.
-- But we can add a logic in the app to recognize this email as the root superuser.
