import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewPasswordForm } from "@/components/PasswordForms";
import { currentUser } from "@/lib/account";

export const metadata: Metadata = {
  title: "Neues Passwort",
  description: "Neues Passwort für dein Caravamo-Konto festlegen.",
};

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-sm text-muted">Seite wird geladen.</p>}>
      <NewPasswordContent />
    </Suspense>
  );
}

async function NewPasswordContent() {
  const user = await currentUser();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Neues Passwort</h1>
      {user ? (
        <>
          <p className="mt-4 leading-7 text-muted">
            Lege ein Passwort mit mindestens 8 Zeichen für {user.email} fest.
          </p>
          <NewPasswordForm />
        </>
      ) : (
        <p className="mt-4 leading-7 text-muted">
          Der Link ist abgelaufen oder wurde schon benutzt.{" "}
          <Link href="/passwort-vergessen" className="font-semibold text-pine">
            Neuen Link anfordern
          </Link>
        </p>
      )}
    </div>
  );
}
