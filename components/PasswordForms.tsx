"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword, type AuthState } from "@/actions/auth";

const initialState: AuthState = { error: null, message: null };

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

export function PasswordRequestForm({ notice }: { notice: string | null }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label htmlFor="email" className="block text-sm font-medium">
        E-Mail
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClassName} />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-copper-dark">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="text-sm text-pine">
          {state.message}
        </p>
      ) : null}
      {notice ? (
        <p role="alert" className="text-sm text-copper-dark">
          {notice}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-70"
      >
        {pending ? "Bitte warten" : "Link senden"}
      </button>
      <p className="text-sm text-muted">
        <Link href="/login" className="font-semibold text-pine">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label htmlFor="password" className="block text-sm font-medium">
        Neues Passwort
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClassName}
        />
      </label>
      <label htmlFor="confirmation" className="block text-sm font-medium">
        Passwort wiederholen
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClassName}
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-copper-dark">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-4 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-70"
      >
        {pending ? "Bitte warten" : "Passwort speichern"}
      </button>
    </form>
  );
}
