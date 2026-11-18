const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mountAccountViews({ host, request, onCreator, onCharacter }) {
  let view = "", source = "janitor", folder = null, rows = [], nextOffset = 0;
  let hasMore = false, connected = null, busy = false, error = "", name = "", serial = 0, disposed = false;
  let filter = "", saved = false;

  function render() {
    if (disposed) return;
    // Keep a partially entered session out of routine renders. This field is
    // cleared immediately on submission and never put in browser storage.
    if (connected === false) {
      host.innerHTML = `<div class="dcv1-account-page-note">
        <h3>Use your existing DataCat session</h3>
        <p>No new login is needed. Transfer the session from the desktop browser where you are already signed in to DataCat.</p>
        <ol><li>On datacat.run, open Developer Tools (F12) → Console.</li>
        <li>Run this command to copy your own current session:<br><code>copy(localStorage.getItem("liberator_session_token") || "")</code></li>
        <li>Paste it below. Only paste this credential into your own Lumiverse extension; never send it in chat.</li></ol>
        <label>Existing DataCat website session<input class="dcv1-search" data-website-session type="password" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Existing DataCat website session"></label>
        <button class="dcv1-button" type="button" data-website-connect>Save session and load</button>
        ${saved ? '<button class="dcv1-button" type="button" data-website-cancel>Use saved session</button>' : ""}
        <p>Saved encrypted for this Lumiverse user on this server. If Android runs a separate Lumiverse server, transfer the session there once too. If DataCat expires or revokes it, this connection will need updating.</p>
        <p role="status" data-account-message>${escape(error)}</p>
      </div>`;
      return;
    }
    const heading = folder?.name || (view === "following" ? "Following" : "Collections");
    host.innerHTML = `<div class="dcv1-account-tools">
      <strong>${escape(heading)}</strong>
      <span>${escape(name ? `Website session · ${name}` : "Website session saved")}</span>
      <button class="dcv1-button" type="button" data-website-change>Update session</button>
      <button class="dcv1-button" type="button" data-website-disconnect>Remove saved session</button>
      ${folder ? '<button class="dcv1-button" type="button" data-account-back>All collections</button>' : ""}
      ${view === "following" ? `<label>Source <select data-account-source aria-label="Creator source"><option value="janitor" ${source === "janitor" ? "selected" : ""}>Janitor</option><option value="saucepan" ${source === "saucepan" ? "selected" : ""}>Saucepan</option></select></label>` : ""}
      <input class="dcv1-search" data-account-search type="search" aria-label="Filter loaded items" placeholder="Filter loaded items" value="${escape(filter)}">
    </div>
    <div class="dcv1-account-results" data-account-results></div>
    <p class="dcv1-account-message" role="status">${escape(error || (busy ? "Loading…" : ""))}</p>
    ${error ? '<button class="dcv1-button" data-account-retry type="button">Try again</button>' : ""}
    ${hasMore ? `<button class="dcv1-button" data-account-more type="button" ${busy ? "disabled" : ""}>Load more</button>` : ""}`;
    renderRows();
  }

  function renderRows() {
    const list = host.querySelector("[data-account-results]");
    if (!list) return;
    list.innerHTML = rows.map((row, index) => ({ row, index })).filter(({ row }) =>
      `${row.name} ${row.creatorName || ""}`.toLowerCase().includes(filter.toLowerCase()),
    ).map(({ row, index }) => `<button class="dcv1-account-row" type="button" data-account-row="${index}" ${view === "following" && !row.ref ? "disabled" : ""}>
      <strong>${escape(row.name)}</strong><span>${escape(view === "following" ? `${row.characterCount} characters` : folder ? row.creatorName : `${row.count} items · ${row.visibility}`)}</span>
      ${!folder && view === "collections" && row.description ? `<span>${escape(row.description)}</span>` : ""}
    </button>`).join("") || (busy ? "" : `<p>${rows.length ? "No loaded items match this filter." : view === "following" ? "No followed creators for this source." : folder ? "This collection is empty." : "No collections found."}</p>`);
  }

  async function load(reset = true) {
    const ticket = ++serial;
    busy = true; error = "";
    if (reset) { rows = []; nextOffset = 0; hasMore = false; }
    render();
    try {
      if (connected === null) {
        const status = await request({ action: "status" });
        if (ticket !== serial || disposed) return;
        connected = status.connected;
        saved = connected;
      }
      if (!connected) return;
      const action = view === "following" ? "following" : folder ? "collection-items" : "collections";
      const payload = await request({ action, source, offset: nextOffset, folderId: folder?.id });
      if (ticket !== serial || disposed) return;
      const combined = reset ? payload.rows : [...rows, ...payload.rows];
      const seen = new Set();
      rows = combined.filter(row => {
        const key = row.ref || row.id;
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      hasMore = Boolean(payload.hasMore);
      nextOffset = payload.nextOffset || rows.length;
    } catch (e) {
      if (ticket !== serial || disposed) return;
      error = e.message || "Could not load DataCat account data.";
      if (e.code === "WEBSITE_SESSION_REQUIRED") connected = false;
    } finally {
      if (ticket === serial && !disposed) { busy = false; render(); }
    }
  }

  const click = async event => {
    const target = event.target.closest("button");
    if (!target || !host.contains(target)) return;
    event.stopPropagation();
    if (target.hasAttribute("data-website-connect")) {
      if (busy) return;
      const field = host.querySelector("[data-website-session]");
      const token = field.value;
      field.value = "";
      busy = true; target.disabled = true;
      const ticket = ++serial;
      try {
        const result = await request({ action: "connect", token });
        if (ticket !== serial || disposed) return;
        connected = true; saved = true; name = result.name || ""; busy = false;
        await load();
      } catch (e) {
        if (ticket !== serial || disposed) return;
        busy = false; error = e.message; render();
      }
      return;
    }
    if (target.hasAttribute("data-website-change")) {
      ++serial; connected = false; busy = false; error = ""; render(); return;
    }
    if (target.hasAttribute("data-website-cancel") && !busy) {
      connected = true; error = ""; await load(); return;
    }
    if (target.hasAttribute("data-website-disconnect")) {
      if (busy) return;
      const ticket = ++serial;
      busy = true;
      try {
        await request({ action: "disconnect" });
        if (ticket !== serial || disposed) return;
        connected = false; saved = false; name = ""; rows = []; folder = null; error = "";
      } catch (e) { if (ticket === serial) error = e.message; }
      finally { if (ticket === serial && !disposed) { busy = false; render(); } }
      return;
    }
    if (busy) return;
    if (target.hasAttribute("data-account-back")) { folder = null; filter = ""; await load(); }
    else if (target.hasAttribute("data-account-more")) await load(false);
    else if (target.hasAttribute("data-account-retry")) await load(rows.length === 0);
    else if (target.hasAttribute("data-account-row")) {
      const row = rows[Number(target.dataset.accountRow)];
      if (!row) return;
      if (view === "following") onCreator(row.ref);
      else if (folder) onCharacter(row);
      else { folder = row; filter = ""; await load(); }
    }
  };
  const change = event => {
    if (event.target.matches("[data-account-source]")) { source = event.target.value; filter = ""; void load(); }
  };
  const input = event => {
    if (event.target.matches("[data-account-search]")) { filter = event.target.value; renderRows(); }
  };
  host.addEventListener("click", click);
  host.addEventListener("change", change);
  host.addEventListener("input", input);
  return {
    show(nextView, refresh = false) {
      if (nextView !== view) {
        view = nextView; folder = null; filter = "";
        if (!(busy && connected === false)) void load();
      } else if (refresh && !busy) void load();
    },
    destroy() {
      disposed = true; ++serial;
      host.replaceChildren();
      host.removeEventListener("click", click);
      host.removeEventListener("change", change);
      host.removeEventListener("input", input);
    },
  };
}
