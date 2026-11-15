"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const maxImages = 12;
const maxBytes = 10 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadedImage = {
  path: string;
  previewUrl: string;
  persisted?: boolean;
};

type ImageUploadProps = {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onPendingChange: (pending: boolean) => void;
};

export function ImageUpload({ images, onChange, onPendingChange }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const files = [...(fileList ?? [])];
    if (files.length === 0) {
      return;
    }

    if (images.length + files.length > maxImages) {
      setError("Höchstens 12 Bilder.");
      return;
    }

    setPending(true);
    onPendingChange(true);
    setError(null);
    const next = [...images];

    try {
      for (const file of files) {
        const uploaded = await uploadVehicleImage(file);
        next.push(uploaded);
        onChange([...next]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Das Bild konnte nicht hochgeladen werden.");
    } finally {
      setPending(false);
      onPendingChange(false);
    }
  }

  async function removeImage(image: UploadedImage) {
    onChange(images.filter((entry) => entry.path !== image.path));
    if (image.persisted) {
      return;
    }

    const supabase = createClient();
    await supabase.storage.from("vehicle-images").remove([image.path]);
  }

  return (
    <fieldset className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <legend className="px-1 text-base font-semibold">Bilder</legend>
      <p className="mt-2 text-sm leading-6 text-muted">
        JPG, PNG oder WebP, höchstens 10 MB pro Bild. Das erste Bild wird das Hauptbild.
      </p>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-foam px-4 py-8 text-center hover:bg-sand">
        <ImagePlus aria-hidden="true" className="size-6 text-pine" />
        <span className="mt-2 text-sm font-semibold">Bilder auswählen</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={pending || images.length >= maxImages}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {pending ? (
        <p className="mt-3 text-sm text-muted" role="status">
          Bilder werden hochgeladen.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-copper-dark" role="alert">
          {error}
        </p>
      ) : null}
      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.path} className="relative aspect-[16/10] overflow-hidden rounded-xl">
              <Image
                src={image.previewUrl}
                alt={index === 0 ? "Hauptbild" : `Bild ${index + 1}`}
                fill
                sizes="(min-width: 640px) 30vw, 50vw"
                className="object-cover"
              />
              {index === 0 ? (
                <p className="absolute left-2 top-2 rounded-full bg-pine-deep/70 px-2 py-1 text-xs font-medium text-foam">
                  Hauptbild
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void removeImage(image)}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-foam text-ink"
                aria-label={index === 0 ? "Hauptbild entfernen" : `Bild ${index + 1} entfernen`}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}

async function uploadVehicleImage(file: File): Promise<UploadedImage> {
  const extension = extensions[file.type];
  if (!extension) {
    throw new Error("Erlaubt sind JPG, PNG und WebP.");
  }

  if (file.size > maxBytes) {
    throw new Error("Ein Bild darf höchstens 10 MB groß sein.");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Bitte melde dich erneut an, bevor du Bilder hochlädst.");
  }

  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
  const uploaded = await supabase.storage.from("vehicle-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploaded.error) {
    throw new Error("Das Bild konnte nicht im Speicher abgelegt werden.");
  }

  const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(path);
  return { path, previewUrl: publicUrl.publicUrl };
}
