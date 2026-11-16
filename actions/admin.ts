"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountBlocked } from "@/lib/account";
import { isVehicleId } from "@/lib/owned-listings";
import { isAdminRole } from "@/lib/roles";
import { isBusinessRole } from "@/lib/stripe";
import { storagePathFromPublicUrl } from "@/lib/vehicle-images";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

const restorable = new Set(["entwurf", "aktiv", "inaktiv", "verkauft"]);

export async function setDealerVerified(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const verified = formData.get("verified") === "ja";
  if (!isVehicleId(id)) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const { supabase } = await requireAdmin();
  const { data: dealer } = await supabase.from("users").select("role").eq("id", id).maybeSingle();
  if (!isBusinessRole(typeof dealer?.role === "string" ? dealer.role : null)) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const { error } = await supabase.from("users").update({ dealer_verified: verified }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/haendler");
  revalidatePath(`/haendler/${id}`);
  redirect(error ? "/admin?hinweis=nicht-moeglich" : "/admin?hinweis=haendler");
}

export async function setAccountBlocked(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const blocked = formData.get("blocked") === "ja";
  if (!isVehicleId(id)) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const { supabase, userId } = await requireAdmin();
  if (id === userId) {
    redirect("/admin?hinweis=eigenes-konto");
  }

  const { error } = await supabase
    .from("users")
    .update({ blocked_at: blocked ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  if (blocked) {
    const { data } = await supabase.from("vehicles").select("id, status").eq("user_id", id).in("status", ["aktiv", "inaktiv"]);
    for (const vehicle of data ?? []) {
      if (!vehicle || typeof vehicle.id !== "string" || typeof vehicle.status !== "string") {
        continue;
      }
      await supabase
        .from("vehicles")
        .update({ status: "gesperrt", status_before_block: vehicle.status })
        .eq("id", vehicle.id);
    }
  } else {
    const { data } = await supabase
      .from("vehicles")
      .select("id, status_before_block")
      .eq("user_id", id)
      .eq("status", "gesperrt");
    for (const vehicle of data ?? []) {
      if (!vehicle || typeof vehicle.id !== "string") {
        continue;
      }
      const previous = typeof vehicle.status_before_block === "string" && restorable.has(vehicle.status_before_block)
        ? vehicle.status_before_block
        : "entwurf";
      await supabase.from("vehicles").update({ status: previous, status_before_block: null }).eq("id", vehicle.id);
    }
  }

  refreshPublic();
  redirect(blocked ? "/admin?hinweis=konto-gesperrt" : "/admin?hinweis=konto-offen");
}

export async function setListingBlocked(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const blocked = formData.get("blocked") === "ja";
  if (!isVehicleId(id)) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const { supabase } = await requireAdmin();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("status, status_before_block, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!vehicle || typeof vehicle.status !== "string") {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const next = blocked
    ? { status: "gesperrt", status_before_block: vehicle.status === "gesperrt" ? vehicle.status_before_block : vehicle.status }
    : {
        status: typeof vehicle.status_before_block === "string" && restorable.has(vehicle.status_before_block)
          ? vehicle.status_before_block
          : "entwurf",
        status_before_block: null,
      };
  const { error } = await supabase.from("vehicles").update(next).eq("id", id);
  refreshPublic(id, typeof vehicle.user_id === "string" ? vehicle.user_id : null);
  redirect(error ? "/admin?hinweis=nicht-moeglich" : blocked ? "/admin?hinweis=inserat-gesperrt" : "/admin?hinweis=inserat-frei");
}

export async function deleteListingAsAdmin(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isVehicleId(id)) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const { supabase } = await requireAdmin();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("user_id, vehicle_images(url)")
    .eq("id", id)
    .maybeSingle();
  if (!vehicle || typeof vehicle.user_id !== "string") {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const urls = imageUrls(vehicle.vehicle_images);
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  await removeStoredImages(urls, vehicle.user_id);
  refreshPublic(id, vehicle.user_id);
  redirect("/admin?hinweis=geloescht");
}

async function requireAdmin(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string }> {
  if (!isSupabaseConfigured()) {
    redirect("/admin?hinweis=nicht-moeglich");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (await accountBlocked(user.id)) {
    redirect("/gesperrt");
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(typeof profile?.role === "string" ? profile.role : null)) {
    redirect("/");
  }

  return { supabase, userId: user.id };
}

function refreshPublic(vehicleId?: string, sellerId?: string | null): void {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/suche");
  revalidatePath("/haendler");
  if (vehicleId) {
    revalidatePath(`/fahrzeug/${vehicleId}`);
    revalidatePath(`/vorschau/${vehicleId}`);
  }
  if (sellerId) {
    revalidatePath(`/haendler/${sellerId}`);
  }
}

function imageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((image) => {
    if (!image || typeof image !== "object" || !("url" in image) || typeof image.url !== "string") {
      return [];
    }
    return [image.url];
  });
}

async function removeStoredImages(urls: string[], ownerId: string): Promise<void> {
  if (urls.length === 0 || !isServiceRoleConfigured()) {
    return;
  }

  const admin = createAdminClient();
  const { data: remaining } = await admin.from("vehicle_images").select("url").in("url", urls);
  const stillUsed = new Set<string>();
  if (Array.isArray(remaining)) {
    for (const row of remaining) {
      if (row && typeof row.url === "string") {
        stillUsed.add(row.url);
      }
    }
  }

  const paths = urls.flatMap((url) => {
    if (stillUsed.has(url)) {
      return [];
    }
    const path = storagePathFromPublicUrl(url, ownerId);
    return path ? [path] : [];
  });
  if (paths.length > 0) {
    await admin.storage.from("vehicle-images").remove(paths);
  }
}
