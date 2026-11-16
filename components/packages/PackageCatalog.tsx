import { startPackageCheckout } from "@/actions/packages";
import { dealerPackages, formatEuroCents, listPriceCents } from "@/lib/dealer-packages";
import { businessListingAmount, privateListingAmount } from "@/lib/listing-payment";
import Link from "next/link";

export function PackageCatalog({
  booking,
  currentSlots,
}: {
  booking: "login" | "dealer" | "private";
  currentSlots?: number | null;
}) {
  return (
    <div>
      <p className="text-sm text-muted">
        Ein einzelnes Händler-Inserat kostet {formatEuroCents(businessListingAmount)} für 30 Tage. Privatverkäufer zahlen{" "}
        {formatEuroCents(privateListingAmount)}. Ein Paket gilt einen Monat und verlängert sich, bis es gekündigt wird.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dealerPackages.map((pack) => {
          const list = listPriceCents(pack.slots);
          const saving = list - pack.amount;
          const current = currentSlots === pack.slots;
          return (
            <li key={pack.slots} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <p className="text-sm font-medium text-copper-dark">{pack.slots} Fahrzeuge</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{formatEuroCents(pack.amount)}</p>
              <p className="mt-1 text-sm text-muted">pro Monat</p>
              <p className="mt-3 text-sm">
                statt {formatEuroCents(list)}
                {saving > 0 ? `, ${formatEuroCents(saving)} günstiger` : ""}
              </p>
              <p className="mt-1 text-sm text-muted">{formatEuroCents(Math.round(pack.amount / pack.slots))} je Fahrzeug</p>
              <div className="mt-5">
                {current ? (
                  <p className="text-sm font-semibold text-pine">Dein aktuelles Paket</p>
                ) : booking === "dealer" ? (
                  <form action={startPackageCheckout}>
                    <input type="hidden" name="slots" value={pack.slots} />
                    <button
                      type="submit"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
                    >
                      Paket buchen
                    </button>
                  </form>
                ) : booking === "private" ? (
                  <p className="text-sm text-muted">Pakete gibt es für Händlerkonten.</p>
                ) : (
                  <Link
                    href="/login?next=/dashboard/pakete"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
                  >
                    Paket buchen
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
