export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const [, year, month, day] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
  );
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  return date;
}

export function formatLocalMonthKey(date: Date): string {
  return formatLocalDateKey(date).slice(0, 7);
}

export function getTodayLocalDateKey(): string {
  return formatLocalDateKey(new Date());
}

export function getYesterdayLocalDateKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDateKey(date);
}
