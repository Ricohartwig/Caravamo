import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Seite nicht gefunden
      </h1>
      <p className="mt-3 text-muted">Dieser Pfad gehört nicht zu Caravamo.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
