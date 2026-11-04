// Date helpers for business logic. "Today" always means today in Asia/Kolkata (IST, UTC+5:30, no DST).

const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date in IST as "YYYY-MM-DD".
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// The instant when the IST day containing `now` began (00:00 IST).
export function startOfDayIST(now: Date = new Date()): Date {
  const midnightAsUtc = Date.parse(`${todayIST(now)}T00:00:00Z`);
  return new Date(midnightAsUtc - IST_OFFSET_MS);
}

// Start of the IST day that is `days` days after the IST day containing `now`.
export function addDaysIST(days: number, now: Date = new Date()): Date {
  return new Date(startOfDayIST(now).getTime() + days * DAY_MS);
}

// Whole IST calendar days from today to `date`: 0 = today, 1 = tomorrow, -2 = two days ago.
export function dayDiffIST(date: Date | string, now: Date = new Date()): number {
  const target = typeof date === "string" ? new Date(date) : date;
  return Math.round((startOfDayIST(target).getTime() - startOfDayIST(now).getTime()) / DAY_MS);
}

// Human text like "today", "tomorrow", "3 days ago", "in 2 days", compared by IST calendar day.
export function formatRelativeIST(date: Date | string, now: Date = new Date()): string {
  const diffDays = dayDiffIST(date, now);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  return diffDays > 0 ? `in ${diffDays} days` : `${-diffDays} days ago`;
}

// Short day label in IST, like "4 Nov".
export function formatDayIST(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(date));
}

// Weekday name in IST, like "Saturday". Passed to prompts so the model can work out "this Saturday".
export function weekdayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(now);
}

// Follow-up time: 10:00 IST, `days` IST calendar days from today.
export function followUpAtIST(days: number, now: Date = new Date()): Date {
  return new Date(addDaysIST(days, now).getTime() + 10 * 60 * 60 * 1000);
}
