import {
  bedTypes,
  canonicalBodyType,
  categoryOfBody,
  climateOptions,
  fuels,
  isListingCategory,
  transmissions,
} from "@/lib/listing-options";
import { vehicles, type Vehicle } from "@/lib/vehicles";

export const weightLimitKg = 3500;
export const weightSliderMaxKg = 7500;

export type VehicleFilters = {
  brand: string;
  model: string;
  type: string;
  body: string;
  priceMin: number | null;
  priceMax: number | null;
  weightMax: number | null;
  solar: boolean;
  inverter: boolean;
  awning: boolean;
  air: boolean;
  fuel: string;
  transmission: string;
  bed: string;
  climate: string;
  sleepMin: number | null;
};

type SearchParamValue = string | string[] | undefined;

export function blankFilters(): VehicleFilters {
  return {
    brand: "",
    model: "",
    type: "",
    body: "",
    priceMin: null,
    priceMax: null,
    weightMax: null,
    solar: false,
    inverter: false,
    awning: false,
    air: false,
    fuel: "",
    transmission: "",
    bed: "",
    climate: "",
    sleepMin: null,
  };
}

function firstParam(value: SearchParamValue): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function priceParam(value: SearchParamValue): number | null {
  const raw = firstParam(value).replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return null;
  }

  const price = Math.round(Number(raw));
  if (!Number.isFinite(price) || price < 0 || price > 5_000_000) {
    return null;
  }

  return price;
}

function boundedInt(value: SearchParamValue, min: number, max: number): number | null {
  const raw = firstParam(value);
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);
  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function flagParam(value: SearchParamValue): boolean {
  const raw = firstParam(value).toLocaleLowerCase("de-DE");
  return raw === "1" || raw === "true" || raw === "on";
}

function choiceParam(value: SearchParamValue, options: readonly string[]): string {
  const raw = firstParam(value);
  return options.find((option) => option.toLocaleLowerCase("de-DE") === raw.toLocaleLowerCase("de-DE")) ?? "";
}

export function searchHref(filters: VehicleFilters): string {
  const params = new URLSearchParams();
  setText(params, "brand", filters.brand);
  setText(params, "model", filters.model);
  setText(params, "type", filters.type);
  setText(params, "body", filters.body);
  setText(params, "price_min", filters.priceMin);
  setText(params, "price_max", filters.priceMax);
  setText(params, "weight_max", filters.weightMax);
  setFlag(params, "solar", filters.solar);
  setFlag(params, "inverter", filters.inverter);
  setFlag(params, "awning", filters.awning);
  setFlag(params, "air", filters.air);
  setText(params, "fuel", filters.fuel);
  setText(params, "transmission", filters.transmission);
  setText(params, "bed", filters.bed);
  setText(params, "climate", filters.climate);
  setText(params, "sleep_min", filters.sleepMin);

  const query = params.toString();
  return query ? `/suche?${query}` : "/suche";
}

function setText(params: URLSearchParams, key: string, value: string | number | null): void {
  if (value === null || value === "") {
    return;
  }

  params.set(key, String(value));
}

function setFlag(params: URLSearchParams, key: string, value: boolean): void {
  if (value) {
    params.set(key, "1");
  }
}

export function filterLabels(filters: VehicleFilters): string[] {
  return [
    filters.brand ? `Marke ${filters.brand}` : "",
    filters.model ? `Modell ${filters.model}` : "",
    filters.type ? `Typ ${filters.type}` : "",
    filters.body ? `Aufbau ${filters.body}` : "",
    filters.priceMin !== null ? `ab ${filters.priceMin} €` : "",
    filters.priceMax !== null ? `bis ${filters.priceMax} €` : "",
    filters.weightMax !== null ? `Gewicht bis ${filters.weightMax.toLocaleString("de-DE")} kg` : "",
    filters.solar ? "Solaranlage" : "",
    filters.inverter ? "Wechselrichter" : "",
    filters.awning ? "Markise" : "",
    filters.air ? "Luftfederung" : "",
    filters.fuel ? `Kraftstoff ${filters.fuel}` : "",
    filters.transmission ? `Getriebe ${filters.transmission}` : "",
    filters.bed ? `Bett ${filters.bed}` : "",
    filters.climate ? filters.climate : "",
    filters.sleepMin !== null ? `ab ${filters.sleepMin} Schlafplätzen` : "",
  ].filter((entry) => entry.length > 0);
}

export function searchTitle(filters: VehicleFilters): string {
  const labels = filterLabels(filters);
  const title = labels.length > 0 ? labels.join(" · ") : "Alle Angebote";
  return title.slice(0, 80);
}

