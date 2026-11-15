import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { payForListing } from "@/actions/checkout";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { formatDay, formatPrice } from "@/lib/format";
import { isPublicListing } from "@/lib/listing-payment";
import { currentUser } from "@/lib/account";
import { listOwnedVehicles, type OwnedVehicle } from "@/lib/owned-listings";

export const metadata: Metadata = {
  title: "Meine Inserate",
  description: "Eigene Fahrzeuge bearbeiten, verlängern oder löschen.",
};

export default function InseratePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Inserate werden geladen.</p>}>
      <OwnedListings />
    </Suspense>
  );
}

async function OwnedListings() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/inserate");
  }

  const vehicles = await listOwnedVehicles(user.id);
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Meine Inserate</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Ein Entwurf wird erst nach der Stripe-Zahlung öffentlich. Ein laufendes Inserat kannst du verlängern, dann kommen 30 Tage dazu.
      </p>
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
      ) : (
        <ul className="mt-6 space-y-4">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <OwnedListingRow vehicle={vehicle} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusLabel(vehicle: OwnedVehicle, visible: boolean): string {
  if (visible) {
    return "Veröffentlicht";
  }

  return vehicle.status === "aktiv" ? "Abgelaufen" : "Entwurf";
}

function payLabel(vehicle: OwnedVehicle, visible: boolean): string {
  if (visible) {
    return "Verlängern";
  }

  return vehicle.status === "aktiv" ? "Erneut bezahlen" : "Jetzt bezahlen";
}

function OwnedListingRow({ vehicle }: { vehicle: OwnedVehicle }) {
  const visible = isPublicListing(vehicle.status, vehicle.publishedUntil);
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
          ) : null}
          <form action={payForListing}>
            <input type="hidden" name="id" value={vehicle.id} />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
            >
              {payLabel(vehicle, visible)}
            </button>
          </form>
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
