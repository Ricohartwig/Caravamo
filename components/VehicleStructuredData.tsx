import { headers } from "next/headers";
import { listingDescription, listingTitle } from "@/lib/listing-seo";
import { getPublishedListing } from "@/lib/published-listings";
import { absoluteUrl } from "@/lib/site";

const vehiclePath =
  /^\/fahrzeug\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export async function VehicleStructuredData() {
  const pathname = (await headers()).get("x-caravamo-path") ?? "";
  const id = vehiclePath.exec(pathname)?.[1];
  if (!id) {
    return null;
  }

  const listing = await getPublishedListing(id);
  if (!listing) {
    return null;
  }

  const title = listingTitle(listing);
  const description = listingDescription(listing);
  const url = absoluteUrl(`/fahrzeug/${listing.id}`);
  const headTags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="de_DE">`,
  ].join("");

  return (
    <>
      {/* generateMetadata streamt Titel und Beschreibung in den Body. Das Skript setzt sie in den Head. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.head.insertAdjacentHTML("beforeend", ${JSON.stringify(headTags)});
document.addEventListener("DOMContentLoaded", () => {
  document.body.querySelectorAll("title, meta[name='description'], meta[property^='og:'], link[rel='canonical']").forEach((node) => node.remove());
});`,
        }}
      />
    </>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
