-- Caravamo: Grundschema für den Fahrzeug-Marktplatz.
-- Die UUID-Primärschlüssel bekommen gen_random_uuid(), damit Inserts ohne
-- manuelle IDs funktionieren. Policies bleiben auskommentiert.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text,
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id),
  brand text,
  model text,
  type text,
  price numeric,
  mileage int,
  year int,
  description text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  url text,
  is_main boolean default false,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;

-- RLS: Jeder darf Fahrzeuge lesen.
-- create policy "vehicles_select_public"
--   on public.vehicles
--   for select
--   using (true);

-- create policy "vehicle_images_select_public"
--   on public.vehicle_images
--   for select
--   using (true);

-- RLS: Nur authentifizierte Nutzer dürfen eigene Fahrzeuge erstellen und bearbeiten.
-- user_id soll dabei der Auth-User-ID entsprechen.
-- create policy "vehicles_insert_own"
--   on public.vehicles
--   for insert
--   to authenticated
--   with check (auth.uid() = user_id);

-- create policy "vehicles_update_own"
--   on public.vehicles
--   for update
--   to authenticated
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- Profil-Policies für public.users folgen mit der Authentifizierung.
-- Solange keine Policy existiert, bleibt die Tabelle über die Data API geschlossen.
