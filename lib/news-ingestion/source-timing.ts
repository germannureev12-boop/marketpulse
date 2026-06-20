function toDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

export function getNextSyncAt(lastFetchedAt: Date | string | null, pollIntervalMinutes: number) {
  const normalizedDate = toDate(lastFetchedAt);

  if (!normalizedDate || Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  return new Date(normalizedDate.getTime() + Math.max(1, pollIntervalMinutes) * 60 * 1000);
}

export function shouldSyncSourceNow(
  lastFetchedAt: Date | string | null,
  pollIntervalMinutes: number,
  now = new Date()
) {
  const nextSyncAt = getNextSyncAt(lastFetchedAt, pollIntervalMinutes);
  if (!lastFetchedAt) {
    return true;
  }

  if (!nextSyncAt) {
    return true;
  }

  return now.getTime() >= nextSyncAt.getTime();
}
