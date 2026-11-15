export const listingCategories = [
  "Wohnmobil",
  "Wohnwagen",
  "Dachzelt/Faltanhänger",
  "Kabine",
] as const;

export type ListingCategory = (typeof listingCategories)[number];

export function isListingCategory(value: string): value is ListingCategory {
  return (listingCategories as readonly string[]).includes(value);
}

export const conditions = ["Neu", "Gebraucht", "Vorführfahrzeug", "Beschädigt"] as const;
export const priceTaxes = ["Brutto", "Netto"] as const;
export const availabilities = ["Sofort verfügbar", "im Vorlauf", "bestellbar"] as const;

export const bodyTypes: Record<ListingCategory, readonly string[]> = {
  Wohnmobil: [
    "Kastenwagen (Campervan)",
    "Teilintegriert",
    "Vollintegriert",
    "Alkoven",
    "Expeditionsmobil",
    "Linermobil",
  ],
  Wohnwagen: [
    "Mini-Wohnwagen (Tear Drop)",
    "Hubdach-Wohnwagen",
    "Teleskop-Wohnwagen",
    "Tandemachser",
    "Familien-Wohnwagen",
  ],
  "Dachzelt/Faltanhänger": [
    "Faltcaravan",
    "Klappcaravan",
    "Dachzeltanhänger",
    "Offroad-Anhänger",
  ],
  Kabine: ["Absetzkabine", "Wohnkabine"],
};

export const fuels = ["Diesel", "Elektro", "Benzin"] as const;
export const transmissions = ["Schaltgetriebe", "Automatik"] as const;
export const emissionStandards = ["Euro 6d", "Euro 6d-TEMP", "Euro 6", "Euro 5", "Euro 4"] as const;
export const emissionStickers = ["Grün", "Gelb", "Rot"] as const;
export const drivetrains = ["Frontantrieb", "Heckantrieb", "Allrad (4x4)"] as const;
export const bedTypes = [
  "Einzelbetten",
  "Queensbett",
  "Querbett",
  "Hubbett",
  "Alkoven",
  "Stockbetten",
  "Aufstelldach",
  "Umbaubett",
] as const;
export const seatingGroups = [
  "Face-to-Face",
  "Halbdinette",
  "Rundsitzgruppe",
  "Mittelsitzgruppe",
] as const;
export const batteryTypes = ["LiFePO4 (Lithium)", "AGM", "Gel", "Blei-Säure", "Na-Ion"] as const;
export const connectivityOptions = ["Starlink", "LTE/5G Router", "SAT-TV"] as const;
export const heatingSystems = [
  "Truma Combi (Gas/E)",
  "Alde Warmwasser",
  "Dieselstandheizung",
  "Webasto",
  "Autoterm",
] as const;
export const climateOptions = ["Fahrerhausklima", "Dachklimaanlage", "Staukastenklima"] as const;
export const toilets = ["Chemie-Kassette", "Trenntoilette (TTV)", "Verschweißer-Toilette"] as const;
export const showers = ["Variobad", "Raumbad", "separate Dusche", "Außendusche"] as const;
export const gasCapacities = ["Platz für 2x11kg", "1x11kg", "1x5kg"] as const;
export const gasBottleTypes = [
  "Standard Tauschflasche",
  "LPG-Tankgasflasche",
  "fest verbauter Unterflur-Gastank",
] as const;
export const jackTypes = [
  "Manuelle Kurbelstützen",
  "Hydraulische Hubstützen",
  "elektrische Stützen",
] as const;
export const brakeSystems = ["Auflaufgebremst", "Ungebremst"] as const;
export const tentFabrics = ["Baumwoll-Mischgewebe (TC)", "reines Polyester", "Segeltuch"] as const;

const all = listingCategories;
const motorhome = ["Wohnmobil"] as const satisfies readonly ListingCategory[];
const trailers = ["Wohnwagen", "Dachzelt/Faltanhänger"] as const satisfies readonly ListingCategory[];
const living = ["Wohnmobil", "Wohnwagen", "Kabine"] as const satisfies readonly ListingCategory[];
const moverCategories = ["Wohnwagen", "Dachzelt/Faltanhänger"] as const satisfies readonly ListingCategory[];
const tent = ["Dachzelt/Faltanhänger"] as const satisfies readonly ListingCategory[];
const exterior = ["Wohnmobil", "Wohnwagen", "Kabine"] as const satisfies readonly ListingCategory[];

export const listingAudiences = {
  all,
  motorhome,
  trailers,
  living,
  moverCategories,
  tent,
  exterior,
} as const;
