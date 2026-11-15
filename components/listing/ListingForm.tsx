"use client";

import { useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { createListing, updateListing } from "@/actions/listings";
import { bodyOptions, isFieldVisible, listingSections, type ListingField } from "@/lib/listing-sections";
import { listingDefaults, listingFormSchema, type ListingFormInput, type ListingOutput } from "@/lib/listing-schema";
import { ImageUpload, type UploadedImage } from "@/components/listing/ImageUpload";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-line bg-foam px-3 py-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

type ListingFormProps = {
  listingId?: string;
  initialValues?: ListingFormInput;
  initialImages?: UploadedImage[];
};

export function ListingForm({ listingId, initialValues, initialImages = [] }: ListingFormProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormInput, unknown, ListingOutput>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: initialValues ?? listingDefaults,
  });
  const category = useWatch({ control, name: "category" });
  const grossWeight = useWatch({ control, name: "gross_weight_kg" });
  const curbWeight = useWatch({ control, name: "curb_weight_kg" });
  const sections = listingSections(category);
  const payload = payloadKg(grossWeight, curbWeight);

  async function onSubmit(values: ListingOutput) {
    setFormError(null);
    const payload = {
      ...values,
      images: images.map((image) => ({ path: image.path })),
    };
    const result = listingId ? await updateListing(listingId, payload) : await createListing(payload);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <form
      className="mt-8 space-y-6"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(onSubmit, () => {
          setFormError("Bitte prüfe die markierten Angaben.");
        })(event);
      }}
    >
      <p className="text-sm leading-6 text-muted">
        Wähle zuerst die Fahrzeugart. Motor und Abgasnorm erscheinen nur beim Wohnmobil, der Mover bei Wohnwagen und Zeltanhängern.
      </p>
      {sections.map((section) => (
        <fieldset key={section.id} className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <legend className="px-1 text-base font-semibold">{section.title}</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                category={category}
                register={register}
                error={messageFor(errors, field.name)}
                onCategoryChange={() => setValue("body_type", "")}
              />
            ))}
          </div>
          {section.id === "masse" && payload !== null ? (
            <p className="mt-4 text-sm font-medium text-pine">Zuladung: {payload} kg</p>
          ) : null}
        </fieldset>
      ))}
      <ImageUpload images={images} onChange={setImages} onPendingChange={setUploading} />
      {formError ? (
        <p role="alert" className="text-sm text-copper-dark">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper-dark px-5 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? "Inserat wird gespeichert" : listingId ? "Änderungen speichern" : "Inserat veröffentlichen"}
      </button>
    </form>
  );
}

function Field({
  field,
  category,
  register,
  error,
  onCategoryChange,
}: {
  field: ListingField;
  category: string;
  register: UseFormRegister<ListingFormInput>;
  error: string | null;
  onCategoryChange: () => void;
}) {
  if (!isFieldVisible(field, category)) {
    return null;
  }

  const errorId = error ? `${field.name}-error` : undefined;
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;

  if (field.kind === "checks") {
    return (
      <div className="sm:col-span-2">
        <fieldset>
          <legend className="text-sm font-medium">{label}</legend>
          {field.options ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {field.options.map((option) => (
                <label key={option} className="flex items-start gap-3 rounded-xl border border-line bg-foam px-3 py-3 text-sm">
                  <input type="checkbox" value={option} className="mt-1 size-4" {...register(field.name)} />
                  {option}
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>
        {error ? (
          <p id={errorId} className="mt-1 text-sm text-copper-dark">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const registration = register(field.name);
  const wide = field.kind === "textarea" || field.kind === "checkbox";

  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      {field.kind === "checkbox" ? (
        <label className="flex items-start gap-3 text-sm font-medium" htmlFor={field.name}>
          <input
            id={field.name}
            type="checkbox"
            className="mt-1 size-4"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            {...registration}
          />
          {label}
        </label>
      ) : (
        <label className="block text-sm font-medium" htmlFor={field.name}>
          {label}
          {field.kind === "textarea" ? (
            <textarea
              id={field.name}
              rows={5}
              className={fieldClassName}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
              {...registration}
            />
          ) : null}
          {field.kind === "text" || field.kind === "number" || field.kind === "date" ? (
            <input
              id={field.name}
              type={field.kind === "date" ? "date" : "text"}
              inputMode={field.kind === "number" ? "numeric" : undefined}
              className={fieldClassName}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
              {...registration}
            />
          ) : null}
          {field.kind === "select" || field.kind === "body" ? (
            <SelectField
              field={field}
              category={category}
              registration={registration}
              error={error}
              errorId={errorId}
              onCategoryChange={onCategoryChange}
            />
          ) : null}
        </label>
      )}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-copper-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  field,
  category,
  registration,
  error,
  errorId,
  onCategoryChange,
}: {
  field: ListingField;
  category: string;
  registration: ReturnType<UseFormRegister<ListingFormInput>>;
  error: string | null;
  errorId: string | undefined;
  onCategoryChange: () => void;
}) {
  const options = field.kind === "body" ? bodyOptions(category) : (field.options ?? []);
  const allowEmpty = field.name !== "price_tax";

  return (
    <select
      id={field.name}
      className={fieldClassName}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      {...registration}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
        void registration.onChange(event);
        if (field.name === "category") {
          onCategoryChange();
        }
      }}
    >
      {allowEmpty ? <option value="">Bitte wählen</option> : null}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function messageFor(errors: FieldErrors<ListingFormInput>, name: keyof ListingFormInput): string | null {
  const error = errors[name];
  if (error && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return null;
}

function payloadKg(gross: string, curb: string): number | null {
  if (!/^\d+$/.test(gross) || !/^\d+$/.test(curb)) {
    return null;
  }

  const payload = Number(gross) - Number(curb);
  if (payload < 0) {
    return null;
  }

  return payload;
}
