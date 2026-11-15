"use client";

import { useActionState } from "react";
import { sendInquiry } from "@/actions/account";

export function InquiryForm({ vehicleId }: { vehicleId: string }) {
  const [state, action, pending] = useActionState(sendInquiry, null);

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <label htmlFor="anfrage" className="text-sm font-medium">
        Nachricht an den Anbieter
        <textarea
          id="anfrage"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Zum Beispiel: Ist das Fahrzeug noch verfügbar und wie ist der Zustand der Polster?"
          className="mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-70"
      >
        {pending ? "Wird gesendet" : "Anfrage senden"}
      </button>
      {state?.error ? (
        <p role="alert" className="mt-3 text-sm text-copper-dark">
          {state.error}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">
          Die Anfrage landet im Konto von dir und vom Anbieter. Es geht keine E-Mail hinaus.
        </p>
      )}
    </form>
  );
}
