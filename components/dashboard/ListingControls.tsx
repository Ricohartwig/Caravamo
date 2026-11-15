import { duplicateListing, setListingState } from "@/actions/listings";
import { canMarkSold, canPause, canResume } from "@/lib/listing-state";

export function ListingControls({
  id,
  status,
  publishedUntil,
  preview = false,
}: {
  id: string;
  status: string;
  publishedUntil: string | null;
  preview?: boolean;
}) {
  return (
    <>
      {canPause(status, publishedUntil) ? (
        <StateButton id={id} status="inaktiv" preview={preview} label="Pausieren" />
      ) : null}
      {canResume(status, publishedUntil) ? (
        <StateButton id={id} status="aktiv" preview={preview} label="Wieder online" tone="copper" />
      ) : null}
      {canMarkSold(status, publishedUntil) ? (
        <StateButton id={id} status="verkauft" preview={preview} label="Als verkauft markieren" />
      ) : null}
      <form action={duplicateListing}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-sand"
        >
          Duplizieren
        </button>
      </form>
    </>
  );
}

function StateButton({
  id,
  status,
  label,
  preview,
  tone = "line",
}: {
  id: string;
  status: "aktiv" | "inaktiv" | "verkauft";
  label: string;
  preview: boolean;
  tone?: "line" | "copper";
}) {
  return (
    <form action={setListingState}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {preview ? <input type="hidden" name="return" value="vorschau" /> : null}
      <button
        type="submit"
        className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold ${
          tone === "copper" ? "bg-copper-dark text-foam hover:bg-copper" : "border border-line hover:bg-sand"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
