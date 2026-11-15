import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProfile } from "@/actions/account";
import { accountProfile, currentUser, type AccountProfile } from "@/lib/account";
import { LogoField } from "@/components/account/LogoField";
import { dealerServiceOptions, legalForms, profileSlotCount } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Profil",
  description: "Profil für Privatkunden und Händler bei Caravamo.",
};

const notices: Record<string, string> = {
  gespeichert: "Das Profil ist gespeichert.",
  name: "Der Name braucht 2 bis 80 Zeichen.",
  phone: "Die Telefonnummer darf nur Ziffern, Leerzeichen und + / ( ) enthalten.",
  postal: "Die Postleitzahl hat fünf Ziffern.",
  city: "Der Ort ist zu lang.",
  street: "Die Straße ist zu lang.",
  company: "Der Firmenname braucht 2 bis 120 Zeichen.",
  website: "Die Website braucht eine gültige https-Adresse.",
  about: "Die Vorstellung darf höchstens 800 Zeichen haben.",
  hours: "Die Öffnungszeiten dürfen höchstens 240 Zeichen haben.",
  vat: "Die USt-IdNr. hat die Form DE und neun Ziffern.",
  services: "Diese Leistung gibt es nicht.",
  logo: "Das Logo muss ein Bild aus deinem Konto sein.",
  "public-email": "Bitte gib eine gültige E-Mail für das Impressum an.",
  legal: "Bitte wähle eine Rechtsform aus der Liste.",
  register: "Registergericht und Registernummer sind zu lang oder enthalten ungültige Zeichen.",
  represented: "„Vertreten durch“ braucht 2 bis 80 Zeichen.",
  fehler: "Das Profil konnte nicht gespeichert werden.",
};

const fieldClassName = "mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-3 text-base";

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
  const total = profileSlotCount(profile.business);
  const done = total - profile.gaps.length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
      <p className="mt-2 text-muted">
        Du bist als {profile.roleLabel} angemeldet. Die Kontoart legt den Preis eines Inserats fest und bleibt, wie sie bei der Registrierung gewählt wurde.
      </p>
      <p className="mt-4 rounded-2xl border border-line bg-card px-4 py-3 text-sm">
        {profile.gaps.length === 0
          ? "Dein Profil ist vollständig."
          : `${done} von ${total} Angaben stehen. Es fehlt noch: ${profile.gaps.map((gap) => gap.label).join(", ")}.`}
      </p>
      {profile.publicDealerPage ? (
        <p className="mt-3 text-sm">
          <Link href={`/haendler/${user.id}`} className="font-semibold text-pine hover:underline">
            Öffentliche Händlerseite ansehen
          </Link>
        </p>
      ) : profile.business ? (
        <p className="mt-3 text-sm text-muted">Die Händlerseite geht online, sobald Firmenname und Ort gespeichert sind.</p>
      ) : null}
      {noticeKey && notices[noticeKey] ? (
        <p role="status" className="mt-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
          {notices[noticeKey]}
        </p>
      ) : null}
      <form action={updateProfile} className="mt-6 space-y-8">
        {profile.business ? <BusinessFields profile={profile} /> : <PrivateFields profile={profile} />}
        <p className="text-sm text-muted">E-Mail: {user.email}</p>
        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-pine px-4 text-sm font-semibold text-foam">
          Profil speichern
        </button>
      </form>
    </div>
  );
}

function PrivateFields({ profile }: { profile: AccountProfile }) {
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Persönlich</h2>
        <TextField id="profil-name" name="name" label="Name" required minLength={2} maxLength={80} defaultValue={profile.name} autoComplete="name" />
        <TextField id="profil-phone" name="phone" label="Telefon" type="tel" maxLength={40} defaultValue={profile.phone} autoComplete="tel" />
        <p className="text-sm text-muted">Die Telefonnummer bleibt privat und steht nicht im Exposé.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Standort</h2>
        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <TextField id="profil-postal" name="postal_code" label="Postleitzahl" inputMode="numeric" maxLength={5} defaultValue={profile.postalCode} autoComplete="postal-code" />
          <TextField id="profil-city" name="city" label="Ort" maxLength={80} defaultValue={profile.city} autoComplete="address-level2" />
        </div>
        <p className="text-sm text-muted">Postleitzahl und Ort sind auf deinen öffentlichen Inseraten sichtbar. Die Straße fragen wir bei Privatkunden nicht ab.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Auf den Inseraten</h2>
        <TextArea id="profil-about" name="about" label="Kurze Vorstellung" maxLength={800} rows={5} defaultValue={profile.about} />
        <p className="text-sm text-muted">Dieser Text steht unter deinem Namen im Exposé. Eine eigene Profilseite für Privatkunden gibt es nicht.</p>
      </section>
    </>
  );
}

