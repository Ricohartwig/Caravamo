import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import { VehiclePlaceholder } from "@/components/VehiclePlaceholder";
import { formatPrice } from "@/lib/format";
import { listOwnedVehicles, type OwnedVehicle } from "@/lib/owned-listings";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Meine Inserate",
  description: "Eigene Fahrzeuge bei Caravamo bearbeiten oder löschen.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-copper-dark">Konto</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Meine Inserate</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Hier stehen nur die Fahrzeuge deines Kontos. Bearbeiten lädt die Angaben zurück ins Formular.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Inserate werden geladen.</p>}>
        <OwnedListings />
      </Suspense>
    </div>
  );
}

async function OwnedListings() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login?next=/dashboard");
  }

  const vehicles = await listOwnedVehicles(data.user.id);
  if (vehicles.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
        <p className="text-lg font-semibold">Noch keine eigenen Inserate</p>
        <p className="mt-2 text-sm text-muted">Ein neues Fahrzeug erscheint hier, sobald du es veröffentlichst.</p>
        <Link
          href="/inserieren"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam"
        >
          Fahrzeug inserieren
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-4">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <OwnedListingRow vehicle={vehicle} />
        </li>
      ))}
    </ul>
  );
}

function OwnedListingRow({ vehicle }: { vehicle: OwnedVehicle }) {
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
          <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">
            {vehicle.status === "aktiv" ? "Veröffentlicht" : vehicle.status}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatPrice(vehicle.price)} · {vehicle.type}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/fahrzeug/${vehicle.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
          >
            Ansehen
          </Link>
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
