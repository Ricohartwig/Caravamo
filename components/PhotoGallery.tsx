import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid, X, ZoomIn } from "lucide-react";

export function PhotoGallery({
  title,
  urls,
  galleryId,
}: {
  title: string;
  urls: readonly string[];
  galleryId: string;
}) {
  const current = urls[0];
  const several = urls.length > 1;
  const zoomId = `zoom-${galleryId}`;
  const allId = `all-${galleryId}`;
  const rootId = `photos-${galleryId}`;

  if (!current) {
    return null;
  }

  return (
    <div id={rootId}>
      <div className="relative">
        <ul
          data-photo-strip
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-sand [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {urls.map((url, index) => (
            <li key={`${url}-${index}`} className="w-full shrink-0 snap-center">
              <button
                type="button"
                data-photo-open="zoom"
                data-photo-zoom={index}
                aria-label={`Bild ${index + 1} vergrößern`}
                className="relative block aspect-[16/10] w-full"
              >
                <Image
                  src={url}
                  alt={`${title}, Bild ${index + 1} von ${urls.length}`}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              </button>
            </li>
          ))}
        </ul>
        {several ? (
          <>
            <StripButton label="Vorheriges Bild" className="left-3" dir={-1} />
            <StripButton label="Nächstes Bild" className="right-3" dir={1} />
          </>
        ) : null}
        <p
          data-photo-count
          className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-semibold text-foam"
        >
          1 / {urls.length}
        </p>
        <div className="absolute bottom-3 right-3 flex gap-2">
          {several ? (
            <button
              type="button"
              data-photo-open="all"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foam/95 px-3 text-xs font-semibold text-ink shadow hover:bg-foam"
            >
              <LayoutGrid aria-hidden="true" className="size-4" />
              Alle Bilder
            </button>
          ) : null}
          <button
            type="button"
            data-photo-open="zoom"
            data-photo-zoom="current"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foam/95 px-3 text-xs font-semibold text-ink shadow hover:bg-foam"
          >
            <ZoomIn aria-hidden="true" className="size-4" />
            Vergrößern
          </button>
        </div>
      </div>
      {several ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, index) => (
            <li key={`${url}-thumb-${index}`} className="w-24 shrink-0">
              <button
                type="button"
                data-photo-jump={index}
                aria-current={index === 0 ? "true" : "false"}
                aria-label={`Bild ${index + 1} zeigen`}
                className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl ring-pine aria-[current=true]:ring-2"
              >
                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog id={allId} className="m-auto w-[min(100%-1.5rem,72rem)] rounded-2xl bg-ink p-3 text-foam backdrop:bg-ink/80 sm:p-4">
        <DialogBar title={`Alle Bilder (${urls.length})`} />
        <ul className="grid max-h-[75vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, index) => (
            <li key={`${url}-all-${index}`}>
              <button
                type="button"
                data-photo-index={index}
                aria-label={`Bild ${index + 1} vergrößern`}
                className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl"
              >
                <Image src={url} alt="" fill sizes="25vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      </dialog>

      <dialog id={zoomId} className="m-auto w-[min(100%-1.5rem,72rem)] rounded-2xl bg-ink p-3 text-foam backdrop:bg-ink/80 sm:p-4">
        <DialogBar title="Vergrößerte Ansicht" />
        <div className="relative">
          <ul data-photo-strip className="flex h-[min(72vh,680px)] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {urls.map((url, index) => (
              <li key={`${url}-zoom-${index}`} className="relative h-full w-full shrink-0 snap-center">
                <Image
                  src={url}
                  alt={`${title}, Bild ${index + 1} von ${urls.length}`}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </li>
            ))}
          </ul>
          {several ? (
            <>
              <StripButton label="Vorheriges Bild" className="left-3" dir={-1} zoom />
              <StripButton label="Nächstes Bild" className="right-3" dir={1} zoom />
            </>
          ) : null}
        </div>
      </dialog>
      <script
        dangerouslySetInnerHTML={{
          __html: galleryScript(rootId, zoomId, allId),
        }}
      />
    </div>
  );
}

