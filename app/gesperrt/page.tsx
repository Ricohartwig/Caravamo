import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Konto gesperrt",
  robots: { index: false, follow: false },
};

export default function BlockedPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Dieses Konto ist gesperrt</h1>
      <p className="mt-3 text-muted">
        Inserate, Anfragen und das Konto sind geschlossen. Die öffentliche Suche bleibt erreichbar.
      </p>
      <p className="mt-6">
        <Link href="/" className="font-semibold text-pine hover:underline">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
