import { Suspense } from "react";
import type { Metadata } from "next";
import { PasswordRequestForm } from "@/components/PasswordForms";
import { firstSearchParam } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Passwort vergessen",
  description: "Link für ein neues Caravamo-Passwort anfordern.",
};

const notices: Record<string, string> = {
  link: "Der Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an.",
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-sm text-muted">Seite wird geladen.</p>}>
      <ForgotContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ForgotContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = firstSearchParam(params.error);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Passwort vergessen</h1>
      <p className="mt-4 leading-7 text-muted">
        Gib die E-Mail deines Kontos ein. Wenn sie bei uns liegt, schicken wir einen Link für ein neues Passwort.
      </p>
      <PasswordRequestForm notice={notices[error] ?? null} />
    </div>
  );
}
