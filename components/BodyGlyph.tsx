export function BodyGlyph({ kind }: { kind: BodyGlyphKind }) {
  return (
    <svg viewBox="0 0 72 40" aria-hidden="true" className="h-8 w-14 text-pine">
      {kind === "teil" ? <Teilintegriert /> : null}
      {kind === "voll" ? <Vollintegriert /> : null}
      {kind === "alkoven" ? <Alkoven /> : null}
      {kind === "kasten" ? <Kastenwagen /> : null}
      {kind === "wohnwagen" ? <Wohnwagen /> : null}
      {kind === "dachzelt" ? <Dachzelt /> : null}
    </svg>
  );
}

export type BodyGlyphKind = "teil" | "voll" | "alkoven" | "kasten" | "wohnwagen" | "dachzelt";

function Teilintegriert() {
  return (
    <path
      d="M6 28h6l2-6h8l4-7h22l6 7h8v6h4M18 28a4 4 0 1 0 0.1 0M52 28a4 4 0 1 0 0.1 0M22 15v7h24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Vollintegriert() {
  return (
    <path
      d="M8 28h4l6-12h34l8 6h6v6h4M24 28a4 4 0 1 0 0.1 0M54 28a4 4 0 1 0 0.1 0M20 16h16v6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Alkoven() {
  return (
    <path
      d="M6 28h6l2-5h7V12h28l5 6h8v10h4M18 28a4 4 0 1 0 0.1 0M50 28a4 4 0 1 0 0.1 0M15 18h8v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Kastenwagen() {
  return (
    <path
      d="M8 28h5l3-8h12l3-5h24v13h5M22 28a4 4 0 1 0 0.1 0M52 28a4 4 0 1 0 0.1 0M28 15v8h16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Wohnwagen() {
  return (
    <path
      d="M14 28h28M16 28l2-10h28l4 10M22 28a4 4 0 1 0 0.1 0M40 28a4 4 0 1 0 0.1 0M24 18h10v5H24z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Dachzelt() {
  return (
    <path
      d="M10 30h6l3-6h18l4 6h8M20 30a3 3 0 1 0 0.1 0M42 30a3 3 0 1 0 0.1 0M22 16l8-6 8 6v6H22z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}
