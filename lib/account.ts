import { parseStoredFilters, searchHref, type VehicleFilters } from "@/lib/filters";
import { isPublicListing } from "@/lib/listing-payment";
import { isVehicleId } from "@/lib/owned-listings";
import {
  dealerPageReady,
  emptyProfile,
  profileGaps,
  type DealerService,
  type ProfileFields,
  type ProfileGap,
} from "@/lib/profile";
import { isBusinessRole } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export type AccountUser = {
  id: string;
  email: string;
};

export type AccountProfile = ProfileFields & {
  roleLabel: "Privat" | "Händler";
  business: boolean;
  memberSince: string;
  gaps: ProfileGap[];
  publicDealerPage: boolean;
};

export type AccountCounts = {
  favorites: number;
  searches: number;
  unread: number;
  views: number;
  comparisons: number;
  listings: number;
};

export type CardMarks = {
  signedIn: boolean;
  saved: boolean;
  compared: boolean;
  returnTo: string;
};

export type SavedVehicle = {
  id: string;
  available: boolean;
  title: string;
  price: number | null;
  savedPrice: number | null;
  type: string;
  firstRegistration: string;
  mileage: number | null;
  imageUrl: string | null;
  note: string;
  savedAt: string;
};

export type SavedSearch = {
  id: string;
  name: string;
  filters: VehicleFilters;
  href: string;
  createdAt: string;
  lastCount: number;
};

export type InquiryPreview = {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  direction: "eingang" | "gesendet";
  counterpart: string;
  body: string;
  unread: boolean;
  createdAt: string;
};

export type InquiryMessage = {
  id: string;
  body: string;
  own: boolean;
  author: string;
  createdAt: string;
};

export type InquiryThread = {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  available: boolean;
  counterpart: string;
  incoming: boolean;
  messages: InquiryMessage[];
};

export type CompareColumn = {
  id: string;
  available: boolean;
  title: string;
  href: string;
  imageUrl: string | null;
  price: number | null;
  rows: { label: string; value: string }[];
};

const viewLimit = 30;
const searchLimit = 20;

export async function currentUser(): Promise<AccountUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? "" };
}

export async function loadCardMarks(returnTo: string): Promise<{
  signedIn: boolean;
  favorites: Set<string>;
  comparisons: Set<string>;
  returnTo: string;
}> {
  const user = await currentUser();
  if (!user) {
    return { signedIn: false, favorites: new Set(), comparisons: new Set(), returnTo };
  }

  const supabase = await createClient();
  const [favorites, comparisons] = await Promise.all([
    supabase.from("favorites").select("vehicle_id").eq("user_id", user.id),
    supabase.from("comparisons").select("vehicle_id").eq("user_id", user.id),
  ]);

  return {
    signedIn: true,
    favorites: idSet(favorites.data),
    comparisons: idSet(comparisons.data),
    returnTo,
  };
}

export function marksFor(
  vehicleId: string,
  marks: { signedIn: boolean; favorites: Set<string>; comparisons: Set<string>; returnTo: string },
): CardMarks {
  return {
    signedIn: marks.signedIn,
    saved: marks.favorites.has(vehicleId),
    compared: marks.comparisons.has(vehicleId),
    returnTo: marks.returnTo,
  };
}

