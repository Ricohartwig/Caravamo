import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { saveSearch } from "@/actions/account";
import { SearchShell } from "@/components/SearchFilters";
import { VehicleCard } from "@/components/VehicleCard";
import { loadCardMarks, marksFor } from "@/lib/account";
import { filterLabels, parseFilters, searchHref, searchTitle, wantsExpandedFilters, type VehicleFilters } from "@/lib/filters";
import { formatOfferCount } from "@/lib/format";
import { searchOfferPage } from "@/lib/published-listings";
import { offerSorts, parseOfferSort, parseSearchPage, searchPageHref, searchPageSize, type OfferSort } from "@/lib/search-query";

export const metadata: Metadata = {
  title: "Fahrzeuge suchen",
  description: "Durchsuchen Sie Inserate nach Marke, Typ und Preis.",
};

export default function SuchePage({ searchParams }: PageProps<"/suche">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Fahrzeuge suchen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Zuerst Marke, Modell, Fahrzeugart und Preis. Weitere Filter klappen links auf, mit Zustand, Laufleistung, Maßen und Ausstattung.
      </p>
      <Suspense fallback={<SearchFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: PageProps<"/suche">["searchParams"];
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const sort = parseOfferSort(params.sort);
  const page = parseSearchPage(params.page);
  const [results, marks] = await Promise.all([
    searchOfferPage(filters, page, sort),
    loadCardMarks(searchPageHref(filters, sort, page)),
  ]);
  const active = filterLabels(filters);
  const pages = Math.max(1, Math.ceil(results.total / searchPageSize));

  return (
    <SearchShell key={searchHref(filters)} filters={filters} sort={sort} startOpen={wantsExpandedFilters(params.erweitert, filters)}>
      <section aria-label="Suchergebnisse">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <p className="text-sm font-medium text-muted">
            {formatOfferCount(results.total)}
            {active.length > 0 ? ` · ${active.join(" · ")}` : ""}
            {pages > 1 ? ` · Seite ${Math.min(page, pages)} von ${pages}` : ""}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SortForm filters={filters} sort={sort} />
            <SaveSearchForm filters={filters} />
          </div>
        </div>
        {results.total === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">Keine Fahrzeuge für diese Auswahl</h2>
            <p className="mt-2 text-sm text-muted">
              Zu diesen Filtern liegt kein Inserat vor. Setzen Sie die Filter zurück oder wählen Sie eine andere Kombination.
            </p>
            <Link
              href="/suche"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam"
            >
              Alle Angebote zeigen
            </Link>
          </div>
        ) : results.offers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">Diese Seite gibt es nicht</h2>
            <Link href={searchPageHref(filters, sort, 1)} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
              Zur ersten Seite
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.offers.map((vehicle) => (
              <li key={vehicle.id}>
                <VehicleCard vehicle={vehicle} marks={marksFor(vehicle.id, marks)} />
              </li>
            ))}
          </ul>
        )}
        <SearchPager filters={filters} sort={sort} page={page} pages={pages} />
      </section>
    </SearchShell>
  );
}

function SortForm({ filters, sort }: { filters: VehicleFilters; sort: OfferSort }) {
  const params = new URLSearchParams(searchHref(filters).split("?")[1] ?? "");

  return (
    <form action="/suche" method="get" className="flex flex-wrap items-center gap-2">
      {[...params.entries()].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="suche-sort" className="text-sm font-medium">
        Sortierung
      </label>
      <select
        id="suche-sort"
        name="sort"
        key={sort}
        defaultValue={sort}
        className="h-11 rounded-xl border border-line bg-card px-3 text-sm"
      >
        {offerSorts.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-sand"
      >
        Anwenden
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var select=document.getElementById("suche-sort");if(!select||select.getAttribute("data-ready")==="1")return;select.setAttribute("data-ready","1");select.addEventListener("change",function(){if(select.form)select.form.requestSubmit();});})();`,
        }}
      />
    </form>
  );
}

function SearchPager({
  filters,
  sort,
  page,
  pages,
}: {
  filters: VehicleFilters;
  sort: OfferSort;
  page: number;
  pages: number;
}) {
  if (pages <= 1) {
    return null;
  }

  const current = Math.min(Math.max(page, 1), pages);
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index).filter((number) => number <= pages);

  return (
    <nav aria-label="Seiten" className="mt-6 flex flex-wrap items-center gap-2">
      {current > 1 ? <PageLink href={searchPageHref(filters, sort, current - 1)}>Zurück</PageLink> : null}
      {numbers.map((number) => (
        <PageLink key={number} href={searchPageHref(filters, sort, number)} current={number === current}>
          {number}
        </PageLink>
      ))}
      {current < pages ? <PageLink href={searchPageHref(filters, sort, current + 1)}>Weiter</PageLink> : null}
    </nav>
  );
}

function PageLink({ href, current = false, children }: { href: string; current?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold ${
        current ? "bg-pine text-foam" : "border border-line bg-card hover:bg-sand"
      }`}
    >
      {children}
    </Link>
  );
}

function SaveSearchForm({ filters }: { filters: VehicleFilters }) {
  const params = new URLSearchParams(searchHref(filters).split("?")[1] ?? "");

  return (
    <form action={saveSearch} className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
      {[...params.entries()].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="sr-only" htmlFor="suche-name">
        Name der Suche
      </label>
      <input
        id="suche-name"
        name="name"
        defaultValue={searchTitle(filters)}
        maxLength={80}
        className="h-11 min-w-48 rounded-xl border border-line bg-card px-3 text-sm"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-sand"
      >
        Suche speichern
      </button>
    </form>
  );
}

function SearchFallback() {
  return (
    <p className="mt-6 text-sm text-muted" role="status">
      Angebote werden geladen.
    </p>
  );
}
