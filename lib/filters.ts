import {
  bedTypes,
  canonicalBodyType,
  categoryOfBody,
  climateOptions,
  conditions,
  fuels,
  isListingCategory,
  listingAudiences,
  transmissions,
} from "@/lib/listing-options";
import { vehicles, type Vehicle } from "@/lib/vehicles";

export const weightLimitKg = 3500;
export const weightSliderMaxKg = 7500;

export type SellerKind = "" | "privat" | "haendler";

export type VehicleFilters = {
  brand: string;
  model: string;
  type: string;
  body: string;
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
  condition: string;
  city: string;
  seller: SellerKind;
  weightMax: number | null;
  lengthMin: number | null;
  lengthMax: number | null;
  powerMin: number | null;
  solar: boolean;
  inverter: boolean;
  awning: boolean;
  air: boolean;
  fuel: string;
  transmission: string;
  bed: string;
  climate: string;
  sleepMin: number | null;
  heater: boolean;
  shower: boolean;
  toilet: boolean;
  seating: boolean;
  sat: boolean;
  bike: boolean;
  hitch: boolean;
};

export const standHeating = ["Dieselstandheizung", "Webasto", "Autoterm"] as const;

type SearchParamValue = string | string[] | undefined;

export function blankFilters(): VehicleFilters {
  return {
    brand: "",
    model: "",
    type: "",
    body: "",
    priceMin: null,
    priceMax: null,
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
  setText(params, "year_min", filters.yearMin);
  setText(params, "year_max", filters.yearMax);
  setText(params, "mileage_min", filters.mileageMin);
  setText(params, "mileage_max", filters.mileageMax);
  setText(params, "condition", filters.condition);
  setText(params, "city", filters.city);
  setText(params, "seller", filters.seller);
  setText(params, "weight_max", filters.weightMax);
  setText(params, "length_min", filters.lengthMin);
  setText(params, "length_max", filters.lengthMax);
  setText(params, "power_min", filters.powerMin);
  setFlag(params, "solar", filters.solar);
  setFlag(params, "inverter", filters.inverter);
  setFlag(params, "awning", filters.awning);
  setFlag(params, "air", filters.air);
  setText(params, "fuel", filters.fuel);
  setText(params, "transmission", filters.transmission);
  setText(params, "bed", filters.bed);
  setText(params, "climate", filters.climate);
  setText(params, "sleep_min", filters.sleepMin);
  setFlag(params, "heater", filters.heater);
  setFlag(params, "shower", filters.shower);
  setFlag(params, "toilet", filters.toilet);
  setFlag(params, "seating", filters.seating);
  setFlag(params, "sat", filters.sat);
  setFlag(params, "bike", filters.bike);
  setFlag(params, "hitch", filters.hitch);

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
    filters.priceMin !== null ? `ab ${filters.priceMin.toLocaleString("de-DE")} €` : "",
    filters.priceMax !== null ? `bis ${filters.priceMax.toLocaleString("de-DE")} €` : "",
    filters.yearMin !== null ? `Erstzulassung ab ${filters.yearMin}` : "",
    filters.yearMax !== null ? `Erstzulassung bis ${filters.yearMax}` : "",
    filters.mileageMin !== null ? `ab ${filters.mileageMin.toLocaleString("de-DE")} km` : "",
    filters.mileageMax !== null ? `bis ${filters.mileageMax.toLocaleString("de-DE")} km` : "",
    filters.condition ? filters.condition : "",
    filters.city ? `Ort ${filters.city}` : "",
    filters.seller === "haendler" ? "Händler" : filters.seller === "privat" ? "Privat" : "",
    filters.weightMax !== null ? `Gewicht bis ${filters.weightMax.toLocaleString("de-DE")} kg` : "",
    filters.lengthMin !== null ? `Länge ab ${filters.lengthMin.toLocaleString("de-DE")} cm` : "",
    filters.lengthMax !== null ? `Länge bis ${filters.lengthMax.toLocaleString("de-DE")} cm` : "",
    filters.powerMin !== null ? `ab ${filters.powerMin.toLocaleString("de-DE")} PS` : "",
    filters.solar ? "Solaranlage" : "",
    filters.inverter ? "Wechselrichter" : "",
    filters.awning ? "Markise" : "",
    filters.air ? "Luftfederung" : "",
    filters.fuel ? `Kraftstoff ${filters.fuel}` : "",
    filters.transmission ? `Getriebe ${filters.transmission}` : "",
    filters.bed ? `Bett ${filters.bed}` : "",
    filters.climate ? filters.climate : "",
    filters.sleepMin !== null ? `ab ${filters.sleepMin} Schlafplätzen` : "",
    filters.heater ? "Standheizung" : "",
    filters.shower ? "separate Dusche" : "",
    filters.toilet ? "WC" : "",
    filters.seating ? "Rundsitzgruppe" : "",
    filters.sat ? "SAT-TV" : "",
    filters.bike ? "Fahrradträger" : "",
    filters.hitch ? "Anhängerkupplung" : "",
  ].filter((entry) => entry.length > 0);
}

