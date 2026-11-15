import Link from "next/link";
import { allBodyTypes, listingCategories } from "@/lib/listing-options";
import type { VehicleFilters } from "@/lib/filters";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

type SearchFiltersProps = {
  filters: VehicleFilters;
};

export function SearchFilters({ filters }: SearchFiltersProps) {
  const selectedKind = filters.body || filters.type;

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <form
        key={`${filters.brand}-${filters.model}-${selectedKind}-${filters.priceMin}-${filters.priceMax}`}
        action="/suche"
        method="get"
        aria-label="Filter"
        className="rounded-2xl border border-line bg-card p-4"
      >
        <h2 className="text-base font-semibold">Filter</h2>

        <label htmlFor="filter-brand" className="mt-4 block text-sm font-medium">
          Marke
          <input
            id="filter-brand"
            name="brand"
            defaultValue={filters.brand}
            className={fieldClassName}
          />
        </label>

        <label htmlFor="filter-model" className="mt-4 block text-sm font-medium">
          Modell
          <input
            id="filter-model"
            name="model"
            defaultValue={filters.model}
            className={fieldClassName}
          />
        </label>

        <label htmlFor="filter-type" className="mt-4 block text-sm font-medium">
          Fahrzeugtyp
          <select
            id="filter-type"
            name="type"
            defaultValue={selectedKind}
            className={fieldClassName}
          >
            <option value="">Alle Fahrzeugtypen</option>
            <optgroup label="Fahrzeugart">
              {listingCategories.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </optgroup>
            <optgroup label="Aufbau">
              {allBodyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label htmlFor="filter-price-min" className="mt-4 block text-sm font-medium">
          Preis von
          <input
            id="filter-price-min"
            name="price_min"
            inputMode="numeric"
            defaultValue={filters.priceMin ?? ""}
            className={fieldClassName}
          />
        </label>

        <label htmlFor="filter-price-max" className="mt-4 block text-sm font-medium">
          Preis bis
          <input
            id="filter-price-max"
            name="price_max"
            inputMode="numeric"
            defaultValue={filters.priceMax ?? ""}
            className={fieldClassName}
          />
        </label>

        <button
          type="submit"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
        >
          Filter anwenden
        </button>
        <Link
          href="/suche"
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-muted hover:text-foreground"
        >
          Zurücksetzen
        </Link>
      </form>
    </aside>
  );
}
