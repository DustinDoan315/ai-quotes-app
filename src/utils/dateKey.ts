export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