export function hasAdvancedFilters(filters: VehicleFilters): boolean {
  return (
    filters.body.length > 0 ||
    filters.yearMin !== null ||
    filters.yearMax !== null ||
    filters.mileageMin !== null ||
    filters.mileageMax !== null ||
    filters.condition.length > 0 ||
    filters.city.length > 0 ||
    filters.seller.length > 0 ||
    filters.weightMax !== null ||
    filters.lengthMin !== null ||
    filters.lengthMax !== null ||
    filters.powerMin !== null ||
    filters.solar ||
    filters.inverter ||
    filters.awning ||
    filters.air ||
    filters.fuel.length > 0 ||
    filters.transmission.length > 0 ||
    filters.bed.length > 0 ||
    filters.climate.length > 0 ||
    filters.sleepMin !== null ||
    filters.heater ||
    filters.shower ||
    filters.toilet ||
    filters.seating ||
    filters.sat ||
    filters.bike ||
    filters.hitch
  );
}

export function wantsExpandedFilters(
  value: SearchParamValue,
  filters: VehicleFilters,
): boolean {
  const raw = firstParam(value);
  if (raw === "0") {
    return false;
  }
  if (raw === "1") {
    return true;
  }

  return hasAdvancedFilters(filters);
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
    filters.lengthMin !== null ||
    filters.lengthMax !== null ||
    filters.powerMin !== null ||
    filters.solar ||
    filters.inverter ||
    filters.awning ||
    filters.air ||
    filters.fuel.length > 0 ||
    filters.transmission.length > 0 ||
    filters.bed.length > 0 ||
    filters.climate.length > 0 ||
    filters.sleepMin !== null ||
    filters.heater ||
    filters.shower ||
    filters.toilet ||
    filters.seating ||
    filters.sat ||
    filters.bike ||
    filters.hitch
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
    year_min: textValue(value.yearMin),
    year_max: textValue(value.yearMax),
    mileage_min: textValue(value.mileageMin),
    mileage_max: textValue(value.mileageMax),
    condition: textValue(value.condition),
    city: textValue(value.city),
    seller: textValue(value.seller),
    weight_max: textValue(value.weightMax),
    length_min: textValue(value.lengthMin),
    length_max: textValue(value.lengthMax),
    power_min: textValue(value.powerMin),
    solar: flagValue(value.solar),
    inverter: flagValue(value.inverter),
    awning: flagValue(value.awning),
    air: flagValue(value.air),
    fuel: textValue(value.fuel),
    transmission: textValue(value.transmission),
    bed: textValue(value.bed),
    climate: textValue(value.climate),
    sleep_min: textValue(value.sleepMin),
    heater: flagValue(value.heater),
    shower: flagValue(value.shower),
    toilet: flagValue(value.toilet),
    seating: flagValue(value.seating),
    sat: flagValue(value.sat),
    bike: flagValue(value.bike),
    hitch: flagValue(value.hitch),
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

export function parseFilters(params: Partial<Record<string, SearchParamValue>>): VehicleFilters {
  const requestedType = firstParam(params.type) || firstParam(params.typ);
  const requestedBody = firstParam(params.body);
  const kind = requestedBody
    ? { type: requestedType, body: canonicalBodyType(requestedBody) ?? "" }
    : splitKind(requestedType);
  const city = firstParam(params.city).slice(0, 80);

  return forCategory({
    brand: firstParam(params.brand) || firstParam(params.marke),
    model: firstParam(params.model) || firstParam(params.modell),
    type: listingType(kind),
    body: kind.body,
    priceMin: priceParam(params.price_min),
    priceMax: priceParam(params.price_max),
    yearMin: boundedInt(params.year_min, 1950, 2035),
    yearMax: boundedInt(params.year_max, 1950, 2035),
    mileageMin: boundedInt(params.mileage_min, 0, 2_000_000),
    mileageMax: boundedInt(params.mileage_max, 0, 2_000_000),
    condition: choiceParam(params.condition, conditions),
    city,
    seller: sellerParam(params.seller),
    weightMax: boundedInt(params.weight_max, 500, 20_000),
    lengthMin: boundedInt(params.length_min, 100, 2_000),
    lengthMax: boundedInt(params.length_max, 100, 2_000),
    powerMin: boundedInt(params.power_min, 1, 2_000),
    solar: flagParam(params.solar),
    inverter: flagParam(params.inverter),
    awning: flagParam(params.awning),
    air: flagParam(params.air),
    fuel: choiceParam(params.fuel, fuels),
    transmission: choiceParam(params.transmission, transmissions),
    bed: choiceParam(params.bed, bedTypes),
    climate: choiceParam(params.climate, climateOptions),
    sleepMin: boundedInt(params.sleep_min, 1, 12),
    heater: flagParam(params.heater),
    shower: flagParam(params.shower),
    toilet: flagParam(params.toilet),
    seating: flagParam(params.seating),
    sat: flagParam(params.sat),
    bike: flagParam(params.bike),
    hitch: flagParam(params.hitch),
  });
}

function sellerParam(value: SearchParamValue): SellerKind {
  const raw = firstParam(value).toLocaleLowerCase("de-DE");
  if (raw === "privat") {
    return "privat";
  }
  if (raw === "haendler" || raw === "händler") {
    return "haendler";
  }

  return "";
}

function allows(category: string, options: readonly string[]): boolean {
  return category === "" || options.includes(category);
}

export function forCategory(filters: VehicleFilters): VehicleFilters {
  const next = { ...filters };
  const owner = next.body ? categoryOfBody(next.body) : null;
  if (next.type && owner && owner !== next.type) {
    next.body = "";
  }

  const weightMax = next.weightMax !== null && next.weightMax >= weightSliderMaxKg ? null : next.weightMax;
  next.weightMax = weightMax;
  if (next.yearMin !== null && next.yearMax !== null && next.yearMin > next.yearMax) {
    next.yearMax = next.yearMin;
  }
  if (next.mileageMin !== null && next.mileageMax !== null && next.mileageMin > next.mileageMax) {
    next.mileageMax = next.mileageMin;
  }
  if (next.lengthMin !== null && next.lengthMax !== null && next.lengthMin > next.lengthMax) {
    next.lengthMax = next.lengthMin;
  }

  if (!allows(next.type, listingAudiences.motorhome)) {
    next.mileageMin = null;
    next.mileageMax = null;
    next.fuel = "";
    next.transmission = "";
    next.powerMin = null;
  }
  if (!allows(next.type, listingAudiences.living)) {
    next.sleepMin = null;
    next.bed = "";
    next.climate = "";
    next.heater = false;
    next.shower = false;
    next.toilet = false;
    next.seating = false;
  }
  if (!allows(next.type, listingAudiences.exterior)) {
    next.awning = false;
    next.air = false;
  }

  return next;
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
