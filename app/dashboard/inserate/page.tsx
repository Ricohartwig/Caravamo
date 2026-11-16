import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { payForListing } from "@/actions/checkout";
import { publishWithPackage } from "@/actions/packages";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { ListingControls } from "@/components/dashboard/ListingControls";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { accountProfile, currentUser } from "@/lib/account";
import { packageAllowance } from "@/lib/dealer-subscription";
import { formatDay, formatPrice } from "@/lib/format";
import { listingNeedsPayment, listingStand, type ListingStand } from "@/lib/listing-state";
import { listOwnedVehicles, type OwnedVehicle } from "@/lib/owned-listings";

export const metadata: Metadata = {
  title: "Meine Inserate",
  description: "Eigene Fahrzeuge ansehen, pausieren, verlängern oder löschen.",
};

const notices: Record<string, string> = {
  online: "Das Inserat ist wieder online.",
  pausiert: "Das Inserat ist pausiert. Die bezahlte Laufzeit läuft weiter.",
  verkauft: "Das Inserat ist als verkauft markiert und aus der Suche genommen.",
  paket: "Das Inserat ist über dein Paket online.",
  "paket-voll": "Alle Plätze im Paket sind belegt. Weitere Fahrzeuge buchst du einzeln oder wechselst das Paket.",
  "nicht-moeglich": "Das geht mit diesem Inserat gerade nicht.",
  "kopie-fehler": "Die Kopie konnte nicht angelegt werden.",
  unbekannt: "Dieses Inserat gehört nicht zu deinem Konto.",
};

const filters: { id: "alle" | ListingStand; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "entwurf", label: "Entwürfe" },
  { id: "aktiv", label: "Online" },
  { id: "inaktiv", label: "Pausiert" },
  { id: "abgelaufen", label: "Abgelaufen" },
  { id: "verkauft", label: "Verkauft" },
];

export default function InseratePage({
  searchParams,
}: {
  searchParams: Promise<{ stand?: string | string[]; hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Inserate werden geladen.</p>}>
      <OwnedListings searchParams={searchParams} />
    </Suspense>
  );
}

