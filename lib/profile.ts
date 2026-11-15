export const dealerServiceOptions = [
  { id: "finanzierung", label: "Finanzierung" },
  { id: "inzahlungnahme", label: "Inzahlungnahme" },
  { id: "werkstatt", label: "Werkstatt" },
  { id: "lieferung", label: "Lieferung" },
] as const;

export type DealerService = (typeof dealerServiceOptions)[number]["id"];

const serviceIds = new Set<string>(dealerServiceOptions.map((option) => option.id));

export type ProfileFields = {
  name: string;
  phone: string;
  postalCode: string;
  city: string;
  street: string;
  companyName: string;
  website: string;
  about: string;
  openingHours: string;
  vatId: string;
  services: DealerService[];
};

export type ProfileGap = {
  id: string;
  label: string;
};

export function emptyProfile(): ProfileFields {
  return {
    name: "",
    phone: "",
    postalCode: "",
    city: "",
    street: "",
    companyName: "",
    website: "",
    about: "",
    openingHours: "",
    vatId: "",
    services: [],
  };
}

export function profileGaps(fields: ProfileFields, business: boolean): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  if (business && fields.companyName.length < 2) {
    gaps.push({ id: "company", label: "Firmenname" });
  }
  if (fields.name.length < 2) {
    gaps.push({ id: "name", label: business ? "Ansprechpartner" : "Name" });
  }
  if (!fields.phone) {
    gaps.push({ id: "phone", label: "Telefon" });
  }
  if (business && !fields.street) {
    gaps.push({ id: "street", label: "Straße" });
  }
  if (!fields.postalCode) {
    gaps.push({ id: "postal", label: "Postleitzahl" });
  }
  if (!fields.city) {
    gaps.push({ id: "city", label: "Ort" });
  }
  if (!fields.about) {
    gaps.push({ id: "about", label: business ? "Vorstellung des Betriebs" : "Kurze Vorstellung" });
  }
  if (business && !fields.openingHours) {
    gaps.push({ id: "hours", label: "Öffnungszeiten" });
  }
  if (business && !fields.website) {
    gaps.push({ id: "website", label: "Website" });
  }
  if (business && !fields.vatId) {
    gaps.push({ id: "vat", label: "USt-IdNr." });
  }
  return gaps;
}

export function dealerPageReady(fields: Pick<ProfileFields, "companyName" | "city">, business: boolean): boolean {
  return business && fields.companyName.trim().length >= 2 && fields.city.trim().length >= 2;
}

export function serviceLabel(id: string): string {
  return dealerServiceOptions.find((option) => option.id === id)?.label ?? id;
}

export type ProfileParse = { ok: true; fields: ProfileFields } | { ok: false; code: string };

export function parseProfile(formData: FormData, business: boolean): ProfileParse {
  const name = singleLine(formData.get("name"));
  const phone = singleLine(formData.get("phone"));
  const postalCode = singleLine(formData.get("postal_code"));
  const city = singleLine(formData.get("city"));
  const street = business ? singleLine(formData.get("street")) : "";
  const companyName = business ? singleLine(formData.get("company_name")) : "";
  const website = business ? normalizeWebsite(singleLine(formData.get("website"))) : "";
  const about = textBlock(formData.get("about"));
  const openingHours = business ? textBlock(formData.get("opening_hours")) : "";
  const vatId = business ? normalizeVat(singleLine(formData.get("vat_id"))) : "";
  const services = business ? readServices(formData.getAll("services")) : [];

  if (name.length < 2 || name.length > 80) {
    return { ok: false, code: "name" };
  }
  if (phone && !/^[0-9+()/\-\s.]{6,40}$/.test(phone)) {
    return { ok: false, code: "phone" };
  }
  if (postalCode && !/^[0-9]{5}$/.test(postalCode)) {
    return { ok: false, code: "postal" };
  }
  if (city.length > 80) {
    return { ok: false, code: "city" };
  }
  if (street.length > 120) {
    return { ok: false, code: "street" };
  }
  if (companyName.length > 120 || (companyName.length > 0 && companyName.length < 2)) {
    return { ok: false, code: "company" };
  }
  if (website === "invalid") {
    return { ok: false, code: "website" };
  }
  if (about.length > 800) {
    return { ok: false, code: "about" };
  }
  if (openingHours.length > 240) {
    return { ok: false, code: "hours" };
  }
  if (vatId === "invalid") {
    return { ok: false, code: "vat" };
  }
  if (services === null) {
    return { ok: false, code: "services" };
  }

  return {
    ok: true,
    fields: {
      name,
      phone,
      postalCode,
      city,
      street,
      companyName,
      website,
      about,
      openingHours,
      vatId,
      services,
    },
  };
}

export function profileRow(fields: ProfileFields, business: boolean) {
  return {
    name: fields.name,
    phone: fields.phone || null,
    postal_code: fields.postalCode || null,
    city: fields.city || null,
    street: business ? fields.street || null : null,
    company_name: business ? fields.companyName || null : null,
    website: business ? fields.website || null : null,
    about: fields.about || null,
    opening_hours: business ? fields.openingHours || null : null,
    vat_id: business ? fields.vatId || null : null,
    services: business ? fields.services : [],
  };
}

function singleLine(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim() : "";
}

function textBlock(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

function normalizeWebsite(value: string): string {
  if (!value) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  if (!withProtocol.startsWith("https://") || /\s/.test(withProtocol) || withProtocol.length > 188) {
    return "invalid";
  }

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" || !url.hostname.includes(".")) {
      return "invalid";
    }
    return url.toString();
  } catch {
    return "invalid";
  }
}

function normalizeVat(value: string): string {
  if (!value) {
    return "";
  }

  const compact = value.replace(/\s+/g, "").toUpperCase();
  return /^DE[0-9]{9}$/.test(compact) ? compact : "invalid";
}

function readServices(values: FormDataEntryValue[]): DealerService[] | null {
  const services: DealerService[] = [];
  for (const value of values) {
    if (typeof value !== "string" || !serviceIds.has(value) || services.includes(value as DealerService)) {
      return null;
    }
    services.push(value as DealerService);
  }
  return services;
}
