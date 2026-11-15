import Link from "next/link";
import {
  bedTypes,
  bodyTypes,
  fuels,
  listingCategories,
  transmissions,
} from "@/lib/listing-options";
import { selectedCategory, weightLimitKg, weightSliderMaxKg, type VehicleFilters } from "@/lib/filters";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

const weightSliderMinKg = 750;

const filterControls = `
(() => {
  const form = document.querySelector('form[aria-label="Filter"]');
  if (!form) return;
  const weight = form.querySelector("#filter-weight");
  const label = form.querySelector("[data-weight-label]");
  const preset = form.querySelector("[data-weight-preset]");
  const max = ${weightSliderMaxKg};
  const limit = ${weightLimitKg};
  const format = (value) => new Intl.NumberFormat("de-DE").format(value);
  const text = (value) =>
    value >= max ? "alle Gewichte" : value === limit ? format(value) + " kg, Führerschein B" : format(value) + " kg";
  const paint = () => {
    if (!(weight instanceof HTMLInputElement) || !label) return;
    const value = Number(weight.value);
    const next = text(value);
    label.textContent = next;
    weight.setAttribute("aria-valuenow", String(value));
    weight.setAttribute("aria-valuetext", next);
    if (preset) preset.setAttribute("aria-pressed", value === limit ? "true" : "false");
  };
  weight?.addEventListener("input", paint);
  preset?.addEventListener("click", () => {
    if (weight instanceof HTMLInputElement) weight.value = String(limit);
    paint();
  });
  form.addEventListener("submit", () => {
    const type = form.querySelector("#filter-type");
    const motorhome = type instanceof HTMLSelectElement && type.value === "Wohnmobil";
    for (const field of form.elements) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement) || !field.name) continue;
      const camperField = Boolean(field.closest("fieldset"));
      const unlimited = field.name === "weight_max" && Number(field.value) >= max;
      if ((camperField && !motorhome) || unlimited || field.value === "") field.disabled = true;
    }
  });
})();
`;

type SearchFiltersProps = {
  filters: VehicleFilters;
};

export function SearchFilters({ filters }: SearchFiltersProps) {
  const initialCategory = selectedCategory(filters);

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <form action="/suche" method="get" aria-label="Filter" className="group rounded-2xl border border-line bg-card p-4">
        <h2 className="text-base font-semibold">Filter</h2>

        <label htmlFor="filter-brand" className="mt-4 block text-sm font-medium">
          Marke
          <input id="filter-brand" name="brand" defaultValue={filters.brand} className={fieldClassName} />
        </label>

        <label htmlFor="filter-model" className="mt-4 block text-sm font-medium">
          Modell
          <input id="filter-model" name="model" defaultValue={filters.model} className={fieldClassName} />
        </label>

        <label htmlFor="filter-type" className="mt-4 block text-sm font-medium">
          Fahrzeugart
          <select id="filter-type" name="type" defaultValue={initialCategory} className={fieldClassName}>
            <option value="">Alle Fahrzeugarten</option>
            {listingCategories.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden group-has-[option[value=Wohnmobil]:checked]:block">
          <MotorhomeFilters filters={filters} />
        </div>

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
      <script dangerouslySetInnerHTML={{ __html: filterControls }} />
    </aside>
  );
}

function MotorhomeFilters({ filters }: { filters: VehicleFilters }) {
  const weight = filters.weightMax ?? weightSliderMaxKg;
  const label = weightText(weight);

  return (
    <fieldset className="mt-4 space-y-4 border-t border-line pt-4">
      <legend className="text-sm font-semibold">Wohnmobil</legend>

      <label htmlFor="filter-body" className="block text-sm font-medium">
        Aufbauart
        <select id="filter-body" name="body" defaultValue={filters.body} className={fieldClassName}>
          <option value="">Alle Aufbauarten</option>
          {bodyTypes.Wohnmobil.map((body) => (
            <option key={body} value={body}>
              {body}
            </option>
          ))}
        </select>
      </label>

      <div>
        <label htmlFor="filter-weight" className="block text-sm font-medium">
          Gewicht bis
          <span data-weight-label className="mt-1 block text-sm font-normal text-muted">
            {label}
          </span>
          <input
            id="filter-weight"
            type="range"
            min={weightSliderMinKg}
            max={weightSliderMaxKg}
            step={50}
            defaultValue={weight}
            aria-valuemin={weightSliderMinKg}
            aria-valuemax={weightSliderMaxKg}
            aria-valuenow={weight}
            aria-valuetext={label}
            name="weight_max"
            className="mt-3 w-full accent-pine"
          />
        </label>
        <button
          type="button"
          data-weight-preset={weightLimitKg}
          aria-pressed={weight === weightLimitKg}
          className="mt-2 inline-flex h-9 items-center rounded-full border border-line px-3 text-sm font-medium hover:bg-sand aria-pressed:border-pine aria-pressed:bg-sand"
        >
          bis 3.500 kg
        </button>
      </div>

      <div className="space-y-2">
        <Check name="solar" label="Solaranlage" checked={filters.solar} />
        <Check name="inverter" label="Wechselrichter" checked={filters.inverter} />
        <Check name="awning" label="Markise" checked={filters.awning} />
        <Check name="air" label="Luftfederung" checked={filters.air} />
        <Check name="climate" label="Dachklimaanlage" value="Dachklimaanlage" checked={filters.climate === "Dachklimaanlage"} />
      </div>

      <label htmlFor="filter-fuel" className="block text-sm font-medium">
        Kraftstoff
        <select id="filter-fuel" name="fuel" defaultValue={filters.fuel} className={fieldClassName}>
          <option value="">Alle Kraftstoffe</option>
          {fuels.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="filter-transmission" className="block text-sm font-medium">
        Getriebe
        <select id="filter-transmission" name="transmission" defaultValue={filters.transmission} className={fieldClassName}>
          <option value="">Alle Getriebe</option>
          {transmissions.map((transmission) => (
            <option key={transmission} value={transmission}>
              {transmission}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="filter-bed" className="block text-sm font-medium">
        Bettentyp
        <select id="filter-bed" name="bed" defaultValue={filters.bed} className={fieldClassName}>
          <option value="">Alle Betten</option>
          {bedTypes.map((bed) => (
            <option key={bed} value={bed}>
              {bed}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="filter-sleep" className="block text-sm font-medium">
        Schlafplätze ab
        <select id="filter-sleep" name="sleep_min" defaultValue={filters.sleepMin ?? ""} className={fieldClassName}>
          <option value="">Egal</option>
          {[2, 3, 4, 5, 6].map((places) => (
            <option key={places} value={places}>
              {places}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

function Check({
  name,
  label,
  checked,
  value = "1",
}: {
  name: string;
  label: string;
  checked: boolean;
  value?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="size-4 accent-pine" />
      {label}
    </label>
  );
}

function weightText(value: number): string {
  if (value >= weightSliderMaxKg) {
    return "alle Gewichte";
  }

  const formatted = value.toLocaleString("de-DE");
  return value === weightLimitKg ? `${formatted} kg, Führerschein B` : `${formatted} kg`;
}
