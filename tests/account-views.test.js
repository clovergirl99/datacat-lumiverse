import test from "node:test";
import assert from "node:assert/strict";
import { mountAccountViews } from "../src/account-views.js";

const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture(request) {
  // Only the host boundary is mocked; exercise the real view's loading,
  // pagination, click handlers, refresh and request cancellation.
  const listeners = new Map();
  const results = { innerHTML: "" };
  const host = {
    innerHTML: "", contains: () => true,
    querySelector: selector => selector === "[data-account-results]" ? results : null,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: type => listeners.delete(type),
    replaceChildren() { this.innerHTML = ""; results.innerHTML = ""; },
  };
  const opened = [];
  const view = mountAccountViews({ host, request, onCreator: ref => opened.push(ref), onCharacter: row => opened.push(row) });
  return {
    view, host, results, opened,
    async click(attribute, value = "") {
      const target = { dataset: { accountRow: value, accountRemove: value }, closest() { return this; }, hasAttribute: attr => attr === attribute };
      await listeners.get("click")({ target, stopPropagation() {} });
    },
  };
}

test("Library loads saved website cards, opens a card instead of treating it as a folder, and pages", async () => {
  const calls = [];
  const f = fixture(async input => {
    calls.push(input);
    if (input.action === "status") return { connected: true };
    return input.offset === 24
      ? { rows: [{ id: "second", name: "Second card" }], hasMore: false, nextOffset: 25 }
      : { rows: [{ id: "first", name: "Added via link", creatorName: "Creator" }], hasMore: true, nextOffset: 24 };
  });
  f.view.show("library"); await settle();
  assert.deepEqual(calls.map(call => call.action), ["status", "library"]);
  assert.match(f.host.innerHTML, /DataCat library/);
  assert.match(f.results.innerHTML, /Added via link/);
  await f.click("data-account-row", "0");
  assert.equal(f.opened[0].id, "first");
  assert.equal(calls.length, 2);
  await f.click("data-account-more");
  assert.equal(calls.at(-1).action, "library");
  assert.equal(calls.at(-1).offset, 24);
  assert.match(f.results.innerHTML, /Added via link/);
  assert.match(f.results.innerHTML, /Second card/);
  f.view.destroy();
});

test("refresh and returning to Library reload characters added on the website", async () => {
  let generation = 0;
  const f = fixture(async input => input.action === "status" ? { connected: true } : { rows: [{ id: String(++generation), name: `Card ${generation}` }] });
  f.view.show("library"); await settle();
  f.view.show("library", true); await settle();
  assert.match(f.results.innerHTML, /Card 2/);
  assert.doesNotMatch(f.results.innerHTML, /Card 1/);
  f.view.hide();
  f.view.show("library"); await settle();
  assert.match(f.results.innerHTML, /Card 3/);
  f.view.destroy();
});

test("an older Library request cannot overwrite the view after switching to Shelf", async () => {
  let finishLibrary;
  const f = fixture(async input => {
    if (input.action === "status") return { connected: true };
    if (input.action === "library") return new Promise(resolve => { finishLibrary = resolve; });
    return { rows: [] };
  });
  f.view.show("library"); await settle();
  f.view.show("collections"); await settle();
  finishLibrary({ rows: [{ id: "old", name: "Stale card" }] }); await settle();
  assert.match(f.results.innerHTML, /Collections/);
  assert.doesNotMatch(f.results.innerHTML, /Stale card/);
  f.view.destroy();
});

test("a failed website request shows an error, not a false empty-library result, and can retry", async () => {
  let fail = true;
  const f = fixture(async input => {
    if (input.action === "status") return { connected: true };
    if (fail) throw Error("Could not load library");
    return { rows: [{ id: "retry", name: "Recovered card" }] };
  });
  f.view.show("library"); await settle();
  assert.match(f.host.innerHTML, /Could not load library/);
  assert.doesNotMatch(f.results.innerHTML, /library is empty/);
  fail = false;
  await f.click("data-account-retry");
  assert.match(f.results.innerHTML, /Recovered card/);
  f.view.destroy();
});