export async function accountCounts(userId: string): Promise<AccountCounts> {
  const supabase = await createClient();
  const [favorites, searches, unread, views, comparisons, listings] = await Promise.all([
    supabase.from("favorites").select("vehicle_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null),
    supabase.from("recent_views").select("vehicle_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("comparisons").select("vehicle_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return {
    favorites: favorites.count ?? 0,
    searches: searches.count ?? 0,
    unread: unread.count ?? 0,
    views: views.count ?? 0,
    comparisons: comparisons.count ?? 0,
    listings: listings.count ?? 0,
  };
}

export async function accountProfile(userId: string): Promise<AccountProfile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(
      "name, phone, city, postal_code, street, company_name, website, about, opening_hours, vat_id, services, logo_url, legal_form, register_court, register_number, public_email, represented_by, role, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  const business = isBusinessRole(readString(data?.role));
  const fields: ProfileFields = {
    ...emptyProfile(),
    name: readString(data?.name) ?? "",
    phone: readString(data?.phone) ?? "",
    city: readString(data?.city) ?? "",
    postalCode: readString(data?.postal_code) ?? "",
    street: readString(data?.street) ?? "",
    companyName: readString(data?.company_name) ?? "",
    website: readString(data?.website) ?? "",
    about: readString(data?.about) ?? "",
    openingHours: readString(data?.opening_hours) ?? "",
    vatId: readString(data?.vat_id) ?? "",
    services: readServices(data?.services),
    logoUrl: readString(data?.logo_url) ?? "",
    legalForm: readString(data?.legal_form) ?? "",
    registerCourt: readString(data?.register_court) ?? "",
    registerNumber: readString(data?.register_number) ?? "",
    publicEmail: readString(data?.public_email) ?? "",
    representedBy: readString(data?.represented_by) ?? "",
  };

  return {
    ...fields,
    roleLabel: business ? "Händler" : "Privat",
    business,
    memberSince: readString(data?.created_at) ?? "",
    gaps: profileGaps(fields, business),
    publicDealerPage: dealerPageReady(fields, business),
  };
}

export async function listFavorites(userId: string): Promise<SavedVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(
      "vehicle_id, note, price_at_save, created_at, vehicles(id, brand, model, type, price, mileage, year, first_registration, status, published_until, vehicle_images(url, is_main))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.vehicle_id !== "string") {
      return [];
    }

    const vehicle = firstRecord(row.vehicles);
    const available = vehicle ? isPublicListing(readString(vehicle.status) ?? "", readString(vehicle.published_until)) : false;

    return [
      {
        id: row.vehicle_id,
        available,
        title: vehicleTitle(vehicle),
        price: available ? readNumber(vehicle?.price) : null,
        savedPrice: readNumber(row.price_at_save),
        type: readString(vehicle?.type) ?? "Fahrzeug",
        firstRegistration: registrationLabel(readString(vehicle?.first_registration), readNumber(vehicle?.year)),
        mileage: readNumber(vehicle?.mileage),
        imageUrl: mainImage(vehicle?.vehicle_images),
        note: readString(row.note) ?? "",
        savedAt: readString(row.created_at) ?? "",
      },
    ];
  });
}

export async function listRecentViews(userId: string): Promise<SavedVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recent_views")
    .select(
      "vehicle_id, viewed_at, vehicles(id, brand, model, type, price, mileage, year, first_registration, status, published_until, vehicle_images(url, is_main))",
    )
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(viewLimit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.vehicle_id !== "string") {
      return [];
    }

    const vehicle = firstRecord(row.vehicles);
    const available = vehicle ? isPublicListing(readString(vehicle.status) ?? "", readString(vehicle.published_until)) : false;

    return [
      {
        id: row.vehicle_id,
        available,
        title: vehicleTitle(vehicle),
        price: available ? readNumber(vehicle?.price) : null,
        savedPrice: null,
        type: readString(vehicle?.type) ?? "Fahrzeug",
        firstRegistration: registrationLabel(readString(vehicle?.first_registration), readNumber(vehicle?.year)),
        mileage: readNumber(vehicle?.mileage),
        imageUrl: mainImage(vehicle?.vehicle_images),
        note: "",
        savedAt: readString(row.viewed_at) ?? "",
      },
    ];
  });
}

export async function listSavedSearches(userId: string): Promise<SavedSearch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, filters, last_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(searchLimit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") {
      return [];
    }

    const filters = parseStoredFilters(row.filters);
    return [
      {
        id: row.id,
        name: readString(row.name) ?? "Suche",
        filters,
        href: searchHref(filters),
        createdAt: readString(row.created_at) ?? "",
        lastCount: readNumber(row.last_count) ?? 0,
      },
    ];
  });
}

