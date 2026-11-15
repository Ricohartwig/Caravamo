import { getSupabaseEnv } from "@/utils/supabase/env";

const publicMarker = "/storage/v1/object/public/vehicle-images/";

export function publicImageUrl(path: string, userId: string): string | null {
  if (!isOwnImagePath(path, userId)) {
    return null;
  }

  const { url } = getSupabaseEnv();
  return `${url}${publicMarker}${path}`;
}

export function acceptOwnLogo(value: string, userId: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const path = storagePathFromPublicUrl(trimmed, userId);
  const expected = path ? publicImageUrl(path, userId) : null;
  if (!path || !expected) {
    return null;
  }

  try {
    const given = new URL(trimmed);
    const own = new URL(expected);
    if (given.origin !== own.origin || given.pathname !== own.pathname) {
      return null;
    }
    return own.toString();
  } catch {
    return null;
  }
}

export function storagePathFromPublicUrl(url: string, userId: string): string | null {
  const index = url.indexOf(publicMarker);
  if (index < 0) {
    return null;
  }

  const path = decodeURIComponent(url.slice(index + publicMarker.length).split("?")[0] ?? "");
  return isOwnImagePath(path, userId) ? path : null;
}

function isOwnImagePath(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..") && !path.includes("\\");
}
