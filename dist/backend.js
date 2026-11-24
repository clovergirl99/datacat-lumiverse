// @bun
// src/uuidv7.js
var lastTimestamp = -1;
var sequence = 0;
function fillRandomBytes(bytes) {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.getRandomValues === "function") {
    try {
      cryptoApi.getRandomValues(bytes);
      return;
    } catch (_) {}
  }
  for (let index = 0;index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
}
function uuidv7() {
  let timestamp = Math.max(0, Math.floor(Date.now()));
  if (timestamp > lastTimestamp) {
    lastTimestamp = timestamp;
    sequence = 0;
  } else {
    timestamp = lastTimestamp;
    sequence += 1;
    if (sequence > 4095) {
      lastTimestamp += 1;
      timestamp = lastTimestamp;
      sequence = 0;
    }
  }
  const bytes = new Uint8Array(16);
  fillRandomBytes(bytes);
  bytes[0] = Math.floor(timestamp / 1099511627776) & 255;
  bytes[1] = Math.floor(timestamp / 4294967296) & 255;
  bytes[2] = Math.floor(timestamp / 16777216) & 255;
  bytes[3] = Math.floor(timestamp / 65536) & 255;
  bytes[4] = Math.floor(timestamp / 256) & 255;
  bytes[5] = timestamp & 255;
  bytes[6] = 112 | sequence >> 8 & 15;
  bytes[7] = sequence & 255;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

// src/website-account.js
var ORIGIN = "https://datacat.run";
var KEY = "datacat.website_session";
var UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function fail(code, message) {
  return Object.assign(new Error(message), { code, publicWebsiteError: true });
}
function offset(value) {
  const n = Number(value ?? 0);
  if (!Number.isSafeInteger(n) || n < 0 || n > 1e6)
    throw fail("INVALID_REQUEST", "Invalid page.");
  return n;
}
function text(value, max = 500) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
function avatarUrl(row) {
  for (const value of [row.avatarDisplayUrl, row.avatar_display_url, row.avatarUrl, row.avatar_url, row.avatarVariantUrls?.card, row.avatar_variant_urls?.card, row.avatarSelfArchiveUrl, row.avatar_self_archive_url, row.avatar]) {
    if (typeof value !== "string")
      continue;
    try {
      const url = new URL(value, ORIGIN);
      if (url.protocol === "https:" && (value.startsWith("https://") || value.startsWith("/")))
        return url.href;
    } catch (_) {}
  }
  return "";
}
function createWebsiteAccount(api) {
  async function read(path, userId, candidate, method = "GET") {
    const token = candidate || await api.enclave.get(KEY, userId);
    if (!token)
      throw fail("WEBSITE_SESSION_REQUIRED", "Transfer your existing DataCat website session once to load these lists.");
    let response;
    try {
      response = await api.cors(`${ORIGIN}${path}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Session-Token": token },
        ...method === "POST" ? { body: JSON.stringify({ token }) } : {}
      });
    } catch (_) {
      throw fail("WEBSITE_NETWORK_ERROR", "Could not reach DataCat. Your saved connection has been kept. Try again.");
    }
    let body;
    try {
      body = JSON.parse(response.body);
    } catch (_) {
      throw fail("WEBSITE_RESPONSE_ERROR", "DataCat returned an unreadable response. Try again later.");
    }
    if ([401, 403].includes(Number(response.status)) || path === "/api/auth/verify" && (!body.valid || !body.user)) {
      throw fail("WEBSITE_SESSION_REJECTED", "DataCat did not accept this website session. Check that it is still active and belongs to a signed-in account.");
    }
    if (Number(response.status) < 200 || Number(response.status) >= 300 || body.success !== true) {
      throw fail("WEBSITE_REQUEST_FAILED", Number(response.status) === 429 ? "DataCat is rate limiting requests. Try again shortly." : "DataCat could not load this account data. Try again later.");
    }
    return body;
  }
  return async function websiteAccount(input, userId) {
    const action = String(input?.action || "");
    if (action === "status")
      return { connected: await api.enclave.has(KEY, userId) };
    if (action === "disconnect") {
      await api.enclave.delete(KEY, userId);
      return { connected: false };
    }
    if (action === "connect") {
      const token = String(input.token || "").trim();
      if (token.length < 16 || token.length > 16000 || /[^\x21-\x7e]/.test(token) || /^dcv1_/i.test(token)) {
        throw fail("INVALID_WEBSITE_SESSION", "Paste the website session value, not a Client API token or a password.");
      }
      const body = await read("/api/auth/verify", userId, token, "POST");
      await api.enclave.put(KEY, token, userId);
      return { connected: true, name: text(body.user.displayName || body.user.username || "DataCat account", 120) };
    }
    if (action === "following") {
      const source = input.source === "saucepan" ? "saucepan" : input.source === "janitor" ? "janitor" : null;
      if (!source)
        throw fail("INVALID_REQUEST", "Unknown creator source.");
      const start = offset(input.offset);
      const body = await read(`/api/creators/following?limit=24&offset=${start}&sourceKind=${source}&sortBy=total_chats&sortDir=desc&tagsLimit=0`, userId);
      if (!Array.isArray(body.list))
        throw fail("WEBSITE_RESPONSE_ERROR", "DataCat did not return a creator list.");
      const rows = body.list.map((row) => {
        const id = text(row.creatorId || row.id || row.ref, 100);
        const bare = id.replace(/^saucepan:/, "");
        return {
          ref: UUID.test(bare) ? source === "saucepan" ? `saucepan:${bare}` : bare : "",
          name: text(row.userName || row.name || row.creatorName || "Unknown creator", 240),
          characterCount: Number(row.charCount) || 0
        };
      });
      const total = Number.isFinite(Number(body.total)) ? Number(body.total) : null;
      return { rows, hasMore: body.list.length === 24 && (total === null || start + body.list.length < total), nextOffset: start + body.list.length, total };
    }
    if (action === "collections") {
      const body = await read("/api/user-folders", userId);
      if (!Array.isArray(body.folders))
        throw fail("WEBSITE_RESPONSE_ERROR", "DataCat did not return a collection list.");
      return { rows: body.folders.filter((row) => Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0).map((row) => ({
        id: Number(row.id),
        name: text(row.title || "Untitled collection", 240),
        description: text(row.description, 1500),
        count: Number(row.itemCount ?? row.membershipCount) || 0,
        visibility: row.visibility === "published" ? "Published" : "Private"
      })) };
    }
    if (action === "collection-items" || action === "library") {
      const library = action === "library";
      const folder = Number(input.folderId);
      if (!library && (!Number.isSafeInteger(folder) || folder <= 0))
        throw fail("INVALID_REQUEST", "Invalid collection.");
      const start = offset(input.offset);
      const limit = !library && input.preview === true ? 4 : 24;
      const scope = library ? "&sort=added" : `&folderId=${folder}`;
      const body = await read(`/api/characters?limit=${limit}&offset=${start}&skipCount=1&collectionSection=collected${scope}`, userId);
      if (!Array.isArray(body.characters))
        throw fail("WEBSITE_RESPONSE_ERROR", library ? "DataCat did not return your library." : "DataCat did not return collection contents.");
      const rows = body.characters.map((row) => ({
        id: text(row.characterId || row.character_id || row.id, 100),
        name: text(row.name || row.chat_name || row.chatName || "Unnamed character", 240),
        creatorName: text(row.creatorName || row.creator_name || (typeof row.creator === "string" ? row.creator : row.creator?.name), 240),
        sourceKind: text(row.characterSourceKind || row.primaryContentSourceKind || row.sourceKind, 50),
        avatarUrl: avatarUrl(row)
      })).filter((row) => UUID.test(row.id));
      return { rows, nextOffset: start + body.characters.length, hasMore: body.hasMore ?? body.paging?.hasMore ?? body.characters.length === limit };
    }
    throw fail("INVALID_REQUEST", "Unknown account operation.");
  };
}

// src/backend.js
var PAGE_SIZE = 200;
var CACHE_TTL_MS = 60000;
var DATACAT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DEFAULT_DATACAT_ORIGIN = "https://datacat.run";
var DATACAT_API_PREFIX = "/api/client/v1";
var DATACAT_CLIENT_ID = "datacat_lumiverse";
var DATACAT_CLIENT_VERSION = "0.7.7";
var INSTALLATION_KEY = "datacat.installation_id";
var ACCESS_TOKEN_KEY = "datacat.access_token";
var VERIFICATION_LEASE_KEY = "datacat.verification_lease";
var api = globalThis.spindle;
if (!api) {
  throw new Error("The Lumiverse Spindle backend API is unavailable.");
}
var cacheByUser = new Map;
var scanByUser = new Map;
var websiteAccount = createWebsiteAccount(api);
function randomInstallationId() {
  return `lumiverse-${uuidv7()}`;
}
async function getInstallationId(userId) {
  let value = String(await api.enclave.get(INSTALLATION_KEY, userId) || "");
  if (!/^[A-Za-z0-9._:-]{16,160}$/.test(value)) {
    value = randomInstallationId();
    await api.enclave.put(INSTALLATION_KEY, value, userId);
  }
  return value;
}
function parseJson(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}
function isAllowedDatacatPath(path, method) {
  const safePath = String(path || "");
  const verb = String(method || "GET").toUpperCase();
  if (!safePath.startsWith("/") || safePath.includes("\\"))
    return false;
  if (verb === "GET") {
    return [
      /^\/capabilities$/,
      /^\/characters(?:\?.*)?$/,
      /^\/fresh(?:\?.*)?$/,
      /^\/tags(?:\?.*)?$/,
      /^\/creators\/[A-Za-z0-9:%_-]+\/(?:bootstrap|characters)(?:\?.*)?$/,
      /^\/characters\/[0-9a-f-]{36}(?:\?.*)?$/i,
      /^\/characters\/[0-9a-f-]{36}\/(?:card|avatar)(?:\?.*)?$/i,
      /^\/characters\/[0-9a-f-]{36}\/community(?:\?.*)?$/i,
      /^\/account(?:\/status)?$/,
      /^\/verifications\/[0-9a-f-]{36}$/i
    ].some((pattern) => pattern.test(safePath));
  }
  if (verb === "POST") {
    return [
      /^\/account-links$/,
      /^\/account-links\/[0-9a-f-]{36}\/token$/i,
      /^\/verifications$/,
      /^\/verifications\/[0-9a-f-]{36}\/token$/i,
      /^\/characters\/[0-9a-f-]{36}\/community\/(?:kudos|comments)$/i
    ].some((pattern) => pattern.test(safePath));
  }
  return verb === "DELETE" && safePath === "/account";
}
function transientKey(kind, id) {
  const safeId = String(id || "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(safeId))
    return null;
  return `datacat.${kind}.${safeId}`;
}
async function readVerificationLease(userId) {
  const record = parseJson(await api.enclave.get(VERIFICATION_LEASE_KEY, userId));
  const token = String(record.token || "");
  const expiresAt = Date.parse(String(record.expiresAt || ""));
  if (!token.startsWith("dcv1v_") || !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 5000) {
    await api.enclave.delete(VERIFICATION_LEASE_KEY, userId);
    return null;
  }
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}
async function datacatSecureState(userId) {
  const lease = await readVerificationLease(userId);
  return {
    hasAccessToken: await api.enclave.has(ACCESS_TOKEN_KEY, userId),
    verificationExpiresAt: lease?.expiresAt || null
  };
}
async function runDatacatRequest(payload, userId) {
  const path = String(payload?.path || "").trim();
  const method = String(payload?.method || "GET").trim().toUpperCase();
  if (!isAllowedDatacatPath(path, method)) {
    throw new Error("This Datacat request is not available to the extension.");
  }
  const installationId = await getInstallationId(userId);
  const accessToken = String(await api.enclave.get(ACCESS_TOKEN_KEY, userId) || "").trim();
  const headers = {
    Accept: payload?.responseType === "arraybuffer" ? "image/avif,image/webp,image/png,image/jpeg,image/gif" : "application/json",
    "X-Datacat-Client": `Lumiverse/${DATACAT_CLIENT_VERSION}`,
    "X-Datacat-Client-Id": DATACAT_CLIENT_ID,
    "X-Datacat-Installation-Id": installationId
  };
  if (accessToken)
    headers.Authorization = `Bearer ${accessToken}`;
  let body = parseJson(payload?.body);
  const accountExchange = path.match(/^\/account-links\/([0-9a-f-]{36})\/token$/i);
  const verificationExchange = path.match(/^\/verifications\/([0-9a-f-]{36})\/token$/i);
  if (path === "/account-links" || path === "/verifications") {
    body = {
      ...body,
      installationId,
      clientId: DATACAT_CLIENT_ID,
      clientName: "Lumiverse",
      clientVersion: DATACAT_CLIENT_VERSION
    };
  }
  if (accountExchange) {
    const key = transientKey("account_link", accountExchange[1]);
    const deviceCode = key ? await api.enclave.get(key, userId) : null;
    if (!deviceCode)
      throw new Error("The Datacat account-link request expired.");
    body = { ...body, deviceCode, installationId, clientId: DATACAT_CLIENT_ID };
  }
  if (verificationExchange) {
    const key = transientKey("verification", verificationExchange[1]);
    const deviceCode = key ? await api.enclave.get(key, userId) : null;
    if (!deviceCode)
      throw new Error("The Datacat security-check request expired.");
    body = { ...body, deviceCode, installationId, clientId: DATACAT_CLIENT_ID };
  }
  if (method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }
  if (/^\/characters\/[0-9a-f-]{36}\/(?:card|avatar)(?:\?.*)?$/i.test(path)) {
    const lease = await readVerificationLease(userId);
    if (lease)
      headers["X-Datacat-Verification-Lease"] = lease.token;
  }
  const response = await api.cors(`${DEFAULT_DATACAT_ORIGIN}${DATACAT_API_PREFIX}${path}`, {
    method,
    headers,
    ...method === "GET" || method === "DELETE" ? {} : { body: JSON.stringify(body) },
    ...payload?.responseType === "arraybuffer" ? { responseType: "arraybuffer", mediaType: "image" } : {}
  });
  const result = {
    status: Number(response?.status || 500),
    statusText: String(response?.statusText || ""),
    headers: response?.headers || {},
    body: response?.body ?? "",
    encoding: response?.encoding || null
  };
  if (payload?.responseType !== "arraybuffer") {
    const responseBody = parseJson(result.body);
    if (result.status >= 200 && result.status < 300) {
      if (path === "/account-links" && responseBody.linkId && responseBody.deviceCode) {
        const key = transientKey("account_link", responseBody.linkId);
        if (key)
          await api.enclave.put(key, String(responseBody.deviceCode), userId);
        delete responseBody.deviceCode;
      }
      if (path === "/verifications" && responseBody.verificationId && responseBody.deviceCode) {
        const key = transientKey("verification", responseBody.verificationId);
        if (key)
          await api.enclave.put(key, String(responseBody.deviceCode), userId);
        delete responseBody.deviceCode;
      }
      if (accountExchange && responseBody.accessToken) {
        await api.enclave.put(ACCESS_TOKEN_KEY, String(responseBody.accessToken), userId);
        const key = transientKey("account_link", accountExchange[1]);
        if (key)
          await api.enclave.delete(key, userId);
        delete responseBody.accessToken;
        responseBody.accessTokenSaved = true;
        await api.enclave.delete(VERIFICATION_LEASE_KEY, userId);
      }
      if (verificationExchange && responseBody.leaseToken && responseBody.expiresAt) {
        await api.enclave.put(VERIFICATION_LEASE_KEY, JSON.stringify({
          token: String(responseBody.leaseToken),
          expiresAt: String(responseBody.expiresAt)
        }), userId);
        const key = transientKey("verification", verificationExchange[1]);
        if (key)
          await api.enclave.delete(key, userId);
        delete responseBody.leaseToken;
        responseBody.leaseAvailable = true;
      }
      if (method === "DELETE" && path === "/account") {
        await api.enclave.delete(ACCESS_TOKEN_KEY, userId);
        await api.enclave.delete(VERIFICATION_LEASE_KEY, userId);
      }
    } else if (result.status === 401 && accessToken) {
      await api.enclave.delete(ACCESS_TOKEN_KEY, userId);
      await api.enclave.delete(VERIFICATION_LEASE_KEY, userId);
    }
    result.body = JSON.stringify(result.status >= 200 && result.status < 300 ? responseBody : {
      success: false,
      error: [
        "CLIENT_VERIFICATION_REQUIRED",
        "VERIFICATION_PENDING",
        "LINK_PENDING",
        "CLIENT_API_SCHEMA_REQUIRED"
      ].includes(String(responseBody?.error || "")) ? String(responseBody.error) : "DATACAT_REQUEST_FAILED",
      verificationRequired: responseBody?.verificationRequired === true || responseBody?.securityCheckRequired === true,
      securityCheckRequired: responseBody?.securityCheckRequired === true
    });
  }
  return result;
}
function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}
function normalizeImportTimestamp(value) {
  const raw = String(value || "").trim();
  if (!raw)
    return "";
  const numeric = Number(raw);
  const milliseconds = Number.isFinite(numeric) ? Math.abs(numeric) < 10000000000 ? numeric * 1000 : numeric : Date.parse(raw);
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}
function datacatLink(character) {
  const datacat = character?.extensions?.datacat && typeof character.extensions.datacat === "object" ? character.extensions.datacat : null;
  if (!datacat)
    return null;
  const datacatCharacterId = normalizeId(datacat.datacatCharacterId ?? datacat.datacat_character_id ?? datacat.characterId ?? datacat.character_id);
  const lumiverseCharacterId = normalizeId(character?.id);
  if (!DATACAT_ID_PATTERN.test(datacatCharacterId) || !lumiverseCharacterId) {
    return null;
  }
  const name = String(character?.name || "").trim().slice(0, 240) || "Imported Datacat character";
  const importedAt = [
    datacat.importedAt,
    datacat.imported_at,
    character?.createdAt,
    character?.created_at,
    character?.updatedAt,
    character?.updated_at
  ].map(normalizeImportTimestamp).find(Boolean);
  return {
    datacatCharacterId,
    lumiverseCharacterId,
    name,
    ...importedAt ? { importedAt } : {}
  };
}
function importTimestamp(link) {
  const timestamp = Date.parse(String(link?.importedAt || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}
async function scanLinks(userId) {
  const links = new Map;
  let offset = 0;
  let total = 0;
  do {
    const page = await api.characters.list({
      limit: PAGE_SIZE,
      offset,
      userId
    });
    const rows = Array.isArray(page?.data) ? page.data : [];
    total = Math.max(0, Number(page?.total) || 0);
    for (const character of rows) {
      const link = datacatLink(character);
      const existing = link ? links.get(link.datacatCharacterId) : null;
      if (link && (!existing || importTimestamp(link) > importTimestamp(existing))) {
        links.set(link.datacatCharacterId, link);
      }
    }
    offset += rows.length;
    if (rows.length === 0)
      break;
  } while (offset < total);
  const result = {
    links: [...links.values()].sort((left, right) => importTimestamp(right) - importTimestamp(left)),
    total: links.size,
    scanned: offset,
    loadedAt: Date.now(),
    dirty: false
  };
  cacheByUser.set(userId, result);
  return result;
}
async function getLinks(userId, force = false) {
  const cached = cacheByUser.get(userId);
  if (!force && cached && !cached.dirty && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached;
  }
  if (scanByUser.has(userId))
    return scanByUser.get(userId);
  const scan = scanLinks(userId).finally(() => {
    scanByUser.delete(userId);
  });
  scanByUser.set(userId, scan);
  return scan;
}
for (const event of [
  "CHARACTER_CREATED",
  "CHARACTER_EDITED",
  "CHARACTER_DELETED",
  "CHARACTER_DUPLICATED"
]) {
  api.on(event, () => {
    for (const cached of cacheByUser.values())
      cached.dirty = true;
  });
}
api.onFrontendMessage(async (payload, userId) => {
  if (payload?.type === "datacat_website_request") {
    const requestId = String(payload.requestId || "");
    try {
      const result = await websiteAccount(payload.request, userId);
      api.sendToFrontend({ type: "datacat_website_result", requestId, result }, userId);
    } catch (error) {
      api.sendToFrontend({
        type: "datacat_website_error",
        requestId,
        code: error?.publicWebsiteError ? error.code : "WEBSITE_REQUEST_FAILED",
        error: error?.publicWebsiteError ? error.message : "Could not load DataCat account data."
      }, userId);
    }
    return;
  }
  if (payload?.type === "datacat_secure_state_request") {
    const requestId = String(payload.requestId || "");
    try {
      api.sendToFrontend({
        type: "datacat_secure_state_result",
        requestId,
        state: await datacatSecureState(userId)
      }, userId);
    } catch (error) {
      api.sendToFrontend({
        type: "datacat_secure_state_error",
        requestId,
        error: "Could not read Datacat connection state."
      }, userId);
    }
    return;
  }
  if (payload?.type === "datacat_clear_verification_request") {
    const requestId = String(payload.requestId || "");
    try {
      await api.enclave.delete(VERIFICATION_LEASE_KEY, userId);
      api.sendToFrontend({ type: "datacat_clear_verification_result", requestId }, userId);
    } catch (error) {
      api.sendToFrontend({
        type: "datacat_clear_verification_error",
        requestId,
        error: "Could not clear the Datacat security check."
      }, userId);
    }
    return;
  }
  if (payload?.type === "datacat_api_request") {
    const requestId = String(payload.requestId || "");
    try {
      api.sendToFrontend({
        type: "datacat_api_result",
        requestId,
        response: await runDatacatRequest(payload.request, userId)
      }, userId);
    } catch (error) {
      api.sendToFrontend({
        type: "datacat_api_error",
        requestId,
        error: "Datacat could not complete that request."
      }, userId);
    }
    return;
  }
  if (payload?.type === "datacat_toast") {
    const tone = ["success", "error", "info", "warning"].includes(payload.tone) ? payload.tone : "info";
    const message = String(payload.message || "").trim().slice(0, 500);
    const title = String(payload.title || "Datacat").trim().slice(0, 80);
    if (message && typeof api.toast?.[tone] === "function") {
      api.toast[tone](message, {
        title: title || "Datacat",
        duration: tone === "error" ? 8000 : 5000,
        userId
      });
    }
    return;
  }
  if (payload?.type === "datacat_character_link_request") {
    const requestId = String(payload.requestId || "");
    const lumiverseCharacterId = normalizeId(payload.lumiverseCharacterId);
    try {
      const character = lumiverseCharacterId ? await api.characters.get(lumiverseCharacterId, userId) : null;
      api.sendToFrontend({
        type: "datacat_character_link_result",
        requestId,
        link: datacatLink(character)
      }, userId);
    } catch (error) {
      api.sendToFrontend({
        type: "datacat_character_link_error",
        requestId,
        error: "Could not inspect the active Lumiverse character."
      }, userId);
    }
    return;
  }
  if (payload?.type !== "datacat_link_index_request")
    return;
  const requestId = String(payload.requestId || "");
  try {
    const result = await getLinks(userId, payload.force === true);
    api.sendToFrontend({
      type: "datacat_link_index_result",
      requestId,
      links: result.links,
      total: result.total,
      scanned: result.scanned
    }, userId);
  } catch (error) {
    api.sendToFrontend({
      type: "datacat_link_index_error",
      requestId,
      error: "Could not inspect the Lumiverse character library."
    }, userId);
  }
});
export {
  datacatLink,
  getLinks,
  scanLinks
};