export async function listInquiries(userId: string): Promise<InquiryPreview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, vehicle_id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  const rows = data.filter(isRecord);
  const titles = await vehicleTitles(rows.map((row) => readString(row.vehicle_id)).filter((id): id is string => Boolean(id)));
  const names = await profileNames(
    rows.flatMap((row) => [readString(row.sender_id), readString(row.recipient_id)].filter((id): id is string => Boolean(id))),
  );

  return rows.flatMap((row) => {
    const id = readString(row.id);
    const vehicleId = readString(row.vehicle_id);
    const senderId = readString(row.sender_id);
    const recipientId = readString(row.recipient_id);
    if (!id || !vehicleId || !senderId || !recipientId) {
      return [];
    }

    const incoming = recipientId === userId;
    return [
      {
        id,
        vehicleId,
        vehicleTitle: titles.get(vehicleId) ?? "Inserat nicht mehr verfügbar",
        direction: incoming ? "eingang" : "gesendet",
        counterpart: names.get(incoming ? senderId : recipientId) ?? "Nutzer",
        body: readString(row.body) ?? "",
        unread: incoming && !readString(row.read_at),
        createdAt: readString(row.created_at) ?? "",
      },
    ];
  });
}

export async function getInquiryThread(userId: string, inquiryId: string): Promise<InquiryThread | null> {
  if (!isVehicleId(inquiryId)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, vehicle_id, sender_id, recipient_id, body, created_at, inquiry_replies(id, sender_id, body, created_at)")
    .eq("id", inquiryId)
    .maybeSingle();

  if (error || !isRecord(data)) {
    return null;
  }

  const senderId = readString(data.sender_id);
  const recipientId = readString(data.recipient_id);
  const vehicleId = readString(data.vehicle_id);
  if (!senderId || !recipientId || !vehicleId || (senderId !== userId && recipientId !== userId)) {
    return null;
  }

  const names = await profileNames([senderId, recipientId]);
  const titles = await vehicleTitles([vehicleId]);
  const replies = Array.isArray(data.inquiry_replies) ? data.inquiry_replies.filter(isRecord) : [];
  replies.sort((left, right) => (readString(left.created_at) ?? "").localeCompare(readString(right.created_at) ?? ""));

  const messages: InquiryMessage[] = [
    {
      id: readString(data.id) ?? inquiryId,
      body: readString(data.body) ?? "",
      own: senderId === userId,
      author: names.get(senderId) ?? "Nutzer",
      createdAt: readString(data.created_at) ?? "",
    },
    ...replies.flatMap((reply) => {
      const replySender = readString(reply.sender_id);
      const replyId = readString(reply.id);
      if (!replySender || !replyId) {
        return [];
      }

      return [
        {
          id: replyId,
          body: readString(reply.body) ?? "",
          own: replySender === userId,
          author: names.get(replySender) ?? "Nutzer",
          createdAt: readString(reply.created_at) ?? "",
        },
      ];
    }),
  ];

  return {
    id: inquiryId,
    vehicleId,
    vehicleTitle: titles.get(vehicleId) ?? "Inserat nicht mehr verfügbar",
    available: titles.has(vehicleId),
    counterpart: names.get(senderId === userId ? recipientId : senderId) ?? "Nutzer",
    incoming: recipientId === userId,
    messages,
  };
}

export async function listComparison(userId: string): Promise<CompareColumn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comparisons")
    .select(
      "vehicle_id, created_at, vehicles(id, brand, model, type, price, mileage, year, first_registration, condition, status, published_until, user_id, vehicle_images(url, is_main), vehicle_camper_details(body_type, sleeping_places, length_cm, fuel, power_ps, belted_seats))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    return [];
  }

  const sellerIds = data.flatMap((row) => {
    const vehicle = isRecord(row) ? firstRecord(row.vehicles) : null;
    const id = readString(vehicle?.user_id);
    return id ? [id] : [];
  });
  const names = await profileNames(sellerIds);

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.vehicle_id !== "string") {
      return [];
    }

    const vehicle = firstRecord(row.vehicles);
    const available = vehicle ? isPublicListing(readString(vehicle.status) ?? "", readString(vehicle.published_until)) : false;
    const details = firstRecord(vehicle?.vehicle_camper_details);
    const sellerId = readString(vehicle?.user_id);

    return [
      {
        id: row.vehicle_id,
        available,
        title: vehicleTitle(vehicle),
        href: `/fahrzeug/${row.vehicle_id}`,
        imageUrl: mainImage(vehicle?.vehicle_images),
        price: available ? readNumber(vehicle?.price) : null,
        rows: [
          { label: "Typ", value: readString(vehicle?.type) ?? "—" },
          { label: "Aufbau", value: readString(details?.body_type) ?? "—" },
          { label: "Erstzulassung", value: registrationLabel(readString(vehicle?.first_registration), readNumber(vehicle?.year)) },
          { label: "Kilometer", value: numberLabel(readNumber(vehicle?.mileage), "km") },
          { label: "Zustand", value: readString(vehicle?.condition) ?? "—" },
          { label: "Schlafplätze", value: numberLabel(readNumber(details?.sleeping_places), "") },
          { label: "Länge", value: numberLabel(readNumber(details?.length_cm), "cm") },
          { label: "Kraftstoff", value: readString(details?.fuel) ?? "—" },
          { label: "Leistung", value: numberLabel(readNumber(details?.power_ps), "PS") },
          { label: "Sitzplätze", value: numberLabel(readNumber(details?.belted_seats), "") },
          { label: "Anbieter", value: sellerId ? names.get(sellerId) ?? "Anbieter" : "—" },
        ],
      },
    ];
  });
}

