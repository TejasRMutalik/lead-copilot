// Normalizers for phone and email, used when saving a lead. Phase 7 adds the matching logic here.

// Digits only, keeping the last 10 (drops +91 and leading 0 for Indian numbers).
export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits.slice(-10) : null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const cleaned = (email ?? "").trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}
