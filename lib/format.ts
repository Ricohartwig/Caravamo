export function formatPrice(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(kilometers: number): string {
  return `${new Intl.NumberFormat("de-DE").format(kilometers)} km`;
}

export function formatPower(kilowatts: number | null): string {
  if (kilowatts === null) {
    return "ohne eigenen Antrieb";
  }

  const horsepower = Math.round(kilowatts * 1.35962);
  return `${kilowatts} kW (${horsepower} PS)`;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export function formatOfferCount(count: number): string {
  if (count === 1) {
    return "1 Angebot";
  }

  return `${new Intl.NumberFormat("de-DE").format(count)} Angebote`;
}
