import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function OfferRail({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {aside}
          <button
            type="button"
            data-rail="-1"
            aria-label="Vorherige Fahrzeuge"
            className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-card hover:bg-sand"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            data-rail="1"
            aria-label="Weitere Fahrzeuge"
            className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-card hover:bg-sand"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <ul data-rail-list className="mt-4 flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2">
        {children}
      </ul>
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  var root = document.getElementById(${JSON.stringify(id)});
  if (!root || root.getAttribute("data-ready") === "1") return;
  root.setAttribute("data-ready", "1");
  var list = root.querySelector("[data-rail-list]");
  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-rail]");
    if (!button || !list) return;
    list.scrollBy({ left: Number(button.getAttribute("data-rail")) * Math.max(list.clientWidth * 0.8, 280), behavior: "smooth" });
  });
})();
`,
        }}
      />
    </section>
  );
}
