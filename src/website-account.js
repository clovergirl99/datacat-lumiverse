const ORIGIN = "https://datacat.run";
const KEY = "datacat.website_session";
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function fail(code, message) { return Object.assign(new Error(message), { code, publicWebsiteError: true }); }
function offset(value) {
  const n = Number(value ?? 0);
  if (!Number.isSafeInteger(n) || n < 0 || n > 1_000_000) throw fail("INVALID_REQUEST", "Invalid page.");
  return n;
}
function text(value, max = 500) { return typeof value === "string" ? value.slice(0, max) : ""; }
function avatarUrl(row) {
  for (const value of [row.avatarDisplayUrl, row.avatar_display_url, row.avatarUrl, row.avatar_url, row.avatarVariantUrls?.card, row.avatar_variant_urls?.card, row.avatarSelfArchiveUrl, row.avatar_self_archive_url, row.avatar]) {
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value, ORIGIN);
      if (url.protocol === "https:" && (value.startsWith("https://") || value.startsWith("/"))) return url.href;
    } catch (_) {}
  }
  return "";
}

export function createWebsiteAccount(api) {
  async function read(path, userId, candidate, method = "GET") {
    const token = candidate || await api.enclave.get(KEY, userId);
    if (!token) throw fail("WEBSITE_SESSION_REQUIRED", "Transfer your existing DataCat website session once to load these lists.");
    let response;
    try {
      response = await api.cors(`${ORIGIN}${path}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Session-Token": token },
        ...(method === "POST" ? { body: JSON.stringify({ token }) } : {}),
      });
    } catch (_) {
      throw fail("WEBSITE_NETWORK_ERROR", "Could not reach DataCat. Your saved connection has been kept. Try again.");
    }
    let body;
    try { body = JSON.parse(response.body); } catch (_) {
      throw fail("WEBSITE_RESPONSE_ERROR", "DataCat returned an unreadable response. Try again later.");
    }
    if ([401, 403].includes(Number(response.status)) || (path === "/api/auth/verify" && (!body.valid || !body.user))) {
      // Keep the scoped Client API connection entirely separate. Do not erase
      // even the website credential for a transient challenge or permissions error.
      throw fail("WEBSITE_SESSION_REJECTED", "DataCat did not accept this website session. Check that it is still active and belongs to a signed-in account.");
    }
    if (Number(response.status) < 200 || Number(response.status) >= 300 || body.success !== true) {
      throw fail("WEBSITE_REQUEST_FAILED", Number(response.status) === 429 ? "DataCat is rate limiting requests. Try again shortly." : "DataCat could not load this account data. Try again later.");
    }
    return body;
  }

  return async function websiteAccount(input, userId) {
    const action = String(input?.action || "");
    if (action === "status") return { connected: await api.enclave.has(KEY, userId) };
    if (action === "disconnect") {
      await api.enclave.delete(KEY, userId);
      return { connected: false };
    }
    if (action === "connect") {
      const token = String(input.token || "").trim();
      if (token.length < 16 || token.length > 16_000 || /[^\x21-\x7e]/.test(token) || /^dcv1_/i.test(token)) {
        throw fail("INVALID_WEBSITE_SESSION", "Paste the website session value, not a Client API token or a password.");
      }
      const body = await read("/api/auth/verify", userId, token, "POST");
      await api.enclave.put(KEY, token, userId);
      return { connected: true, name: text(body.user.displayName || body.user.username || "DataCat account", 120) };
    }
    if (action === "following") {
      const source = input.source === "saucepan" ? "saucepan" : input.source === "janitor" ? "janitor" : null;
      if (!source) throw fail("INVALID_REQUEST", "Unknown creator source.");
      const start = offset(input.offset);
      const body = await read(`/api/creators/following?limit=24&offset=${start}&sourceKind=${source}&sortBy=total_chats&sortDir=desc&tagsLimit=0`, userId);
      if (!Array.isArray(body.list)) throw fail("WEBSITE_RESPONSE_ERROR", "DataCat did not return a creator list.");
      const rows = body.list.map(row => {
        const id = text(row.creatorId || row.id || row.ref, 100);
        const bare = id.replace(/^saucepan:/, "");
        return {
          ref: UUID.test(bare) ? (source === "saucepan" ? `saucepan:${bare}` : bare) : "",
          name: text(row.userName || row.name || row.creatorName || "Unknown creator", 240),
          characterCount: Number(row.charCount) || 0,
        };
      });
      const total = Number.isFinite(Number(body.total)) ? Number(body.total) : null;
      return { rows, hasMore: body.list.length === 24 && (total === null || start + body.list.length < total), nextOffset: start + body.list.length, total };
    }
    if (action === "collections") {
      const body = await read("/api/user-folders", userId);
      if (!Array.isArray(body.folders)) throw fail("WEBSITE_RESPONSE_ERROR", "DataCat did not return a collection list.");
      return { rows: body.folders.filter(row => Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0).map(row => ({
        id: Number(row.id), name: text(row.title || "Untitled collection", 240),
        description: text(row.description, 1500), count: Number(row.itemCount ?? row.membershipCount) || 0,
        visibility: row.visibility === "published" ? "Published" : "Private",
      })) };
    }
    if (action === "collection-items") {
      const folder = Number(input.folderId);
      if (!Number.isSafeInteger(folder) || folder <= 0) throw fail("INVALID_REQUEST", "Invalid collection.");
      const start = offset(input.offset);
      const limit = input.preview === true ? 4 : 24;
      const body = await read(`/api/characters?limit=${limit}&offset=${start}&skipCount=1&collectionSection=collected&folderId=${folder}`, userId);
      if (!Array.isArray(body.characters)) throw fail("WEBSITE_RESPONSE_ERROR", "DataCat did not return collection contents.");
      const rows = body.characters.map(row => ({
        id: text(row.characterId || row.character_id || row.id, 100),
        name: text(row.name || row.chat_name || row.chatName || "Unnamed character", 240),
        creatorName: text(row.creatorName || row.creator_name || (typeof row.creator === "string" ? row.creator : row.creator?.name), 240),
        sourceKind: text(row.characterSourceKind || row.primaryContentSourceKind || row.sourceKind, 50),
        avatarUrl: avatarUrl(row),
      })).filter(row => UUID.test(row.id));
      return { rows, nextOffset: start + body.characters.length, hasMore: body.hasMore ?? body.paging?.hasMore ?? body.characters.length === limit };
    }
    throw fail("INVALID_REQUEST", "Unknown account operation.");
  };
}
