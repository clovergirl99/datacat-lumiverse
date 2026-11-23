import assert from "node:assert/strict";
import test from "node:test";
import { loadBlockedTags, saveBlockedTags } from "../src/tag-preferences.js";

function storage() {
  const values = new Map();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("blocked tags survive a new app session without browser session state", () => {
  const disk = storage();
  const selected = new Map([[12, "Fantasy"], [83, "Horror"]]);
  assert.equal(saveBlockedTags(selected, disk), true);
  const restored = loadBlockedTags(undefined, disk);
  assert.deepEqual([...restored], [...selected]);
  assert.equal(new URLSearchParams({ blockedTagIds: [...restored.keys()].join(",") }).get("blockedTagIds"), "12,83");
});

test("existing session blocks migrate once, and persistent choices win thereafter", () => {
  const disk = storage();
  assert.deepEqual([...loadBlockedTags([[12, "Fantasy"]], disk)], [[12, "Fantasy"]]);
  assert.deepEqual([...loadBlockedTags([[83, "Stale session"]], disk)], [[12, "Fantasy"]]);
});

test("unblocking a tag is saved, and clearing all never resurrects stale session blocks", () => {
  const disk = storage();
  saveBlockedTags(new Map([[12, "Fantasy"], [83, "Horror"]]), disk);
  const tags = loadBlockedTags(undefined, disk);
  tags.delete(12);
  saveBlockedTags(tags, disk);
  assert.deepEqual([...loadBlockedTags(undefined, disk)], [[83, "Horror"]]);
  saveBlockedTags(new Map(), disk);
  assert.deepEqual([...loadBlockedTags([[12, "Stale session"]], disk)], []);
});

test("malformed entries are excluded from migrated and saved tag lists", () => {
  const disk = storage();
  const entries = [[12, "Valid"], [0, "Bad"], [-1, "Bad"], [1.5, "Bad"], ["8", "Bad"], [9, null], null, [12, "Updated"]];
  assert.deepEqual([...loadBlockedTags(entries, disk)], [[12, "Updated"]]);
  assert.deepEqual([...loadBlockedTags(undefined, disk)], [[12, "Updated"]]);
});

test("malformed storage falls back to a valid session selection", () => {
  const disk = storage();
  disk.values.set("datacat_client_v1:blocked_tags", "invalid JSON");
  assert.deepEqual([...loadBlockedTags([[12, "Fantasy"]], disk)], [[12, "Fantasy"]]);
  assert.deepEqual([...loadBlockedTags(undefined, disk)], [[12, "Fantasy"]]);
});

test("unavailable device storage does not prevent blocking in the current session", () => {
  const unavailable = { getItem() { throw Error("unavailable"); }, setItem() { throw Error("unavailable"); } };
  assert.deepEqual([...loadBlockedTags([[12, "Fantasy"]], unavailable)], [[12, "Fantasy"]]);
  assert.equal(saveBlockedTags(new Map([[12, "Fantasy"]]), unavailable), false);
});
