-- ============================================================
--  AI Golf Coach — databaseschema voor Supabase
-- ============================================================
--  Plak dit volledige bestand in de Supabase SQL Editor en klik "Run".
--  Het is veilig om opnieuw uit te voeren (alles is idempotent).
--
--  BELANGRIJK: de anon-key in de frontend is publiek. Wat je gegevens
--  daadwerkelijk beschermt is Row Level Security (RLS) hieronder.
--  Zonder deze policies kan iedereen met die key ALLE rijen lezen.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Tabel met opgeslagen swing-analyses
-- ------------------------------------------------------------
create table if not exists public.swing_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Pad in de storage-bucket, bv. "<user_id>/<uuid>.mp4".
  -- Bewust geen publieke URL: video's worden via signed URLs opgehaald.
  video_path text,
  video_name text,

  -- Gemeten hoeken (graden). Null als ze niet gedetecteerd konden worden.
  knee_flex numeric,
  spine_angle numeric,
  shoulder_rotation numeric,
  hip_rotation numeric,
  x_factor numeric,

  -- Herkende fasetijden, bv. {"address":{"t":0},"top":{"t":0.4}, ...}
  phases jsonb,

  -- Gebruikte club, bv. "i7". Zie frontend/src/lib/clubs.js voor de lijst.
  club text,

  -- Houdingsscore 0-100 uit frontend/src/lib/swingScore.js.
  -- Let op: gebaseerd op onze eigen richtlijnen, geen golftechnische norm.
  swing_score integer,

  -- Claude-coachadvies. Blijft leeg zolang er geen ANTHROPIC_API_KEY is.
  coach_root_cause text,
  coach_feel text,
  coach_prop text,
  coach_mental text,

  note text
);

-- Kolommen die later zijn toegevoegd. Deze regels zorgen dat het schema ook
-- bijwerkt als je de tabel al eerder had aangemaakt zonder club/score.
alter table public.swing_analyses add column if not exists club text;
alter table public.swing_analyses add column if not exists swing_score integer;

create index if not exists swing_analyses_user_created_idx
  on public.swing_analyses (user_id, created_at desc);


-- ------------------------------------------------------------
-- 2. Row Level Security op de tabel
-- ------------------------------------------------------------
alter table public.swing_analyses enable row level security;

-- Policies opnieuw aanmaken zodat dit bestand herhaalbaar is.
drop policy if exists "eigen analyses lezen" on public.swing_analyses;
drop policy if exists "eigen analyses toevoegen" on public.swing_analyses;
drop policy if exists "eigen analyses bijwerken" on public.swing_analyses;
drop policy if exists "eigen analyses verwijderen" on public.swing_analyses;

create policy "eigen analyses lezen"
  on public.swing_analyses for select
  to authenticated
  using (auth.uid() = user_id);

-- "with check" is hier essentieel: zonder deze regel zou een gebruiker
-- een rij kunnen invoegen met andermans user_id.
create policy "eigen analyses toevoegen"
  on public.swing_analyses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "eigen analyses bijwerken"
  on public.swing_analyses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "eigen analyses verwijderen"
  on public.swing_analyses for delete
  to authenticated
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 3. Private opslag-bucket voor de video's
-- ------------------------------------------------------------
-- public = false, dus bestanden zijn alleen bereikbaar via een
-- tijdelijke signed URL voor de eigenaar.
insert into storage.buckets (id, name, public)
values ('swings', 'swings', false)
on conflict (id) do nothing;


-- ------------------------------------------------------------
-- 4. Row Level Security op de opgeslagen bestanden
-- ------------------------------------------------------------
-- Conventie: elk bestand staat in een map die de user_id is.
-- (storage.foldername(name))[1] is dus de eigenaar.
drop policy if exists "eigen videos lezen" on storage.objects;
drop policy if exists "eigen videos uploaden" on storage.objects;
drop policy if exists "eigen videos verwijderen" on storage.objects;

create policy "eigen videos lezen"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'swings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "eigen videos uploaden"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'swings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "eigen videos verwijderen"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'swings'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );


-- ------------------------------------------------------------
-- 5. Controle achteraf
-- ------------------------------------------------------------
-- Draai dit los om te bevestigen dat RLS echt aan staat.
-- Verwacht: rowsecurity = true
--
--   select relname, relrowsecurity as rowsecurity
--   from pg_class where relname = 'swing_analyses';
--
-- En om de policies te zien:
--
--   select policyname, cmd from pg_policies
--   where tablename = 'swing_analyses';
