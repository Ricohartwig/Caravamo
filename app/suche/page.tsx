import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchFilters } from "@/components/SearchFilters";
import { VehicleCard } from "@/components/VehicleCard";
import { filterVehicles, parseFilters } from "@/lib/filters";
import { formatOfferCount } from "@/lib/format";
import { listOfferCards } from "@/lib/published-listings";

export const metadata: Metadata = {
  title: "Fahrzeuge suchen",
  description: "Durchsuchen Sie Angebote nach Marke, Modell und Fahrzeugtyp.",
};

export default function SuchePage({ searchParams }: PageProps<"/suche">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Fahrzeuge suchen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Veröffentlichte Inserate stehen neben den Beispielangeboten. Filter kommen
        aus der Adresse und gelten sofort auf dieser Seite.
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
  const published = await listOfferCards();
  const results = [
    ...published.filter(
      (vehicle) =>
        sameTextValue(vehicle.brand, filters.brand) &&
        sameTextValue(vehicle.model, filters.model) &&
        sameTextValue(vehicle.type, filters.type),
    ),
    ...filterVehicles(filters),
  ];
  const active = [
    filters.brand ? `Marke ${filters.brand}` : "",
    filters.model ? `Modell ${filters.model}` : "",
    filters.type ? `Typ ${filters.type}` : "",
  ].filter((entry) => entry.length > 0);

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
            <h2 className="text-lg font-semibold">
              Keine Fahrzeuge für diese Auswahl
            </h2>
            <p className="mt-2 text-sm text-muted">
              Marke, Modell und Typ passen gemeinsam auf kein Angebot. Setzen
              Sie die Filter zurück oder wählen Sie eine andere Kombination.
            </p>
            <a
              href="/suche"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam"
            >
              Alle Angebote zeigen
            </a>
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

function sameTextValue(value: string, query: string): boolean {
  if (query === "") {
    return true;
  }

  return value.toLocaleLowerCase("de-DE") === query.toLocaleLowerCase("de-DE");
}

function SearchFallback() {
  return (
    <p className="mt-6 text-sm text-muted" role="status">
      Angebote werden geladen.
    </p>
  );
}
