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
alter table public.vehicles add column if not exists published_until timestamptz;
alter table public.vehicles add column if not exists stripe_session_id text;
alter table public.vehicles add column if not exists view_count integer not null default 0;

create unique index if not exists vehicles_stripe_session_id_key
  on public.vehicles (stripe_session_id)
  where stripe_session_id is not null;

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
declare
  chosen text;
begin
  chosen := lower(coalesce(new.raw_user_meta_data ->> 'role', 'privat'));
  insert into public.users (id, role, name)
  values (
    new.id,
    case when chosen in ('haendler', 'händler') then 'haendler' else 'privat' end,
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

-- Öffentlich sind nur bezahlte, noch laufende Inserate. Entwürfe sieht der Besitzer.
create policy "vehicles_select_public"
  on public.vehicles
  for select
  using (
    auth.uid() = user_id
    or (
      status = 'aktiv'
      and (published_until is null or published_until > now())
    )
  );

create policy "vehicle_images_select_public"
  on public.vehicle_images
  for select
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_images.vehicle_id
        and (
          vehicles.user_id = auth.uid()
          or (
            vehicles.status = 'aktiv'
            and (vehicles.published_until is null or vehicles.published_until > now())
          )
        )
    )
  );

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
  using (
    exists (
      select 1
      from public.vehicles
      where vehicles.id = vehicle_camper_details.vehicle_id
        and (
          vehicles.user_id = auth.uid()
          or (
            vehicles.status = 'aktiv'
            and (vehicles.published_until is null or vehicles.published_until > now())
          )
        )
    )
  );

-- Die Laufzeit und die Stripe-Sitzung setzt nur der Webhook. Der Besitzer darf
-- ein bezahltes Inserat pausieren, wieder online stellen oder als verkauft markieren.
create or replace function public.guard_vehicle_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin') or auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'entwurf';
    new.published_until := null;
    new.stripe_session_id := null;
    new.view_count := 0;
    return new;
  end if;

  if new.published_until is distinct from old.published_until
     or new.stripe_session_id is distinct from old.stripe_session_id then
    raise exception 'Laufzeit und Zahlung setzt nur die bestätigte Zahlung';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status not in ('aktiv', 'inaktiv', 'verkauft') then
    raise exception 'Dieser Status ist nicht erlaubt';
  end if;

  if coalesce(old.status, 'entwurf') = 'entwurf' then
    raise exception 'Ein Entwurf wird erst nach der Zahlung veröffentlicht';
  end if;

  if coalesce(old.status, 'entwurf') not in ('aktiv', 'inaktiv', 'verkauft') then
    raise exception 'Dieser Status ist nicht erlaubt';
  end if;

  if new.status = 'aktiv'
     and (old.published_until is null or old.published_until <= now()) then
    raise exception 'Die Laufzeit ist abgelaufen';
  end if;

  return new;
end;
$$;

