import { isBusinessRole } from "@/lib/stripe";

export function isAdminRole(role: string | null | undefined): boolean {
  return role?.trim().toLowerCase() === "admin";
}

export function accountRoleLabel(role: string | null | undefined): "Admin" | "Händler" | "Privat" {
  if (isAdminRole(role)) {
    return "Admin";
  }

  return isBusinessRole(role) ? "Händler" : "Privat";
}
