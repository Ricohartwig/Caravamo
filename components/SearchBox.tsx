import Link from "next/link";
import { Search } from "lucide-react";
import { BodyGlyph, type BodyGlyphKind } from "@/components/BodyGlyph";
import { formatOfferCount } from "@/lib/format";
import { conditions } from "@/lib/listing-options";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

const homeBodies: Array<{ href: string; label: string; glyph: BodyGlyphKind }> = [
  { href: "/suche?body=Teilintegriert", label: "Teilintegriert", glyph: "teil" },
  { href: "/suche?body=Vollintegriert", label: "Integriert", glyph: "voll" },
  { href: "/suche?body=Alkoven", label: "Alkoven", glyph: "alkoven" },
  { href: "/suche?body=Kastenwagen%20(Campervan)", label: "Kastenwagen", glyph: "kasten" },
  { href: "/suche?type=Wohnwagen", label: "Wohnwagen", glyph: "wohnwagen" },
  { href: "/suche?type=Dachzelt%2FFaltanh%C3%A4nger", label: "Dachzelt", glyph: "dachzelt" },
];

const homeScript = `
(function () {
  var form = document.getElementById("home-search");
  if (!form || form.getAttribute("data-ready") === "1") return;
  form.setAttribute("data-ready", "1");
  form.addEventListener("submit", function () {
    var fields = form.elements;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (!field.name || field.type === "submit" || field.type === "button") continue;
      if (field.value === "") field.disabled = true;
    }
  });
})();
`;

export function SearchBox({ count }: { count: number | null }) {
  return (
    <div className="rounded-3xl bg-card p-4 text-foreground shadow-xl sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Wohnmobile und Wohnwagen kaufen</h2>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {homeBodies.map((entry) => (
          <li key={entry.label}>
            <Link
              href={entry.href}
              className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-line px-2 py-3 text-center text-xs font-medium hover:border-pine hover:bg-sand"
            >
              <BodyGlyph kind={entry.glyph} />
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
      <form id="home-search" action="/suche" method="get" aria-label="Fahrzeugsuche" className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
        <label htmlFor="brand" className="text-sm font-medium">
          Marke
          <input id="brand" name="brand" list="marken-vorschlaege" className={fieldClassName} />
        </label>
        <label htmlFor="condition" className="text-sm font-medium">
          Zustand
          <select id="condition" name="condition" defaultValue="" className={fieldClassName}>
            <option value="">Neu und gebraucht</option>
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="sleep-min" className="text-sm font-medium">
          Schlafplätze mind.
          <select id="sleep-min" name="sleep_min" defaultValue="" className={fieldClassName}>
            <option value="">Egal</option>
            {[2, 3, 4, 5, 6].map((places) => (
              <option key={places} value={places}>
                {places}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          name="erweitert"
          value="1"
          className="inline-flex h-12 items-center justify-center px-2 text-sm font-semibold text-pine hover:underline"
        >
          Zur Detailsuche
        </button>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-pine px-5 font-semibold text-foam hover:bg-pine-deep"
        >
          <Search aria-hidden="true" className="size-4" />
          {count === null ? "Suchen" : formatOfferCount(count)}
        </button>
        <datalist id="marken-vorschlaege">
          {["Challenger", "Fiat", "Hobby", "Knaus", "Weinsberg"].map((entry) => (
            <option key={entry} value={entry} />
          ))}
        </datalist>
        <script dangerouslySetInnerHTML={{ __html: homeScript }} />
      </form>
    </div>
  );
}