const charA = "11111111-1111-4111-8111-111111111111";
const charB = "22222222-2222-4222-8222-222222222222";
async function collectionFixture(remove = async input => ({ removed: true, folderId: input.folderId, characterId: input.characterId })) {
  const calls = [];
  const f = fixture(async input => {
    calls.push(input);
    if (input.action === "status") return { connected: true };
    if (input.action === "collections") return { rows: [{ id: 7, name: "Favorites", count: 25 }] };
    if (input.action === "following") return { rows: [] };
    if (input.action === "remove-collection-item") return remove(input);
    if (input.preview) return { rows: [] };
    return input.offset === 23
      ? { rows: [{ id: "next", name: "Next page" }], nextOffset: 24, hasMore: false }
      : { rows: [{ id: charA, name: 'Alex <one>' }, { id: charB, name: 'Alex <two>' }], nextOffset: 24, hasMore: true };
  });
  f.view.show("collections"); await settle();
  await f.click("data-account-row", "0");
  return { ...f, calls };
}

test("collection removal requires confirmation and Cancel leaves the website untouched", async () => {
  const f = await collectionFixture();
  assert.match(f.results.innerHTML, /data-account-remove=/);
  await f.click("data-account-remove", "0");
  assert.match(f.results.innerHTML, /Alex &lt;one&gt;/);
  assert.match(f.results.innerHTML, /stays in your DataCat library/);
  assert.equal(f.opened.length, 0, "Remove must not open the card");
  assert.equal(f.calls.filter(call => call.action === "remove-collection-item").length, 0);
  await f.click("data-account-remove-cancel");
  assert.doesNotMatch(f.results.innerHTML, /data-account-remove-confirm/);
  assert.equal(f.calls.filter(call => call.action === "remove-collection-item").length, 0);
  f.view.destroy();
});

test("confirmed removal targets only the selected ID, keeps other cards, and adjusts pagination", async () => {
  const f = await collectionFixture();
  await f.click("data-account-remove", "0");
  await f.click("data-account-remove-confirm");
  assert.deepEqual(f.calls.find(call => call.action === "remove-collection-item"), { action: "remove-collection-item", folderId: 7, characterId: charA });
  assert.doesNotMatch(f.results.innerHTML, /Alex &lt;one&gt;/);
  assert.match(f.results.innerHTML, /Alex &lt;two&gt;/);
  assert.match(f.host.innerHTML, /Removed from this collection/);
  await f.click("data-account-more");
  assert.equal(f.calls.at(-1).offset, 23);
  assert.match(f.results.innerHTML, /Next page/);
  f.view.destroy();
});

test("failed removal keeps the card and confirmation available for retry", async () => {
  let fail = true;
  const f = await collectionFixture(async input => {
    if (fail) throw Error("Removal failed");
    return { removed: true, folderId: input.folderId, characterId: input.characterId };
  });
  await f.click("data-account-remove", "0");
  await f.click("data-account-remove-confirm");
  assert.match(f.results.innerHTML, /Removal failed/);
  assert.match(f.results.innerHTML, /Alex &lt;one&gt;/);
  fail = false;
  await f.click("data-account-remove-confirm");
  assert.doesNotMatch(f.results.innerHTML, /Alex &lt;one&gt;/);
  f.view.destroy();
});

test("double confirmation sends one request and a late completion cannot replace Shelf", async () => {
  let resolve;
  const f = await collectionFixture(() => new Promise(yes => { resolve = yes; }));
  await f.click("data-account-remove", "0");
  const pending = f.click("data-account-remove-confirm");
  await f.click("data-account-remove-confirm");
  assert.equal(f.calls.filter(call => call.action === "remove-collection-item").length, 1);
  await f.click("data-account-back");
  resolve({ removed: true, folderId: 7, characterId: charA });
  await pending;
  assert.match(f.results.innerHTML, /Collections/);
  assert.doesNotMatch(f.results.innerHTML, /Alex &lt;one&gt;/);
  f.view.destroy();
});

test("Library has no collection-removal controls", async () => {
  const f = fixture(async input => input.action === "status" ? { connected: true } : { rows: [{ id: charA, name: "Library card" }] });
  f.view.show("library"); await settle();
  assert.doesNotMatch(f.results.innerHTML, /data-account-remove/);
  f.view.destroy();
});
