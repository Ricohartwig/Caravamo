import { vehicles, type Vehicle } from "@/lib/vehicles";

export type VehicleFilters = {
  brand: string;
  model: string;
  type: string;
};

type SearchParamValue = string | string[] | undefined;

function firstParam(value: SearchParamValue): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function parseFilters(params: {
  marke?: SearchParamValue;
  modell?: SearchParamValue;
  typ?: SearchParamValue;
}): VehicleFilters {
  return {
    brand: firstParam(params.marke),
    model: firstParam(params.modell),
    type: firstParam(params.typ),
  };
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
