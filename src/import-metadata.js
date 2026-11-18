function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function creatorName(value) {
  if (typeof value !== "string") return "";
  const name = value.trim();
  return name && !/^(?:https?:|www\.|\/\/)/i.test(name) &&
    !/^unknown(?: creator)?$/i.test(name) ? name : "";
}

export function importCreatorName(character) {
  return creatorName(character?.creator?.name) || creatorName(character?.creatorName);
}

export function cleanCreatorNotes(notes) {
  if (typeof notes !== "string") return notes;
  // Remove only DataCat's retrieval attribution, including Markdown's escaped colon.
  const stamp = /\[retrieved by https\\?:\/\/datacat\.run on \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\]/gi;
  return notes.replace(stamp, "");
}

export function prepareImportCard(card, character, importedAt) {
  if (!record(card)) throw new Error("DataCat returned an invalid character card.");
  const result = { ...card };
  // Support flat cards and Character Card V2/V3 data envelopes.
  const data = record(card.data) ? { ...card.data } : result;
  if (data !== result) result.data = data;
  const originalCreator = typeof data.creator === "string" ? data.creator.trim() : "";
  data.creator = importCreatorName(character) || creatorName(originalCreator);
  if (typeof data.creator_notes === "string") {
    data.creator_notes = cleanCreatorNotes(data.creator_notes);
  }
  const extensions = record(data.extensions) || {};
  data.extensions = {
    ...extensions,
    datacat: {
      ...(record(extensions.datacat) || {}),
      // Keep source attribution as metadata instead of displaying a URL as a name.
      ...(/^https?:\/\//i.test(originalCreator) ? { creatorSourceUrl: originalCreator } : {}),
      importedAt,
    },
  };
  return result;
}
