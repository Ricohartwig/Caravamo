"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { sendContactRequest } from "@/actions/contact";
import { contactMessage } from "@/lib/contact-status";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

export function ContactForm({ vehicleId }: { vehicleId: string }) {
  const params = useSearchParams();
  const code = params.get("kontakt");
  const sent = code === "gesendet";
  const error = contactMessage(code);

  useEffect(() => {
    if (!sent) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("kontakt");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [sent]);

  return (
    <div className="mt-5">
      {sent ? (
        <p className="text-sm leading-6 text-muted">Die Nachricht ist beim Anbieter angekommen.</p>
      ) : (
        <form action={sendContactRequest}>
          <input type="hidden" name="vehicle_id" value={vehicleId} />
          <p className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </p>
          <label htmlFor="kontakt-name" className="block text-sm font-medium">
            Name
            <input id="kontakt-name" name="name" required maxLength={80} autoComplete="name" className={fieldClassName} />
          </label>
          <label htmlFor="kontakt-email" className="mt-3 block text-sm font-medium">
            E-Mail
            <input
              id="kontakt-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              className={fieldClassName}
            />
          </label>
          <label htmlFor="kontakt-phone" className="mt-3 block text-sm font-medium">
            Telefon
            <input
              id="kontakt-phone"
              name="phone"
              type="tel"
              required
              maxLength={40}
              autoComplete="tel"
              className={fieldClassName}
            />
          </label>
          <label htmlFor="kontakt-message" className="mt-3 block text-sm font-medium">
            Nachricht
            <textarea
              id="kontakt-message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Zum Beispiel: Ist das Fahrzeug noch verfügbar?"
              className={fieldClassName}
            />
          </label>
          <button
            type="submit"
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper"
          >
            Nachricht senden
          </button>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-copper-dark">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Deine Angaben gehen nur an den Anbieter. Die E-Mail-Adresse des Anbieters bleibt verborgen.
            </p>
          )}
        </form>
      )}
      {sent ? (
        <p
          role="status"
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-foam shadow-lg"
        >
          Die Nachricht ist beim Anbieter angekommen.
        </p>
      ) : null}
    </div>
  );
}
