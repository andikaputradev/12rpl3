-- Fase 4 — RLS seluruh tabel baru. Pola identik 0001/0003/0005/0007/0008:
-- (select auth.uid()), TO anon/authenticated eksplisit, FORCE ROW LEVEL
-- SECURITY. Berbeda dari Fase 3: staf di sini SELALU mencakup 'pengurus'
-- (achievements/portfolio/blog bersifat konten-dimoderasi, sejenis galeri
-- Fase 2 — bukan data administratif sensitif seperti nilai/absensi Fase 3).
--
-- Tiga celah brief ditutup di sini (pola sama seperti subjects di Fase 3):
-- blog_categories dan portfolio_contributors sama sekali tidak disebut di
-- blok RLS prompt; blog_comments hanya diberi policy SELECT/INSERT/DELETE
-- padahal hideComment() butuh UPDATE (mengubah is_hidden) yang tanpa policy
-- ini akan selalu gagal walau pemanggilnya staf sah.

alter table "achievements" enable row level security;
alter table "achievements" force row level security;
create policy "achievements_select_public" on "achievements" for select to anon, authenticated using (true);
create policy "achievements_mutate_staff" on "achievements" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "achievement_participants" enable row level security;
alter table "achievement_participants" force row level security;
create policy "achievement_participants_select_public" on "achievement_participants" for select to anon, authenticated using (true);
create policy "achievement_participants_mutate_staff" on "achievement_participants" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "portfolio_projects" enable row level security;
alter table "portfolio_projects" force row level security;
create policy "portfolio_select_approved_or_own_or_staff" on "portfolio_projects" for select to anon, authenticated using (
  status = 'approved'
  or submitted_by = (select auth.uid())
  or is_staff()
);
create policy "portfolio_insert_authenticated" on "portfolio_projects" for insert to authenticated with check (
  submitted_by = (select auth.uid())
);
create policy "portfolio_update_staff_only" on "portfolio_projects" for update to authenticated using (
  is_staff()
);
--> statement-breakpoint

-- portfolio_contributors — visibilitas mengikuti proyek induknya
alter table "portfolio_contributors" enable row level security;
alter table "portfolio_contributors" force row level security;
create policy "portfolio_contributors_select" on "portfolio_contributors" for select to anon, authenticated using (
  exists (
    select 1 from portfolio_projects pp
    where pp.id = portfolio_contributors.project_id
    and (
      pp.status = 'approved'
      or pp.submitted_by = (select auth.uid())
      or is_staff()
    )
  )
);
create policy "portfolio_contributors_insert_own_project" on "portfolio_contributors" for insert to authenticated with check (
  exists (
    select 1 from portfolio_projects pp
    where pp.id = portfolio_contributors.project_id and pp.submitted_by = (select auth.uid())
  )
);
create policy "portfolio_contributors_mutate_staff" on "portfolio_contributors" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "alumni_testimonials" enable row level security;
alter table "alumni_testimonials" force row level security;
create policy "testimonials_select_public" on "alumni_testimonials" for select to anon, authenticated using (true);
create policy "testimonials_mutate_staff" on "alumni_testimonials" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

-- blog_categories
alter table "blog_categories" enable row level security;
alter table "blog_categories" force row level security;
create policy "blog_categories_select_public" on "blog_categories" for select to anon, authenticated using (true);
create policy "blog_categories_mutate_staff" on "blog_categories" for all to authenticated using (
  is_staff()
);
--> statement-breakpoint

alter table "blog_posts" enable row level security;
alter table "blog_posts" force row level security;
create policy "posts_select_published_or_own_or_staff" on "blog_posts" for select to anon, authenticated using (
  status = 'published'
  or author_id = (select auth.uid())
  or is_staff()
);
create policy "posts_insert_authenticated" on "blog_posts" for insert to authenticated with check (
  author_id = (select auth.uid())
);
create policy "posts_update_own_draft_or_staff" on "blog_posts" for update to authenticated using (
  (author_id = (select auth.uid()) and status in ('draft', 'pending_review'))
  or is_staff()
);
--> statement-breakpoint

alter table "blog_comments" enable row level security;
alter table "blog_comments" force row level security;
create policy "comments_select_visible_or_staff" on "blog_comments" for select to anon, authenticated using (
  is_hidden = false
  or is_staff()
);
create policy "comments_insert_authenticated" on "blog_comments" for insert to authenticated with check (
  author_id = (select auth.uid())
);
-- Wajib untuk hideComment()
create policy "comments_update_staff_hide" on "blog_comments" for update to authenticated using (
  is_staff()
);
create policy "comments_delete_own_or_staff" on "blog_comments" for delete to authenticated using (
  author_id = (select auth.uid())
  or is_staff()
);
