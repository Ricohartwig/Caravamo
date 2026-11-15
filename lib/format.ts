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

export function formatOfferCount(count: number): string {
  if (count === 1) {
    return "1 Angebot";
  }

  return `${new Intl.NumberFormat("de-DE").format(count)} Angebote`;
}
