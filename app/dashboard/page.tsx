import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { payForListing } from "@/actions/checkout";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { formatPrice } from "@/lib/format";
import { isPublicListing } from "@/lib/listing-payment";
import { listOwnedVehicles, type OwnedVehicle } from "@/lib/owned-listings";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Meine Inserate",
  description: "Eigene Fahrzeuge bei Caravamo bearbeiten oder löschen.",
};

const paymentNotices: Record<string, string> = {
  erfolgreich:
    "Stripe hat die Zahlung angenommen. Das Inserat wird öffentlich, sobald die Bestätigung ankommt.",
  abgebrochen: "Die Zahlung wurde abgebrochen. Der Entwurf bleibt in deinem Konto.",
  "nicht-eingerichtet":
    "Die Bezahlung ist noch nicht eingerichtet. Der Entwurf bleibt gespeichert und ist nicht öffentlich.",
  fehler: "Stripe hat die Zahlung gerade nicht gestartet. Der Entwurf bleibt gespeichert.",
  unbekannt: "Dieses Inserat gehört nicht zu deinem Konto.",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ zahlung?: string | string[] }>;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Konto</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Meine Inserate</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Hier stehen nur die Fahrzeuge deines Kontos. Ein Entwurf wird erst nach der Stripe-Zahlung öffentlich.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Inserate werden geladen.</p>}>
        <OwnedListings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OwnedListings({
  searchParams,
}: {
  searchParams: Promise<{ zahlung?: string | string[] }>;
}) {
  const params = await searchParams;
  const noticeKey = Array.isArray(params.zahlung) ? params.zahlung[0] : params.zahlung;
  const notice = noticeKey ? paymentNotices[noticeKey] : undefined;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login?next=/dashboard");
  }

  const vehicles = await listOwnedVehicles(data.user.id);
  if (vehicles.length === 0) {
    return (
      <div className="mt-8">
        <PaymentNotice notice={notice} />
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
        <p className="text-lg font-semibold">Noch keine eigenen Inserate</p>
        <p className="mt-2 text-sm text-muted">Ein neues Fahrzeug erscheint hier, sobald du es veröffentlichst.</p>
        <Link
          href="/inserieren"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam"
        >
          Fahrzeug inserieren
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <PaymentNotice notice={notice} />
      <ul className="space-y-4">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <OwnedListingRow vehicle={vehicle} />
        </li>
      ))}
      </ul>
    </div>
  );
}

function PaymentNotice({ notice }: { notice: string | undefined }) {
  if (!notice) {
    return null;
  }

  return (
    <p role="status" className="rounded-2xl border border-line bg-sand px-4 py-3 text-sm text-ink">
      {notice}
    </p>
  );
}

function statusLabel(vehicle: OwnedVehicle, visible: boolean): string {
  if (visible) {
    return "Veröffentlicht";
  }

  return vehicle.status === "aktiv" ? "Abgelaufen" : "Entwurf";
}

function formatUntil(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function OwnedListingRow({ vehicle }: { vehicle: OwnedVehicle }) {
  const visible = isPublicListing(vehicle.status, vehicle.publishedUntil);
  const until = vehicle.publishedUntil ? formatUntil(vehicle.publishedUntil) : null;

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
          <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">{statusLabel(vehicle, visible)}</p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatPrice(vehicle.price)} · {vehicle.type}
          {visible && until ? ` · sichtbar bis ${until}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {visible ? (
            <Link
              href={`/fahrzeug/${vehicle.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
            >
              Ansehen
            </Link>
          ) : (
            <form action={payForListing}>
              <input type="hidden" name="id" value={vehicle.id} />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
              >
                {vehicle.status === "aktiv" ? "Erneut bezahlen" : "Jetzt bezahlen"}
              </button>
            </form>
          )}
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
