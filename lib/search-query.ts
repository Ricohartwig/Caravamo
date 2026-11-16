import { searchHref, type VehicleFilters } from "@/lib/filters";

export const searchPageSize = 12;

export const offerSorts = [
  { id: "neueste", label: "Neueste Inserate" },
  { id: "preis-auf", label: "Preis aufsteigend" },
  { id: "preis-ab", label: "Preis absteigend" },
  { id: "km-auf", label: "Kilometer aufsteigend" },
  { id: "km-ab", label: "Kilometer absteigend" },
  { id: "ez-neu", label: "Erstzulassung, neueste zuerst" },
  { id: "ez-alt", label: "Erstzulassung, älteste zuerst" },
] as const;

export type OfferSort = (typeof offerSorts)[number]["id"];

type SearchParam = string | string[] | undefined;

export function parseOfferSort(value: SearchParam): OfferSort {
  const raw = Array.isArray(value) ? value[0] : value;
  const match = offerSorts.find((option) => option.id === raw);
  return match?.id ?? "neueste";
}

export function parseSearchPage(value: SearchParam): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) {
    return 1;
  }

  const page = Number(raw);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(page, 500);
}

export function searchPageHref(filters: VehicleFilters, sort: OfferSort, page = 1): string {
  const href = searchHref(filters);
  const params = new URLSearchParams(href.split("?")[1] ?? "");
  if (sort !== "neueste") {
    params.set("sort", sort);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/suche?${query}` : "/suche";
}

export function similarPriceBand(price: number): { min: number; max: number } {
  const span = Math.max(10_000, Math.round(price * 0.5));
  return { min: Math.max(0, price - span), max: price + span };
}
