"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const maxBytes = 2 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function LogoField({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const extension = extensions[file.type];
    if (!extension) {
      setError("Erlaubt sind JPG, PNG und WebP.");
      return;
    }
    if (file.size > maxBytes) {
      setError("Das Logo darf höchstens 2 MB groß sein.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        throw new Error("Bitte melde dich erneut an, bevor du das Logo hochlädst.");
      }

      const path = `${data.user.id}/logo-${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage.from("vehicle-images").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploaded.error) {
        throw new Error("Das Logo konnte nicht gespeichert werden.");
      }

      if (uploadedPath) {
        await supabase.storage.from("vehicle-images").remove([uploadedPath]);
      }

      const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      setUploadedPath(path);
      setUrl(publicUrl.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Das Logo konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  async function clear() {
    if (uploadedPath) {
      const supabase = createClient();
      await supabase.storage.from("vehicle-images").remove([uploadedPath]);
    }
    setUploadedPath(null);
    setUrl("");
  }

  return (
    <div>
      <p className="text-sm font-medium">Logo</p>
      <input type="hidden" name="logo_url" value={url} />
      <p className="mt-1 text-sm text-muted">JPG, PNG oder WebP, höchstens 2 MB. Das Logo erscheint oben auf der Händlerseite.</p>
      {url ? (
        <div className="mt-3 flex items-center gap-3">
          <Image src={url} alt="Aktuelles Logo" width={96} height={96} className="size-24 rounded-2xl border border-line bg-foam object-contain p-2" />
          <button type="button" onClick={() => void clear()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
            <X aria-hidden="true" className="size-4" />
            Logo entfernen
          </button>
        </div>
      ) : (
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-line bg-foam px-4 py-4 text-sm hover:bg-sand">
          <ImagePlus aria-hidden="true" className="size-5 text-pine" />
          <span>{pending ? "Logo wird hochgeladen." : "Logo auswählen"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void handleFile(file);
            }}
          />
        </label>
      )}
      {error ? (
        <p className="mt-2 text-sm text-copper-dark" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
