import { Heart } from "lucide-react";

export function SavedCount({ count }: { count: number }) {
  const amount = new Intl.NumberFormat("de-DE").format(count);
  const detail =
    count === 0
      ? "Noch niemand hat sich das gemerkt"
      : count === 1
        ? "1 Person hat sich das gemerkt"
        : `${amount} Personen haben sich das gemerkt`;

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold">
      <Heart aria-hidden="true" className="size-4 text-copper-dark" fill="currentColor" />
      Gemerkt
      <span className="font-normal text-muted">{detail}</span>
    </p>
  );
}
