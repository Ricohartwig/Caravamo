import { listingFields, type ListingField } from "@/lib/listing-sections";

const hiddenInFacts = new Set([
  "category",
  "brand",
  "model",
  "price",
  "price_tax",
  "description",
]);

export function ListingFacts({ values }: { values: Record<string, unknown> }) {
  const groups = new Map<string, { title: string; rows: { label: string; value: string }[] }>();

  for (const field of listingFields) {
    if (hiddenInFacts.has(field.name)) {
      continue;
    }

    const formatted = formatField(field, values[field.name]);
    if (!formatted) {
      continue;
    }

    const group = groups.get(field.section) ?? { title: field.sectionTitle, rows: [] };
    group.rows.push({ label: field.label, value: formatted });
    groups.set(field.section, group);
  }

  const payload = formatNumber(values.payload_kg, "kg");
  if (payload) {
    const group = groups.get("masse") ?? { title: "Maße und Gewichte", rows: [] };
    group.rows.splice(2, 0, { label: "Zuladung", value: payload });
    groups.set("masse", group);
  }

  const sections = [...groups.values()];
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {section.rows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-line bg-card p-4">
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className="mt-1 font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function formatField(field: ListingField, value: unknown): string | null {
  if (typeof value === "boolean") {
    return value ? "Ja" : null;
  }

  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);
    return items.length > 0 ? items.join(", ") : null;
  }

  if (field.kind === "date" && typeof value === "string") {
    return formatDate(value);
  }

  if (typeof value === "number") {
    return formatNumber(value, field.unit);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    return field.unit ? `${trimmed} ${field.unit}` : trimmed;
  }

  return null;
}

function formatNumber(value: unknown, unit?: string): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const formatted = new Intl.NumberFormat("de-DE").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}
