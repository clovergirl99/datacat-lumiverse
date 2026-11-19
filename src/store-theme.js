// A compact, neutral storefront theme. Scoped to the DataCat extension.
export const STORE_THEME = `
  .dcv1-root, .dcv1-page-modal-host {
    --dc-bg: #0c0b10;
    --dc-panel: #111015;
    --dc-panel-2: #19161f;
    --dc-border: rgba(171, 151, 204, .12);
    --dc-text: #e5e2ea;
    --dc-muted: #827b8d;
    --dc-yellow: #ac92d5;
    --dc-purple: #ac92d5;
    font-family: var(--lumiverse-font-family, system-ui, sans-serif);
    font-size: 12px;
    line-height: 1.45;
    color-scheme: dark;
  }
  .dcv1-root { background: var(--dc-bg); }
  .dcv1-toolbar { padding: 6px 12px; gap: 6px; background: #111015; border-color: var(--dc-border); }
  .dcv1-toolbar-brand { color: var(--dc-text); font-size: 12px; font-weight: 650; letter-spacing: -.15px; }
  .dcv1-version-badge { background: transparent; border: 0; color: #665d74; font-size: 8px; padding: 0; }
  .dcv1-toolbar-icon { width: 25px; min-height: 25px; }
  .dcv1-toolbar-icon svg { width: 16px; height: 16px; }
  .dcv1-toolbar-close { min-width: 24px; font-size: 18px; }
  .dcv1-view-tabs { margin: 8px 10px 12px; padding: 2px; gap: 3px; border: 1px solid var(--dc-border); border-radius: 8px; background: transparent; scrollbar-width: none; }
  .dcv1-view-tabs::-webkit-scrollbar { display: none; }
  .dcv1-view-tab { flex: 1 1 0; min-width: 0; min-height: 24px; padding: 0 7px; border: 1px solid transparent; border-radius: 6px; font-size: 11px; font-weight: 500; color: var(--dc-muted); white-space: nowrap; }
  .dcv1-view-tab:hover { color: var(--dc-text); background: #151219; }
  .dcv1-view-tab[data-active="true"] { color: #b69adf; background: #211a2b; border-color: rgba(172,146,213,.18); box-shadow: none; }
  .dcv1-search-row { grid-template-columns: auto minmax(0,1fr) 36px; padding: 0 12px 10px; gap: 7px; background: transparent; }
  .dcv1-button, .dcv1-search { border-color: var(--dc-border); border-radius: 7px; font-size: 11px; min-height: 30px; }
  .dcv1-button { background: #151219; color: #c5bdce; }
  .dcv1-button:hover:not(:disabled) { border-color: rgba(172,146,213,.35); background: #201a29; }
  .dcv1-button[data-primary], .dcv1-card [data-import], .dcv1-fresh-row [data-import] { color: #d9c8f0; background: #2a2038; border: 1px solid #40304f; border-radius: 7px; }
  .dcv1-button[data-primary]:hover:not(:disabled) { background: #362747; }
  .dcv1-search { background: #0f0d13; color: var(--dc-text); }
  .dcv1-search::placeholder { color: #645d70; }
  .dcv1-search:focus { border-color: #76608e; box-shadow: 0 0 0 2px rgba(172,146,213,.09); }
  .dcv1-sort-trigger, .dcv1-sort-menu, .dcv1-menu-panel { background: #141118; border-color: var(--dc-border); }
  .dcv1-sort-trigger { border-radius: 7px; }
  .dcv1-sort-trigger svg { width: 18px; height: 18px; }
  .dcv1-sort-badge { color: #c3acd9; background: #292034; border-color: #443351; }
  .dcv1-scroll, .dcv1-account-pages, .dcv1-tag-groups { scrollbar-width: thin; scrollbar-color: #342a3e transparent; }
  .dcv1-scroll::-webkit-scrollbar, .dcv1-account-pages::-webkit-scrollbar { width: 5px; }
  .dcv1-scroll::-webkit-scrollbar-thumb, .dcv1-account-pages::-webkit-scrollbar-thumb { background: #342a3e; border-radius: 5px; }
  .dcv1-grid { grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 12px; padding: 4px 12px 16px; }
  .dcv1-card { background: #100e14; border: 1px solid var(--dc-border); border-radius: 10px; }
  .dcv1-cover-wrap { border-radius: 8px 8px 0 0; }
  .dcv1-card-body { padding: 9px; gap: 6px; }
  .dcv1-card-title { font-size: 12px; font-weight: 650; }
  .dcv1-card-author, .dcv1-card-author .dcv1-creator-link { color: #9e91ae; }
  .dcv1-cover-missing { background: #1b1523; color: #9b7dbf; }
  .dcv1-fresh-section { padding: 6px 0; }
  .dcv1-fresh-head { padding: 4px 0 10px; }
  .dcv1-fresh-head strong { font-size: 12px; font-weight: 650; }
  .dcv1-fresh-list { gap: 10px; }
  .dcv1-fresh-row { min-height: 145px; padding: 10px; border: 1px solid var(--dc-border); border-radius: 10px; background: #100e14; grid-template-columns: 84px minmax(0,1fr) 53px; gap: 7px; }
  .dcv1-fresh-row:last-child { border: 1px solid var(--dc-border); padding-bottom: 10px; }
  .dcv1-fresh-cover { width: 84px; min-height: 112px; border-radius: 7px; background: #1b1523; }
  .dcv1-fresh-title { font-size: 12px; font-weight: 650; }
  .dcv1-fresh-description { color: #8a8194; font-size: 11px; font-style: normal; line-height: 1.45; }
  .dcv1-fresh-creator, .dcv1-fresh-meta { font-size: 10px; }
  .dcv1-tag, .dcv1-chip { border: 1px solid var(--dc-border); background: #1b1523; color: #a89ab9; box-shadow: none; }
  .dcv1-tag[data-selected="true"], .dcv1-chip { background: #292034; color: #d2bce9; }
  .dcv1-tag-panel, .dcv1-character-modal, .dcv1-local-character-modal { background: #111015; border-color: var(--dc-border); }
  .dcv1-character-modal-head, .dcv1-character-modal-actions { background: #111015; border-color: var(--dc-border); }
  .dcv1-imports { padding: 4px 0; }
  .dcv1-import-row { padding: 8px; border: 1px solid var(--dc-border); border-radius: 9px; background: #100e14; }
  .dcv1-imports-head strong { font-size: 12px; }
  .dcv1-account-footer { padding: 5px 12px calc(5px + env(safe-area-inset-bottom,0px)); background: #0f0d13; border-top: 1px solid var(--dc-border); }
  .dcv1-account-summary { font-size: 9px; color: #81748f; }
  .dcv1-account-pages { position: relative; padding: 0 12px 16px; gap: 0; }
  .dcv1-account-tools { padding: 0 0 12px; gap: 8px; }
  .dcv1-account-tools > strong { font-size: 12px; font-weight: 650; }
  .dcv1-account-tools-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; width: 100%; }
  .dcv1-account-tools-row .dcv1-search { flex: 1; min-width: 0; width: auto; }
  .dcv1-account-tools[data-overview="false"] .dcv1-search { flex: 1 1 150px; }
  .dcv1-account-tools[data-overview="true"] { position: absolute; top: 0; right: 12px; z-index: 4; padding: 0; }
  .dcv1-account-tools[data-overview="true"] .dcv1-account-tools-row { gap: 5px; }
  .dcv1-account-tools[data-overview="true"] .dcv1-search { position: absolute; top: 33px; right: 0; width: min(240px,70vw); background: #16121c; }
  .dcv1-account-tools .dcv1-search[hidden] { display: none; }
  .dcv1-shelf-filter-toggle { display: grid; place-items: center; width: 25px; min-height: 25px; padding: 0; background: transparent; }
  .dcv1-account-tools[data-overview="true"] .dcv1-account-settings summary { padding: 4px 7px; font-size: 10px; }
  .dcv1-account-settings { position: relative; flex: 0 0 auto; color: var(--dc-muted); font-size: 11px; }
  .dcv1-account-settings summary { list-style: none; cursor: pointer; border: 1px solid var(--dc-border); border-radius: 7px; padding: 6px 9px; }
  .dcv1-account-settings summary::-webkit-details-marker { display: none; }
  .dcv1-account-settings > div { position: absolute; top: calc(100% + 5px); right: 0; width: 195px; z-index: 12; padding: 9px; display: grid; gap: 7px; background: #16121c; border: 1px solid var(--dc-border); border-radius: 8px; box-shadow: 0 8px 25px #0008; }
  .dcv1-account-results { padding: 0; }
  .dcv1-shelf-section { margin: 0 0 20px; }
  .dcv1-shelf-heading { display: flex; align-items: center; gap: 8px; margin: 3px 0 9px; }
  .dcv1-shelf-heading h3 { margin: 0; font-size: 12px; font-weight: 650; }
  .dcv1-shelf-heading > span { color: #665d74; font-size: 10px; }
  .dcv1-shelf-heading button { margin-left: auto; border: 0; background: transparent; color: #9f87bf; cursor: pointer; font: inherit; font-size: 10px; padding: 4px 0 4px 8px; }
  .dcv1-collection-grid { display: grid; grid-template-columns: repeat(auto-fill,112px); gap: 9px; }
  .dcv1-collection-tile { min-width: 0; padding: 0; overflow: hidden; text-align: left; background: #0e0c12; border: 1px solid var(--dc-border); border-radius: 10px; color: var(--dc-text); cursor: pointer; font: inherit; }
  .dcv1-collection-tile:hover { border-color: #51405f; }
  .dcv1-collection-art { display: grid; grid-template-columns: repeat(2,1fr); aspect-ratio: 1.5; overflow: hidden; gap: 1px; background: #0c0b10; }
  .dcv1-collection-art > span { display: grid; place-items: center; position: relative; overflow: hidden; background: linear-gradient(140deg,#33273e,#16111d); color: #8a6da7; font-size: 18px; font-weight: 500; }
  .dcv1-collection-art > span:nth-child(2) { background: linear-gradient(140deg,#26313e,#121923); color: #6c8baf; }
  .dcv1-collection-art > span:nth-child(3) { background: linear-gradient(140deg,#2c3430,#171c1a); color: #7b9a89; }
  .dcv1-collection-art > span:nth-child(4) { background: linear-gradient(140deg,#3b2f36,#1a1217); color: #a48597; }
  .dcv1-collection-art img { position: absolute; width: 100%; height: 100%; object-fit: cover; inset: 0; }
  .dcv1-collection-info { display: grid; gap: 3px; padding: 9px; }
  .dcv1-collection-info strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; font-weight: 650; }
  .dcv1-collection-info small { color: #776d83; font-size: 9px; }
  .dcv1-creator-list { display: grid; gap: 5px; }
  .dcv1-account-row { flex-direction: row; align-items: center; gap: 10px; padding: 5px 8px; border: 1px solid var(--dc-border); border-radius: 9px; background: #0d0b10; }
  .dcv1-account-row:hover { background: #17121d; border-color: #382b45; }
  .dcv1-creator-initial { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; border-radius: 50%; background: #241c30; color: #aa8bd0; font-size: 14px; font-weight: 650; }
  .dcv1-account-row .dcv1-account-row-copy { display: grid; gap: 2px; min-width: 0; flex: 1; }
  .dcv1-account-row strong { color: var(--dc-text); font-size: 11px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dcv1-account-row small { font-size: 10px; color: #766a86; }
  .dcv1-account-row .dcv1-row-arrow { color: #695777; font-size: 17px; padding: 0 4px; }
  .dcv1-account-page-note { margin: 2px 0; padding: 14px; background: #111015; border: 1px solid var(--dc-border); border-radius: 10px; color: var(--dc-muted); font-size: 11px; }
  .dcv1-account-page-note h3 { color: var(--dc-text); font-size: 13px; margin-top: 0; }
  .dcv1-account-message { margin: 4px 0 9px; }
  button.dcv1-native-launch[data-spindle-ext-id="datacat_client_v1"],
  button.dcv1-native-launch[data-active="true"] { color: #a68bc9 !important; background: transparent !important; box-shadow: none !important; border-left: 0 !important; }
  .dcv1-native-launch::before, .dcv1-native-launch::after { display: none !important; }
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
