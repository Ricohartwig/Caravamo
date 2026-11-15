"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  brands,
  isBrand,
  isVehicleType,
  modelsByBrand,
  vehicleTypes,
  type Brand,
  type VehicleType,
} from "@/lib/vehicles";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:cursor-not-allowed disabled:opacity-60";

export function SearchBox() {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | "">("");
  const [model, setModel] = useState("");
  const [type, setType] = useState<VehicleType | "">("");

  const models = brand ? modelsByBrand[brand] : [];

  function handleBrandChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!isBrand(value)) {
      setBrand("");
      setModel("");
      return;
    }

    setBrand(value);
    if (model && !modelsByBrand[value].includes(model)) {
      setModel("");
    }
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setType(isVehicleType(value) ? value : "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (brand) {
      params.set("marke", brand);
    }
    if (model) {
      params.set("modell", model);
    }
    if (type) {
      params.set("typ", type);
    }

    const query = params.toString();
    router.push(query ? `/suche?${query}` : "/suche");
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Fahrzeugsuche"
      className="mt-8 grid gap-3 rounded-2xl bg-card p-4 text-foreground shadow-xl sm:p-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <label htmlFor="marke" className="text-sm font-medium">
        Marke
        <select
          id="marke"
          name="marke"
          value={brand}
          onChange={handleBrandChange}
          className={fieldClassName}
        >
          <option value="">Alle Marken</option>
          {brands.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="modell" className="text-sm font-medium">
        Modell
        <select
          id="modell"
          name="modell"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          disabled={!brand}
          className={fieldClassName}
        >
          <option value="">
            {brand ? "Alle Modelle" : "Zuerst eine Marke wählen"}
          </option>
          {models.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="typ" className="text-sm font-medium">
        Fahrzeugtyp
        <select
          id="typ"
          name="typ"
          value={type}
          onChange={handleTypeChange}
          className={fieldClassName}
        >
          <option value="">Alle Fahrzeugtypen</option>
          {vehicleTypes.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-copper-dark px-5 font-semibold text-foam hover:bg-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper-dark lg:w-auto"
      >
        <Search aria-hidden="true" className="size-4" />
        Suchen
      </button>
    </form>
  );
}