async function OwnedListings({
  searchParams,
}: {
  searchParams: Promise<{ stand?: string | string[]; hinweis?: string | string[] }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/inserate");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const requested = Array.isArray(params.stand) ? params.stand[0] : params.stand;
  const stand = filters.some((filter) => filter.id === requested) ? (requested as (typeof filters)[number]["id"]) : "alle";
  const profile = await accountProfile(user.id);
  const allowance = profile.business ? await packageAllowance(user.id) : null;
  const vehicles = await listOwnedVehicles(user.id);
  const visibleVehicles = vehicles.filter((vehicle) => stand === "alle" || listingStand(vehicle.status, vehicle.publishedUntil) === stand);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Meine Inserate</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Hier bearbeitest du den Preis, pausierst ein Inserat oder löschst es. Unter jedem Fahrzeug stehen die Aufrufe des Exposés und die Kontaktanfragen. Ein bezahltes Inserat kannst du pausieren und wieder online stellen. Die Laufzeit läuft dabei weiter.
      </p>
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const count = vehicles.filter((vehicle) => filter.id === "alle" || listingStand(vehicle.status, vehicle.publishedUntil) === filter.id).length;
          const href = filter.id === "alle" ? "/dashboard/inserate" : `/dashboard/inserate?stand=${filter.id}`;
          return (
            <Link
              key={filter.id}
              href={href}
              aria-current={stand === filter.id ? "page" : undefined}
              className={`inline-flex h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold ${
                stand === filter.id ? "bg-pine text-foam" : "bg-card hover:bg-sand"
              }`}
            >
              {filter.label}
              <span className="ml-2 text-xs">{count}</span>
            </Link>
          );
        })}
      </div>
      {vehicles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="text-lg font-semibold">Noch keine eigenen Inserate</p>
          <p className="mt-2 text-sm text-muted">Auch ohne Inserat bleiben Merkliste und Suchen in deinem Konto.</p>
          <Link
            href="/inserieren"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam"
          >
            Fahrzeug inserieren
          </Link>
        </div>
      ) : visibleVehicles.length === 0 ? (
        <p className="mt-6 text-sm text-muted">In dieser Ansicht liegt kein Inserat.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visibleVehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <OwnedListingRow vehicle={vehicle} packageFree={Boolean(allowance?.usable && allowance.free > 0)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OwnedListingRow({ vehicle, packageFree }: { vehicle: OwnedVehicle; packageFree: boolean }) {
  const stand = listingStand(vehicle.status, vehicle.publishedUntil);
  const until = vehicle.publishedUntil ? formatDay(vehicle.publishedUntil) : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4 sm:flex-row">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl sm:w-40 sm:shrink-0">
        {vehicle.imageUrl ? (
          <Image src={vehicle.imageUrl} alt="" fill sizes="160px" className="object-cover" />
        ) : (
          <VehiclePlaceholder title={vehicle.title} type={vehicle.type} tone={0} label="Front" decorative />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{vehicle.title}</h2>
          <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">{standLabel(stand)}</p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatPrice(vehicle.price)} · {vehicle.type}
          {until && (stand === "aktiv" || stand === "inaktiv") ? ` · Laufzeit bis ${until}` : ""}
        </p>
        <dl className="mt-3 grid max-w-md grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-sand px-3 py-2">
            <dt className="text-muted">Exposé aufgerufen</dt>
            <dd className="text-lg font-semibold">{formatCount(vehicle.viewCount)}</dd>
          </div>
          <div className="rounded-xl bg-sand px-3 py-2">
            <dt className="text-muted">Kontaktanfragen</dt>
            <dd className="text-lg font-semibold">{formatCount(vehicle.inquiryCount)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-muted">{countLabel(vehicle.saveCount, "Mal gemerkt", "Mal gemerkt")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/vorschau/${vehicle.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
          >
            Vorschau
          </Link>
          {stand === "aktiv" ? (
            <Link
              href={`/fahrzeug/${vehicle.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
            >
              Öffentliche Seite
            </Link>
          ) : null}
          {packageFree && listingNeedsPayment(vehicle.status, vehicle.publishedUntil) ? (
            <form action={publishWithPackage}>
              <input type="hidden" name="id" value={vehicle.id} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
              >
                Mit Paket veröffentlichen
              </button>
            </form>
          ) : null}
          {listingNeedsPayment(vehicle.status, vehicle.publishedUntil) ? (
            <form action={payForListing}>
              <input type="hidden" name="id" value={vehicle.id} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
              >
                {packageFree ? "Einzeln bezahlen" : stand === "abgelaufen" ? "Erneut bezahlen" : "Jetzt bezahlen"}
              </button>
            </form>
          ) : stand === "aktiv" && vehicle.billingSource === "paket" ? (
            <p className="text-sm font-semibold text-pine">Läuft über das Paket</p>
          ) : stand === "aktiv" ? (
            <form action={payForListing}>
              <input type="hidden" name="id" value={vehicle.id} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
              >
                Verlängern
              </button>
            </form>
          ) : null}
          <ListingControls id={vehicle.id} status={vehicle.status} publishedUntil={vehicle.publishedUntil} />
          <Link
            href={`/inserieren/${vehicle.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
          >
            Bearbeiten
          </Link>
          <DeleteListingButton id={vehicle.id} title={vehicle.title} />
        </div>
      </div>
    </article>
  );
}

function standLabel(stand: ListingStand): string {
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
  return "Entwurf";
}

function formatCount(count: number): string {
  return new Intl.NumberFormat("de-DE").format(count);
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${new Intl.NumberFormat("de-DE").format(count)} ${count === 1 ? singular : plural}`;
}
