import { connection } from "next/server";
import { listingStand } from "@/lib/listing-state";
import { isVehicleId } from "@/lib/owned-listings";
import { accountRoleLabel, isAdminRole } from "@/lib/roles";
import { isBusinessRole } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  roleLabel: "Admin" | "Händler" | "Privat";
  admin: boolean;
  dealer: boolean;
  companyName: string | null;
  city: string | null;
  verified: boolean;
  blocked: boolean;
  createdAt: string | null;
};

export type AdminListing = {
  id: string;
  title: string;
  type: string;
  price: number | null;
  status: string;
  standLabel: string;
  sellerId: string;
  sellerName: string;
  createdAt: string | null;
};

export type AdminStats = {
  activeListings: number;
  drafts: number;
  paused: number;
  sold: number;
  blockedListings: number;
  expired: number;
  newListings: number;
  expiringSoon: number;
  accounts: number;
  privateAccounts: number;
  dealers: number;
  admins: number;
  blockedAccounts: number;
  verifiedDealers: number;
  openDealers: number;
  newAccounts: number;
  openInquiries: number | null;
  favorites: number | null;
};

export type AdminOverview = {
  stats: AdminStats;
  listings: AdminListing[];
  dealers: AdminAccount[];
  accounts: AdminAccount[];
};

const weekMs = 7 * 24 * 60 * 60 * 1000;

export async function adminOverview(): Promise<AdminOverview> {
  await connection();
  const now = Date.now();
  const weekAgo = now - weekMs;
  const soon = now + weekMs;
  const supabase = await createClient();

  const [usersResult, vehiclesResult, newestResult, inquiriesResult, favoritesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, role, company_name, city, dealer_verified, blocked_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("vehicles").select("status, published_until, created_at").limit(2000),
    supabase
      .from("vehicles")
      .select("id, user_id, brand, model, type, price, status, published_until, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("favorites").select("user_id", { count: "exact", head: true }),
  ]);

  const accounts = (usersResult.data ?? []).flatMap((row) => {
    const account = toAccount(row);
    return account ? [account] : [];
  });
  const byId = new Map(accounts.map((account) => [account.id, account]));
  const listings = (newestResult.data ?? []).flatMap((row) => {
    const listing = toListing(row, byId);
    return listing ? [listing] : [];
  });

  const stats = emptyStats();
  stats.accounts = accounts.length;
  for (const account of accounts) {
    if (account.admin) {
      stats.admins += 1;
    } else if (account.dealer) {
      stats.dealers += 1;
      if (account.verified) {
        stats.verifiedDealers += 1;
      } else {
        stats.openDealers += 1;
      }
    } else {
      stats.privateAccounts += 1;
    }
    if (account.blocked) {
      stats.blockedAccounts += 1;
    }
    if (createdInWeek(account.createdAt, weekAgo, now)) {
      stats.newAccounts += 1;
    }
  }

  for (const row of vehiclesResult.data ?? []) {
    if (!isRecord(row)) {
      continue;
    }
    const status = readString(row.status) ?? "entwurf";
    const until = readString(row.published_until);
    const stand = listingStand(status, until, now);
    if (stand === "aktiv") {
      stats.activeListings += 1;
    } else if (stand === "entwurf") {
      stats.drafts += 1;
    } else if (stand === "inaktiv") {
      stats.paused += 1;
    } else if (stand === "verkauft") {
      stats.sold += 1;
    } else if (stand === "gesperrt") {
      stats.blockedListings += 1;
    } else if (stand === "abgelaufen") {
      stats.expired += 1;
    }
    if (createdInWeek(readString(row.created_at), weekAgo, now)) {
      stats.newListings += 1;
    }
    const untilMs = until ? Date.parse(until) : Number.NaN;
    if ((status === "aktiv" || status === "inaktiv") && Number.isFinite(untilMs) && untilMs > now && untilMs <= soon) {
      stats.expiringSoon += 1;
    }
  }

  stats.openInquiries = inquiriesResult.error ? null : (inquiriesResult.count ?? 0);
  stats.favorites = favoritesResult.error ? null : (favoritesResult.count ?? 0);

  return {
    stats,
    listings,
    dealers: accounts
      .filter((account) => account.dealer)
      .sort((left, right) => Number(left.verified) - Number(right.verified)),
    accounts,
  };
}

function emptyStats(): AdminStats {
  return {
    activeListings: 0,
    drafts: 0,
    paused: 0,
    sold: 0,
    blockedListings: 0,
    expired: 0,
    newListings: 0,
    expiringSoon: 0,
    accounts: 0,
    privateAccounts: 0,
    dealers: 0,
    admins: 0,
    blockedAccounts: 0,
    verifiedDealers: 0,
    openDealers: 0,
    newAccounts: 0,
    openInquiries: null,
    favorites: null,
  };
}

function toAccount(row: unknown): AdminAccount | null {
  if (!isRecord(row) || typeof row.id !== "string" || !isVehicleId(row.id)) {
    return null;
  }

  const role = readString(row.role);
  return {
    id: row.id,
    name: readString(row.name) ?? "Ohne Namen",
    email: readString(row.email) ?? "",
    roleLabel: accountRoleLabel(role),
    admin: isAdminRole(role),
    dealer: isBusinessRole(role),
    companyName: readString(row.company_name),
    city: readString(row.city),
    verified: row.dealer_verified === true,
    blocked: typeof row.blocked_at === "string" && row.blocked_at.length > 0,
    createdAt: readString(row.created_at),
  };
}

function toListing(row: unknown, accounts: Map<string, AdminAccount>): AdminListing | null {
  if (!isRecord(row) || typeof row.id !== "string" || !isVehicleId(row.id)) {
    return null;
  }

  const sellerId = readString(row.user_id) ?? "";
  const brand = readString(row.brand) ?? "Fahrzeug";
  const model = readString(row.model) ?? "";
  const status = readString(row.status) ?? "entwurf";
  const until = readString(row.published_until);
  const price = typeof row.price === "number" ? row.price : typeof row.price === "string" ? Number(row.price) : null;

  return {
    id: row.id,
    title: model ? `${brand} ${model}` : brand,
    type: readString(row.type) ?? "Fahrzeug",
    price: price !== null && Number.isFinite(price) ? price : null,
    status,
    standLabel: standText(listingStand(status, until)),
    sellerId,
    sellerName: accounts.get(sellerId)?.name ?? "Unbekannt",
    createdAt: readString(row.created_at),
  };
}

function standText(stand: ReturnType<typeof listingStand>): string {
  if (stand === "aktiv") {
    return "Online";
  }
  if (stand === "inaktiv") {
    return "Pausiert";
  }
  if (stand === "verkauft") {
    return "Verkauft";
  }
  if (stand === "abgelaufen") {
    return "Abgelaufen";
  }
  if (stand === "gesperrt") {
    return "Gesperrt";
  }
  return "Entwurf";
}

function createdInWeek(value: string | null, weekAgo: number, now: number): boolean {
  if (!value) {
    return false;
  }
  const created = Date.parse(value);
  return Number.isFinite(created) && created >= weekAgo && created <= now;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
