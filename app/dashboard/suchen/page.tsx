import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteSearch, openSavedSearch, renameSearch } from "@/actions/account";
import { currentUser, listSavedSearches } from "@/lib/account";
import { searchTitle } from "@/lib/filters";
import { formatOfferCount } from "@/lib/format";
import { searchOffers } from "@/lib/published-listings";

export const metadata: Metadata = {
  title: "Gespeicherte Suchen",
  description: "Filter merken und neue Treffer sehen.",
};

const notices: Record<string, string> = {
  voll: "Es sind schon 20 Suchen gespeichert. Lösche eine, bevor du eine neue anlegst.",
  fehler: "Die Suche konnte nicht gespeichert werden.",
  name: "Die Suche braucht einen Namen.",
};

export default function SuchenPage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Suchen werden geladen.</p>}>
      <Searches searchParams={searchParams} />
    </Suspense>
  );
}

async function Searches({ searchParams }: { searchParams: Promise<{ hinweis?: string | string[] }> }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/suchen");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const searches = await listSavedSearches(user.id);
  const counts = await Promise.all(searches.map((search) => searchOffers(search.filters).then((offers) => offers.length)));

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Gespeicherte Suchen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Jede Suche merkt sich die Trefferzahl vom letzten Öffnen. Sind es mehr geworden, steht die Differenz dabei.
      </p>
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      {searches.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted">Noch keine Suche. Auf der Suchseite kannst du die aktuelle Auswahl speichern.</p>
          <Link href="/suche" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
            Zur Suche
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {searches.map((search, index) => {
            const current = counts[index] ?? 0;
            const extra = Math.max(0, current - search.lastCount);
            return (
              <li key={search.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{search.name}</h2>
                  {extra > 0 ? (
                    <p className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-pine">{extra} weitere Treffer</p>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {searchTitle(search.filters)} · {formatOfferCount(current)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form action={openSavedSearch}>
                    <input type="hidden" name="id" value={search.id} />
                    <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
                      Treffer ansehen
                    </button>
                  </form>
                  <form action={deleteSearch}>
                    <input type="hidden" name="id" value={search.id} />
                    <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-copper-dark hover:bg-sand">
                      Löschen
                    </button>
                  </form>
                </div>
                <form action={renameSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={search.id} />
                  <label className="sr-only" htmlFor={`name-${search.id}`}>
                    Name der Suche
                  </label>
                  <input
                    id={`name-${search.id}`}
                    name="name"
                    defaultValue={search.name}
                    maxLength={80}
                    className="h-11 flex-1 rounded-xl border border-line bg-foam px-3 text-sm"
                  />
                  <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand">
                    Umbenennen
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