create or replace function public.bump_listing_view(listing_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.vehicles
  set view_count = view_count + 1
  where id = listing_id
    and status = 'aktiv'
    and (published_until is null or published_until > now());
$$;

revoke all on function public.bump_listing_view(uuid) from public;
grant execute on function public.bump_listing_view(uuid) to anon, authenticated;

create or replace function public.owner_listing_signals(listing_ids uuid[])
returns table (vehicle_id uuid, inquiries bigint, saves bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id,
    (select count(*) from public.inquiries i where i.vehicle_id = v.id and i.recipient_id = v.user_id),
    (select count(*) from public.favorites f where f.vehicle_id = v.id)
  from public.vehicles v
  where v.user_id = auth.uid()
    and v.id = any (listing_ids);
$$;

revoke all on function public.owner_listing_signals(uuid[]) from public;
grant execute on function public.owner_listing_signals(uuid[]) to authenticated;

drop trigger if exists guard_vehicle_publication on public.vehicles;

create trigger guard_vehicle_publication
  before insert or update on public.vehicles
  for each row execute function public.guard_vehicle_publication();

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

alter table public.users add column if not exists city text;
alter table public.users add column if not exists postal_code text;
alter table public.users add column if not exists street text;
alter table public.users add column if not exists company_name text;
alter table public.users add column if not exists website text;
alter table public.users add column if not exists about text;
alter table public.users add column if not exists opening_hours text;
alter table public.users add column if not exists vat_id text;
alter table public.users add column if not exists services text[] not null default '{}';
alter table public.users add column if not exists logo_url text;
alter table public.users add column if not exists legal_form text;
alter table public.users add column if not exists register_court text;
alter table public.users add column if not exists register_number text;
alter table public.users add column if not exists public_email text;
alter table public.users add column if not exists represented_by text;

alter table public.users drop constraint if exists users_postal_code_shape;
alter table public.users add constraint users_postal_code_shape
  check (postal_code is null or postal_code ~ '^[0-9]{5}$');

alter table public.users drop constraint if exists users_street_length;
alter table public.users add constraint users_street_length
  check (street is null or char_length(street) between 1 and 120);

alter table public.users drop constraint if exists users_company_name_length;
alter table public.users add constraint users_company_name_length
  check (company_name is null or char_length(company_name) between 2 and 120);

alter table public.users drop constraint if exists users_website_shape;
alter table public.users add constraint users_website_shape
  check (website is null or website ~ '^https://[^[:space:]]{1,180}$');

alter table public.users drop constraint if exists users_about_length;
alter table public.users add constraint users_about_length
  check (about is null or char_length(about) between 1 and 800);

alter table public.users drop constraint if exists users_opening_hours_length;
alter table public.users add constraint users_opening_hours_length
  check (opening_hours is null or char_length(opening_hours) between 1 and 240);

alter table public.users drop constraint if exists users_vat_id_shape;
alter table public.users add constraint users_vat_id_shape
  check (vat_id is null or vat_id ~ '^DE[0-9]{9}$');

alter table public.users drop constraint if exists users_services_known;
alter table public.users add constraint users_services_known
  check (services <@ array['finanzierung','inzahlungnahme','werkstatt','lieferung']::text[]);

alter table public.users drop constraint if exists users_logo_url_shape;
alter table public.users add constraint users_logo_url_shape
  check (logo_url is null or logo_url ~ '^https://[^[:space:]]{1,280}$');

alter table public.users drop constraint if exists users_legal_form_known;
alter table public.users add constraint users_legal_form_known
  check (legal_form is null or legal_form in (
    'Einzelunternehmen', 'e.K.', 'GbR', 'UG (haftungsbeschränkt)', 'GmbH', 'GmbH & Co. KG', 'AG', 'OHG', 'KG'
  ));

alter table public.users drop constraint if exists users_register_court_length;
alter table public.users add constraint users_register_court_length
  check (register_court is null or char_length(register_court) between 2 and 80);

alter table public.users drop constraint if exists users_register_number_length;
alter table public.users add constraint users_register_number_length
  check (register_number is null or char_length(register_number) between 2 and 40);

alter table public.users drop constraint if exists users_public_email_shape;
alter table public.users add constraint users_public_email_shape
  check (public_email is null or public_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.users drop constraint if exists users_represented_by_length;
alter table public.users add constraint users_represented_by_length
  check (represented_by is null or char_length(represented_by) between 2 and 80);

create or replace view public.seller_profiles as
select id, name, role, city, postal_code, company_name, about
from public.users;

drop view if exists public.dealer_profiles;
create view public.dealer_profiles as
select
  id,
  company_name,
  name as contact_name,
  phone,
  street,
  postal_code,
  city,
  website,
  about,
  opening_hours,
  vat_id,
  services,
  logo_url,
  legal_form,
  register_court,
  register_number,
  public_email,
  represented_by,
  created_at
from public.users
where lower(coalesce(role, '')) in ('haendler', 'händler')
  and nullif(btrim(company_name), '') is not null
  and nullif(btrim(city), '') is not null;

grant select on public.dealer_profiles to anon, authenticated;

-- Der Ort darf im Exposé stehen. Die Rolle bestimmt den Inseratspreis und
-- bleibt an der Anmeldung hängen.
create or replace function public.guard_user_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin') or auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Die Rolle kann hier nicht geändert werden';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_user_role on public.users;

create trigger guard_user_role
  before update on public.users
  for each row execute function public.guard_user_role();

create table if not exists public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  note text,
  price_at_save numeric,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id),
  constraint favorites_note_length check (note is null or char_length(note) <= 280)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  filters jsonb not null,
  last_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint saved_searches_name_length check (char_length(name) between 1 and 80)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint inquiries_body_length check (char_length(body) between 1 and 2000),
  constraint inquiries_not_self check (sender_id <> recipient_id)
);

create unique index if not exists inquiries_vehicle_sender_key
  on public.inquiries (vehicle_id, sender_id);

create table if not exists public.inquiry_replies (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint inquiry_replies_body_length check (char_length(body) between 1 and 2000)
);

create table if not exists public.recent_views (
  user_id uuid not null references public.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

create table if not exists public.comparisons (
  user_id uuid not null references public.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

create index if not exists saved_searches_user_created_idx
  on public.saved_searches (user_id, created_at desc);

create index if not exists inquiries_recipient_created_idx
  on public.inquiries (recipient_id, created_at desc);

create index if not exists inquiries_sender_created_idx
  on public.inquiries (sender_id, created_at desc);

create index if not exists recent_views_user_viewed_idx
  on public.recent_views (user_id, viewed_at desc);

alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_replies enable row level security;
alter table public.recent_views enable row level security;
alter table public.comparisons enable row level security;

drop policy if exists "favorites_select" on public.favorites;
create policy "favorites_select"
  on public.favorites
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites_delete" on public.favorites;
create policy "favorites_delete"
  on public.favorites
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites_insert" on public.favorites;
create policy "favorites_insert"
  on public.favorites
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.vehicles
      where vehicles.id = favorites.vehicle_id
        and vehicles.status = 'aktiv'
        and (vehicles.published_until is null or vehicles.published_until > now())
    )
  );

drop policy if exists "favorites_update" on public.favorites;
create policy "favorites_update"
  on public.favorites
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "saved_searches_own" on public.saved_searches;
create policy "saved_searches_own"
  on public.saved_searches
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "inquiries_select_party" on public.inquiries;
create policy "inquiries_select_party"
  on public.inquiries
  for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "inquiries_insert_buyer" on public.inquiries;
create policy "inquiries_insert_buyer"
  on public.inquiries
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id <> recipient_id
    and exists (
      select 1
      from public.vehicles
      where vehicles.id = inquiries.vehicle_id
        and vehicles.user_id = inquiries.recipient_id
        and vehicles.status = 'aktiv'
        and (vehicles.published_until is null or vehicles.published_until > now())
    )
  );

