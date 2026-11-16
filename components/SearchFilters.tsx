import type { ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { BodyGlyph, type BodyGlyphKind } from "@/components/BodyGlyph";
import {
  bedTypes,
  bodyTypes,
  conditions,
  fuels,
  listingCategories,
  transmissions,
} from "@/lib/listing-options";
import {
  filterLabels,
  weightLimitKg,
  weightSliderMaxKg,
  type VehicleFilters,
} from "@/lib/filters";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

const weightSliderMinKg = 750;

const layoutStyle = `
.search-open-only {
  display: none;
}
.search-pair,
.search-scroll {
  display: contents;
}
.search-advanced {
  display: none;
}
.search-advanced > summary {
  list-style: none;
}
.search-advanced > summary::-webkit-details-marker {
  display: none;
}
#filter-expand:focus-visible ~ .search-layout [data-expand-toggle] {
  outline: 2px solid var(--color-pine);
  outline-offset: 2px;
}
#filter-expand:checked ~ .search-layout .search-open-only {
  display: flex;
}
#filter-expand:checked ~ .search-layout .search-advanced {
  display: block;
}
#filter-expand:checked ~ .search-layout .search-closed-only {
  display: none;
}
#filter-expand:checked ~ .search-layout .search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0;
  overflow: hidden;
}
#filter-expand:checked ~ .search-layout .search-scroll {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
#filter-expand:checked ~ .search-layout .search-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Wohnwagen"]:checked) .search-motor,
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Dachzelt/Faltanhänger"]:checked) .search-motor,
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Kabine"]:checked) .search-motor,
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Dachzelt/Faltanhänger"]:checked) .search-living,
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Dachzelt/Faltanhänger"]:checked) .search-exterior,
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Wohnmobil"]:checked) [data-body-cat]:not([data-body-cat="Wohnmobil"]),
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Wohnwagen"]:checked) [data-body-cat]:not([data-body-cat="Wohnwagen"]),
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Dachzelt/Faltanhänger"]:checked) [data-body-cat]:not([data-body-cat="Dachzelt/Faltanhänger"]),
#filter-expand:checked ~ .search-layout:has([name="type"] option[value="Kabine"]:checked) [data-body-cat]:not([data-body-cat="Kabine"]) {
  display: none;
}
@media (min-width: 1024px) {
  #filter-expand:checked ~ .search-layout {
    display: grid;
    grid-template-columns: 22rem minmax(0, 1fr);
    align-items: start;
    column-gap: 1.5rem;
  }
  #filter-expand:checked ~ .search-layout .search-form {
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 16rem);
    border-radius: 1rem;
  }
}
@media (max-width: 1023px) {
  #filter-expand:checked ~ .search-backdrop {
    display: block;
  }
  #filter-expand:checked ~ .search-layout .search-form {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    width: 100%;
    border-radius: 0;
    box-shadow: none;
  }
}
`;

const filterScript = `
(function () {
  var form = document.getElementById("search-filters");
  var expand = document.getElementById("filter-expand");
  if (!form || !expand || form.getAttribute("data-ready") === "1") return;
  form.setAttribute("data-ready", "1");
  var weight = document.getElementById("filter-weight");
  var label = document.getElementById("filter-weight-label");
  var preset = document.getElementById("filter-weight-preset");
  var max = ${weightSliderMaxKg};
  var limit = ${weightLimitKg};
  function text(value) {
    if (value >= max) return "alle Gewichte";
    var formatted = value.toLocaleString("de-DE");
    return value === limit ? formatted + " kg, Führerschein B" : formatted + " kg";
  }
  function paint() {
    if (!weight || !label) return;
    var value = Number(weight.value);
    var current = text(value);
    label.textContent = current;
    weight.setAttribute("aria-valuenow", String(value));
    weight.setAttribute("aria-valuetext", current);
    if (preset) preset.setAttribute("aria-pressed", value === limit ? "true" : "false");
  }
  function bindRange(rangeId, inputId, clearAtEnd) {
    var range = document.getElementById(rangeId);
    var input = document.getElementById(inputId);
    if (!range || !input) return;
    function fromRange() {
      var atEnd = clearAtEnd && Number(range.value) >= Number(range.max);
      var atStart = !clearAtEnd && Number(range.value) <= Number(range.min);
      input.value = atEnd || atStart ? "" : range.value;
    }
    range.addEventListener("input", fromRange);
    input.addEventListener("input", function () {
      if (input.value) range.value = input.value;
    });
  }
  function mark() {
    var open = expand.checked ? "true" : "false";
    var toggles = form.querySelectorAll("[data-expand-toggle]");
    for (var i = 0; i < toggles.length; i++) toggles[i].setAttribute("aria-expanded", open);
  }
  if (weight) weight.addEventListener("input", paint);
  if (preset && weight) {
    preset.addEventListener("click", function () {
      weight.value = String(limit);
      paint();
    });
  }
  bindRange("filter-price-range", "filter-price-max", true);
  bindRange("filter-year-range", "filter-year-min", false);
  bindRange("filter-km-range", "filter-km-max", true);
  expand.addEventListener("change", mark);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && expand.checked) {
      expand.checked = false;
      expand.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  form.addEventListener("submit", function () {
    var hidden = form.querySelector('input[type="hidden"][name="erweitert"]');
    if (expand.checked && hidden) hidden.disabled = true;
    var fields = form.elements;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (!field.name || field.type === "hidden" || field.type === "submit" || field.type === "button") continue;
      if (field === expand) continue;
      var unlimited = field.name === "weight_max" && Number(field.value) >= max;
      if (unlimited || field.value === "") field.disabled = true;
    }
  });
  mark();
})();
`;

export function SearchShell({
  filters,
  startOpen,
  children,
}: {
  filters: VehicleFilters;
  startOpen: boolean;
  children: ReactNode;
}) {
  const extra = advancedCount(filters);

  return (
    <div className="mt-6">
      <style>{layoutStyle}</style>
      <input
        id="filter-expand"
        name="erweitert"
        type="checkbox"
        value="1"
        form="search-filters"
        defaultChecked={startOpen}
        className="sr-only"
        aria-label="Weitere Filter"
      />
      <label htmlFor="filter-expand" className="search-backdrop fixed inset-0 z-50 hidden bg-ink/40">
        <span className="sr-only">Filter schließen</span>
      </label>
      <div className="search-layout">
        <form
          id="search-filters"
          action="/suche"
          method="get"
          aria-label="Filter"
          className="search-form mb-6 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input type="hidden" name="erweitert" value="0" />
          <div className="search-open-only shrink-0 items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Filter</h2>
            <label
              htmlFor="filter-expand"
              data-expand-toggle=""
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-semibold hover:bg-sand"
            >
              <X aria-hidden="true" className="size-4" />
              Einklappen
            </label>
          </div>
          <div className="search-scroll">
          <CategoryField value={filters.type} />
          <TextField id="filter-brand" name="brand" label="Marke" defaultValue={filters.brand} />
          <TextField id="filter-model" name="model" label="Modell" defaultValue={filters.model} />
          <BodyTiles body={filters.body} />
          <div className="search-pair">
            <TextField id="filter-price-min" name="price_min" label="Preis von" defaultValue={filters.priceMin ?? ""} numeric />
            <TextField id="filter-price-max" name="price_max" label="Preis bis" defaultValue={filters.priceMax ?? ""} numeric />
          </div>
          <label htmlFor="filter-price-range" className="search-advanced block text-sm font-medium">
            Regler für Preis bis
            <input
              id="filter-price-range"
              type="range"
              min={0}
              max={300000}
              step={1000}
              defaultValue={filters.priceMax ?? 300000}
              className="mt-2 w-full accent-pine"
            />
          </label>

          <details className="search-advanced rounded-xl border border-line px-3 py-2" open>
            <summary className="cursor-pointer text-sm font-semibold">Basisdaten</summary>
            <div className="mt-3 space-y-4">
              <fieldset>
                <legend className="text-sm font-medium">Fahrzeugzustand</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Radio name="condition" value="" label="Alle" defaultChecked={filters.condition === ""} />
                  {conditions.map((condition) => (
                    <Radio key={condition} name="condition" value={condition} label={condition} defaultChecked={filters.condition === condition} />
                  ))}
                </div>
              </fieldset>
              <div className="search-pair">
                <TextField id="filter-year-min" name="year_min" label="Erstzulassung von" defaultValue={filters.yearMin ?? ""} numeric />
                <TextField id="filter-year-max" name="year_max" label="Erstzulassung bis" defaultValue={filters.yearMax ?? ""} numeric />
              </div>
              <label htmlFor="filter-year-range" className="block text-sm text-muted">
                Erstzulassung ab
                <input
                  id="filter-year-range"
                  type="range"
                  min={1990}
                  max={2030}
                  step={1}
                  defaultValue={filters.yearMin ?? 1990}
                  className="mt-2 w-full accent-pine"
                />
              </label>
              <div className="search-motor">
                <div className="grid grid-cols-2 gap-3">
                  <TextField id="filter-km-min" name="mileage_min" label="Kilometer von" defaultValue={filters.mileageMin ?? ""} numeric />
                  <TextField id="filter-km-max" name="mileage_max" label="Kilometer bis" defaultValue={filters.mileageMax ?? ""} numeric />
                </div>
                <label htmlFor="filter-km-range" className="mt-3 block text-sm text-muted">
                  Kilometer bis
                  <input
                    id="filter-km-range"
                    type="range"
                    min={0}
                    max={200000}
                    step={5000}
                    defaultValue={filters.mileageMax ?? 200000}
                    className="mt-2 w-full accent-pine"
                  />
                </label>
              </div>
            </div>
          </details>

          <details className="search-advanced search-motor rounded-xl border border-line px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Technik</summary>
            <div className="mt-3 space-y-4">
              <SelectField id="filter-fuel" name="fuel" label="Kraftstoff" defaultValue={filters.fuel}>
                <option value="">Alle Kraftstoffe</option>
                {fuels.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </SelectField>
              <SelectField id="filter-transmission" name="transmission" label="Getriebe" defaultValue={filters.transmission}>
                <option value="">Alle Getriebe</option>
                {transmissions.map((transmission) => (
                  <option key={transmission} value={transmission}>
                    {transmission}
                  </option>
                ))}
              </SelectField>
              <TextField id="filter-power" name="power_min" label="Leistung ab PS" defaultValue={filters.powerMin ?? ""} numeric />
            </div>
          </details>

          <details className="search-advanced rounded-xl border border-line px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Maße und Gewicht</summary>
            <div className="mt-3 space-y-4">
              <div className="search-pair">
                <TextField id="filter-length-min" name="length_min" label="Länge von, cm" defaultValue={filters.lengthMin ?? ""} numeric />
                <TextField id="filter-length-max" name="length_max" label="Länge bis, cm" defaultValue={filters.lengthMax ?? ""} numeric />
              </div>
              <WeightField value={filters.weightMax} />
            </div>
          </details>

          <details className="search-advanced search-living rounded-xl border border-line px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Schlafplätze</summary>
            <div className="mt-3 space-y-4">
              <SelectField id="filter-sleep" name="sleep_min" label="Schlafplätze ab" defaultValue={filters.sleepMin ?? ""}>
                <option value="">Egal</option>
                {[2, 3, 4, 5, 6].map((places) => (
                  <option key={places} value={places}>
                    {places}
                  </option>
                ))}
              </SelectField>
              <SelectField id="filter-bed" name="bed" label="Bettentyp" defaultValue={filters.bed}>
                <option value="">Alle Betten</option>
                {bedTypes.map((bed) => (
                  <option key={bed} value={bed}>
                    {bed}
                  </option>
                ))}
              </SelectField>
            </div>
          </details>

          <details className="search-advanced rounded-xl border border-line px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Standort und Anbieter</summary>
            <div className="mt-3 space-y-4">
              <TextField id="filter-city" name="city" label="Ort oder PLZ" defaultValue={filters.city} />
              <fieldset>
                <legend className="text-sm font-medium">Anbieter</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Radio name="seller" value="" label="Alle" defaultChecked={filters.seller === ""} />
                  <Radio name="seller" value="haendler" label="Händler" defaultChecked={filters.seller === "haendler"} />
                  <Radio name="seller" value="privat" label="Privat" defaultChecked={filters.seller === "privat"} />
                </div>
              </fieldset>
            </div>
          </details>

          <fieldset className="search-advanced border-t border-line pt-4">
            <legend className="text-sm font-semibold">Ausstattung</legend>
            <div className="mt-3 space-y-2">
              <Check name="solar" label="Solaranlage" defaultChecked={filters.solar} />
              <Check name="inverter" label="Wechselrichter" defaultChecked={filters.inverter} />
              <Check name="bike" label="Fahrradträger" defaultChecked={filters.bike} />
              <Check name="hitch" label="Anhängerkupplung" defaultChecked={filters.hitch} />
              <div className="search-exterior space-y-2">
                <Check name="awning" label="Markise" defaultChecked={filters.awning} />
                <Check name="air" label="Luftfederung" defaultChecked={filters.air} />
              </div>
              <div className="search-living space-y-2">
                <Check name="climate" label="Dachklimaanlage" value="Dachklimaanlage" defaultChecked={filters.climate === "Dachklimaanlage"} />
                <Check name="heater" label="Standheizung" defaultChecked={filters.heater} />
                <Check name="shower" label="separate Dusche" defaultChecked={filters.shower} />
                <Check name="toilet" label="WC" defaultChecked={filters.toilet} />
                <Check name="seating" label="Rundsitzgruppe" defaultChecked={filters.seating} />
              </div>
              <Check name="sat" label="SAT-TV" defaultChecked={filters.sat} />
            </div>
          </fieldset>

          <div className="search-closed-only flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="submit"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
            >
              Suchen
            </button>
            <label
              htmlFor="filter-expand"
              data-expand-toggle=""
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Weitere Filter
              {extra > 0 ? <span className="text-muted">{extra}</span> : null}
            </label>
          </div>
          </div>

          <div className="search-open-only mt-1 shrink-0 flex-col border-t border-line pt-3">
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam hover:bg-pine-deep"
            >
              Treffer zeigen
            </button>
            <a
              href="/suche"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-muted hover:text-foreground"
            >
              Zurücksetzen
            </a>
          </div>
        </form>
        <div className="min-w-0">{children}</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: filterScript }} />
    </div>
  );
}