function DialogBar({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">{title}</p>
      <button
        type="button"
        data-photo-close
        className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-white/10"
      >
        <X aria-hidden="true" className="size-5" />
        <span className="sr-only">Schließen</span>
      </button>
    </div>
  );
}

function StripButton({
  label,
  className,
  dir,
  zoom = false,
}: {
  label: string;
  className: string;
  dir: number;
  zoom?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-photo-dir={dir}
      data-photo-zoom-dir={zoom ? "" : undefined}
      className={`absolute top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-foam/95 text-ink shadow hover:bg-foam ${className}`}
    >
      {dir < 0 ? <ChevronLeft aria-hidden="true" className="size-5" /> : <ChevronRight aria-hidden="true" className="size-5" />}
    </button>
  );
}

function galleryScript(rootId: string, zoomId: string, allId: string): string {
  return `
(function () {
  var root = document.getElementById(${JSON.stringify(rootId)});
  var zoom = document.getElementById(${JSON.stringify(zoomId)});
  var all = document.getElementById(${JSON.stringify(allId)});
  if (!root || root.getAttribute("data-ready") === "1") return;
  root.setAttribute("data-ready", "1");
  var strip = root.querySelector("[data-photo-strip]");
  var count = root.querySelector("[data-photo-count]");
  var zoomStrip = zoom ? zoom.querySelector("[data-photo-strip]") : null;
  function place(list, index, behavior) {
    if (!list) return;
    var max = list.children.length - 1;
    var next = Math.max(0, Math.min(max, index));
    list.scrollTo({ left: next * list.clientWidth, behavior: behavior || "smooth" });
  }
  function current() {
    var width = strip.clientWidth || 1;
    return Math.round(strip.scrollLeft / width);
  }
  function paint() {
    var index = current();
    if (count) count.textContent = (index + 1) + " / " + strip.children.length;
    var thumbs = root.querySelectorAll("[data-photo-jump]");
    for (var i = 0; i < thumbs.length; i++) thumbs[i].setAttribute("aria-current", i === index ? "true" : "false");
  }
  strip.addEventListener("scroll", paint);
  function openZoom(index) {
    if (!zoom) return;
    if (all && all.open) all.close();
    if (!zoom.open) zoom.showModal();
    setTimeout(function () {
      place(zoomStrip, index, "auto");
      place(strip, index, "auto");
    }, 30);
  }
  root.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    var dialog = button.closest("dialog");
    if (button.hasAttribute("data-photo-close") && dialog) dialog.close();
    if (dialog === zoom && button.hasAttribute("data-photo-zoom-dir") && zoomStrip) {
      var width = zoomStrip.clientWidth || 1;
      var next = Math.round(zoomStrip.scrollLeft / width) + Number(button.getAttribute("data-photo-dir"));
      place(zoomStrip, next);
      place(strip, next);
      return;
    }
    if (!root.contains(button) || dialog) return;
    if (button.hasAttribute("data-photo-dir")) {
      place(strip, current() + Number(button.getAttribute("data-photo-dir")));
    }
    var jump = button.getAttribute("data-photo-jump");
    if (jump !== null) place(strip, Number(jump));
    if (button.getAttribute("data-photo-open") === "all" && all && !all.open) all.showModal();
    if (button.getAttribute("data-photo-open") === "zoom") {
      var chosen = button.getAttribute("data-photo-zoom");
      openZoom(chosen === "current" ? current() : Number(chosen));
    }
  });
  if (all) {
    all.addEventListener("click", function (event) {
      var button = event.target.closest("[data-photo-index]");
      if (!button) return;
      var index = Number(button.getAttribute("data-photo-index"));
      place(strip, index);
      openZoom(index);
    });
  }
})();
`;
}
