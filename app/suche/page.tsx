import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { VehicleCard } from "@/components/VehicleCard";
import { parseFilters, type VehicleFilters } from "@/lib/filters";
import { formatOfferCount, formatPrice } from "@/lib/format";
import { searchOffers } from "@/lib/published-listings";

export const metadata: Metadata = {
  title: "Fahrzeuge suchen",
  description: "Durchsuchen Sie Inserate nach Marke, Typ und Preis.",
};

export default function SuchePage({ searchParams }: PageProps<"/suche">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Fahrzeuge suchen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Die Treffer kommen aus den veröffentlichten Inseraten. Marke, Modell, Typ und Preis stehen in der Adresse.
      </p>
      <Suspense fallback={<SearchFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: PageProps<"/suche">["searchParams"];
}) {
  const filters = parseFilters(await searchParams);
  const results = await searchOffers(filters);
  const active = activeFilters(filters);

  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
      <SearchFilters filters={filters} />
      <section className="min-w-0 flex-1" aria-label="Suchergebnisse">
        <p className="text-sm font-medium text-muted">
          {formatOfferCount(results.length)}
          {active.length > 0 ? ` · ${active.join(" · ")}` : ""}
        </p>
        {results.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">Keine Fahrzeuge für diese Auswahl</h2>
            <p className="mt-2 text-sm text-muted">
              Zu diesen Filtern liegt kein Inserat vor. Setzen Sie die Filter zurück oder wählen Sie eine andere Kombination.
            </p>
            <Link
              href="/suche"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam"
            >
              Alle Angebote zeigen
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((vehicle) => (
              <li key={vehicle.id}>
                <VehicleCard vehicle={vehicle} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function activeFilters(filters: VehicleFilters): string[] {
  return [
    filters.brand ? `Marke ${filters.brand}` : "",
    filters.model ? `Modell ${filters.model}` : "",
    filters.type ? `Typ ${filters.type}` : "",
    filters.body ? `Aufbau ${filters.body}` : "",
    filters.priceMin !== null ? `ab ${formatPrice(filters.priceMin)}` : "",
    filters.priceMax !== null ? `bis ${formatPrice(filters.priceMax)}` : "",
  ].filter((entry) => entry.length > 0);
}

function SearchFallback() {
  return (
    <p className="mt-6 text-sm text-muted" role="status">
      Angebote werden geladen.
    </p>
  );
}
