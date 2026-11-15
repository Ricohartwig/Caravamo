import { z } from "zod";
import {
  bedTypes,
  batteryTypes,
  brakeSystems,
  climateOptions,
  conditions,
  connectivityOptions,
  drivetrains,
  emissionStandards,
  emissionStickers,
  fuels,
  gasBottleTypes,
  gasCapacities,
  heatingSystems,
  isListingCategory,
  jackTypes,
  priceTaxes,
  seatingGroups,
  showers,
  tentFabrics,
  toilets,
  transmissions,
} from "@/lib/listing-options";

const maxYear = new Date().getFullYear() + 1;

function optionalRange(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        return;
      }

      const parsed = Number(value);
      if (!/^\d+$/.test(value) || parsed < min || parsed > max) {
        ctx.addIssue({ code: "custom", message });
      }
    });
}

function requiredRange(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const parsed = Number(value);
      if (!/^\d+$/.test(value) || parsed < min || parsed > max) {
        ctx.addIssue({ code: "custom", message });
      }
    });
}

function optionalText(max: number) {
  return z.string().trim().max(max, `Höchstens ${max} Zeichen.`);
}

function optionalChoice(options: readonly string[]) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value !== "" && !options.includes(value)) {
        ctx.addIssue({ code: "custom", message: "Bitte eine gültige Auswahl treffen." });
      }
    });
}

function requiredChoice(options: readonly string[], message: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!options.includes(value)) {
        ctx.addIssue({ code: "custom", message });
      }
    });
}

function choiceList(options: readonly string[]) {
  return z
    .array(z.string())
    .max(options.length)
    .superRefine((items, ctx) => {
      if (items.some((item) => !options.includes(item))) {
        ctx.addIssue({ code: "custom", message: "Bitte nur vorgeschlagene Punkte wählen." });
      }
    });
}

function optionalDate() {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        return;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        ctx.addIssue({ code: "custom", message: "Bitte ein Datum wählen." });
      }
    });
}

export const listingFormSchema = z
  .object({
    category: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        if (!isListingCategory(value)) {
          ctx.addIssue({ code: "custom", message: "Bitte die Fahrzeugart wählen." });
        }
      }),
    brand: z.string().trim().min(2, "Bitte die Marke eintragen.").max(80),
    model: z.string().trim().min(1, "Bitte das Modell eintragen.").max(80),
    condition: requiredChoice(conditions, "Bitte den Zustand wählen."),
    price: requiredRange(1, 5_000_000, "Bitte den Preis in vollen Euro eingeben."),
    price_tax: requiredChoice(priceTaxes, "Bitte Brutto oder Netto wählen."),
    year: optionalRange(1950, maxYear, `Bitte ein Baujahr zwischen 1950 und ${maxYear}.`),
    first_registration: optionalDate(),
    mileage: optionalRange(0, 2_000_000, "Bitte den Kilometerstand als ganze Zahl eingeben."),
    availability: optionalChoice(["Sofort verfügbar", "im Vorlauf", "bestellbar"]),
    previous_owners: optionalRange(0, 20, "Bitte die Anzahl der Vorbesitzer eintragen."),
    service_record: z.boolean(),
    next_inspection: optionalDate(),
    next_gas_inspection: optionalDate(),
    speed_100: z.boolean(),
    description: optionalText(4000),
    body_type: optionalText(80),
    gross_weight_kg: optionalRange(1, 20_000, "Bitte das zulässige Gesamtgewicht in kg eintragen."),
    curb_weight_kg: optionalRange(1, 20_000, "Bitte das Leergewicht in kg eintragen."),
    length_cm: optionalRange(1, 2_000, "Bitte die Länge in cm eintragen."),
    width_cm: optionalRange(1, 400, "Bitte die Breite in cm eintragen."),
    height_cm: optionalRange(1, 500, "Bitte die Höhe in cm eintragen."),
    weight_adjusted: z.boolean(),
    axle_count: optionalRange(1, 3, "Bitte 1, 2 oder 3 Achsen eintragen."),
    braked_tow_kg: optionalRange(0, 5_000, "Bitte die gebremste Anhängelast in kg eintragen."),
    unbraked_tow_kg: optionalRange(0, 5_000, "Bitte die ungebremste Anhängelast in kg eintragen."),
    chassis: optionalText(80),
    power_ps: optionalRange(1, 2_000, "Bitte die Leistung in PS eintragen."),
    fuel: optionalChoice(fuels),
    transmission: optionalChoice(transmissions),
    emission_standard: optionalChoice(emissionStandards),
    emission_sticker: optionalChoice(emissionStickers),
    drivetrain: optionalChoice(drivetrains),
    sleeping_places: optionalRange(0, 12, "Bitte die Schlafplätze eintragen."),
    bed_types: choiceList(bedTypes),
    belted_seats: optionalRange(0, 12, "Bitte die Sitzplätze mit Gurt eintragen."),
    seating_group: optionalChoice(seatingGroups),
    battery_ah: optionalRange(0, 2_000, "Bitte die Kapazität in Ah eintragen."),
    battery_type: optionalChoice(batteryTypes),
    has_solar: z.boolean(),
    solar_wp: optionalRange(0, 5_000, "Bitte die Solarleistung in Wp eintragen."),
    has_inverter: z.boolean(),
    inverter_w: optionalRange(0, 20_000, "Bitte die Wechselrichterleistung in Watt eintragen."),
    has_dc_charger: z.boolean(),
    connectivity: choiceList(connectivityOptions),
    heating: optionalChoice(heatingSystems),
    fresh_water_l: optionalRange(0, 1_000, "Bitte das Frischwasser in Litern eintragen."),
    waste_water_l: optionalRange(0, 1_000, "Bitte das Abwasser in Litern eintragen."),
    waste_tank_heated: z.boolean(),
    climate: choiceList(climateOptions),
    toilet: optionalChoice(toilets),
    shower: optionalChoice(showers),
    gas_capacity: optionalChoice(gasCapacities),
    gas_bottle_type: optionalChoice(gasBottleTypes),
    has_crash_sensor: z.boolean(),
    has_awning: z.boolean(),
    has_bike_rack: z.boolean(),
    has_tow_hitch: z.boolean(),
    has_mover: z.boolean(),
    jack_type: optionalChoice(jackTypes),
    has_air_suspension: z.boolean(),
    includes_porch: z.boolean(),
    brake_system: optionalChoice(brakeSystems),
    tent_fabric: optionalChoice(tentFabrics),
    setup_minutes: optionalRange(0, 600, "Bitte die Aufbauzeit in Minuten eintragen."),
    has_kitchen_module: z.boolean(),
    lid_payload_kg: optionalRange(0, 2_000, "Bitte die Deckelzuladung in kg eintragen."),
  })
  .superRefine((listing, ctx) => {
    const gross = toNumber(listing.gross_weight_kg);
    const curb = toNumber(listing.curb_weight_kg);
    if (gross !== null && curb !== null && curb > gross) {
      ctx.addIssue({
        code: "custom",
        path: ["curb_weight_kg"],
        message: "Das Leergewicht kann nicht über dem zulässigen Gesamtgewicht liegen.",
      });
    }
  });

