// Angel.OS Light storefront. Inherit the user's live palette; keep light fallbacks.
export const STORE_THEME = `
  .dcv1-root, .dcv1-page-modal-host {
    --dc-bg: var(--faye-bg, #fff8fb);
    --dc-panel: var(--faye-panel, #ffffff);
    --dc-panel-2: var(--faye-panel-alt, #fff0f6);
    --dc-border: var(--faye-border-soft, #efd2df);
    --dc-text: var(--faye-text, #704055);
    --dc-muted: var(--faye-text-dim, #89596f);
    --dc-accent: var(--faye-pink, #f3b1cb);
    --dc-icon-fill: var(--faye-text-soft, #7b4b61);
    --dc-accent-border: var(--faye-lavender, #edb6cf);
    --dc-accent-text: var(--faye-text-soft, #7b4b61);
    --dc-hover: var(--faye-panel-dark, #fff8fc);
    --dc-titlebar: var(--faye-tb-pink, linear-gradient(90deg,#efb1cb,#edb6cf 60%,#f3b1cb));
    --dc-focus: rgba(225,161,190,.25);
    --dc-shadow: rgba(112,64,85,.14);
    --dc-danger: #a03f61;
    --dc-mint: var(--faye-mint, #bce6d8);
    --dc-cream: var(--faye-yellow, #faecc7);
    --dc-yellow: var(--dc-accent-text);
    --dc-purple: var(--dc-accent-text);
    font-family: "Pixelify Sans", "pixelifysans-regular", var(--lumiverse-font-family, system-ui, sans-serif);
    font-size: 12px;
    line-height: 1.45;
    color-scheme: light;
  }
  .dcv1-root { background: var(--dc-bg); }
  .dcv1-toolbar-brand { gap: 7px; }
  .dcv1-toolbar-brand svg { width: 20px; height: 20px; flex: 0 0 20px; }
  .dcv1-toolbar { padding: 6px 12px; gap: 6px; background: var(--dc-titlebar); border-color: var(--dc-accent-border); }
  .dcv1-toolbar-brand { color: var(--dc-text); font-size: 12px; font-weight: 650; letter-spacing: -.15px; }
  .dcv1-version-badge { background: transparent; border: 0; color: var(--dc-muted); font-size: 8px; padding: 0; }
  .dcv1-toolbar-icon { width: 25px; min-height: 25px; }
  .dcv1-toolbar-icon svg { width: 16px; height: 16px; }
  .dcv1-toolbar-close { min-width: 24px; font-size: 18px; }
  .dcv1-view-tabs { margin: 8px 10px 12px; padding: 2px; gap: 3px; border: 1px solid var(--dc-border); border-radius: 8px; background: transparent; scrollbar-width: none; }
  .dcv1-view-tabs::-webkit-scrollbar { display: none; }
  .dcv1-view-tab { flex: 1 1 0; min-width: 0; min-height: 24px; padding: 0 7px; border: 1px solid transparent; border-radius: 6px; font-size: 11px; font-weight: 500; color: var(--dc-muted); white-space: nowrap; }
  .dcv1-view-tab:hover { color: var(--dc-text); background: var(--dc-panel-2); }
  .dcv1-view-tab[data-active="true"] { color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-accent-border); box-shadow: none; }
  .dcv1-search-row { grid-template-columns: auto minmax(0,1fr) 36px; padding: 0 12px 10px; gap: 7px; background: transparent; }
  .dcv1-button, .dcv1-search { border-color: var(--dc-border); border-radius: 7px; font-size: 11px; min-height: 30px; }
  .dcv1-button { background: var(--dc-panel-2); color: var(--dc-text); }
  .dcv1-button:hover:not(:disabled) { border-color: var(--dc-accent-border); background: var(--dc-panel-2); }
  .dcv1-button[data-primary], .dcv1-card [data-import], .dcv1-fresh-row [data-import] { color: var(--dc-text); background: var(--dc-accent); border: 1px solid var(--dc-accent-border); border-radius: 7px; }
  .dcv1-button[data-primary]:hover:not(:disabled) { background: var(--dc-accent); }
  .dcv1-search { background: var(--dc-panel); color: var(--dc-text); }
  .dcv1-search::placeholder { color: var(--dc-muted); }
  .dcv1-search:focus { border-color: var(--dc-accent-border); box-shadow: 0 0 0 2px var(--dc-focus); }
  .dcv1-sort-trigger, .dcv1-sort-menu, .dcv1-menu-panel { background: var(--dc-panel); border-color: var(--dc-border); }
  .dcv1-sort-trigger { border-radius: 7px; }
  .dcv1-sort-trigger svg { width: 18px; height: 18px; }
  .dcv1-sort-badge { color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-accent-border); }
  .dcv1-scroll, .dcv1-account-pages, .dcv1-tag-groups { scrollbar-width: thin; scrollbar-color: var(--dc-accent-border) transparent; }
  .dcv1-scroll::-webkit-scrollbar, .dcv1-account-pages::-webkit-scrollbar { width: 5px; }
  .dcv1-scroll::-webkit-scrollbar-thumb, .dcv1-account-pages::-webkit-scrollbar-thumb { background: var(--dc-accent-border); border-radius: 5px; }
  .dcv1-grid { grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 12px; padding: 4px 12px 16px; }
  .dcv1-card { background: var(--dc-panel); border: 1px solid var(--dc-border); border-radius: 10px; }
  .dcv1-cover-wrap { border-radius: 8px 8px 0 0; }
  .dcv1-card-body { padding: 9px; gap: 6px; }
  .dcv1-card-title { font-size: 12px; font-weight: 650; }
  .dcv1-card-author, .dcv1-card-author .dcv1-creator-link { color: var(--dc-muted); }
  .dcv1-cover-missing { background: var(--dc-panel-2); color: var(--dc-muted); }
  .dcv1-fresh-section { padding: 6px 0; }
  .dcv1-fresh-head { padding: 4px 0 10px; }
  .dcv1-fresh-head strong { font-size: 12px; font-weight: 650; }
  .dcv1-fresh-list { gap: 10px; }
  .dcv1-fresh-row { min-height: 145px; padding: 10px; border: 1px solid var(--dc-border); border-radius: 10px; background: var(--dc-panel); grid-template-columns: 84px minmax(0,1fr) 53px; gap: 7px; }
  .dcv1-fresh-row:last-child { border: 1px solid var(--dc-border); padding-bottom: 10px; }
  .dcv1-fresh-cover { width: 84px; min-height: 112px; border-radius: 7px; background: var(--dc-panel-2); }
  .dcv1-fresh-title { font-size: 12px; font-weight: 650; }
  .dcv1-fresh-description { color: var(--dc-muted); font-size: 11px; font-style: normal; line-height: 1.45; }
  .dcv1-fresh-creator, .dcv1-fresh-meta { font-size: 10px; }
  .dcv1-tag, .dcv1-chip { border: 1px solid var(--dc-border); background: var(--dc-panel-2); color: var(--dc-muted); box-shadow: none; }
  .dcv1-tag[data-selected="true"], .dcv1-chip { background: var(--dc-panel-2); color: var(--dc-text); }
  .dcv1-tag-panel, .dcv1-character-modal, .dcv1-local-character-modal { background: var(--dc-panel); border-color: var(--dc-border); }
  .dcv1-character-modal-head, .dcv1-character-modal-actions { background: var(--dc-panel); border-color: var(--dc-border); }
  .dcv1-imports { padding: 4px 0; }
  .dcv1-import-row { padding: 8px; border: 1px solid var(--dc-border); border-radius: 9px; background: var(--dc-panel); }
  .dcv1-imports-head strong { font-size: 12px; }
  .dcv1-account-footer { padding: 5px 12px calc(5px + env(safe-area-inset-bottom,0px)); background: var(--dc-panel); border-top: 1px solid var(--dc-border); }
  .dcv1-account-summary { font-size: 9px; color: var(--dc-muted); }
  .dcv1-account-pages { position: relative; padding: 0 12px 16px; gap: 0; }
  .dcv1-account-tools { padding: 0 0 12px; gap: 8px; }
  .dcv1-account-tools > strong { font-size: 12px; font-weight: 650; }
  .dcv1-account-tools-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; width: 100%; }
  .dcv1-account-tools-row .dcv1-search { flex: 1; min-width: 0; width: auto; }
  .dcv1-account-tools[data-overview="false"] .dcv1-search { flex: 1 1 150px; }
  .dcv1-account-tools[data-overview="true"] { position: absolute; top: 0; right: 12px; z-index: 4; padding: 0; }
  .dcv1-account-tools[data-overview="true"] .dcv1-account-tools-row { gap: 5px; }
  .dcv1-account-tools[data-overview="true"] .dcv1-search { position: absolute; top: 33px; right: 0; width: min(240px,70vw); background: var(--dc-panel); }
  .dcv1-account-tools .dcv1-search[hidden] { display: none; }
  .dcv1-shelf-filter-toggle { display: grid; place-items: center; width: 25px; min-height: 25px; padding: 0; background: transparent; }
  .dcv1-account-tools[data-overview="true"] .dcv1-account-settings summary { padding: 4px 7px; font-size: 10px; }
  .dcv1-account-settings { position: relative; flex: 0 0 auto; color: var(--dc-muted); font-size: 11px; }
  .dcv1-account-settings summary { list-style: none; cursor: pointer; border: 1px solid var(--dc-border); border-radius: 7px; padding: 6px 9px; }
  .dcv1-account-settings summary::-webkit-details-marker { display: none; }
  .dcv1-account-settings > div { position: absolute; top: calc(100% + 5px); right: 0; width: 195px; z-index: 12; padding: 9px; display: grid; gap: 7px; background: var(--dc-panel); border: 1px solid var(--dc-border); border-radius: 8px; box-shadow: 0 8px 25px var(--dc-shadow); }
  .dcv1-account-results { padding: 0; }
  .dcv1-shelf-section { margin: 0 0 20px; }
  .dcv1-shelf-heading { display: flex; align-items: center; gap: 8px; margin: 3px 0 9px; }
  .dcv1-shelf-heading h3 { margin: 0; font-size: 12px; font-weight: 650; }
  .dcv1-shelf-heading > span { color: var(--dc-muted); font-size: 10px; }
  .dcv1-shelf-heading button { margin-left: auto; border: 0; background: transparent; color: var(--dc-muted); cursor: pointer; font: inherit; font-size: 10px; padding: 4px 0 4px 8px; }
  .dcv1-collection-grid { display: grid; grid-template-columns: repeat(auto-fill,112px); gap: 9px; }
  .dcv1-collection-tile { min-width: 0; padding: 0; overflow: hidden; text-align: left; background: var(--dc-panel); border: 1px solid var(--dc-border); border-radius: 10px; color: var(--dc-text); cursor: pointer; font: inherit; }
  .dcv1-collection-tile:hover { border-color: var(--dc-accent-border); }
  .dcv1-collection-art { display: grid; grid-template-columns: repeat(2,1fr); aspect-ratio: 1.5; overflow: hidden; gap: 1px; background: var(--dc-bg); }
  .dcv1-collection-art > span { display: grid; place-items: center; position: relative; overflow: hidden; background: linear-gradient(140deg,var(--dc-accent),var(--dc-panel-2)); color: var(--dc-text); font-size: 18px; font-weight: 500; }
  .dcv1-collection-art > span:nth-child(2) { background: linear-gradient(140deg,var(--faye-purple,#efbfdb),var(--dc-panel)); color: var(--dc-text); }
  .dcv1-collection-art > span:nth-child(3) { background: linear-gradient(140deg,var(--dc-mint),var(--dc-panel)); color: var(--dc-text); }
  .dcv1-collection-art > span:nth-child(4) { background: linear-gradient(140deg,var(--dc-cream),var(--dc-panel)); color: var(--dc-text); }
  .dcv1-collection-art img { position: absolute; width: 100%; height: 100%; object-fit: cover; inset: 0; }
  .dcv1-collection-info { display: grid; gap: 3px; padding: 9px; }
  .dcv1-collection-info strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; font-weight: 650; }
  .dcv1-collection-info small { color: var(--dc-muted); font-size: 9px; }
  .dcv1-creator-list { display: grid; gap: 5px; }
  .dcv1-account-row { flex-direction: row; align-items: center; gap: 10px; padding: 5px 8px; border: 1px solid var(--dc-border); border-radius: 9px; background: var(--dc-panel); }
  .dcv1-account-row:hover { background: var(--dc-panel-2); border-color: var(--dc-accent-border); }
  .dcv1-creator-initial { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; border-radius: 50%; background: var(--dc-panel-2); color: var(--dc-text); font-size: 14px; font-weight: 650; }
  .dcv1-account-row .dcv1-account-row-copy { display: grid; gap: 2px; min-width: 0; flex: 1; }
  .dcv1-account-row strong { color: var(--dc-text); font-size: 11px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dcv1-account-row small { font-size: 10px; color: var(--dc-muted); }
  .dcv1-account-row .dcv1-row-arrow { color: var(--dc-muted); font-size: 17px; padding: 0 4px; }
  .dcv1-account-page-note { margin: 2px 0; padding: 14px; background: var(--dc-panel); border: 1px solid var(--dc-border); border-radius: 10px; color: var(--dc-muted); font-size: 11px; }
  .dcv1-account-page-note h3 { color: var(--dc-text); font-size: 13px; margin-top: 0; }
  .dcv1-account-message { margin: 4px 0 9px; }
  button.dcv1-native-launch[data-spindle-ext-id="datacat_client_v1"],
  button.dcv1-native-launch[data-active="true"] { --dc-icon-fill: var(--faye-text-soft,#7b4b61); color: var(--faye-text,#704055) !important; background: transparent !important; box-shadow: none !important; border-left: 0 !important; }
  .dcv1-native-launch::before, .dcv1-native-launch::after { display: none !important; }
  .dcv1-root button:focus-visible, .dcv1-root [tabindex]:focus-visible,
  .dcv1-page-modal-host button:focus-visible { outline: 2px solid var(--dc-accent-text); outline-offset: 2px; }
  .dcv1-root select, .dcv1-page-modal-host select { background: var(--dc-panel); color: var(--dc-text); border: 1px solid var(--dc-border); border-radius: 6px; font: inherit; }
  .dcv1-toolbar-bare, .dcv1-toolbar-bare:hover:not(:disabled) { color: var(--dc-text); background: transparent; }
  .dcv1-view-tab[data-active="true"] { background: var(--dc-accent); }
  .dcv1-author-label, .dcv1-fresh-age, .dcv1-fresh-spotted { color: var(--dc-accent-text); }
  .dcv1-creator-link { color: var(--dc-accent-text); }
  .dcv1-creator-link:hover { color: var(--dc-text); }
  .dcv1-tag-cloud-item, .dcv1-tag-view-toggle { color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-border); }
  .dcv1-account-change, .dcv1-account-change:hover { color: var(--dc-accent-text); }
  .dcv1-fresh-tag, .dcv1-kudos-count, .dcv1-kudos-option, .dcv1-community-comment {
    color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-border);
  }
  .dcv1-sort-menu, .dcv1-menu-panel, .dcv1-account-settings > div { box-shadow: 0 8px 24px var(--dc-shadow); }
  .dcv1-sort-option:hover, .dcv1-sort-option:focus-visible, .dcv1-sort-option[data-active="true"],
  .dcv1-tag-toggle[data-active="true"], .dcv1-tag-view-toggle button[data-active="true"] {
    color: var(--dc-text); background: var(--dc-accent); border-color: var(--dc-accent-border);
  }
  .dcv1-chip:hover, .dcv1-tag:hover, .dcv1-tag-cloud-item[data-selected="true"] {
    color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-accent-border);
  }
  .dcv1-chip .dcv1-tag-count, .dcv1-tag-cloud-item .dcv1-tag-count { color: var(--dc-muted); }
  .dcv1-tag-panel, .dcv1-character-modal { box-shadow: 0 12px 40px var(--dc-shadow); }
  .dcv1-tag-panel, .dcv1-tag-drawer-head, .dcv1-tag-panel-footer,
  .dcv1-community, .dcv1-filter-chips { border-color: var(--dc-border); }
  .dcv1-tag-drawer-handle { background: var(--dc-accent-border); }
  .dcv1-tag-scrim, .dcv1-modal-layer { background: rgba(112,64,85,.23); }
  .dcv1-community-actions .dcv1-button[data-kudos], .dcv1-kudos-picker {
    color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-accent-border);
  }
  .dcv1-kudos-option:hover:not(:disabled) { background: var(--dc-accent); border-color: var(--dc-accent-border); }
  .dcv1-community-composer textarea { background: var(--dc-panel); color: var(--dc-text); border-color: var(--dc-border); }
  .dcv1-community-comment p, .dcv1-character-description, .dcv1-creator-about-copy, .dcv1-profile-scroll { color: var(--dc-text); }
  .dcv1-profile-nav { background: var(--dc-titlebar); border-color: var(--dc-accent-border); }
  .dcv1-creator-hero { background: var(--dc-panel); border-color: var(--dc-accent-border); box-shadow: 0 6px 22px var(--dc-shadow); }
  .dcv1-creator-tag-panel, .dcv1-stat, .dcv1-creator-about, .dcv1-creator-catalog {
    background: var(--dc-panel); border-color: var(--dc-border);
  }
  .dcv1-profile-avatar, .dcv1-character-hero, .dcv1-import-row-avatar {
    background: var(--dc-panel-2); border-color: var(--dc-accent-border);
  }
  .dcv1-verified { color: var(--dc-text); background: var(--dc-accent); }
  .dcv1-card:hover .dcv1-cover-wrap, .dcv1-card:focus-visible .dcv1-cover-wrap {
    box-shadow: 0 0 0 1px var(--dc-accent-border);
  }
  .dcv1-card-score, .dcv1-fresh-score, .dcv1-score-badge,
  .dcv1-card-score[data-tier="mid"], .dcv1-fresh-score[data-tier="mid"], .dcv1-score-badge[data-tier="mid"],
  .dcv1-card-score[data-tier="low"], .dcv1-fresh-score[data-tier="low"], .dcv1-score-badge[data-tier="low"] {
    color: var(--dc-text); background: var(--dc-panel-2); border-color: var(--dc-accent-border); box-shadow: 0 2px 8px var(--dc-shadow);
  }
  .dcv1-card-score[data-tier="top"], .dcv1-fresh-score[data-tier="top"], .dcv1-score-badge[data-tier="top"] {
    color: #315b50; background: var(--dc-mint); border-color: #8bbcab; box-shadow: 0 2px 8px var(--dc-shadow);
  }
  .dcv1-added-badge, .dcv1-button[data-added], .dcv1-character-added-text { color: #3e7566; }
  .dcv1-loader-visual { background: var(--dc-panel-2); color: var(--dc-accent-text); filter: none; }
  .dcv1-loader-visual::before, .dcv1-inline-spinner { border-color: var(--dc-border); border-top-color: var(--dc-accent-text); border-right-color: var(--dc-accent-border); }
  .dcv1-import-tray { color: var(--dc-text); background: var(--dc-panel); border-color: var(--dc-accent-border); box-shadow: 0 8px 24px var(--dc-shadow); }
  .dcv1-import-icon, .dcv1-import-tray[data-tone="verification"] .dcv1-import-icon { color: var(--dc-text); background: var(--dc-panel-2); }
  .dcv1-empty[data-error], .dcv1-import-tray[data-tone="error"] .dcv1-import-icon { color: #a03f61; }
  .dcv1-import-tray[data-tone="success"] .dcv1-import-icon { color: #3e7566; background: var(--dc-mint); }
  @media(max-width:420px) {
    .dcv1-toolbar { padding: 6px 10px; }
    .dcv1-view-tabs { margin: 8px 10px; }
    .dcv1-view-tab { padding: 0 5px; font-size: 10px; }
    .dcv1-grid { grid-template-columns: repeat(2,minmax(0,1fr)); padding: 4px 10px 14px; gap: 9px; }
    .dcv1-collection-grid { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }
    .dcv1-collection-info { padding: 8px 6px; }
    .dcv1-account-pages { padding-left: 10px; padding-right: 10px; }
  }
`;
