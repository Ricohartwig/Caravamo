import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { firstSearchParam, safeNextPath } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Registrieren",
  description: "Konto bei Caravamo anlegen.",
};

export default function RegisterPage({ searchParams }: PageProps<"/registrieren">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-sm text-muted">Registrierung wird geladen.</p>}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({
  searchParams,
}: {
  searchParams: PageProps<"/registrieren">["searchParams"];
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstSearchParam(params.next));

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Konto anlegen</h1>
      <p className="mt-4 leading-7 text-muted">
        Privatkunden und Händler nutzen dasselbe Konto. Die Kontoart wählst du hier, sie bestimmt den Preis eines Inserats und die öffentliche Händlerseite.
      </p>
      <AuthForm mode="register" nextPath={nextPath} notice={null} />
    </div>
  );
}
