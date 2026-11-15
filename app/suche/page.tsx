import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { saveSearch } from "@/actions/account";
import { SearchFilters } from "@/components/SearchFilters";
import { VehicleCard } from "@/components/VehicleCard";
import { loadCardMarks, marksFor } from "@/lib/account";
import { parseFilters, searchHref, searchTitle, type VehicleFilters } from "@/lib/filters";
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
  const [results, marks] = await Promise.all([searchOffers(filters), loadCardMarks(searchHref(filters))]);
  const active = activeFilters(filters);

  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
      <SearchFilters filters={filters} />
      <section className="min-w-0 flex-1" aria-label="Suchergebnisse">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-medium text-muted">
            {formatOfferCount(results.length)}
            {active.length > 0 ? ` · ${active.join(" · ")}` : ""}
          </p>
          <SaveSearchForm filters={filters} />
        </div>
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
                <VehicleCard vehicle={vehicle} marks={marksFor(vehicle.id, marks)} />
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

function SaveSearchForm({ filters }: { filters: VehicleFilters }) {
  return (
    <form action={saveSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="brand" value={filters.brand} />
      <input type="hidden" name="model" value={filters.model} />
      <input type="hidden" name="type" value={filters.type} />
      <input type="hidden" name="body" value={filters.body} />
      <input type="hidden" name="price_min" value={filters.priceMin ?? ""} />
      <input type="hidden" name="price_max" value={filters.priceMax ?? ""} />
      <label className="sr-only" htmlFor="suche-name">
        Name der Suche
      </label>
      <input
        id="suche-name"
        name="name"
        defaultValue={searchTitle(filters)}
        maxLength={80}
        className="h-11 rounded-xl border border-line bg-card px-3 text-sm"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-sand"
      >
        Suche speichern
      </button>
    </form>
  );
}

function SearchFallback() {
  return (
    <p className="mt-6 text-sm text-muted" role="status">
      Angebote werden geladen.
    </p>
  );
}
