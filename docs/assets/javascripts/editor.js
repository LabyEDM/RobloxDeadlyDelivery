(() => {
  const app = document.querySelector('[data-dd-editor="1"]');
  if (!app) return;

  // ---------- Elements ----------
  const pageSelect = document.getElementById('ddPageSelect');
  const pathInput = document.getElementById('ddPathInput');
  const btnLoad = document.getElementById('ddLoadGithub');
  const btnLoadDraft = document.getElementById('ddLoadDraft');
  const btnSaveDraft = document.getElementById('ddSaveDraft');
  const btnExport = document.getElementById('ddExportMd');
  const btnPlaceholder = document.getElementById('ddInsertPlaceholder');
  const btnInfobox = document.getElementById('ddInfobox');
  const btnTable = document.getElementById('ddTableBuilder');

  const tabEdit = document.getElementById('ddTabEdit');
  const tabPrev = document.getElementById('ddTabPreview');

  const editor = document.getElementById('ddEditor');
  const preview = document.getElementById('ddPreview');
  const status = document.getElementById('ddStatus');
  const previewStatus = document.getElementById('ddPreviewStatus');

  const modal = document.getElementById('ddModal');
  const modalTitle = document.getElementById('ddModalTitle');
  const modalBody = document.getElementById('ddModalBody');
  const modalFoot = document.getElementById('ddModalFoot');
  const modalClose = document.getElementById('ddModalClose');

  const panelEditor = document.getElementById('ddPanelEditor');
  const panelPreview = document.getElementById('ddPanelPreview');

  // ---------- Config ----------
  const REPO_OWNER = "LabyEDM";
  const REPO_NAME  = "RobloxDeadlyDelivery";
  const BRANCH     = "main";

  // “Friendly global index”: key pages people will edit most.
  const PAGES = [
    { group: "Home", items: [
      { title: "Home", path: "index.md" },
      { title: "Getting Started", path: "getting-started/index.md" },
      { title: "Update Log", path: "update-log/index.md" },
    ]},
    { group: "Community", items: [
      { title: "Community Hub", path: "community/index.md" },
      { title: "Events", path: "community/events/index.md" },
      { title: "Lore", path: "community/lore/index.md" },
      { title: "Quick Tips", path: "community/quick-tips/index.md" },
      { title: "Guides", path: "community/guides/index.md" },
      { title: "Creators", path: "community/creators/index.md" },
    ]},
    { group: "Game Content", items: [
      { title: "Game Content Hub", path: "game-content/index.md" },
      { title: "Hub Overview", path: "game-content/hub/index.md" },
      { title: "Classes", path: "game-content/classes/index.md" },
      { title: "Skins", path: "game-content/skins/index.md" },
      { title: "Cooking", path: "game-content/cooking/index.md" },
      { title: "NPCs", path: "game-content/npcs/index.md" },
      { title: "Badges", path: "game-content/badges/index.md" },
      { title: "Keybinds", path: "game-content/keybinds/index.md" },
      { title: "Enemies", path: "game-content/enemies/index.md" },
      { title: "Bosses", path: "game-content/bosses/index.md" },
      { title: "Floors", path: "game-content/floors/index.md" },
      { title: "Special Floors", path: "game-content/floors/special-floors/index.md" },
      { title: "Hostages", path: "game-content/hostages/index.md" },
      { title: "Mutations", path: "game-content/mutations/index.md" },
      { title: "Multipliers", path: "game-content/multipliers/index.md" },
      { title: "Food", path: "game-content/food/index.md" },
      { title: "Tools", path: "game-content/tools/index.md" },
    ]},
    { group: "Misc", items: [
      { title: "Misc Hub", path: "misc/index.md" },
      { title: "Media Hub", path: "misc/media/index.md" },
      { title: "Videos", path: "misc/media/youtube/index.md" },
      { title: "Photos", path: "misc/media/photos/index.md" },
      { title: "Audio", path: "misc/media/audio/index.md" },
      { title: "Archive", path: "misc/media/archive/index.md" },
      { title: "Credits", path: "misc/credits/index.md" },
    ]},
  ];

  const STORAGE_KEY = (path) => `ddwiki:draft:${path}`;

  // ---------- Helpers ----------
  function setStatus(msg) {
    status.textContent = msg;
  }

  function setPreviewStatus(msg) {
    previewStatus.textContent = msg;
  }

  function currentPath() {
    const manual = (pathInput && pathInput.value || "").trim();
    if (manual) return manual.replace(/^\/+/, "");
    const sel = pageSelect.value;
    return sel || "index.md";
  }

  function rawUrlFor(path) {
    // Raw markdown from GitHub
    const safe = path.replace(/^\/+/, "");
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/docs/${safe}`;
  }

  function insertAtCursor(text) {
    const el = editor;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
    renderPreview();
  }

  // ---------- Preview ----------
  function renderPreview() {
    const md = editor.value || "";
    const hasMarked = typeof window.marked !== "undefined";
    const hasPurify = typeof window.DOMPurify !== "undefined";

    if (!hasMarked) {
      preview.innerHTML = `<div class="dd-preview-empty">Preview engine not loaded (offline). Your text is saved; export is fine.</div>`;
      setPreviewStatus("Offline preview");
      return;
    }

    try {
      const html = window.marked.parse(md, { breaks: true, gfm: true });
      const safe = hasPurify ? window.DOMPurify.sanitize(html) : html;
      preview.innerHTML = safe || `<div class="dd-preview-empty">Nothing to preview yet.</div>`;
      setPreviewStatus("Live");
    } catch (e) {
      preview.innerHTML = `<div class="dd-preview-empty">Preview error: ${String(e)}</div>`;
      setPreviewStatus("Error");
    }
  }

  // Autosave (light)
  let autosaveTimer = null;
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const path = currentPath();
      localStorage.setItem(STORAGE_KEY(path), editor.value || "");
      setStatus(`Autosaved draft • ${path}`);
    }, 900);
  }

  // ---------- Modal ----------
  function openModal(title, bodyHtml, footHtml = "") {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalFoot.innerHTML = footHtml;
    modal.classList.add("dd-open");
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.classList.remove("dd-open");
    modal.setAttribute("aria-hidden", "true");
  }
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ---------- Builders ----------
  function showPlaceholders() {
    const options = [
      { label: "— (dash placeholder)", value: "—" },
      { label: "TBD", value: "TBD" },
      { label: "WIP note", value: "!!! note\n    WIP — needs verification.\n" },
      { label: "Tip block", value: "!!! tip\n    Tip goes here.\n" },
      { label: "Info block", value: "!!! info\n    Info goes here.\n" },
      { label: "Collapsible section", value: "??? info \"More\"\n    Details here.\n" },
    ];

    const list = options.map((o, i) =>
      `<button class="dd-btn" data-ph="${i}" type="button" style="width:100%;justify-content:flex-start;">${o.label}</button>`
    ).join("");

    openModal(
      "Placeholders",
      `<div style="display:grid;gap:8px;">${list}</div>`,
      `<button class="dd-btn dd-btn-primary" id="ddPhClose" type="button">Close</button>`
    );

    modalBody.querySelectorAll("[data-ph]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-ph"));
        insertAtCursor(options[idx].value);
        closeModal();
      });
    });

    document.getElementById("ddPhClose").addEventListener("click", closeModal);
  }

  function showInfobox() {
    const body = `
      <div style="display:grid;gap:10px;">
        <div style="opacity:.85;">Add key/value pairs (creates a 2-column infobox table).</div>
        <div id="ddInfoRows" style="display:grid;gap:8px;"></div>
        <button class="dd-btn" id="ddInfoAdd" type="button">+ Add field</button>
      </div>
    `;

    const foot = `
      <button class="dd-btn" id="ddInfoCancel" type="button">Cancel</button>
      <button class="dd-btn dd-btn-primary" id="ddInfoInsert" type="button">Insert</button>
    `;

    openModal("Infobox Builder", body, foot);

    const rowsEl = document.getElementById("ddInfoRows");
    const addRow = (k = "", v = "") => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 1fr auto";
      row.style.gap = "8px";
      row.innerHTML = `
        <input class="dd-input" placeholder="Field" value="${k.replace(/"/g, "&quot;")}" />
        <input class="dd-input" placeholder="Value" value="${v.replace(/"/g, "&quot;")}" />
        <button class="dd-btn dd-btn-icon" type="button" aria-label="Remove">✕</button>
      `;
      row.querySelector("button").addEventListener("click", () => row.remove());
      rowsEl.appendChild(row);
    };

    addRow("Type", "—");
    addRow("Location", "—");

    document.getElementById("ddInfoAdd").addEventListener("click", () => addRow("—", "—"));
    document.getElementById("ddInfoCancel").addEventListener("click", closeModal);

    document.getElementById("ddInfoInsert").addEventListener("click", () => {
      const rows = Array.from(rowsEl.children).map(r => {
        const inputs = r.querySelectorAll("input");
        return { k: (inputs[0].value || "—").trim(), v: (inputs[1].value || "—").trim() };
      }).filter(x => x.k.length > 0);

      const md = [
        "| Field | Value |",
        "|---|---|",
        ...rows.map(x => `| ${x.k} | ${x.v} |`)
      ].join("\n") + "\n";

      insertAtCursor("\n" + md + "\n");
      closeModal();
    });
  }

  function showTableBuilder() {
    const presets = [
      { name: "Enemies", cols: ["Enemy", "Floors", "Threat", "Drops", "Notes"] },
      { name: "Bosses", cols: ["Boss", "Where", "Key mechanics", "Rewards"] },
      { name: "Classes", cols: ["Class", "Playstyle", "Strengths", "Weaknesses", "How to unlock"] },
      { name: "Keybinds", cols: ["Action", "Key", "Notes"] },
      { name: "Tools", cols: ["Tool", "Use", "Where obtained", "Notes"] },
      { name: "Floors", cols: ["Floor", "Theme", "Hazards", "Notes"] },
      { name: "Events", cols: ["Event", "Dates", "Key rewards", "Notes"] },
    ];

    const presetOptions = presets.map((p, i) => `<option value="${i}">${p.name}</option>`).join("");

    const body = `
      <div style="display:grid;gap:10px;">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label class="dd-label">Preset</label>
          <select id="ddTblPreset" class="dd-select" style="min-width:220px">${presetOptions}</select>
          <button class="dd-btn" id="ddTblApply" type="button">Apply</button>
          <button class="dd-btn" id="ddTblAddRow" type="button">+ Row</button>
        </div>
        <div id="ddTblGrid" style="overflow:auto;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.01);"></div>
        <div style="opacity:.8;font-size:.9em;">
          Tip: Use placeholders like <b>—</b> until verified.
        </div>
      </div>
    `;

    const foot = `
      <button class="dd-btn" id="ddTblCancel" type="button">Cancel</button>
      <button class="dd-btn dd-btn-primary" id="ddTblInsert" type="button">Insert Table</button>
    `;

    openModal("Table Builder", body, foot);

    const grid = document.getElementById("ddTblGrid");
    let cols = presets[0].cols.slice();
    let rows = [cols.map(() => "—")];

    function renderGrid() {
      const header = cols.map(c => `<th style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.10);text-align:left;">${c}</th>`).join("");
      const bodyRows = rows.map((r, ri) => {
        const tds = r.map((v, ci) =>
          `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.06);">
            <input data-ri="${ri}" data-ci="${ci}" class="dd-input" style="min-width:160px;height:30px;" value="${String(v).replace(/"/g,'&quot;')}" />
          </td>`
        ).join("");
        return `<tr>${tds}</tr>`;
      }).join("");

      grid.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>${header}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      `;

      grid.querySelectorAll("input[data-ri]").forEach(inp => {
        inp.addEventListener("input", () => {
          const ri = Number(inp.getAttribute("data-ri"));
          const ci = Number(inp.getAttribute("data-ci"));
          rows[ri][ci] = inp.value;
        });
      });
    }

    function toMarkdownTable() {
      const head = `| ${cols.join(" | ")} |`;
      const sep  = `|${cols.map(() => "---").join("|")}|`;
      const lines = rows.map(r => `| ${r.map(x => (x && String(x).trim()) ? String(x).trim() : "—").join(" | ")} |`);
      return [head, sep, ...lines].join("\n") + "\n";
    }

    renderGrid();

    document.getElementById("ddTblApply").addEventListener("click", () => {
      const idx = Number(document.getElementById("ddTblPreset").value);
      cols = presets[idx].cols.slice();
      rows = [cols.map(() => "—")];
      renderGrid();
    });

    document.getElementById("ddTblAddRow").addEventListener("click", () => {
      rows.push(cols.map(() => "—"));
      renderGrid();
    });

    document.getElementById("ddTblCancel").addEventListener("click", closeModal);

    document.getElementById("ddTblInsert").addEventListener("click", () => {
      insertAtCursor("\n" + toMarkdownTable() + "\n");
      closeModal();
    });
  }

  // ---------- Actions ----------
  function populateSelect() {
    pageSelect.innerHTML = "";
    for (const section of PAGES) {
      const og = document.createElement("optgroup");
      og.label = section.group;
      for (const item of section.items) {
        const opt = document.createElement("option");
        opt.value = item.path;
        opt.textContent = item.title;
        og.appendChild(opt);
      }
      pageSelect.appendChild(og);
    }
    pageSelect.value = "index.md";
  }

  async function loadFromGithub(path) {
    const url = rawUrlFor(path);
    setStatus(`Loading… ${path}`);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      editor.value = text;
      renderPreview();
      setStatus(`Loaded from GitHub • ${path}`);
      setPreviewStatus("Live");
    } catch (e) {
      setStatus(`Load failed • ${path}`);
      preview.innerHTML = `<div class="dd-preview-empty">Could not load from GitHub.<br><br><b>URL:</b> ${url}<br><b>Error:</b> ${String(e)}</div>`;
      setPreviewStatus("Load failed");
    }
  }

  function saveDraft() {
    const path = currentPath();
    localStorage.setItem(STORAGE_KEY(path), editor.value || "");
    setStatus(`Saved draft • ${path}`);
  }

  function loadDraft() {
    const path = currentPath();
    const draft = localStorage.getItem(STORAGE_KEY(path));
    if (!draft) {
      setStatus(`No draft found • ${path}`);
      return;
    }
    editor.value = draft;
    renderPreview();
    setStatus(`Draft loaded • ${path}`);
  }

  function exportMd() {
    const path = currentPath();
    const name = path.split("/").slice(-2).join("_").replace(/[^a-zA-Z0-9_\.]/g, "_") || "page.md";
    const blob = new Blob([editor.value || ""], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.endsWith(".md") ? name : (name + ".md");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(`Exported • ${a.download}`);
  }

  // ---------- Mobile tabs ----------
  function setMobileTab(which) {
    if (!tabEdit || !tabPrev) return;
    if (which === "edit") {
      tabEdit.classList.add("dd-seg-active");
      tabPrev.classList.remove("dd-seg-active");
      panelEditor.style.display = "";
      panelPreview.style.display = "none";
    } else {
      tabPrev.classList.add("dd-seg-active");
      tabEdit.classList.remove("dd-seg-active");
      panelPreview.style.display = "";
      panelEditor.style.display = "none";
      renderPreview();
    }
  }

  // ---------- Wire events ----------
  populateSelect();
  renderPreview();

  pageSelect.addEventListener("change", () => {
    pathInput.value = "";
    const p = currentPath();
    const draft = localStorage.getItem(STORAGE_KEY(p));
    setStatus(draft ? `Draft available • ${p}` : `Selected • ${p}`);
  });

  btnLoad.addEventListener("click", () => loadFromGithub(currentPath()));
  btnSaveDraft.addEventListener("click", saveDraft);
  btnLoadDraft.addEventListener("click", loadDraft);
  btnExport.addEventListener("click", exportMd);

  btnPlaceholder.addEventListener("click", showPlaceholders);
  btnInfobox.addEventListener("click", showInfobox);
  btnTable.addEventListener("click", showTableBuilder);

  editor.addEventListener("input", () => {
    setStatus("Editing…");
    scheduleAutosave();
    renderPreview();
  });

  // Ctrl+S draft save
  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const saveCombo = (isMac && e.metaKey && e.key.toLowerCase() === "s") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "s");
    if (saveCombo) {
      e.preventDefault();
      saveDraft();
    }
  });

  if (tabEdit && tabPrev) {
    tabEdit.addEventListener("click", () => setMobileTab("edit"));
    tabPrev.addEventListener("click", () => setMobileTab("preview"));
  }

  // Hint on first load
  setStatus("Pick a page • Load • Edit • Export");
})();
