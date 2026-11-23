const BLOCKED_TAGS_KEY = "datacat_client_v1:blocked_tags";

function normalizeBlockedTags(entries) {
  return new Map(Array.isArray(entries) ? entries.filter(entry =>
    Array.isArray(entry) && Number.isSafeInteger(entry[0]) && entry[0] > 0 &&
    typeof entry[1] === "string",
  ).map(([id, name]) => [id, name]) : []);
}

export function saveBlockedTags(tags, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(BLOCKED_TAGS_KEY, JSON.stringify({
      schema: 1,
      tags: [...normalizeBlockedTags([...tags])],
    }));
    return true;
  } catch (_) {
    return false;
  }
}

export function loadBlockedTags(legacyEntries, storage) {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(BLOCKED_TAGS_KEY));
    if (saved?.schema === 1 && Array.isArray(saved.tags)) {
      // A saved empty list is authoritative, even if the session has stale tags.
      return normalizeBlockedTags(saved.tags);
    }
  } catch (_) {}
  // Carry over selections from versions that only used sessionStorage.
  const migrated = normalizeBlockedTags(legacyEntries);
  saveBlockedTags(migrated, storage);
  return migrated;
}
