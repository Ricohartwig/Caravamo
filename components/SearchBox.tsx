"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { allBodyTypes, listingCategories } from "@/lib/listing-options";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

export function SearchBox() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (brand.trim()) {
      params.set("brand", brand.trim());
    }
    if (model.trim()) {
      params.set("model", model.trim());
    }
    if (type) {
      params.set("type", type);
    }
    if (priceMin.trim()) {
      params.set("price_min", priceMin.trim());
    }
    if (priceMax.trim()) {
      params.set("price_max", priceMax.trim());
    }

    const query = params.toString();
    router.push(query ? `/suche?${query}` : "/suche");
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Fahrzeugsuche"
      className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-foreground shadow-xl sm:p-5 lg:grid-cols-3"
    >
      <label htmlFor="brand" className="text-sm font-medium">
        Marke
        <input
          id="brand"
          name="brand"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          list="marken-vorschlaege"
          className={fieldClassName}
        />
      </label>
      <label htmlFor="model" className="text-sm font-medium">
        Modell
        <input
          id="model"
          name="model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor="type" className="text-sm font-medium">
        Fahrzeugtyp
        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={fieldClassName}
        >
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
        <input
          id="price-min"
          name="price_min"
          inputMode="numeric"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor="price-max" className="text-sm font-medium">
        Preis bis
        <input
          id="price-max"
          name="price_max"
          inputMode="numeric"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 self-end rounded-xl bg-copper-dark px-5 font-semibold text-foam hover:bg-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper-dark"
      >
        <Search aria-hidden="true" className="size-4" />
        Suchen
      </button>
      <datalist id="marken-vorschlaege">
        {["Challenger", "Fiat", "Hobby", "Knaus", "Weinsberg"].map((entry) => (
          <option key={entry} value={entry} />
        ))}
      </datalist>
    </form>
  );
}
