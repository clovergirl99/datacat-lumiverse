import test from "node:test";
import assert from "node:assert/strict";
import { createWebsiteAccount } from "../src/website-account.js";

const KEY = "datacat.website_session";
const token = "example-session-value-for-tests-only";
const creatorId = "a609be16-1450-4dd4-b70c-cfd62cd68ec4";
function fixture(body = { success: true, valid: true, user: { username: "Angela" } }, status = 200) {
  const secrets = new Map(), calls = [];
  const api = {
    enclave: {
      get: async (key, user) => secrets.get(`${user}:${key}`),
      has: async (key, user) => secrets.has(`${user}:${key}`),
      put: async (key, value, user) => secrets.set(`${user}:${key}`, value),
      delete: async (key, user) => secrets.delete(`${user}:${key}`),
    },
    cors: async (url, options) => { calls.push({ url, options }); return { status, body: JSON.stringify(body) }; },
  };
  return { run: createWebsiteAccount(api), api, calls, secrets };
}

test("verify a transferred session and keep it in user-scoped enclave storage only", async () => {
  const f = fixture();
  const result = await f.run({ action: "connect", token }, "alice");
  assert.deepEqual(result, { connected: true, name: "Angela" });
  assert.equal(f.secrets.get(`alice:${KEY}`), token);
  assert.equal(JSON.stringify(result).includes(token), false);
  assert.equal(f.calls[0].url, "https://datacat.run/api/auth/verify");
  assert.equal(JSON.parse(f.calls[0].options.body).token, token);
  assert.deepEqual(await f.run({ action: "status" }, "bob"), { connected: false });
  await assert.rejects(f.run({ action: "collections" }, "bob"), { code: "WEBSITE_SESSION_REQUIRED" });
});

test("invalid replacement keeps the saved website session and linked client token", async () => {
  const f = fixture({ success: false, valid: false }, 401);
  f.secrets.set(`alice:${KEY}`, "previous-session");
  f.secrets.set("alice:datacat.access_token", "linked-client-token");
  await assert.rejects(f.run({ action: "connect", token }, "alice"), { code: "WEBSITE_SESSION_REJECTED" });
  assert.equal(f.secrets.get(`alice:${KEY}`), "previous-session");
  assert.equal(f.secrets.get("alice:datacat.access_token"), "linked-client-token");
});

test("use the authenticated, paged following route and normalize creator refs", async () => {
  const f = fixture({ success: true, list: [{ creatorId, userName: "Binaria01", charCount: 62 }], total: 25 });
  f.secrets.set(`alice:${KEY}`, token);
  const result = await f.run({ action: "following", source: "saucepan", offset: 24 }, "alice");
  const url = new URL(f.calls[0].url);
  assert.equal(url.pathname, "/api/creators/following");
  assert.equal(url.searchParams.get("sourceKind"), "saucepan");
  assert.equal(url.searchParams.get("offset"), "24");
  assert.equal(f.calls[0].options.headers["X-Session-Token"], token);
  assert.deepEqual(result.rows, [{ ref: `saucepan:${creatorId}`, name: "Binaria01", characterCount: 62 }]);
  assert.equal(result.hasMore, false);
  assert.equal(result.nextOffset, 25);
});

test("load private collections and their contents using the selected folder", async () => {
  const f = fixture({ success: true, folders: [{ id: 7, title: "Favorites", itemCount: 2, visibility: "private" }] });
  f.secrets.set(`alice:${KEY}`, token);
  assert.deepEqual((await f.run({ action: "collections" }, "alice")).rows, [{ id: 7, name: "Favorites", description: "", count: 2, visibility: "Private" }]);
  f.api.cors = async (url, options) => {
    f.calls.push({ url, options });
    return { status: 200, body: JSON.stringify({ success: true, characters: [{ characterId: creatorId, name: "Example", creatorName: "Binaria01", sourceKind: "janitor_core" }], hasMore: false }) };
  };
  const result = await f.run({ action: "collection-items", folderId: 7 }, "alice");
  const url = new URL(f.calls.at(-1).url);
  assert.equal(url.searchParams.get("folderId"), "7");
  assert.equal(url.searchParams.get("collectionSection"), "collected");
  assert.equal(result.rows[0].creatorName, "Binaria01");
  assert.equal(result.rows[0].id, creatorId);
});

test("reject arbitrary URLs, invalid sources, folder ids and paging before network access", async () => {
  const f = fixture();
  for (const input of [
    { action: "https://example.com/steal" },
    { action: "following", source: "https://example.com" },
    { action: "following", source: "janitor", offset: -1 },
    { action: "collection-items", folderId: "7&user=other" },
    { action: "connect", token: "dcv1_wrong-kind-of-token" },
  ]) await assert.rejects(f.run(input, "alice"));
  assert.equal(f.calls.length, 0);
});

test("collection tile previews request four cards and use only secure image URLs", async () => {
  const f = fixture({ success: true, characters: [
    { id: creatorId, name: "Example", avatarDisplayUrl: "https://media.datacat.run/example.webp" },
    { id: "11111111-1111-4111-8111-111111111111", name: "Unsafe image", avatar: "javascript:alert(1)" },
  ] });
  f.secrets.set(`alice:${KEY}`, token);
  const result = await f.run({ action: "collection-items", folderId: 7, preview: true }, "alice");
  assert.equal(new URL(f.calls[0].url).searchParams.get("limit"), "4");
  assert.equal(result.rows[0].avatarUrl, "https://media.datacat.run/example.webp");
  assert.equal(result.rows[1].avatarUrl, "");
});

test("do not surface server or network errors that could contain session credentials", async () => {
  const f = fixture({ success: false, message: token }, 500);
  f.secrets.set(`alice:${KEY}`, token);
  await assert.rejects(f.run({ action: "collections" }, "alice"), e => !e.message.includes(token));
  f.api.cors = async () => { throw new Error(`request failed with header ${token}`); };
  await assert.rejects(f.run({ action: "collections" }, "alice"), { code: "WEBSITE_NETWORK_ERROR" });
  assert.equal(f.secrets.get(`alice:${KEY}`), token);
});

test("reject malformed API responses instead of showing an empty list", async () => {
  const f = fixture({ success: true });
  f.secrets.set(`alice:${KEY}`, token);
  await assert.rejects(f.run({ action: "collections" }, "alice"), { code: "WEBSITE_RESPONSE_ERROR" });
});

test("remove only this user's transferred session, without logging out DataCat or disconnecting the catalog", async () => {
  const f = fixture();
  f.secrets.set(`alice:${KEY}`, token);
  f.secrets.set(`bob:${KEY}`, "bob-session");
  f.secrets.set("alice:datacat.access_token", "linked-client-token");
  assert.deepEqual(await f.run({ action: "disconnect" }, "alice"), { connected: false });
  assert.equal(f.secrets.has(`alice:${KEY}`), false);
  assert.equal(f.secrets.get(`bob:${KEY}`), "bob-session");
  assert.equal(f.secrets.get("alice:datacat.access_token"), "linked-client-token");
  assert.equal(f.calls.length, 0);
});
