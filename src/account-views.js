const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mountAccountViews({ host, request, onCreator, onCharacter, onImport, getImportState = () => ({}) }) {
  let view = "", source = "janitor", folder = null, rows = [], nextOffset = 0;
  let hasMore = false, connected = null, busy = false, error = "", name = "", serial = 0, disposed = false;
  let filter = "", saved = false, parentView = "", filterOpen = false;
  let followedRows = [], followingPartial = false;
  let removal = null, removing = false, removalError = "", notice = "";
  let quickImportId = "", quickError = "";
  const covers = new Map();

  function creatorRow(row, attribute) {
    return `<button class="dcv1-account-row" type="button" ${attribute} ${!row.ref ? "disabled" : ""}>
      <span class="dcv1-creator-initial" aria-hidden="true">${escape(Array.from(row.name || "?")[0].toUpperCase())}</span>
      <span class="dcv1-account-row-copy"><strong>${escape(row.name)}</strong><small>${escape(row.characterCount)} characters</small></span>
      <span class="dcv1-row-arrow" aria-hidden="true">›</span></button>`;
  }

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
    const heading = folder?.name || (view === "following" ? "Followed creators" : view === "library" ? "DataCat library" : "");
    const overview = view === "collections" && !folder;
    host.innerHTML = `<div class="dcv1-account-tools" data-overview="${overview}">
      ${heading ? `<strong>${escape(heading)}</strong>` : ""}
      <div class="dcv1-account-tools-row">
      ${overview ? `<button class="dcv1-button dcv1-shelf-filter-toggle" type="button" data-account-filter-toggle aria-label="Filter Shelf" aria-expanded="${filterOpen}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>` : ""}
      ${folder || view === "following" ? '<button class="dcv1-button" type="button" data-account-back>Back to Shelf</button>' : ""}
      ${view === "following" ? `<label>Source <select data-account-source aria-label="Creator source"><option value="janitor" ${source === "janitor" ? "selected" : ""}>Janitor</option><option value="saucepan" ${source === "saucepan" ? "selected" : ""}>Saucepan</option></select></label>` : ""}
      <input class="dcv1-search" data-account-search type="search" aria-label="Filter loaded items" placeholder="Filter loaded items" value="${escape(filter)}" ${overview && !filterOpen ? "hidden" : ""}>
      <details class="dcv1-account-settings"><summary aria-label="DataCat website connection settings">Account</summary><div>
        <span>${escape(name ? `Website session · ${name}` : connected === null ? "Checking connection…" : "Website session saved")}</span>
        <button class="dcv1-button" type="button" data-website-change>Update session</button>
        <button class="dcv1-button" type="button" data-website-disconnect>Remove saved session</button>
      </div></details></div>
    </div>
    <div class="dcv1-account-results" data-account-results></div>
    <p class="dcv1-account-message" role="status">${escape(error || quickError || (removing ? "Removing from collection…" : busy ? "Loading…" : notice))}</p>
    ${error ? '<button class="dcv1-button" data-account-retry type="button">Try again</button>' : ""}
    ${hasMore ? `<button class="dcv1-button" data-account-more type="button" ${busy ? "disabled" : ""}>Load more</button>` : ""}`;
    renderRows();
  }

  function renderRows() {
    const list = host.querySelector("[data-account-results]");
    if (!list) return;
    const matches = rows.map((row, index) => ({ row, index })).filter(({ row }) =>
      `${row.name} ${row.creatorName || ""}`.toLowerCase().includes(filter.toLowerCase()),
    );
    if (view === "collections" && !folder) {
      const collections = matches.map(({ row, index }) => {
        const images = covers.get(row.id) || [];
        const letters = Array.from(row.name.replace(/\s/g, "").toUpperCase());
        return `<button class="dcv1-collection-tile" type="button" data-account-row="${index}" title="${escape(row.description || row.name)}">
          <span class="dcv1-collection-art" aria-hidden="true">${Array.from({ length: 4 }, (_, i) => `<span>${escape(letters[i] || "·")}${images[i] ? `<img src="${escape(images[i])}" loading="lazy" alt="">` : ""}</span>`).join("")}</span>
          <span class="dcv1-collection-info"><strong>${escape(row.name)}</strong><small>${escape(row.count)} ${row.count === 1 ? "card" : "cards"} · ${escape(row.visibility)}</small></span></button>`;
      }).join("");
      const followed = followedRows.map((row, index) => ({ row, index })).filter(({ row }) => row.name.toLowerCase().includes(filter.toLowerCase()));
      list.innerHTML = `<section class="dcv1-shelf-section"><div class="dcv1-shelf-heading"><h3>Collections</h3><span>${rows.length}</span></div>
        <div class="dcv1-collection-grid">${collections}</div>${!collections && !busy ? '<p>No collections to show.</p>' : ""}</section>
        <section class="dcv1-shelf-section"><div class="dcv1-shelf-heading"><h3>Followed creators</h3><span>${followedRows.length}${followingPartial ? "+" : ""}</span><button data-account-following type="button">See all</button></div>
        <div class="dcv1-creator-list">${followed.map(({ row, index }) => creatorRow(row, `data-account-follow="${index}"`)).join("")}</div>
        ${!followed.length && !busy ? '<p>No followed creators to show.</p>' : ""}</section>`;
      return;
    }
    list.innerHTML = `<div class="dcv1-creator-list">${matches.map(({ row, index }) => {
      if (view === "following") return creatorRow(row, `data-account-row="${index}"`);
      const open = `<button class="dcv1-account-row" type="button" data-account-row="${index}"><span class="dcv1-creator-initial" aria-hidden="true">${escape(Array.from(row.name || "?")[0])}</span><span class="dcv1-account-row-copy"><strong>${escape(row.name)}</strong><small>${escape(row.creatorName)}</small></span><span class="dcv1-row-arrow" aria-hidden="true">›</span></button>`;
      if (!folder) return open;
      const confirming = removal?.characterId === row.id && removal.folderId === folder.id;
      const importState = getImportState(row.id) || {};
      const importing = quickImportId === row.id || importState.importing;
      const quickImport = onImport ? `<button class="dcv1-button" data-primary type="button" data-account-quick-import="${index}" aria-label="${importState.added ? "Already imported" : "Quick import"} ${escape(row.name)}" ${busy || removing || quickImportId || importState.busy || importState.added ? "disabled" : ""}>${importState.added ? "✓ Added" : importing ? "Importing…" : "Quick import"}</button>` : "";
      return `<div class="dcv1-collection-item"><div class="dcv1-collection-item-actions">${open}<div class="dcv1-collection-item-controls">${quickImport}<button class="dcv1-button dcv1-collection-remove" type="button" data-account-remove="${index}" aria-label="Remove ${escape(row.name)} from this collection" ${busy || removing || quickImportId ? "disabled" : ""}>Remove</button></div></div>
        ${confirming ? `<div class="dcv1-collection-remove-confirm" role="group" aria-label="Confirm removal from collection"><strong>Remove “${escape(row.name)}” from “${escape(folder.name)}”?</strong><p>The character stays in your DataCat library, other collections, and Lumiverse.</p>${removalError ? `<p role="alert">${escape(removalError)}</p>` : ""}<div><button class="dcv1-button" type="button" data-account-remove-confirm ${removing ? "disabled" : ""}>${removing ? "Removing…" : "Remove from collection"}</button><button class="dcv1-button" type="button" data-account-remove-cancel ${removing ? "disabled" : ""}>Cancel</button></div></div>` : ""}</div>`;
    }).join("")}</div>`;
    if (!matches.length && !busy && !error) list.innerHTML += `<p>${rows.length ? "No loaded items match this filter." : folder ? "This collection is empty." : view === "library" ? "Your DataCat library is empty." : "No followed creators for this source."}</p>`;
  }

  async function loadCovers(ticket) {
    await Promise.allSettled(rows.slice(0, 8).map(async row => {
      if (covers.has(row.id)) return;
      covers.set(row.id, []);
      try {
        const payload = await request({ action: "collection-items", folderId: row.id, preview: true });
        const images = payload.rows.map(item => item.avatarUrl).filter(value => {
          try { return new URL(value).protocol === "https:"; } catch (_) { return false; }
        }).slice(0, 4);
        if (disposed) return;
        covers.set(row.id, images);
        if (ticket === serial && view === "collections" && !folder) renderRows();
      } catch (_) { /* Keep the collection's initial mosaic when previews are unavailable. */ }
    }));
  }

  async function load(reset = true) {
    const ticket = ++serial;
    busy = true; error = "";
    if (reset) { rows = []; nextOffset = 0; hasMore = false; removal = null; removalError = ""; notice = ""; quickError = ""; }
    render();
    try {
      if (connected === null) {
        const status = await request({ action: "status" });
        if (ticket !== serial || disposed) return;
        connected = status.connected;
        saved = connected;
      }
      if (!connected) return;
      const action = view === "library" ? "library" : view === "following" ? "following" : folder ? "collection-items" : "collections";
      let payload;
      if (action === "collections") {
        const results = await Promise.allSettled([
          request({ action }), request({ action: "following", source: "janitor" }), request({ action: "following", source: "saucepan" }),
        ]);
        if (ticket !== serial || disposed) return;
        if (results[0].status === "rejected") throw results[0].reason;
        payload = results[0].value;
        followedRows = results.slice(1).flatMap(result => result.status === "fulfilled" ? result.value.rows : []);
        followingPartial = results.slice(1).some(result => result.status === "fulfilled" && result.value.hasMore);
        if (results.slice(1).some(result => result.status === "rejected")) error = "Some followed creators could not be loaded. Try refreshing Shelf.";
      } else {
        payload = await request({ action, source, offset: nextOffset, folderId: folder?.id });
      }
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
      if (ticket === serial && !disposed) {
        busy = false; render();
        if (connected && view === "collections" && !folder) void loadCovers(ticket);
      }
    }
  }

  const click = async event => {
    const target = event.target.closest("button");
    if (!target || !host.contains(target)) return;
    event.stopPropagation();
    if (target.hasAttribute("data-account-quick-import")) {
      if (busy || removing || quickImportId || !folder || view !== "collections" || !onImport) return;
      const row = rows[Number(target.dataset.accountQuickImport)];
      if (!row) return;
      const importState = getImportState(row.id) || {};
      if (importState.busy || importState.added) return;
      const ticket = serial;
      quickImportId = row.id; quickError = ""; removal = null; removalError = "";
      renderRows();
      try {
        // Call immediately in the click gesture so existing verification can
        // open its window when DataCat requires it. Do not open the profile.
        await onImport(row);
      } catch (e) {
        if (!disposed && ticket === serial) quickError = e.message || "Could not import this character. Try again.";
      } finally {
        quickImportId = "";
        if (!disposed) render();
      }
      return;
    }
    if (target.hasAttribute("data-account-remove-cancel")) {
      if (!removing) { removal = null; removalError = ""; renderRows(); }
      return;
    }
    if (target.hasAttribute("data-account-remove")) {
      if (busy || removing || quickImportId || !folder || view !== "collections") return;
      const row = rows[Number(target.dataset.accountRemove)];
      if (!row) return;
      removal = { folderId: folder.id, characterId: row.id };
      removalError = ""; notice = ""; renderRows();
      host.querySelector("[data-account-remove-cancel]")?.focus();
      return;
    }
    if (target.hasAttribute("data-account-remove-confirm")) {
      if (busy || removing || quickImportId || !removal || folder?.id !== removal.folderId || !rows.some(row => row.id === removal.characterId)) return;
      const selected = { ...removal }, ticket = serial;
      removing = true; removalError = ""; render();
      let refreshCurrent = false;
      try {
        const result = await request({ action: "remove-collection-item", ...selected });
        if (result?.removed !== true || result.folderId !== selected.folderId || result.characterId !== selected.characterId) throw Error("DataCat did not confirm the removal. Try again.");
        covers.delete(selected.folderId);
        if (disposed) return;
        if (ticket === serial && folder?.id === selected.folderId) {
          rows = rows.filter(row => row.id !== selected.characterId);
          nextOffset = Math.max(0, nextOffset - 1);
          folder = { ...folder, count: Math.max(0, (folder.count || 0) - 1) };
          removal = null;
          notice = "Removed from this collection.";
        } else if (view === "collections" && folder?.id === selected.folderId) {
          refreshCurrent = true;
        }
      } catch (e) {
        if (!disposed && ticket === serial) removalError = e.message || "Could not remove this character. Try again.";
      } finally {
        removing = false;
        if (!disposed) {
          if (refreshCurrent) await load();
          else render();
        }
      }
      return;
    }
    if (target.hasAttribute("data-account-filter-toggle")) {
      filterOpen = !filterOpen; render();
      if (filterOpen) host.querySelector("[data-account-search]")?.focus();
      return;
    }
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
        followedRows = []; covers.clear(); folder = null;
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
        connected = false; saved = false; name = ""; rows = []; followedRows = []; covers.clear(); folder = null; error = "";
      } catch (e) { if (ticket === serial) error = e.message; }
      finally { if (ticket === serial && !disposed) { busy = false; render(); } }
      return;
    }
    if (busy) return;
    if (target.hasAttribute("data-account-back")) { view = "collections"; folder = null; filter = ""; await load(); }
    else if (target.hasAttribute("data-account-following")) { view = "following"; folder = null; filter = ""; await load(); }
    else if (target.hasAttribute("data-account-follow")) { const row = followedRows[Number(target.dataset.accountFollow)]; if (row?.ref) onCreator(row.ref); }
    else if (target.hasAttribute("data-account-more")) await load(false);
    else if (target.hasAttribute("data-account-retry")) await load(rows.length === 0);
    else if (target.hasAttribute("data-account-row")) {
      const row = rows[Number(target.dataset.accountRow)];
      if (!row) return;
      if (view === "following") onCreator(row.ref);
      else if (folder || view === "library") onCharacter(row);
      else { folder = row; filter = ""; await load(); }
    }
  };
  const change = event => {
    if (event.target.matches("[data-account-source]")) { source = event.target.value; filter = ""; void load(); }
  };
  const input = event => {
    if (event.target.matches("[data-account-search]")) { filter = event.target.value; renderRows(); }
  };
  const imageError = event => {
    if (event.target.matches?.(".dcv1-collection-art img")) event.target.remove();
  };
  host.addEventListener("click", click);
  host.addEventListener("change", change);
  host.addEventListener("input", input);
  host.addEventListener("error", imageError, true);
  return {
    refreshImports() { if (!disposed) renderRows(); },
    hide() {
      if (!parentView) return;
      parentView = ""; view = ""; ++serial; busy = false; connected = null; removal = null; removalError = ""; notice = ""; quickError = "";
    },
    show(nextView, refresh = false) {
      if (nextView !== parentView) {
        parentView = nextView;
        view = nextView; folder = null; filter = "";
        if (!(busy && connected === false)) void load();
      } else if (refresh && !busy) { covers.clear(); void load(); }
    },
    destroy() {
      disposed = true; ++serial;
      host.replaceChildren();
      host.removeEventListener("click", click);
      host.removeEventListener("change", change);
      host.removeEventListener("input", input);
      host.removeEventListener("error", imageError, true);
    },
  };
}

