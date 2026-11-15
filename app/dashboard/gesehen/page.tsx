import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { clearRecentViews } from "@/actions/account";
import { VehicleCard } from "@/components/VehicleCard";
import { currentUser, listRecentViews, loadCardMarks, marksFor } from "@/lib/account";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Zuletzt angesehen",
  description: "Die zuletzt geöffneten Exposés deines Kontos.",
};

export default function GesehenPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Verlauf wird geladen.</p>}>
      <History />
    </Suspense>
  );
}

async function History() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/gesehen");
  }

  const [views, marks] = await Promise.all([listRecentViews(user.id), loadCardMarks("/dashboard/gesehen")]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Zuletzt angesehen</h1>
          <p className="mt-2 max-w-2xl text-muted">Die letzten 30 Exposés, die du geöffnet hast. Eigene Inserate zählen nicht mit.</p>
        </div>
        {views.length > 0 ? (
          <form action={clearRecentViews}>
            <input type="hidden" name="clear" value="1" />
            <button type="submit" className="text-sm font-semibold text-copper-dark hover:underline">
              Verlauf leeren
            </button>
          </form>
        ) : null}
      </div>
      {views.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted">Noch nichts angesehen.</p>
          <Link href="/suche" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
            Fahrzeuge suchen
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {views.map((vehicle) => (
            <li key={vehicle.id}>
              {vehicle.available && vehicle.price !== null ? (
                <div>
                  <VehicleCard
                    vehicle={{
                      id: vehicle.id,
                      title: vehicle.title,
                      price: vehicle.price,
                      type: vehicle.type,
                      firstRegistration: vehicle.firstRegistration,
                      mileage: vehicle.mileage,
                      imageUrl: vehicle.imageUrl,
                    }}
                    marks={marksFor(vehicle.id, marks)}
                    badge={formatDateTime(vehicle.savedAt)}
                  />
                </div>
              ) : (
                <article className="rounded-2xl border border-dashed border-line bg-card p-4">
                  <h2 className="font-semibold">{vehicle.title}</h2>
                  <p className="mt-2 text-sm text-muted">Nicht mehr öffentlich · {formatDateTime(vehicle.savedAt)}</p>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
