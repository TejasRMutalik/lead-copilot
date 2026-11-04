// Builds a wa.me link that opens WhatsApp with the message prefilled.

// WhatsApp wants country code + number. Assume India for 10-digit numbers.
export function whatsappUrl(phoneNorm: string | null, text: string): string | null {
  if (!phoneNorm) return null;
  const number = phoneNorm.length === 10 ? `91${phoneNorm}` : phoneNorm;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
