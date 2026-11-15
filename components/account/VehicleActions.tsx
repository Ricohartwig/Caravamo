import Link from "next/link";
import { Heart, Scale } from "lucide-react";
import { toggleComparison, toggleFavorite } from "@/actions/account";
import type { CardMarks } from "@/lib/account";

const overlayButton =
  "inline-flex size-11 items-center justify-center rounded-full border border-line bg-card/95 text-ink shadow-sm hover:bg-sand";
const stackButton =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand";

export function VehicleActions({
  vehicleId,
  marks,
  variant = "overlay",
}: {
  vehicleId: string;
  marks: CardMarks;
  variant?: "overlay" | "stack";
}) {
  if (!marks.signedIn) {
    const login = `/login?next=${encodeURIComponent(marks.returnTo)}`;
    return (
      <div className={variant === "overlay" ? "flex gap-2" : "flex flex-col gap-2"}>
        <Link href={login} className={variant === "overlay" ? overlayButton : stackButton} aria-label="Zum Merken anmelden">
          <Heart aria-hidden="true" className="size-4" />
          {variant === "stack" ? "Merken" : null}
        </Link>
        <Link href={login} className={variant === "overlay" ? overlayButton : stackButton} aria-label="Zum Vergleichen anmelden">
          <Scale aria-hidden="true" className="size-4" />
          {variant === "stack" ? "Vergleichen" : null}
        </Link>
      </div>
    );
  }

  return (
    <div className={variant === "overlay" ? "flex gap-2" : "flex flex-col gap-2"}>
      <form action={toggleFavorite}>
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="saved" value={marks.saved ? "1" : "0"} />
        <input type="hidden" name="returnTo" value={marks.returnTo} />
        <button
          type="submit"
          className={`${variant === "overlay" ? overlayButton : stackButton} ${marks.saved ? "text-copper-dark" : ""}`}
          aria-pressed={marks.saved}
          aria-label={marks.saved ? "Aus der Merkliste nehmen" : "Auf die Merkliste setzen"}
        >
          <Heart aria-hidden="true" className="size-4" fill={marks.saved ? "currentColor" : "none"} />
          {variant === "stack" ? (marks.saved ? "Gemerkt" : "Merken") : null}
        </button>
      </form>
      <form action={toggleComparison}>
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="compared" value={marks.compared ? "1" : "0"} />
        <input type="hidden" name="returnTo" value={marks.returnTo} />
        <button
          type="submit"
          className={`${variant === "overlay" ? overlayButton : stackButton} ${marks.compared ? "text-pine" : ""}`}
          aria-pressed={marks.compared}
          aria-label={marks.compared ? "Aus dem Vergleich nehmen" : "Zum Vergleich hinzufügen"}
        >
          <Scale aria-hidden="true" className="size-4" />
          {variant === "stack" ? (marks.compared ? "Im Vergleich" : "Vergleichen") : null}
        </button>
      </form>
    </div>
  );
}
