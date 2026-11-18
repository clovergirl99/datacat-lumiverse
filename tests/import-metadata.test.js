import assert from "node:assert/strict";
import test from "node:test";
import { cleanCreatorNotes, prepareImportCard } from "../src/import-metadata.js";

const sourceUrl = "https://janitorai.com/profiles/a609be16-1450-4dd4-b70c-cfd62cd68ec4";
const creator = { creator: { name: "Binaria01" } };
const importedAt = "2026-11-18T00:00:00.000Z";

for (const envelope of [false, true]) {
  test(`normalize ${envelope ? "V2 envelope" : "flat"} import without changing character content`, () => {
    const data = {
      name: "Example", creator: sourceUrl,
      creator_notes: "Author's notes\n[retrieved by https://datacat.run on 2026-10-29 09:58:21 UTC]",
      description: "Keep this prompt exactly.",
      extensions: { datacat: { characterId: "example-id" }, other: { keep: true } },
      tags: ["Fantasy"],
    };
    const input = envelope ? { spec: "chara_card_v2", spec_version: "2.0", data } : data;
    const before = structuredClone(input);
    const result = prepareImportCard(input, creator, importedAt);
    const updated = envelope ? result.data : result;
    assert.equal(updated.creator, "Binaria01");
    assert.equal(updated.creator_notes, "Author's notes\n");
    assert.equal(updated.description, data.description);
    assert.deepEqual(updated.tags, data.tags);
    assert.deepEqual(updated.extensions.other, { keep: true });
    assert.deepEqual(updated.extensions.datacat, { characterId: "example-id", creatorSourceUrl: sourceUrl, importedAt });
    if (envelope) assert.equal(result.spec, "chara_card_v2");
    assert.deepEqual(input, before, "the downloaded card must not be mutated");
  });
}

test("remove the escaped-colon retrieval stamp while preserving real creator notes", () => {
  const stamp = "[retrieved by https\\://datacat.run on 2026-10-29 09:58:21 UTC]";
  assert.equal(cleanCreatorNotes(`before ${stamp} after`), "before  after");
  assert.equal(cleanCreatorNotes(stamp), "");
  const notes = "Visit https://datacat.run. [retrieved by someone else] Keep [bracketed notes].";
  assert.equal(cleanCreatorNotes(notes), notes);
  assert.equal(cleanCreatorNotes(undefined), undefined);
});

test("retain an existing author name when discovery has no usable name", () => {
  assert.equal(prepareImportCard({ creator: "Original Author" }, {}, importedAt).creator, "Original Author");
  assert.equal(prepareImportCard({ creator: "Original Author" }, { creator: { name: sourceUrl } }, importedAt).creator, "Original Author");
});

test("do not put URLs or the unknown-creator placeholder in the Creator field", () => {
  const result = prepareImportCard({ creator: sourceUrl }, { creator: { name: "Unknown creator" } }, importedAt);
  assert.equal(result.creator, "");
  assert.equal(result.extensions.datacat.creatorSourceUrl, sourceUrl);
});

test("reject an invalid card before sending it to Lumiverse", () => {
  for (const card of [null, [], "invalid"]) {
    assert.throws(() => prepareImportCard(card, creator, importedAt), /invalid character card/);
  }
});
