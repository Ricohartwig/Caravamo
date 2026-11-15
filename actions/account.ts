"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, searchLimit } from "@/lib/account";
import { parseFilters, searchHref, searchTitle } from "@/lib/filters";
import { isPublicListing } from "@/lib/listing-payment";
import { isVehicleId } from "@/lib/owned-listings";
import { searchOffers } from "@/lib/published-listings";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/utils/supabase/server";

export async function toggleFavorite(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const returnTo = safeNextPath(String(formData.get("returnTo") ?? "/"));
  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!isVehicleId(vehicleId)) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  if (formData.get("saved") === "1") {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("vehicle_id", vehicleId);
    refreshAccount(vehicleId);
    return;
  }

  const price = await publicPrice(vehicleId);
  if (price === null) {
    redirect(returnTo);
  }

  await supabase.from("favorites").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
    price_at_save: price,
  });
  refreshAccount(vehicleId);
}

export async function saveFavoriteNote(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const user = await requireAccount("/dashboard/merkliste");
  if (!isVehicleId(vehicleId)) {
    redirect("/dashboard/merkliste");
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 280);
  const { error } = await createClient().then((supabase) =>
    supabase
      .from("favorites")
      .update({ note: note || null })
      .eq("user_id", user.id)
      .eq("vehicle_id", vehicleId),
  );
  refreshAccount(vehicleId);
  redirect(error ? "/dashboard/merkliste?hinweis=notiz-fehler" : "/dashboard/merkliste?hinweis=notiz");
}

export async function toggleComparison(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const returnTo = safeNextPath(String(formData.get("returnTo") ?? "/"));
  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!isVehicleId(vehicleId)) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  if (formData.get("compared") === "1") {
    await supabase.from("comparisons").delete().eq("user_id", user.id).eq("vehicle_id", vehicleId);
    refreshAccount(vehicleId);
    return;
  }

  const { count } = await supabase
    .from("comparisons")
    .select("vehicle_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= 3) {
    redirect("/dashboard/vergleich?hinweis=voll");
  }

  const price = await publicPrice(vehicleId);
  if (price === null) {
    redirect(returnTo);
  }

  const { error } = await supabase.from("comparisons").insert({ user_id: user.id, vehicle_id: vehicleId });
  if (error) {
    redirect("/dashboard/vergleich?hinweis=voll");
  }
  refreshAccount(vehicleId);
}

export async function saveSearch(formData: FormData): Promise<void> {
  const user = await currentUser();
  const filters = parseFilters({
    brand: String(formData.get("brand") ?? ""),
    model: String(formData.get("model") ?? ""),
    type: String(formData.get("type") ?? ""),
    body: String(formData.get("body") ?? ""),
    price_min: String(formData.get("price_min") ?? ""),
    price_max: String(formData.get("price_max") ?? ""),
  });
  const returnTo = searchHref(filters);
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const requestedName = String(formData.get("name") ?? "").trim();
  const name = (requestedName || searchTitle(filters)).slice(0, 80);
  const supabase = await createClient();
  const { count } = await supabase
    .from("saved_searches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= searchLimit) {
    redirect("/dashboard/suchen?hinweis=voll");
  }

  const matches = await searchOffers(filters);
  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    name,
    filters,
    last_count: matches.length,
  });
  if (error) {
    redirect("/dashboard/suchen?hinweis=fehler");
  }

  refreshAccount();
  redirect("/dashboard/suchen");
}

export async function renameSearch(formData: FormData): Promise<void> {
  const user = await requireAccount("/dashboard/suchen");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!isVehicleId(id) || name.length === 0) {
    redirect("/dashboard/suchen?hinweis=name");
  }

  await createClient().then((supabase) =>
    supabase.from("saved_searches").update({ name }).eq("id", id).eq("user_id", user.id),
  );
  refreshAccount();
}

export async function deleteSearch(formData: FormData): Promise<void> {
  const user = await requireAccount("/dashboard/suchen");
  const id = String(formData.get("id") ?? "");
  if (isVehicleId(id)) {
    await createClient().then((supabase) => supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id));
  }
  refreshAccount();
}

export async function openSavedSearch(formData: FormData): Promise<void> {
  const user = await requireAccount("/dashboard/suchen");
  const id = String(formData.get("id") ?? "");
  if (!isVehicleId(id)) {
    redirect("/dashboard/suchen");
  }

  const supabase = await createClient();
  const { data } = await supabase.from("saved_searches").select("filters").eq("id", id).eq("user_id", user.id).maybeSingle();
  const filters = parseFilters({
    brand: readFilter(data?.filters, "brand"),
    model: readFilter(data?.filters, "model"),
    type: readFilter(data?.filters, "type"),
    body: readFilter(data?.filters, "body"),
    price_min: readFilter(data?.filters, "priceMin"),
    price_max: readFilter(data?.filters, "priceMax"),
  });
  const matches = await searchOffers(filters);
  await supabase.from("saved_searches").update({ last_count: matches.length }).eq("id", id).eq("user_id", user.id);
  refreshAccount();
  redirect(searchHref(filters));
}

