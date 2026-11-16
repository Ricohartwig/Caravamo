import { Search, SlidersHorizontal } from "lucide-react";
import { allBodyTypes, listingCategories } from "@/lib/listing-options";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

const homeScript = `
(function () {
  var form = document.getElementById("home-search");
  if (!form || form.getAttribute("data-ready") === "1") return;
  form.setAttribute("data-ready", "1");
  form.addEventListener("submit", function () {
    var fields = form.elements;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (!field.name || field.type === "submit" || field.type === "button") continue;
      if (field.value === "") field.disabled = true;
    }
  });
})();
`;

export function SearchBox() {
  return (
    <form
      id="home-search"
      action="/suche"
      method="get"
      aria-label="Fahrzeugsuche"
      className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-foreground shadow-xl sm:p-5 lg:grid-cols-3"
    >
      <label htmlFor="brand" className="text-sm font-medium">
        Marke
        <input id="brand" name="brand" list="marken-vorschlaege" className={fieldClassName} />
      </label>
      <label htmlFor="model" className="text-sm font-medium">
        Modell
        <input id="model" name="model" className={fieldClassName} />
      </label>
      <label htmlFor="type" className="text-sm font-medium">
        Fahrzeugtyp
        <select id="type" name="type" defaultValue="" className={fieldClassName}>
          <option value="">Alle Fahrzeugtypen</option>
          <optgroup label="Fahrzeugart">
            {listingCategories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </optgroup>
          <optgroup label="Aufbau">
            {allBodyTypes.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label htmlFor="price-min" className="text-sm font-medium">
        Preis von
        <input id="price-min" name="price_min" inputMode="numeric" className={fieldClassName} />
      </label>
      <label htmlFor="price-max" className="text-sm font-medium">
        Preis bis
        <input id="price-max" name="price_max" inputMode="numeric" className={fieldClassName} />
      </label>
      <div className="flex flex-col gap-2 self-end sm:flex-row lg:col-span-3">
        <button
          type="submit"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-copper-dark px-5 font-semibold text-foam hover:bg-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper-dark"
        >
          <Search aria-hidden="true" className="size-4" />
          Suchen
        </button>
        <button
          type="submit"
          name="erweitert"
          value="1"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-foam px-5 font-semibold text-foreground hover:bg-sand"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Weitere Filter
        </button>
      </div>
      <datalist id="marken-vorschlaege">
        {["Challenger", "Fiat", "Hobby", "Knaus", "Weinsberg"].map((entry) => (
          <option key={entry} value={entry} />
        ))}
      </datalist>
      <script dangerouslySetInnerHTML={{ __html: homeScript }} />
    </form>
  );
}
