"use client";

import { useActionState } from "react";
import { deleteListing } from "@/actions/listings";

const initialState = { error: null };

export function DeleteListingButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(deleteListing, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(`„${title}“ und die Bilder unwiderruflich löschen?`);
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-copper-dark hover:bg-sand disabled:opacity-70"
      >
        {pending ? "Wird gelöscht" : "Löschen"}
      </button>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-copper-dark">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
