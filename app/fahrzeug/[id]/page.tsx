import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Gauge, Zap } from "lucide-react";
import { SellerContact } from "@/components/SellerContact";
import { VehicleGallery } from "@/components/VehicleGallery";
import { PublishedExpose } from "@/components/PublishedExpose";
import { formatMileage, formatPower, formatPrice } from "@/lib/format";
import { getPublishedListing } from "@/lib/published-listings";
import { getVehicle } from "@/lib/vehicles";

export const metadata: Metadata = {
  title: "Fahrzeug",
  description: "Exposé eines Fahrzeugs auf Caravamo.",
};

export default function VehiclePage({ params }: PageProps<"/fahrzeug/[id]">) {
  return (
    <Suspense fallback={<VehicleFallback />}>
      <VehicleExpose params={params} />
    </Suspense>
  );
}

async function VehicleExpose({
  params,
}: {
  params: PageProps<"/fahrzeug/[id]">["params"];
}) {
  const { id } = await params;
  const vehicle = getVehicle(id);

  if (!vehicle) {
    const listing = await getPublishedListing(id);
    if (!listing) {
      notFound();
    }

    return <PublishedExpose listing={listing} />;
  }

  const facts = [
    { label: "Preis", value: formatPrice(vehicle.price), icon: null },
    { label: "Baujahr", value: String(vehicle.year), icon: Calendar },
    { label: "Leistung", value: formatPower(vehicle.powerKw), icon: Zap },
    { label: "Kilometerstand", value: formatMileage(vehicle.mileage), icon: Gauge },
  ] as const;

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-sm text-muted">
        <Link href="/suche" className="font-medium text-pine hover:underline">
          Zur Suche
        </Link>
        <span aria-hidden="true"> · </span>
        {vehicle.brand} · {vehicle.type}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{vehicle.title}</h1>
        {vehicle.status === "aktiv" ? (
          <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">
            Inserat aktiv
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <VehicleGallery
            title={vehicle.title}
            type={vehicle.type}
            shots={vehicle.shots}
          />
          <dl className="mt-6 grid grid-cols-2 gap-3">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-line bg-card p-4"
              >
                <dt className="flex items-center gap-2 text-sm text-muted">
                  {fact.icon ? (
                    <fact.icon aria-hidden="true" className="size-4" />
                  ) : null}
                  {fact.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-6">
            <h2 className="text-lg font-semibold">Beschreibung</h2>
            <p className="mt-2 max-w-3xl leading-7 text-foreground">
              {vehicle.description}
            </p>
          </section>
        </div>
        <SellerContact seller={vehicle.seller} vehicleTitle={vehicle.title} />
      </div>
    </article>
  );
}

function VehicleFallback() {
  return (
    <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted" role="status">
      Exposé wird geladen.
    </p>
  );
}
