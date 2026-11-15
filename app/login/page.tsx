import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login",
  description: "Anmeldung bei Caravamo folgt mit Supabase.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
      <p className="mt-4 leading-7 text-muted">
        Die Anmeldung wird mit Supabase eingerichtet. In diesem Grundgerüst gibt
        es noch kein Konto und kein Passwortfeld, damit nichts eingegeben wird,
        das nirgends ankommt.
      </p>
      <p className="mt-4 leading-7">
        Legen Sie die Platzhalter aus <code>.env.example</code> in{" "}
        <code>.env.local</code> ab, sobald ein Projekt bereitsteht.
      </p>
      <Link
        href="/suche"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-pine px-5 text-sm font-semibold text-foam"
      >
        Weiter zur Suche
      </Link>
    </div>
  );
}