function CategoryField({ value }: { value: string }) {
  return (
    <label htmlFor="filter-type" className="block text-sm font-medium">
      Fahrzeugart
      <select id="filter-type" name="type" defaultValue={value} className={fieldClassName}>
        <option value="">Alle Fahrzeugarten</option>
        {listingCategories.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </label>
  );
}

const bodyGlyphs: Partial<Record<string, BodyGlyphKind>> = {
  Teilintegriert: "teil",
  Vollintegriert: "voll",
  Alkoven: "alkoven",
  "Kastenwagen (Campervan)": "kasten",
};

function BodyTiles({ body }: { body: string }) {
  return (
    <fieldset className="search-advanced">
      <legend className="text-sm font-semibold">Aufbau</legend>
      <div className="mt-2">
        <Radio name="body" value="" label="Alle Aufbauarten" defaultChecked={body === ""} />
      </div>
      {listingCategories.map((category) => (
        <div key={category} data-body-cat={category} className="mt-3">
          <p className="text-xs font-medium text-muted">{category}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {bodyTypes[category].map((entry) => {
              const glyph = bodyGlyphs[entry];
              return (
                <label
                  key={entry}
                  className="flex items-center gap-2 rounded-xl border border-line px-2 py-2 text-xs has-[:checked]:border-pine has-[:checked]:bg-sand"
                >
                  {glyph ? <BodyGlyph kind={glyph} /> : null}
                  <input type="radio" name="body" value={entry} defaultChecked={body === entry} className="size-4 accent-pine" />
                  {entry.replace(/ \(.*\)$/, "")}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

function TextField({
  id,
  name,
  label,
  defaultValue,
  numeric = false,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string | number;
  numeric?: boolean;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
      <input
        id={id}
        name={name}
        inputMode={numeric ? "numeric" : undefined}
        defaultValue={defaultValue}
        className={fieldClassName}
      />
    </label>
  );
}

function SelectField({
  id,
  name,
  label,
  defaultValue,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string | number;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
      <select id={id} name={name} defaultValue={defaultValue} className={fieldClassName}>
        {children}
      </select>
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
  value = "1",
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  value?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="size-4 accent-pine" />
      {label}
    </label>
  );
}

function Radio({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-pine has-[:checked]:bg-sand">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="accent-pine" />
      {label}
    </label>
  );
}

function WeightField({ value }: { value: number | null }) {
  const initial = value ?? weightSliderMaxKg;

  return (
    <div>
      <label htmlFor="filter-weight" className="block text-sm font-medium">
        Zulässiges Gesamtgewicht bis
        <span id="filter-weight-label" className="mt-1 block text-sm font-normal text-muted">
          {weightText(initial)}
        </span>
        <input
          id="filter-weight"
          type="range"
          min={weightSliderMinKg}
          max={weightSliderMaxKg}
          step={50}
          defaultValue={initial}
          aria-valuemin={weightSliderMinKg}
          aria-valuemax={weightSliderMaxKg}
          aria-valuenow={initial}
          aria-valuetext={weightText(initial)}
          name="weight_max"
          className="mt-3 w-full accent-pine"
        />
      </label>
      <button
        id="filter-weight-preset"
        type="button"
        aria-pressed={initial === weightLimitKg}
        className="mt-2 inline-flex h-9 items-center rounded-full border border-line px-3 text-sm font-medium hover:bg-sand aria-pressed:border-pine aria-pressed:bg-sand"
      >
        bis 3.500 kg
      </button>
    </div>
  );
}

function advancedCount(filters: VehicleFilters): number {
  const basic = filterLabels({
    ...filters,
    body: "",
    yearMin: null,
    yearMax: null,
    mileageMin: null,
    mileageMax: null,
    condition: "",
    city: "",
    seller: "",
    weightMax: null,
    lengthMin: null,
    lengthMax: null,
    powerMin: null,
    solar: false,
    inverter: false,
    awning: false,
    air: false,
    fuel: "",
    transmission: "",
    bed: "",
    climate: "",
    sleepMin: null,
    heater: false,
    shower: false,
    toilet: false,
    seating: false,
    sat: false,
    bike: false,
    hitch: false,
  });
  return Math.max(0, filterLabels(filters).length - basic.length);
}

function weightText(value: number): string {
  if (value >= weightSliderMaxKg) {
    return "alle Gewichte";
  }

  const formatted = value.toLocaleString("de-DE");
  return value === weightLimitKg ? `${formatted} kg, Führerschein B` : `${formatted} kg`;
}
