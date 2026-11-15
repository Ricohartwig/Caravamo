import { listingFields } from "@/lib/listing-sections";
import { listingDefaults, type ListingFormInput } from "@/lib/listing-schema";

const vehicleFields = new Set<keyof ListingFormInput>([
  "category",
  "brand",
  "model",
  "condition",
  "price",
  "price_tax",
  "year",
  "first_registration",
  "mileage",
  "availability",
  "previous_owners",
  "service_record",
  "next_inspection",
  "next_gas_inspection",
  "speed_100",
  "description",
]);

const dateFields = new Set<keyof ListingFormInput>([
  "first_registration",
  "next_inspection",
  "next_gas_inspection",
]);

export function listingFormValues(
  vehicle: Record<string, unknown>,
  details: Record<string, unknown> | null,
): ListingFormInput {
  const values: Record<string, unknown> = {
    ...listingDefaults,
    bed_types: [],
    connectivity: [],
    climate: [],
  };

  for (const field of listingFields) {
    const source = vehicleFields.has(field.name) ? vehicle : details;
    const column = field.name === "category" ? "type" : field.name;
    values[field.name] = readField(field.kind, field.name, source?.[column]);
  }

  if (values.price_tax === "") {
    values.price_tax = "Brutto";
  }

  return values as ListingFormInput;
}

function readField(
  kind: (typeof listingFields)[number]["kind"],
  name: keyof ListingFormInput,
  value: unknown,
): ListingFormInput[keyof ListingFormInput] {
  if (kind === "checkbox") {
    return value === true;
  }

  if (kind === "checks") {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
  }

  if (kind === "number") {
    return numberField(value);
  }

  if (kind === "date" || dateFields.has(name)) {
    return dateField(value);
  }

  return typeof value === "string" ? value : "";
}

function numberField(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.round(value));
  }

  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return String(Math.round(Number(value)));
  }

  return "";
}

function dateField(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
}