export async function rememberView(userId: string, vehicleId: string): Promise<void> {
  if (!isVehicleId(vehicleId)) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recent_views")
    .upsert({ user_id: userId, vehicle_id: vehicleId, viewed_at: new Date().toISOString() }, { onConflict: "user_id,vehicle_id" });

  if (error) {
    return;
  }

  const { data } = await supabase
    .from("recent_views")
    .select("vehicle_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false });

  const extra = Array.isArray(data) ? data.slice(viewLimit) : [];
  const ids = extra.flatMap((row) => (isRecord(row) && typeof row.vehicle_id === "string" ? [row.vehicle_id] : []));
  if (ids.length > 0) {
    await supabase.from("recent_views").delete().eq("user_id", userId).in("vehicle_id", ids);
  }
}

export { searchLimit };

async function vehicleTitles(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const titles = new Map<string, string>();
  if (unique.length === 0) {
    return titles;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("id, brand, model, status, published_until").in("id", unique);
  if (!Array.isArray(data)) {
    return titles;
  }

  for (const row of data) {
    if (!isRecord(row) || typeof row.id !== "string") {
      continue;
    }
    if (!isPublicListing(readString(row.status) ?? "", readString(row.published_until))) {
      continue;
    }
    titles.set(row.id, vehicleTitle(row));
  }

  return titles;
}

async function profileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const names = new Map<string, string>();
  if (unique.length === 0) {
    return names;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("seller_profiles").select("id, name").in("id", unique);
  if (!Array.isArray(data)) {
    return names;
  }

  for (const row of data) {
    if (isRecord(row) && typeof row.id === "string") {
      names.set(row.id, readString(row.name) ?? "Nutzer");
    }
  }

  return names;
}

function idSet(rows: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(rows)) {
    return ids;
  }

  for (const row of rows) {
    if (isRecord(row) && typeof row.vehicle_id === "string") {
      ids.add(row.vehicle_id);
    }
  }

  return ids;
}

function vehicleTitle(vehicle: Record<string, unknown> | null): string {
  if (!vehicle) {
    return "Inserat nicht mehr verfügbar";
  }

  const brand = readString(vehicle.brand) ?? "Fahrzeug";
  const model = readString(vehicle.model) ?? "";
  return model ? `${brand} ${model}` : brand;
}

function mainImage(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const images = value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const url = readString(entry.url);
    return url ? [{ url, main: entry.is_main === true }] : [];
  });
  images.sort((left, right) => Number(right.main) - Number(left.main));
  return images[0]?.url ?? null;
}

function registrationLabel(date: string | null, year: number | null): string {
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [yearPart, month] = date.split("-");
    return `${month}/${yearPart}`;
  }

  return year !== null ? String(year) : "—";
}

function numberLabel(value: number | null, unit: string): string {
  if (value === null) {
    return "—";
  }

  const formatted = new Intl.NumberFormat("de-DE").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }

  return isRecord(value) ? value : null;
}

function readServices(value: unknown): DealerService[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) =>
    entry === "finanzierung" || entry === "inzahlungnahme" || entry === "werkstatt" || entry === "lieferung" ? [entry] : [],
  );
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
