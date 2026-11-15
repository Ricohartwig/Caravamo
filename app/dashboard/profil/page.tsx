import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updateProfile } from "@/actions/account";
import { accountProfile, currentUser } from "@/lib/account";

export const metadata: Metadata = {
  title: "Profil",
  description: "Name, Telefon und Ort deines Caravamo-Kontos.",
};

const notices: Record<string, string> = {
  gespeichert: "Das Profil ist gespeichert. Der Ort erscheint auf deinen öffentlichen Inseraten.",
  ungueltig: "Der Name braucht 2 bis 80 Zeichen. Telefon und Ort bleiben kürzer als 40 beziehungsweise 80 Zeichen.",
  fehler: "Das Profil konnte nicht gespeichert werden.",
};

export default function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ hinweis?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Profil wird geladen.</p>}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({ searchParams }: { searchParams: Promise<{ hinweis?: string | string[] }> }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/dashboard/profil");
  }

  const params = await searchParams;
  const noticeKey = Array.isArray(params.hinweis) ? params.hinweis[0] : params.hinweis;
  const profile = await accountProfile(user.id);

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
      <p className="mt-2 text-muted">
        Du bist als {profile.roleLabel} angemeldet. Die Rolle legt den Preis eines Inserats fest und bleibt, wie sie bei der Registrierung gewählt wurde.
      </p>
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      <form action={updateProfile} className="mt-6 space-y-4">
        <label htmlFor="profil-name" className="block text-sm font-medium">
          Name
          <input
            id="profil-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profile.name}
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-card px-3"
          />
        </label>
        <label htmlFor="profil-phone" className="block text-sm font-medium">
          Telefon
          <input
            id="profil-phone"
            name="phone"
            type="tel"
            maxLength={40}
            defaultValue={profile.phone}
            autoComplete="tel"
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-card px-3"
          />
        </label>
        <p className="text-sm text-muted">Die Telefonnummer bleibt privat und steht nicht im Exposé.</p>
        <label htmlFor="profil-city" className="block text-sm font-medium">
          Ort
          <input
            id="profil-city"
            name="city"
            maxLength={80}
            defaultValue={profile.city}
            autoComplete="address-level2"
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-card px-3"
          />
        </label>
        <p className="text-sm text-muted">Der Ort ist auf deinen öffentlichen Inseraten sichtbar.</p>
        <p className="text-sm text-muted">E-Mail: {user.email}</p>
        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
          Profil speichern
        </button>
      </form>
    </div>
  );
}
