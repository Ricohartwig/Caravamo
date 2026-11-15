import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { firstSearchParam, safeNextPath } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Login",
  description: "Mit E-Mail oder Google bei Caravamo anmelden.",
};

const notices: Record<string, string> = {
  config: "Supabase ist noch nicht verbunden. Die Schlüssel fehlen in der Umgebung.",
  google: "Die Google-Anmeldung ist im Supabase-Projekt noch nicht aktiviert.",
  auth: "Die Anmeldung konnte nicht abgeschlossen werden.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-sm text-muted">Anmeldung wird geladen.</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstSearchParam(params.next));
  const error = firstSearchParam(params.error);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
      <p className="mt-4 leading-7 text-muted">
        Melde dich mit Google oder mit E-Mail und Passwort an. Nur angemeldete
        Nutzer können ein Fahrzeug inserieren.
      </p>
      <AuthForm mode="login" nextPath={nextPath} notice={notices[error] ?? null} />
    </div>
  );
}