function BusinessFields({ profile }: { profile: AccountProfile }) {
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Betrieb</h2>
        <TextField id="profil-company" name="company_name" label="Firmenname" maxLength={120} defaultValue={profile.companyName} autoComplete="organization" />
        <TextField id="profil-vat" name="vat_id" label="USt-IdNr." maxLength={14} defaultValue={profile.vatId} placeholder="DE123456789" />
        <TextField id="profil-website" name="website" label="Website" type="url" maxLength={180} defaultValue={profile.website} placeholder="https://" autoComplete="url" />
        <LogoField initialUrl={profile.logoUrl} />
        <fieldset>
          <legend className="text-sm font-medium">Leistungen</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {dealerServiceOptions.map((service) => (
              <label key={service.id} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-3 text-sm">
                <input type="checkbox" name="services" value={service.id} defaultChecked={profile.services.includes(service.id)} />
                {service.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Ansprechpartner</h2>
        <TextField id="profil-name" name="name" label="Name" required minLength={2} maxLength={80} defaultValue={profile.name} autoComplete="name" />
        <TextField id="profil-phone" name="phone" label="Telefon" type="tel" maxLength={40} defaultValue={profile.phone} autoComplete="tel" />
        <p className="text-sm text-muted">Name und Telefon stehen auf der öffentlichen Händlerseite.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Standort</h2>
        <TextField id="profil-street" name="street" label="Straße und Hausnummer" maxLength={120} defaultValue={profile.street} autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <TextField id="profil-postal" name="postal_code" label="Postleitzahl" inputMode="numeric" maxLength={5} defaultValue={profile.postalCode} autoComplete="postal-code" />
          <TextField id="profil-city" name="city" label="Ort" maxLength={80} defaultValue={profile.city} autoComplete="address-level2" />
        </div>
        <p className="text-sm text-muted">Die Adresse ist auf der Händlerseite sichtbar.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Impressum</h2>
        <p className="text-sm text-muted">
          Diese Angaben stehen auf der öffentlichen Händlerseite. Die E-Mail deiner Anmeldung bleibt privat.
        </p>
        <label htmlFor="profil-legal" className="block text-sm font-medium">
          Rechtsform
          <select id="profil-legal" name="legal_form" defaultValue={profile.legalForm} className={fieldClassName}>
            <option value="">Bitte wählen</option>
            {legalForms.map((form) => (
              <option key={form} value={form}>
                {form}
              </option>
            ))}
          </select>
        </label>
        <TextField id="profil-represented" name="represented_by" label="Vertreten durch" maxLength={80} defaultValue={profile.representedBy} placeholder="Vor- und Nachname, Funktion" />
        <TextField id="profil-public-email" name="public_email" label="E-Mail im Impressum" type="email" maxLength={254} defaultValue={profile.publicEmail} autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="profil-court" name="register_court" label="Registergericht" maxLength={80} defaultValue={profile.registerCourt} placeholder="Amtsgericht Musterstadt" />
          <TextField id="profil-register" name="register_number" label="Registernummer" maxLength={40} defaultValue={profile.registerNumber} placeholder="HRB 12345" />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Händlerseite</h2>
        <TextArea id="profil-about" name="about" label="Vorstellung des Betriebs" maxLength={800} rows={5} defaultValue={profile.about} />
        <TextArea id="profil-hours" name="opening_hours" label="Öffnungszeiten" maxLength={240} rows={4} defaultValue={profile.openingHours} />
      </section>
    </>
  );
}

function TextField({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
      <input id={id} name={name} type={type} defaultValue={defaultValue} className={fieldClassName} {...rest} />
    </label>
  );
}

function TextArea({
  id,
  name,
  label,
  defaultValue,
  maxLength,
  rows,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  maxLength: number;
  rows: number;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
      <textarea id={id} name={name} defaultValue={defaultValue} maxLength={maxLength} rows={rows} className={fieldClassName} />
    </label>
  );
}
