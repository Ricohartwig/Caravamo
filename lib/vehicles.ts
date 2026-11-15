export const brands = [
  "BMW",
  "Fiat",
  "Hobby",
  "Knaus",
  "Mercedes-Benz",
  "Volkswagen",
] as const;

export type Brand = (typeof brands)[number];

export const vehicleTypes = [
  "PKW",
  "Wohnmobil",
  "Wohnwagen",
  "Transporter",
] as const;

export type VehicleType = (typeof vehicleTypes)[number];

export const modelsByBrand: Record<Brand, readonly string[]> = {
  BMW: ["320d Touring"],
  Fiat: ["Ducato"],
  Hobby: ["Optima Ontour"],
  Knaus: ["Südwind"],
  "Mercedes-Benz": ["Sprinter"],
  Volkswagen: ["California Ocean"],
};

export type GalleryShot = {
  label: string;
  tone: 0 | 1 | 2 | 3;
};

export type Seller = {
  name: string;
  kind: "Privat" | "Händler";
  location: string;
};

export type Vehicle = {
  id: string;
  brand: Brand;
  model: string;
  type: VehicleType;
  title: string;
  price: number;
  mileage: number;
  year: number;
  firstRegistration: string;
  powerKw: number | null;
  description: string;
  status: "aktiv";
  seller: Seller;
  shots: readonly [GalleryShot, GalleryShot, GalleryShot, GalleryShot];
};

function gallery(): Vehicle["shots"] {
  return [
    { label: "Front", tone: 0 },
    { label: "Seite", tone: 1 },
    { label: "Heck", tone: 2 },
    { label: "Innenraum", tone: 3 },
  ];
}

export const vehicles: readonly Vehicle[] = [
  {
    id: "4f2c1a7e-6b18-4d0a-9c33-1a8e5b7d2f10",
    brand: "Volkswagen",
    model: "California Ocean",
    type: "Wohnmobil",
    title: "Volkswagen California Ocean 2.0 TDI",
    price: 74900,
    mileage: 72400,
    year: 2019,
    firstRegistration: "03/2019",
    powerKw: 110,
    status: "aktiv",
    description:
      "Aufstelldach, Küchenzeile und vier Schlafplätze. Die Standheizung ist eingebaut, die Markise unbeschädigt. Service bei Volkswagen Nutzfahrzeuge im Frühjahr 2026, mit nachweisbarer Historie.",
    seller: {
      name: "Anna Berger",
      kind: "Privat",
      location: "Hamburg",
    },
    shots: gallery(),
  },
  {
    id: "8c91e0b4-2a77-4f61-a5d8-6e3c9a1d4b20",
    brand: "Fiat",
    model: "Ducato",
    type: "Transporter",
    title: "Fiat Ducato 35 L3H2 Multijet",
    price: 28900,
    mileage: 98200,
    year: 2020,
    firstRegistration: "06/2020",
    powerKw: 103,
    status: "aktiv",
    description:
      "Kastenwagen mit Laderaumtrenngitter, Holzboden und Anhängekupplung. Zwei Vorbesitzer, jeweils Werkstattrechnungen vorhanden. Bereit für Handwerk oder Ausbau.",
    seller: {
      name: "Nordfuhr GmbH",
      kind: "Händler",
      location: "Köln",
    },
    shots: gallery(),
  },
  {
    id: "1b7d6e45-9a02-4c88-8f17-d4e2a6c0b130",
    brand: "BMW",
    model: "320d Touring",
    type: "PKW",
    title: "BMW 320d Touring Advantage",
    price: 21450,
    mileage: 112500,
    year: 2018,
    firstRegistration: "11/2018",
    powerKw: 140,
    status: "aktiv",
    description:
      "Kombi mit Navigationssystem, Sitzheizung und Anhängerkupplung. Scheckheft gepflegt, neuer Satz Sommerreifen im Herbst 2025. Nichtraucherfahrzeug aus einer Hand.",
    seller: {
      name: "Jonas Klein",
      kind: "Privat",
      location: "Stuttgart",
    },
    shots: gallery(),
  },
  {
    id: "6a0e3c92-5d14-4b73-a2e8-9f1c7d5b4a40",
    brand: "Mercedes-Benz",
    model: "Sprinter",
    type: "Transporter",
    title: "Mercedes-Benz Sprinter 317 CDI Kasten",
    price: 46900,
    mileage: 61800,
    year: 2021,
    firstRegistration: "04/2021",
    powerKw: 125,
    status: "aktiv",
    description:
      "Sprinter mit MBUX, Rückfahrkamera und 270-Grad-Hecktüren. Der Laderaum ist verkleidet, die Inspektion ist bis April 2027 eingetragen. Geeignet für Gewerbe und Shuttle.",
    seller: {
      name: "Atelier Mobil",
      kind: "Händler",
      location: "München",
    },
    shots: gallery(),
  },
  {
    id: "9d4b2f18-7c60-4e25-91ab-3c8e6d1f5a50",
    brand: "Knaus",
    model: "Südwind",
    type: "Wohnwagen",
    title: "Knaus Südwind 500 PF",
    price: 18950,
    mileage: 6800,
    year: 2020,
    firstRegistration: "08/2020",
    powerKw: null,
    status: "aktiv",
    description:
      "Einzelbetten, großer Kühlschrank und Vorzelt. Der Wagen lief nur auf wenigen Saisons, die Kilometer stehen für die bewegte Achse. Dichtigkeit zuletzt im Mai 2026 geprüft.",
    seller: {
      name: "Mara Ostermann",
      kind: "Privat",
      location: "Leipzig",
    },
    shots: gallery(),
  },
  {
    id: "c3e8a1d6-4b90-4f72-8d15-2a7c6e9b1d60",
    brand: "Hobby",
    model: "Optima Ontour",
    type: "Wohnwagen",
    title: "Hobby Optima Ontour 65 GE",
    price: 27900,
    mileage: 4200,
    year: 2022,
    firstRegistration: "05/2022",
    powerKw: null,
    status: "aktiv",
    description:
      "Rundsitzgruppe, separates Bett und Fußbodenheizung. Mover und ATC sind eingebaut. Der Händler übergibt den Wagen mit frischer Gasprüfung und aufbereitetem Vorzelt.",
    seller: {
      name: "Küstenwagen OHG",
      kind: "Händler",
      location: "Bremen",
    },
    shots: gallery(),
  },
];

export function isBrand(value: string): value is Brand {
  return (brands as readonly string[]).includes(value);
}

export function isVehicleType(value: string): value is VehicleType {
  return (vehicleTypes as readonly string[]).includes(value);
}

export function getVehicle(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}