drop policy if exists "inquiries_mark_read" on public.inquiries;
create policy "inquiries_mark_read"
  on public.inquiries
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "inquiry_replies_select_party" on public.inquiry_replies;
create policy "inquiry_replies_select_party"
  on public.inquiry_replies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.inquiries
      where inquiries.id = inquiry_replies.inquiry_id
        and (inquiries.sender_id = auth.uid() or inquiries.recipient_id = auth.uid())
    )
  );

drop policy if exists "inquiry_replies_insert_party" on public.inquiry_replies;
create policy "inquiry_replies_insert_party"
  on public.inquiry_replies
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.inquiries
      where inquiries.id = inquiry_replies.inquiry_id
        and (inquiries.sender_id = auth.uid() or inquiries.recipient_id = auth.uid())
    )
  );

drop policy if exists "recent_views_select" on public.recent_views;
create policy "recent_views_select"
  on public.recent_views
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "recent_views_delete" on public.recent_views;
create policy "recent_views_delete"
  on public.recent_views
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "recent_views_insert" on public.recent_views;
create policy "recent_views_insert"
  on public.recent_views
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.vehicles
      where vehicles.id = recent_views.vehicle_id
        and vehicles.status = 'aktiv'
        and (vehicles.published_until is null or vehicles.published_until > now())
    )
  );

drop policy if exists "recent_views_update" on public.recent_views;
create policy "recent_views_update"
  on public.recent_views
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "comparisons_select" on public.comparisons;
create policy "comparisons_select"
  on public.comparisons
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "comparisons_delete" on public.comparisons;
create policy "comparisons_delete"
  on public.comparisons
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "comparisons_insert" on public.comparisons;
create policy "comparisons_insert"
  on public.comparisons
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.vehicles
      where vehicles.id = comparisons.vehicle_id
        and vehicles.status = 'aktiv'
        and (vehicles.published_until is null or vehicles.published_until > now())
    )
  );

create or replace function public.guard_favorite_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.vehicle_id is distinct from old.vehicle_id
     or new.price_at_save is distinct from old.price_at_save
     or new.created_at is distinct from old.created_at then
    raise exception 'Nur die Notiz eines Merklisteneintrags kann geändert werden';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_favorite_update on public.favorites;
create trigger guard_favorite_update
  before update on public.favorites
  for each row execute function public.guard_favorite_update();

create or replace function public.guard_recent_view_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.vehicle_id is distinct from old.vehicle_id then
    raise exception 'Ein angesehener Eintrag bleibt am selben Fahrzeug';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_recent_view_update on public.recent_views;
create trigger guard_recent_view_update
  before update on public.recent_views
  for each row execute function public.guard_recent_view_update();

create or replace function public.guard_inquiry_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.vehicle_id is distinct from old.vehicle_id
     or new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'Eine Anfrage kann nur als gelesen markiert werden';
  end if;

  if auth.uid() is distinct from old.recipient_id then
    raise exception 'Nur der Empfänger markiert eine Anfrage als gelesen';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_inquiry_update on public.inquiries;
create trigger guard_inquiry_update
  before update on public.inquiries
  for each row execute function public.guard_inquiry_update();

create or replace function public.guard_comparison_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.comparisons
    where user_id = new.user_id
  ) >= 3 then
    raise exception 'Höchstens drei Fahrzeuge im Vergleich';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_comparison_limit on public.comparisons;
create trigger guard_comparison_limit
  before insert on public.comparisons
  for each row execute function public.guard_comparison_limit();

grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.saved_searches to authenticated;
grant select, insert, update on public.inquiries to authenticated;
grant select, insert on public.inquiry_replies to authenticated;
grant select, insert, update, delete on public.recent_views to authenticated;
grant select, insert, update, delete on public.comparisons to authenticated;

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
