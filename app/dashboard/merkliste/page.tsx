import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveFavoriteNote, toggleFavorite } from "@/actions/account";
import { VehicleCard } from "@/components/VehicleCard";
import { currentUser, listFavorites, loadCardMarks, marksFor, type SavedVehicle } from "@/lib/account";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Merkliste",
  description: "Gespeicherte Fahrzeuge und Preisänderungen.",
};

const notices: Record<string, string> = {
  notiz: "Die Notiz ist gespeichert.",
  "notiz-fehler": "Die Notiz konnte nicht gespeichert werden.",
};

export default function MerklistePage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Merkliste wird geladen.</p>}>
      <Favorites searchParams={searchParams} />
    </Suspense>
  );
}

async function Favorites({ searchParams }: { searchParams: Promise<{ hinweis?: string | string[] }> }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/merkliste");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const [favorites, marks] = await Promise.all([listFavorites(user.id), loadCardMarks("/dashboard/merkliste")]);
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Merkliste</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Der Preis zum Zeitpunkt des Merkens bleibt stehen. Steigt oder fällt er, siehst du den Unterschied.
      </p>
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      {favorites.length === 0 ? (
        <Empty text="Noch kein Fahrzeug gemerkt. Das Herz auf einer Karte legt es hier ab." />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {favorites.map((vehicle) => (
            <li key={vehicle.id} className="space-y-3">
              {vehicle.available && vehicle.price !== null ? (
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
                  badge={priceBadge(vehicle)}
                />
              ) : (
                <Unavailable vehicle={vehicle} />
              )}
              <form action={saveFavoriteNote}>
                <input type="hidden" name="vehicleId" value={vehicle.id} />
                <label htmlFor={`notiz-${vehicle.id}`} className="text-sm font-medium">
                  Notiz
                  <textarea
                    id={`notiz-${vehicle.id}`}
                    name="note"
                    defaultValue={vehicle.note}
                    maxLength={280}
                    rows={2}
                    className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm"
                  />
                </label>
                <button type="submit" className="mt-2 text-sm font-semibold text-pine hover:underline">
                  Notiz speichern
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function priceBadge(vehicle: SavedVehicle): string | undefined {
  if (vehicle.price === null || vehicle.savedPrice === null || vehicle.price === vehicle.savedPrice) {
    return undefined;
  }

  const delta = vehicle.price - vehicle.savedPrice;
  const amount = formatPrice(Math.abs(delta));
  return delta < 0 ? `Preis gesunken um ${amount}` : `Preis gestiegen um ${amount}`;
}

function Unavailable({ vehicle }: { vehicle: SavedVehicle }) {
  return (
    <article className="rounded-2xl border border-dashed border-line bg-card p-4">
      <h2 className="text-lg font-semibold">{vehicle.title}</h2>
      <p className="mt-2 text-sm text-muted">Das Inserat ist nicht mehr öffentlich.</p>
      <form action={toggleFavorite} className="mt-4">
        <input type="hidden" name="vehicleId" value={vehicle.id} />
        <input type="hidden" name="saved" value="1" />
        <input type="hidden" name="returnTo" value="/dashboard/merkliste" />
        <button type="submit" className="text-sm font-semibold text-copper-dark hover:underline">
          Aus der Merkliste nehmen
        </button>
      </form>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="text-sm text-muted">{text}</p>
      <Link href="/suche" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
        Fahrzeuge suchen
      </Link>
    </div>
  );
}