export async function sendInquiry(
  _state: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!isVehicleId(vehicleId)) {
    return { error: "Dieses Inserat nimmt gerade keine Anfrage an." };
  }

  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/fahrzeug/${vehicleId}`)}`);
  }
  if (body.length < 10) {
    return { error: "Schreib mindestens einen kurzen Satz, mindestens 10 Zeichen." };
  }
  if (body.length > 2000) {
    return { error: "Die Nachricht darf höchstens 2.000 Zeichen haben." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("inquiries")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .eq("sender_id", user.id)
    .maybeSingle();
  if (existing && typeof existing.id === "string") {
    redirect(`/dashboard/anfragen/${existing.id}?hinweis=vorhanden`);
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("user_id, status, published_until")
    .eq("id", vehicleId)
    .maybeSingle();
  const ownerId = typeof vehicle?.user_id === "string" ? vehicle.user_id : "";
  const status = typeof vehicle?.status === "string" ? vehicle.status : "";
  const until = typeof vehicle?.published_until === "string" ? vehicle.published_until : null;
  if (!ownerId || !isPublicListing(status, until)) {
    return { error: "Dieses Inserat ist nicht mehr öffentlich." };
  }
  if (ownerId === user.id) {
    return { error: "Das ist dein eigenes Inserat." };
  }

  const { data: created, error } = await supabase
    .from("inquiries")
    .insert({ vehicle_id: vehicleId, sender_id: user.id, recipient_id: ownerId, body })
    .select("id")
    .single();
  if (error || !created) {
    return { error: "Die Anfrage konnte nicht gesendet werden." };
  }

  refreshAccount(vehicleId);
  redirect(`/dashboard/anfragen/${created.id}`);
}

export async function replyToInquiry(formData: FormData): Promise<void> {
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const user = await requireAccount(`/dashboard/anfragen/${inquiryId}`);
  if (!isVehicleId(inquiryId)) {
    redirect("/dashboard/anfragen");
  }
  if (body.length < 2 || body.length > 2000) {
    redirect(`/dashboard/anfragen/${inquiryId}?hinweis=kurz`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inquiry_replies").insert({
    inquiry_id: inquiryId,
    sender_id: user.id,
    body,
  });
  if (error) {
    redirect(`/dashboard/anfragen/${inquiryId}?hinweis=fehler`);
  }

  refreshAccount();
  redirect(`/dashboard/anfragen/${inquiryId}`);
}

export async function markInquiryRead(inquiryId: string, userId: string): Promise<void> {
  if (!isVehicleId(inquiryId)) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("inquiries")
    .update({ read_at: new Date().toISOString() })
    .eq("id", inquiryId)
    .eq("recipient_id", userId)
    .is("read_at", null);
}

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireAccount("/dashboard/profil");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (name.length < 2 || name.length > 80 || phone.length > 40 || city.length > 80) {
    redirect("/dashboard/profil?hinweis=ungueltig");
  }

  const { error } = await createClient().then((supabase) =>
    supabase.from("users").update({ name, phone: phone || null, city: city || null }).eq("id", user.id),
  );
  refreshAccount();
  redirect(error ? "/dashboard/profil?hinweis=fehler" : "/dashboard/profil?hinweis=gespeichert");
}

export async function clearRecentViews(formData: FormData): Promise<void> {
  if (formData.get("clear") !== "1") {
    return;
  }

  const user = await requireAccount("/dashboard/gesehen");
  await createClient().then((supabase) => supabase.from("recent_views").delete().eq("user_id", user.id));
  refreshAccount();
}

async function requireAccount(nextPath: string) {
  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

async function publicPrice(vehicleId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("price, status, published_until").eq("id", vehicleId).maybeSingle();
  const status = typeof data?.status === "string" ? data.status : "";
  const until = typeof data?.published_until === "string" ? data.published_until : null;
  if (!data || !isPublicListing(status, until)) {
    return null;
  }

  const price = typeof data.price === "number" ? data.price : Number(data.price);
  return Number.isFinite(price) ? price : null;
}

function readFilter(value: unknown, key: string): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const entry = (value as Record<string, unknown>)[key];
  return typeof entry === "number" || typeof entry === "string" ? String(entry) : "";
}

function refreshAccount(vehicleId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/merkliste");
  revalidatePath("/dashboard/suchen");
  revalidatePath("/dashboard/anfragen");
  revalidatePath("/dashboard/gesehen");
  revalidatePath("/dashboard/vergleich");
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/inserate");
  revalidatePath("/");
  revalidatePath("/suche");
  if (vehicleId) {
    revalidatePath(`/fahrzeug/${vehicleId}`);
  }
}
