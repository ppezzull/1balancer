-- Migration: fix RLS policies for performance
-- Replaces auth.<fn>() calls with (select auth.<fn>()) to avoid per-row re-evaluation
-- Consolidates permissive SELECT policies by scoping public access to `anon` role only

BEGIN;

-- Remove old policies (if present)
DROP POLICY IF EXISTS users_delete_own ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_public_select ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- Recreate policies using (select auth.uid()) to avoid re-evaluation per row
CREATE POLICY users_delete_own
  ON public.users
  FOR DELETE
  USING ((select auth.uid()) = id);

CREATE POLICY users_insert_self
  ON public.users
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- Public selection: intentionally only for the anon role to avoid multiple permissive policies across roles
CREATE POLICY users_public_select
  ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated selection: allow authenticated dashboards and service roles to select their own row
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated, authenticator, dashboard_user
  USING ((select auth.uid()) = id);

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

COMMIT;
