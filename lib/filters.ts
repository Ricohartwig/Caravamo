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
