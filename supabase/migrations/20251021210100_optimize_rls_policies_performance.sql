-- ============================================================================
-- Migration: Optimize RLS policies performance
-- Created: 2025-10-21 19:01:00 UTC
-- ============================================================================
-- Purpose:
--   This migration optimizes Row Level Security (RLS) policies by preventing
--   unnecessary re-evaluation of auth.uid() for each row. This addresses
--   performance warnings from Supabase Performance Advisor.
--
--   The optimization replaces:
--     auth.uid() = user_id
--   with:
--     (select auth.uid()) = user_id
--
--   This change ensures auth.uid() is evaluated once per query instead of
--   once per row, significantly improving query performance at scale.
--
-- Affected tables:
--   - public.flashcards (4 policies recreated)
--   - public.generations (4 policies recreated)
--
-- Special notes:
--   - All existing RLS policies for authenticated users are dropped and recreated
--   - No changes to anon role policies (they don't use auth.uid())
--   - No data modifications - this is purely a performance optimization
--   - Policies maintain identical functionality with improved performance
-- ============================================================================

-- ============================================================================
-- flashcards table: drop existing authenticated policies
-- ============================================================================
-- these policies will be recreated with optimized auth.uid() evaluation

drop policy if exists "authenticated_users_can_view_own_flashcards" on public.flashcards;
drop policy if exists "authenticated_users_can_create_own_flashcards" on public.flashcards;
drop policy if exists "authenticated_users_can_update_own_flashcards" on public.flashcards;
drop policy if exists "authenticated_users_can_delete_own_flashcards" on public.flashcards;

-- ============================================================================
-- flashcards table: create optimized authenticated policies
-- ============================================================================
-- all policies now use (select auth.uid()) to prevent per-row re-evaluation

-- authenticated: select policy (optimized)
-- allows users to view only their own flashcards
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_view_own_flashcards"
on public.flashcards
for select
to authenticated
using ((select auth.uid()) = user_id);

-- authenticated: insert policy (optimized)
-- allows users to create flashcards only for themselves
-- with check ensures user_id is set to the authenticated user's id
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_create_own_flashcards"
on public.flashcards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- authenticated: update policy (optimized)
-- allows users to update only their own flashcards
-- using clause prevents viewing others' data, with check prevents changing ownership
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_update_own_flashcards"
on public.flashcards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- authenticated: delete policy (optimized)
-- allows users to delete only their own flashcards
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_delete_own_flashcards"
on public.flashcards
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================================
-- generations table: drop existing authenticated policies
-- ============================================================================
-- these policies will be recreated with optimized auth.uid() evaluation

drop policy if exists "authenticated_users_can_view_own_generations" on public.generations;
drop policy if exists "authenticated_users_can_create_own_generations" on public.generations;
drop policy if exists "authenticated_users_can_update_own_generations" on public.generations;
drop policy if exists "authenticated_users_can_delete_own_generations" on public.generations;

-- ============================================================================
-- generations table: create optimized authenticated policies
-- ============================================================================
-- all policies now use (select auth.uid()) to prevent per-row re-evaluation

-- authenticated: select policy (optimized)
-- allows users to view only their own generation records
-- enables users to review their generation history and costs
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_view_own_generations"
on public.generations
for select
to authenticated
using ((select auth.uid()) = user_id);

-- authenticated: insert policy (optimized)
-- allows users to create generation records only for themselves
-- with check ensures user_id is set to the authenticated user's id
-- prevents users from creating generation records for other users
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_create_own_generations"
on public.generations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- authenticated: update policy (optimized)
-- allows users to update only their own generation records
-- note: while the table is designed to be immutable, this policy allows
-- for edge cases such as correcting metadata or administrative adjustments
-- using clause prevents viewing others' data, with check prevents changing ownership
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_update_own_generations"
on public.generations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- authenticated: delete policy (optimized)
-- allows users to delete only their own generation records
-- enables users to clean up their generation history if desired
-- performance: auth.uid() evaluated once per query, not per row
create policy "authenticated_users_can_delete_own_generations"
on public.generations
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================================
-- end of migration
-- ============================================================================