export const listingSubmitSchema = listingFormSchema.safeExtend({
  images: z
    .array(
      z.object({
        path: z
          .string()
          .trim()
          .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i,
            "Ein Bildpfad ist ungültig.",
          ),
      }),
    )
    .max(12, "Höchstens 12 Bilder."),
});

export type ListingFormInput = z.input<typeof listingFormSchema>;
export type ListingOutput = z.output<typeof listingFormSchema>;
export type ListingSubmit = z.output<typeof listingSubmitSchema>;

const numberFields = [
  "price",
  "year",
  "mileage",
  "previous_owners",
  "gross_weight_kg",
  "curb_weight_kg",
  "length_cm",
  "width_cm",
  "height_cm",
  "axle_count",
  "braked_tow_kg",
  "unbraked_tow_kg",
  "power_ps",
  "sleeping_places",
  "belted_seats",
  "battery_ah",
  "solar_wp",
  "inverter_w",
  "fresh_water_l",
  "waste_water_l",
  "setup_minutes",
  "lid_payload_kg",
] as const satisfies readonly (keyof ListingOutput)[];

type NumberField = (typeof numberFields)[number];

export type NormalizedListing = {
  [K in keyof ListingOutput]: K extends NumberField
    ? number | null
    : ListingOutput[K] extends boolean
      ? boolean | null
      : ListingOutput[K] extends string
        ? string | null
        : ListingOutput[K];
};

export function toNumber(value: string | null): number | null {
  if (value === null || value === "") {
    return null;
  }

  return Number(value);
}

export function normalizeListing(listing: {
  [K in keyof ListingOutput]: K extends NumberField
    ? string | null
    : ListingOutput[K] extends boolean
      ? boolean | null
      : ListingOutput[K] extends string
        ? string | null
        : ListingOutput[K];
}): NormalizedListing {
  const normalized: Record<string, unknown> = { ...listing };

  for (const key of numberFields) {
    normalized[key] = toNumber(listing[key]);
  }

  for (const key of Object.keys(normalized)) {
    if (normalized[key] === "") {
      normalized[key] = null;
    }
  }

  const result = normalized as NormalizedListing;
  if (result.year === null && result.first_registration) {
    result.year = Number(result.first_registration.slice(0, 4));
  }

  return result;
}

export const listingDefaults: ListingFormInput = {
  category: "",
  brand: "",
  model: "",
  condition: "",
  price: "",
  price_tax: "Brutto",
  year: "",
  first_registration: "",
  mileage: "",
  availability: "",
  previous_owners: "",
  service_record: false,
  next_inspection: "",
  next_gas_inspection: "",
  speed_100: false,
  description: "",
  body_type: "",
  gross_weight_kg: "",
  curb_weight_kg: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  weight_adjusted: false,
  axle_count: "",
  braked_tow_kg: "",
  unbraked_tow_kg: "",
  chassis: "",
  power_ps: "",
  fuel: "",
  transmission: "",
  emission_standard: "",
  emission_sticker: "",
  drivetrain: "",
  sleeping_places: "",
  bed_types: [],
  belted_seats: "",
  seating_group: "",
  battery_ah: "",
  battery_type: "",
  has_solar: false,
  solar_wp: "",
  has_inverter: false,
  inverter_w: "",
  has_dc_charger: false,
  connectivity: [],
  heating: "",
  fresh_water_l: "",
  waste_water_l: "",
  waste_tank_heated: false,
  climate: [],
  toilet: "",
  shower: "",
  gas_capacity: "",
  gas_bottle_type: "",
  has_crash_sensor: false,
  has_awning: false,
  has_bike_rack: false,
  has_tow_hitch: false,
  has_mover: false,
  jack_type: "",
  has_air_suspension: false,
  includes_porch: false,
  brake_system: "",
  tent_fabric: "",
  setup_minutes: "",
  has_kitchen_module: false,
  lid_payload_kg: "",
};
