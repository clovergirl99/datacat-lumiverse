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
      const target = { dataset: { accountRow: value }, closest() { return this; }, hasAttribute: attr => attr === attribute };
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
