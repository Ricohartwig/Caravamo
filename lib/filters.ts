import { canonicalBodyType, isListingCategory } from "@/lib/listing-options";
import { vehicles, type Vehicle } from "@/lib/vehicles";

export type VehicleFilters = {
  brand: string;
  model: string;
  type: string;
  body: string;
  priceMin: number | null;
  priceMax: number | null;
};

type SearchParamValue = string | string[] | undefined;

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

export function searchHref(filters: VehicleFilters): string {
  const params = new URLSearchParams();
  if (filters.brand) {
    params.set("brand", filters.brand);
  }
  if (filters.model) {
    params.set("model", filters.model);
  }
  if (filters.type) {
    params.set("type", filters.type);
  }
  if (filters.body) {
    params.set("body", filters.body);
  }
  if (filters.priceMin !== null) {
    params.set("price_min", String(filters.priceMin));
  }
  if (filters.priceMax !== null) {
    params.set("price_max", String(filters.priceMax));
  }

  const query = params.toString();
  return query ? `/suche?${query}` : "/suche";
}

export function searchTitle(filters: VehicleFilters): string {
  const parts = [
    filters.brand,
    filters.model,
    filters.type,
    filters.body,
    filters.priceMin !== null ? `ab ${filters.priceMin} €` : "",
    filters.priceMax !== null ? `bis ${filters.priceMax} €` : "",
  ].filter((part) => part.length > 0);

  const title = parts.length > 0 ? parts.join(" · ") : "Alle Angebote";
  return title.slice(0, 80);
}

export function parseStoredFilters(value: unknown): VehicleFilters {
  if (!isFilterRecord(value)) {
    return { brand: "", model: "", type: "", body: "", priceMin: null, priceMax: null };
  }

  return parseFilters({
    brand: typeof value.brand === "string" ? value.brand : "",
    model: typeof value.model === "string" ? value.model : "",
    type: typeof value.type === "string" ? value.type : "",
    body: typeof value.body === "string" ? value.body : "",
    price_min: typeof value.priceMin === "number" ? String(value.priceMin) : "",
    price_max: typeof value.priceMax === "number" ? String(value.priceMax) : "",
  });
}

function isFilterRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFilters(params: {
  brand?: SearchParamValue;
  model?: SearchParamValue;
  type?: SearchParamValue;
  body?: SearchParamValue;
  price_min?: SearchParamValue;
  price_max?: SearchParamValue;
  marke?: SearchParamValue;
  modell?: SearchParamValue;
  typ?: SearchParamValue;
}): VehicleFilters {
  const requestedType = firstParam(params.type) || firstParam(params.typ);
  const requestedBody = firstParam(params.body);
  const kind = requestedBody
    ? { type: requestedType, body: canonicalBodyType(requestedBody) ?? requestedBody }
    : splitKind(requestedType);

  return {
    brand: firstParam(params.brand) || firstParam(params.marke),
    model: firstParam(params.model) || firstParam(params.modell),
    type: kind.type,
    body: kind.body,
    priceMin: priceParam(params.price_min),
    priceMax: priceParam(params.price_max),
  };
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

  return { type: value, body: "" };
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
