export function journalHasContent(journal) {
  if (!journal) return false;
  if (journal.achievements?.trim()) return true;
  const groups = ['gratitude', 'reflection', 'manifestation'];
  return groups.some((group) =>
    Object.values(journal[group] || {}).some((value) => typeof value === 'string' && value.trim()),
  );
}

export function gratitudeHasContent(journal) {
  if (!journal?.gratitude) return false;
  return Object.values(journal.gratitude).some((value) => typeof value === 'string' && value.trim());
}

export function manifestationHasContent(journal) {
  if (!journal?.manifestation) return false;
  return Object.values(journal.manifestation).some((value) => typeof value === 'string' && value.trim());
}

export function reflectionHasContent(journal) {
  if (!journal?.reflection) return false;
  return Object.values(journal.reflection).some((value) => typeof value === 'string' && value.trim());
}
