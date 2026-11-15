"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInWithGoogle,
  signInWithPassword,
  signUp,
  type AuthState,
} from "@/actions/auth";

const initialState: AuthState = { error: null, message: null };

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath: string;
  notice: string | null;
};

export function AuthForm({ mode, nextPath, notice }: AuthFormProps) {
  const action = mode === "login" ? signInWithPassword : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <div className="mt-8 space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={nextPath} />
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-sand"
        >
          Mit Google anmelden
        </button>
      </form>

      <p className="text-center text-sm text-muted">oder mit E-Mail</p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        {isLogin ? null : (
          <>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                className={fieldClassName}
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Kontoart</legend>
              <label className="flex items-start gap-3 rounded-xl border border-line bg-card px-3 py-3 text-sm">
                <input type="radio" name="role" value="privat" defaultChecked className="mt-1" />
                <span>
                  <span className="font-semibold">Privat</span>
                  <span className="mt-0.5 block text-muted">Kaufen und verkaufen. Ein Inserat kostet 4,99 € für 30 Tage.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-line bg-card px-3 py-3 text-sm">
                <input type="radio" name="role" value="haendler" className="mt-1" />
                <span>
                  <span className="font-semibold">Händler</span>
                  <span className="mt-0.5 block text-muted">
                    Gewerbe mit eigener Händlerseite. Ein Inserat kostet 6,99 € für 30 Tage.
                  </span>
                </span>
              </label>
              <p className="text-sm text-muted">Die Kontoart bleibt nach der Registrierung bestehen.</p>
            </fieldset>
          </>
        )}
        <label htmlFor="email" className="block text-sm font-medium">
          E-Mail
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClassName}
          />
        </label>
        <label htmlFor="password" className="block text-sm font-medium">
          Passwort
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={8}
            className={fieldClassName}
          />
        </label>
        {isLogin ? (
          <p className="text-right text-sm">
            <Link href="/passwort-vergessen" className="font-semibold text-pine">
              Passwort vergessen?
            </Link>
          </p>
        ) : null}
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
          {pending ? "Bitte warten" : isLogin ? "Anmelden" : "Konto anlegen"}
        </button>
      </form>

      <p className="text-sm text-muted">
        {isLogin ? (
          <>
            Noch kein Konto?{" "}
            <Link href={`/registrieren?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-pine">
              Registrieren
            </Link>
          </>
        ) : (
          <>
            Schon ein Konto?{" "}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-pine">
              Anmelden
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
