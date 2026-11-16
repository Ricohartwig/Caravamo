import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteListingAsAdmin, setAccountBlocked, setDealerVerified, setListingBlocked } from "@/actions/admin";
import { accountProfile, currentUser } from "@/lib/account";
import { adminOverview, type AdminAccount, type AdminListing } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const instant = false;

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

const notices: Record<string, string> = {
  haendler: "Die Händler-Verifizierung ist gespeichert.",
  "konto-gesperrt": "Das Konto ist gesperrt. Öffentliche Inserate sind aus der Suche.",
  "konto-offen": "Die Sperre ist aufgehoben.",
  "inserat-gesperrt": "Das Inserat ist gesperrt.",
  "inserat-frei": "Das Inserat ist wieder im vorherigen Stand.",
  geloescht: "Das Inserat ist gelöscht.",
  "eigenes-konto": "Das eigene Admin-Konto bleibt offen.",
  "nicht-moeglich": "Das hat nicht geklappt.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  const profile = await accountProfile(user.id);
  if (!profile.admin) {
    notFound();
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const notice = noticeKey ? notices[noticeKey] : undefined;
  const overview = await adminOverview();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <p className="text-sm font-medium text-copper-dark">Betreiber</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Administration</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Neue Inserate, Händler und Konten. Gesperrte Inserate verschwinden aus der Suche. In der Registrierung gibt es nur Privat und Händler. Das Betreiber-Postfach wird beim Anlegen des Kontos Admin.
      </p>
      {notice ? <p className="mt-4 rounded-2xl border border-line bg-card px-4 py-3 text-sm">{notice}</p> : null}

      <section aria-labelledby="kennzahlen" className="mt-8">
        <h2 id="kennzahlen" className="text-lg font-semibold">
          Plattform
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Aktive Inserate" value={overview.stats.activeListings} />
          <Stat label="Neue Inserate, 7 Tage" value={overview.stats.newListings} />
          <Stat label="Laufzeit endet in 7 Tagen" value={overview.stats.expiringSoon} />
          <Stat label="Gesperrte Inserate" value={overview.stats.blockedListings} />
          <Stat label="Entwürfe" value={overview.stats.drafts} />
          <Stat label="Pausiert" value={overview.stats.paused} />
          <Stat label="Verkauft" value={overview.stats.sold} />
          <Stat label="Abgelaufen" value={overview.stats.expired} />
          <Stat label="Konten" value={overview.stats.accounts} />
          <Stat label="Privat" value={overview.stats.privateAccounts} />
          <Stat label="Händler" value={overview.stats.dealers} />
          <Stat label="Admins" value={overview.stats.admins} />
          <Stat label="Gesperrte Konten" value={overview.stats.blockedAccounts} />
          <Stat label="Händler verifiziert" value={overview.stats.verifiedDealers} />
          <Stat label="Händler offen" value={overview.stats.openDealers} />
          <Stat label="Neue Konten, 7 Tage" value={overview.stats.newAccounts} />
          <Stat label="Offene Anfragen" value={overview.stats.openInquiries} />
          <Stat label="Gemerkt" value={overview.stats.favorites} />
        </dl>
      </section>

      <section aria-labelledby="inserate" className="mt-10">
        <h2 id="inserate" className="text-lg font-semibold">
          Neueste Inserate
        </h2>
        {overview.listings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine Inserate.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {overview.listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="haendler" className="mt-10">
        <h2 id="haendler" className="text-lg font-semibold">
          Händler verifizieren
        </h2>
        {overview.dealers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine Händler-Konten.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {overview.dealers.map((dealer) => (
              <DealerRow key={dealer.id} dealer={dealer} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="konten" className="mt-10">
        <h2 id="konten" className="text-lg font-semibold">
          Konten
        </h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {overview.accounts.map((account) => (
            <AccountRow key={account.id} account={account} self={account.id === user.id} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value === null ? "—" : new Intl.NumberFormat("de-DE").format(value)}</dd>
    </div>
  );
}

function ListingRow({ listing }: { listing: AdminListing }) {
  const blocked = listing.status === "gesperrt";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{listing.title}</p>
        <p className="mt-1 text-sm text-muted">
          {listing.standLabel} · {listing.type}
          {listing.price !== null ? ` · ${formatPrice(listing.price)}` : ""} · {listing.sellerName}
          {listing.createdAt ? ` · ${formatDay(listing.createdAt)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {listing.status === "aktiv" ? (
          <Link
            href={`/fahrzeug/${listing.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-sand"
          >
            Ansehen
          </Link>
        ) : null}
        <form action={setListingBlocked}>
          <input type="hidden" name="id" value={listing.id} />
          <input type="hidden" name="blocked" value={blocked ? "nein" : "ja"} />
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-sand">
            {blocked ? "Freigeben" : "Sperren"}
          </button>
        </form>
        <form action={deleteListingAsAdmin}>
          <input type="hidden" name="id" value={listing.id} />
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-3 text-sm font-semibold text-foam hover:bg-copper">
            Löschen
          </button>
        </form>
      </div>
    </li>
  );
}

function DealerRow({ dealer }: { dealer: AdminAccount }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{dealer.companyName ?? dealer.name}</p>
        <p className="mt-1 text-sm text-muted">
          {dealer.name}
          {dealer.city ? ` · ${dealer.city}` : ""}
          {dealer.email ? ` · ${dealer.email}` : ""}
          {dealer.verified ? " · verifiziert" : " · noch nicht verifiziert"}
          {dealer.blocked ? " · Konto gesperrt" : ""}
        </p>
      </div>
      <form action={setDealerVerified}>
        <input type="hidden" name="id" value={dealer.id} />
        <input type="hidden" name="verified" value={dealer.verified ? "nein" : "ja"} />
        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-3 text-sm font-semibold text-foam hover:bg-pine-deep">
          {dealer.verified ? "Verifizierung zurücknehmen" : "Verifizieren"}
        </button>
      </form>
    </li>
  );
}

function AccountRow({ account, self }: { account: AdminAccount; self: boolean }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{account.name}</p>
        <p className="mt-1 text-sm text-muted">
          {account.roleLabel}
          {account.email ? ` · ${account.email}` : ""}
          {account.blocked ? " · gesperrt" : ""}
          {self ? " · das bist du" : ""}
        </p>
      </div>
      {self ? null : (
        <form action={setAccountBlocked}>
          <input type="hidden" name="id" value={account.id} />
          <input type="hidden" name="blocked" value={account.blocked ? "nein" : "ja"} />
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-sand">
            {account.blocked ? "Sperre aufheben" : "Konto sperren"}
          </button>
        </form>
      )}
    </li>
  );
}

function formatDay(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(parsed);
}