export function camperFilterActive(filters: VehicleFilters): boolean {
  return (
    filters.body.length > 0 ||
    filters.weightMax !== null ||
    filters.solar ||
    filters.inverter ||
    filters.awning ||
    filters.air ||
    filters.fuel.length > 0 ||
    filters.transmission.length > 0 ||
    filters.bed.length > 0 ||
    filters.climate.length > 0 ||
    filters.sleepMin !== null
  );
}

export function selectedCategory(filters: VehicleFilters): string {
  if (isListingCategory(filters.type)) {
    return filters.type;
  }

  return categoryOfBody(filters.body) ?? "";
}

export function parseStoredFilters(value: unknown): VehicleFilters {
  if (!isFilterRecord(value)) {
    return blankFilters();
  }

  return parseFilters({
    brand: textValue(value.brand),
    model: textValue(value.model),
    type: textValue(value.type),
    body: textValue(value.body),
    price_min: textValue(value.priceMin),
    price_max: textValue(value.priceMax),
    weight_max: textValue(value.weightMax),
    solar: flagValue(value.solar),
    inverter: flagValue(value.inverter),
    awning: flagValue(value.awning),
    air: flagValue(value.air),
    fuel: textValue(value.fuel),
    transmission: textValue(value.transmission),
    bed: textValue(value.bed),
    climate: textValue(value.climate),
    sleep_min: textValue(value.sleepMin),
  });
}

function isFilterRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown): string {
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function flagValue(value: unknown): string {
  return value === true || value === "1" || value === "true" ? "1" : "";
}

export function parseFilters(params: {
  brand?: SearchParamValue;
  model?: SearchParamValue;
  type?: SearchParamValue;
  body?: SearchParamValue;
  price_min?: SearchParamValue;
  price_max?: SearchParamValue;
  weight_max?: SearchParamValue;
  solar?: SearchParamValue;
  inverter?: SearchParamValue;
  awning?: SearchParamValue;
  air?: SearchParamValue;
  fuel?: SearchParamValue;
  transmission?: SearchParamValue;
  bed?: SearchParamValue;
  climate?: SearchParamValue;
  sleep_min?: SearchParamValue;
  marke?: SearchParamValue;
  modell?: SearchParamValue;
  typ?: SearchParamValue;
}): VehicleFilters {
  const requestedType = firstParam(params.type) || firstParam(params.typ);
  const requestedBody = firstParam(params.body);
  const kind = requestedBody
    ? { type: requestedType, body: canonicalBodyType(requestedBody) ?? "" }
    : splitKind(requestedType);

  return motorhomeOnly({
    brand: firstParam(params.brand) || firstParam(params.marke),
    model: firstParam(params.model) || firstParam(params.modell),
    type: listingType(kind),
    body: kind.body,
    priceMin: priceParam(params.price_min),
    priceMax: priceParam(params.price_max),
    weightMax: boundedInt(params.weight_max, 500, 20_000),
    solar: flagParam(params.solar),
    inverter: flagParam(params.inverter),
    awning: flagParam(params.awning),
    air: flagParam(params.air),
    fuel: choiceParam(params.fuel, fuels),
    transmission: choiceParam(params.transmission, transmissions),
    bed: choiceParam(params.bed, bedTypes),
    climate: choiceParam(params.climate, climateOptions),
    sleepMin: boundedInt(params.sleep_min, 1, 12),
  });
}

function motorhomeOnly(filters: VehicleFilters): VehicleFilters {
  const weightMax = filters.weightMax !== null && filters.weightMax >= weightSliderMaxKg ? null : filters.weightMax;
  if (selectedCategory(filters) === "Wohnmobil") {
    return { ...filters, weightMax };
  }

  return {
    ...filters,
    body: "",
    weightMax: null,
    solar: false,
    inverter: false,
    awning: false,
    air: false,
    fuel: "",
    transmission: "",
    bed: "",
    climate: "",
    sleepMin: null,
  };
}

function listingType(kind: { type: string; body: string }): string {
  if (isListingCategory(kind.type)) {
    return kind.type;
  }

  return categoryOfBody(kind.body) ?? "";
}

function splitKind(value: string): { type: string; body: string } {
  if (!value) {
    return { type: "", body: "" };
  }

  if (isListingCategory(value)) {
    return { type: value, body: "" };
  }

  const body = canonicalBodyType(value);
  if (body) {
    return { type: "", body };
  }

  return { type: "", body: "" };
}

function matches(field: string, query: string): boolean {
  if (!query) {
    return true;
  }

  return field.toLocaleLowerCase("de-DE") === query.toLocaleLowerCase("de-DE");
}

export function filterVehicles(filters: VehicleFilters): Vehicle[] {
  return vehicles.filter(
    (vehicle) =>
      matches(vehicle.brand, filters.brand) &&
      matches(vehicle.model, filters.model) &&
      matches(vehicle.type, filters.type),
  );
}
