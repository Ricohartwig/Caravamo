import { brands, modelsByBrand, vehicleTypes } from "@/lib/vehicles";
import type { VehicleFilters } from "@/lib/filters";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

type SearchFiltersProps = {
  filters: VehicleFilters;
};

export function SearchFilters({ filters }: SearchFiltersProps) {
  return (
    <aside className="w-full shrink-0 lg:w-72">
      <form
        key={`${filters.brand}-${filters.model}-${filters.type}`}
        action="/suche"
        method="get"
        aria-label="Filter"
        className="rounded-2xl border border-line bg-card p-4"
      >
        <h2 className="text-base font-semibold">Filter</h2>

        <label htmlFor="filter-marke" className="mt-4 block text-sm font-medium">
          Marke
          <select
            id="filter-marke"
            name="marke"
            defaultValue={filters.brand}
            className={fieldClassName}
          >
            <option value="">Alle Marken</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="filter-modell" className="mt-4 block text-sm font-medium">
          Modell
          <select
            id="filter-modell"
            name="modell"
            defaultValue={filters.model}
            className={fieldClassName}
          >
            <option value="">Alle Modelle</option>
            {brands.map((brand) => (
              <optgroup key={brand} label={brand}>
                {modelsByBrand[brand].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label htmlFor="filter-typ" className="mt-4 block text-sm font-medium">
          Fahrzeugtyp
          <select
            id="filter-typ"
            name="typ"
            defaultValue={filters.type}
            className={fieldClassName}
          >
            <option value="">Alle Fahrzeugtypen</option>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
        >
          Filter anwenden
        </button>
        <a
          href="/suche"
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-muted hover:text-foreground"
        >
          Zurücksetzen
        </a>
      </form>
    </aside>
  );
}
