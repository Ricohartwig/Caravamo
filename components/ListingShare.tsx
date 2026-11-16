import { Link2, MessageCircle } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

export function ListingShare({ title, path }: { title: string; path: string }) {
  const url = absoluteUrl(path);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const rootId = `teilen-${path.replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <div id={rootId} className="mt-4 flex flex-wrap gap-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-semibold hover:bg-sand"
      >
        <MessageCircle aria-hidden="true" className="size-4 text-pine" />
        WhatsApp
      </a>
      <button
        type="button"
        data-copy={url}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-semibold hover:bg-sand"
      >
        <Link2 aria-hidden="true" className="size-4 text-pine" />
        <span data-copy-label>Link kopieren</span>
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var root=document.getElementById(${JSON.stringify(rootId)});if(!root||root.getAttribute("data-ready")==="1")return;root.setAttribute("data-ready","1");root.addEventListener("click",function(event){var button=event.target.closest("[data-copy]");if(!button||!root.contains(button))return;var url=button.getAttribute("data-copy")||"";var label=button.querySelector("[data-copy-label]");function done(){if(label)label.textContent="Link kopiert";}function fallback(){var input=document.createElement("textarea");input.value=url;document.body.appendChild(input);input.select();try{document.execCommand("copy");done();}catch(error){}input.remove();}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(fallback);}else{fallback();}});})();`,
        }}
      />
    </div>
  );
}
