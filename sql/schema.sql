-- ============================================================
-- Graduation Projects Management Platform - Database Schema
-- For Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'supervisor', 'jury', 'admin');

CREATE TYPE project_status AS ENUM (
  'draft',
  'under_review',
  'approved',
  'rejected',
  'in_progress',
  'awaiting_jury',
  'needs_revision',
  'completed'
);

CREATE TYPE file_type AS ENUM ('report', 'source', 'presentation', 'other');

CREATE TYPE evaluator_role AS ENUM ('supervisor', 'jury');

-- ============================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  university TEXT,
  college TEXT,
  specialization TEXT,
  student_id TEXT,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Extended user profiles linked to auth.users';

-- ============================================================
-- PROJECTS TABLE
-- ============================================================

CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  abstract TEXT,
  keywords TEXT[] DEFAULT '{}',
  specialization TEXT NOT NULL,
  university TEXT NOT NULL,
  college TEXT NOT NULL,
  status project_status DEFAULT 'draft' NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  academic_year INT DEFAULT EXTRACT(YEAR FROM NOW())::INT NOT NULL,
  final_grade NUMERIC(5,2),
  is_public BOOLEAN DEFAULT false NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.projects IS 'Main table for graduation projects';
CREATE INDEX idx_projects_student ON public.projects(student_id);
CREATE INDEX idx_projects_supervisor ON public.projects(supervisor_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_year ON public.projects(academic_year);
CREATE INDEX idx_projects_university ON public.projects(university);
CREATE INDEX idx_projects_specialization ON public.projects(specialization);

-- ============================================================
-- PROJECT MEMBERS TABLE
-- ============================================================

CREATE TABLE public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, student_id)
);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_student ON public.project_members(student_id);

-- ============================================================
-- PROJECT FILES TABLE
-- ============================================================

CREATE TABLE public.project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type file_type DEFAULT 'other' NOT NULL,
  mime_type TEXT,
  stage TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_project_files_project ON public.project_files(project_id);

-- ============================================================
-- EVALUATIONS TABLE
-- ============================================================

CREATE TABLE public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  evaluator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  evaluator_role evaluator_role NOT NULL,
  score_methodology INT CHECK (score_methodology >= 0 AND score_methodology <= 25) DEFAULT 0,
  score_innovation INT CHECK (score_innovation >= 0 AND score_innovation <= 25) DEFAULT 0,
  score_implementation INT CHECK (score_implementation >= 0 AND score_implementation <= 25) DEFAULT 0,
  score_presentation INT CHECK (score_presentation >= 0 AND score_presentation <= 25) DEFAULT 0,
  total_score INT GENERATED ALWAYS AS (score_methodology + score_innovation + score_implementation + score_presentation) STORED,
  comments TEXT,
  is_final BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, evaluator_id)
);

CREATE INDEX idx_evaluations_project ON public.evaluations(project_id);
CREATE INDEX idx_evaluations_evaluator ON public.evaluations(evaluator_id);

-- ============================================================
-- STATUS HISTORY TABLE
-- ============================================================

CREATE TABLE public.status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_status_history_project ON public.status_history(project_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false NOT NULL,
  related_project UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (project_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status::TEXT, NEW.status::TEXT, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_status_change
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_status_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);

-- PROJECTS POLICIES
CREATE POLICY "projects_select_student" ON public.projects FOR SELECT USING (
  student_id = auth.uid() OR 
  id IN (SELECT project_id FROM public.project_members WHERE student_id = auth.uid())
);
CREATE POLICY "projects_insert_student" ON public.projects FOR INSERT WITH CHECK (
  student_id = auth.uid() AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student'
);
CREATE POLICY "projects_update_student" ON public.projects FOR UPDATE USING (
  student_id = auth.uid() AND status IN ('draft', 'needs_revision')
);
CREATE POLICY "projects_select_supervisor" ON public.projects FOR SELECT USING (
  supervisor_id = auth.uid()
);
CREATE POLICY "projects_update_supervisor" ON public.projects FOR UPDATE USING (
  supervisor_id = auth.uid()
);
CREATE POLICY "projects_all_admin_jury" ON public.projects FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'jury')
);
CREATE POLICY "projects_select_public" ON public.projects FOR SELECT USING (
  is_public = true AND status = 'completed'
);

-- FILES POLICIES
CREATE POLICY "files_select" ON public.project_files FOR SELECT USING (
  is_public = true OR
  project_id IN (SELECT id FROM public.projects WHERE student_id = auth.uid() OR supervisor_id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'jury')
);
CREATE POLICY "files_insert" ON public.project_files FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE student_id = auth.uid() OR supervisor_id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "files_delete" ON public.project_files FOR DELETE USING (
  uploaded_by = auth.uid() OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- EVALUATIONS POLICIES
CREATE POLICY "eval_select" ON public.evaluations FOR SELECT USING (
  evaluator_id = auth.uid() OR
  project_id IN (SELECT id FROM public.projects WHERE student_id = auth.uid() OR supervisor_id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'jury')
);
CREATE POLICY "eval_insert" ON public.evaluations FOR INSERT WITH CHECK (
  evaluator_id = auth.uid() AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('supervisor', 'jury', 'admin')
);
CREATE POLICY "eval_update" ON public.evaluations FOR UPDATE USING (
  evaluator_id = auth.uid() AND is_final = false
);

-- STATUS HISTORY POLICIES
CREATE POLICY "history_select" ON public.status_history FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE student_id = auth.uid() OR supervisor_id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'jury')
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
