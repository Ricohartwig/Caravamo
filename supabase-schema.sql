-- Caravamo: Schema für den Fahrzeug-Marktplatz mit Anmeldung.
-- Wohnmobile, Wohnwagen, Pkw und Transporter liegen in public.vehicles.
-- Der Fahrzeugtyp steht in vehicles.type, zum Beispiel 'Wohnmobil'.
-- Eine eigene Wohnmobil-Tabelle gibt es nicht, damit jedes Inserat genau
-- einem angemeldeten Nutzer gehört.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text default 'privat',
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
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

alter table public.vehicles add column if not exists condition text;
alter table public.vehicles add column if not exists price_tax text;
alter table public.vehicles add column if not exists availability text;
alter table public.vehicles add column if not exists previous_owners integer;
alter table public.vehicles add column if not exists service_record boolean;
alter table public.vehicles add column if not exists next_inspection date;
alter table public.vehicles add column if not exists next_gas_inspection date;
alter table public.vehicles add column if not exists speed_100 boolean;
alter table public.vehicles add column if not exists first_registration date;

-- Technische Felder, die nicht jede Fahrzeugart hat. Ein Wohnwagen lässt den
-- Motor leer, ein Dachzeltanhänger die Abgasnorm. Die Zuladung ergibt sich
-- aus zulässigem Gesamtgewicht minus Leergewicht.
create table if not exists public.vehicle_camper_details (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  body_type text,
  gross_weight_kg integer,
  curb_weight_kg integer,
  payload_kg integer generated always as (gross_weight_kg - curb_weight_kg) stored,
  length_cm integer,
  width_cm integer,
  height_cm integer,
  weight_adjusted boolean,
  axle_count integer,
  braked_tow_kg integer,
  unbraked_tow_kg integer,
  chassis text,
  power_ps integer,
  fuel text,
  transmission text,
  emission_standard text,
  emission_sticker text,
  drivetrain text,
  sleeping_places integer,
  bed_types text[],
  belted_seats integer,
  seating_group text,
  battery_ah integer,
  battery_type text,
  has_solar boolean,
  solar_wp integer,
  has_inverter boolean,
  inverter_w integer,
  has_dc_charger boolean,
  connectivity text[],
  heating text,
  fresh_water_l integer,
  waste_water_l integer,
  waste_tank_heated boolean,
  climate text[],
  toilet text,
  shower text,
  gas_capacity text,
  gas_bottle_type text,
  has_crash_sensor boolean,
  has_awning boolean,
  has_bike_rack boolean,
  has_tow_hitch boolean,
  has_mover boolean,
  jack_type text,
  has_air_suspension boolean,
  includes_porch boolean,
  brake_system text,
  tent_fabric text,
  setup_minutes integer,
  has_kitchen_module boolean,
  lid_payload_kg integer,
  constraint weights_fit check (
    gross_weight_kg is null
    or curb_weight_kg is null
    or gross_weight_kg >= curb_weight_kg
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, role, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'privat'),
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_camper_details enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "vehicles_select_public" on public.vehicles;
drop policy if exists "vehicles_insert_own" on public.vehicles;
drop policy if exists "vehicles_update_own" on public.vehicles;
drop policy if exists "vehicle_images_select_public" on public.vehicle_images;
drop policy if exists "vehicle_images_insert_own" on public.vehicle_images;
drop policy if exists "vehicle_images_update_own" on public.vehicle_images;
drop policy if exists "vehicle_images_delete_own" on public.vehicle_images;
drop policy if exists "vehicles_delete_own" on public.vehicles;
drop policy if exists "vehicle_camper_details_select_public" on public.vehicle_camper_details;
drop policy if exists "vehicle_camper_details_insert_own" on public.vehicle_camper_details;
drop policy if exists "vehicle_camper_details_update_own" on public.vehicle_camper_details;
drop policy if exists "vehicle_camper_details_delete_own" on public.vehicle_camper_details;

-- Jeder darf Fahrzeuge und Bilder lesen.
create policy "vehicles_select_public"
  on public.vehicles
  for select
  using (true);

create policy "vehicle_images_select_public"
  on public.vehicle_images
  for select
  using (true);

-- Nur authentifizierte Nutzer dürfen eigene Fahrzeuge erstellen und bearbeiten.
create policy "vehicles_insert_own"
  on public.vehicles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vehicles_delete_own"
  on public.vehicles
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "vehicles_update_own"
  on public.vehicles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "vehicle_images_insert_own"
  on public.vehicle_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_images.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

create policy "vehicle_images_update_own"
  on public.vehicle_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_images.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_images.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

create policy "vehicle_images_delete_own"
  on public.vehicle_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_images.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

create policy "vehicle_camper_details_select_public"
  on public.vehicle_camper_details
  for select
  using (true);

create policy "vehicle_camper_details_insert_own"
  on public.vehicle_camper_details
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_camper_details.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

create policy "vehicle_camper_details_update_own"
  on public.vehicle_camper_details
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_camper_details.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_camper_details.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

create policy "vehicle_camper_details_delete_own"
  on public.vehicle_camper_details
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_camper_details.vehicle_id
        and vehicles.user_id = auth.uid()
    )
  );

grant select, update on public.users to authenticated;
grant select on public.vehicles to anon, authenticated;
grant insert, update, delete on public.vehicles to authenticated;
grant select on public.vehicle_images to anon, authenticated;
grant insert, update, delete on public.vehicle_images to authenticated;
grant select on public.vehicle_camper_details to anon, authenticated;
grant insert, update, delete on public.vehicle_camper_details to authenticated;

create or replace view public.seller_profiles as
select id, name, role
from public.users;

grant select on public.seller_profiles to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-images',
  'vehicle-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vehicle_images_bucket_read" on storage.objects;
drop policy if exists "vehicle_images_bucket_insert" on storage.objects;
drop policy if exists "vehicle_images_bucket_update" on storage.objects;
drop policy if exists "vehicle_images_bucket_delete" on storage.objects;

create policy "vehicle_images_bucket_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'vehicle-images');

create policy "vehicle_images_bucket_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vehicle_images_bucket_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vehicle_images_bucket_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
