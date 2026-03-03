(() => {
  const REPO = "LabyEDM/RobloxDeadlyDelivery";
  const BRANCH = "main";

  const $ = (id) => document.getElementById(id);
  const modal = $("edModal");
  const modalTitle = $("edModalTitle");
  const modalBody = $("edModalBody");
  const modalFoot = $("edModalFoot");
  $("edModalClose").addEventListener("click", () => closeModal());

  function openModal(t, body, foot=""){
    modalTitle.textContent = t;
    modalBody.innerHTML = body;
    modalFoot.innerHTML = foot;
    modal.classList.add("dd-open");
    modal.setAttribute("aria-hidden","false");
  }
  function closeModal(){
    modal.classList.remove("dd-open");
    modal.setAttribute("aria-hidden","true");
  }
  modal.addEventListener("click", (e)=>{ if(e.target===modal) closeModal(); });

  const edMode  = $("edMode");
  const edType  = $("edType");
  const edTitle = $("edTitle");
  const edPath  = $("edPath");

  const btnGen  = $("edGenPath");
  const btnLoad = $("edLoad");
  const btnTpl  = $("edTemplate");
  const btnMed  = $("edMedia");
  const btnDraftS = $("edSaveDraft");
  const btnDraftL = $("edLoadDraft");
  const btnSubmit = $("edSubmit");
  const btnExport = $("edExport");
  const btnAddIndex = $("edAddIndex");

  const status = $("edStatus");
  const previewStatus = $("edPreviewStatus");
  const preview = $("edPreview");

  let autoAddIndex = true;
  btnAddIndex.addEventListener("click", () => {
    autoAddIndex = !autoAddIndex;
    btnAddIndex.textContent = `Auto-add to Index: ${autoAddIndex ? "ON" : "OFF"}`;
  });

  const TYPE_MAP = [
    { id:"enemy", name:"Enemy", base:"game-content/enemies", index:"game-content/enemies/index.md", header:"Enemy" },
    { id:"boss", name:"Boss", base:"game-content/bosses", index:"game-content/bosses/index.md", header:"Boss" },
    { id:"class", name:"Class", base:"game-content/classes", index:"game-content/classes/index.md", header:"Class" },
    { id:"skin", name:"Skin", base:"game-content/skins", index:"game-content/skins/index.md", header:"Skin" },
    { id:"npc", name:"NPC", base:"game-content/npcs", index:"game-content/npcs/index.md", header:"NPC" },
    { id:"badge", name:"Badge", base:"game-content/badges", index:"game-content/badges/index.md", header:"Badge" },
    { id:"keybind", name:"Keybinds", base:"game-content/keybinds", index:"game-content/keybinds/index.md", header:"Action" },
    { id:"floor", name:"Floor", base:"game-content/floors", index:"game-content/floors/index.md", header:"Floor" },
    { id:"specialfloor", name:"Special Floor", base:"game-content/floors/special-floors", index:"game-content/floors/special-floors/index.md", header:"Floor" },
    { id:"hostage", name:"Hostage", base:"game-content/hostages", index:"game-content/hostages/index.md", header:"Hostage" },
    { id:"mutation", name:"Mutation", base:"game-content/mutations", index:"game-content/mutations/index.md", header:"Mutation" },
    { id:"multiplier", name:"Multiplier", base:"game-content/multipliers", index:"game-content/multipliers/index.md", header:"Multiplier" },
    { id:"food", name:"Food", base:"game-content/food", index:"game-content/food/index.md", header:"Item" },
    { id:"tool", name:"Tool", base:"game-content/tools", index:"game-content/tools/index.md", header:"Tool" },
    { id:"update", name:"Update Log", base:"update-log", index:"update-log/index.md", header:"Update" },
  ];

  edType.innerHTML = TYPE_MAP.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  edType.value = "enemy";

  function setStatus(t){ status.textContent = t; }

  function slugify(s){
    return (s||"")
      .toLowerCase()
      .trim()
      .replace(/['"]/g,"")
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"")
      .slice(0, 64) || "new-page";
  }

  function rawUrl(path){
    const safe = String(path||"").replace(/^\/+/,"");
    return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/docs/${safe}`;
  }

  function guessPath(){
    const t = TYPE_MAP.find(x=>x.id===edType.value) || TYPE_MAP[0];
    const title = edTitle.value.trim() || "New Page";
    const slug = slugify(title);
    if (t.id === "update") {
      // Updates live in update-log/index.md (append entry), but we still allow separate files if you want later
      return "update-log/index.md";
    }
    return `${t.base}/${slug}.md`;
  }

  btnGen.addEventListener("click", () => {
    edPath.value = guessPath();
    setStatus("Path generated");
  });

  // ---------- EditorJS ----------
  const editor = new EditorJS({
    holder: "edHolder",
    tools: {
      header: Header,
      list: List,
      table: Table,
      quote: Quote,
      code: CodeTool,
      delimiter: Delimiter,
    },
    data: { blocks: [] },
    autofocus: true,
    onChange: () => { renderPreview(); scheduleAutosave(); }
  });

  // Templates
  const TEMPLATES = {
    enemy: [
      { type:"header", data:{ text:"Enemy Name", level:1 } },
      { type:"paragraph", data:{ text:"Short description." } },
      { type:"header", data:{ text:"Overview", level:2 } },
      { type:"paragraph", data:{ text:"| Field | Value |\n|---|---|\n| Threat | — |\n| Floors | — |\n| Drops | — |\n" } },
      { type:"header", data:{ text:"Behavior", level:2 } },
      { type:"list", data:{ style:"unordered", items:["—","—"] } },
      { type:"header", data:{ text:"Drops", level:2 } },
      { type:"paragraph", data:{ text:"| Drop | Chance | Notes |\n|---|---:|---|\n| — | — | — |\n" } },
    ],
    boss: [
      { type:"header", data:{ text:"Boss Name", level:1 } },
      { type:"paragraph", data:{ text:"Short overview + where to find." } },
      { type:"header", data:{ text:"Mechanics", level:2 } },
      { type:"list", data:{ style:"unordered", items:["Phase 1 —","Phase 2 —","Enrage —"] } },
      { type:"header", data:{ text:"Rewards", level:2 } },
      { type:"paragraph", data:{ text:"| Reward | Condition | Notes |\n|---|---|---|\n| — | — | — |\n" } },
    ],
    generic: [
      { type:"header", data:{ text:"Title", level:1 } },
      { type:"paragraph", data:{ text:"Write an overview." } },
      { type:"header", data:{ text:"Details", level:2 } },
      { type:"list", data:{ style:"unordered", items:["—","—"] } },
    ],
    updateEntry: [
      { type:"header", data:{ text:"YYYY-MM-DD — Title", level:3 } },
      { type:"list", data:{ style:"unordered", items:["Change 1","Change 2","Notes"] } },
      { type:"delimiter", data:{} }
    ]
  };

  async function applyTemplate(){
    const type = edType.value;
    const title = edTitle.value.trim();
    let blocks = null;

    if (type === "enemy") blocks = TEMPLATES.enemy;
    else if (type === "boss") blocks = TEMPLATES.boss;
    else if (type === "update") blocks = TEMPLATES.updateEntry;
    else blocks = TEMPLATES.generic;

    // If title is set, patch first header
    if (blocks && title) {
      const b0 = blocks[0];
      if (b0 && b0.type === "header") b0.data.text = title;
    }

    await editor.render({ blocks: blocks || [] });
    setStatus("Template applied");
    renderPreview();
  }

  btnTpl.addEventListener("click", () => {
    openModal(
      "Template",
      `
        <div style="display:grid;gap:10px;">
          <div style="opacity:.85;">Apply a template for the selected page type.</div>
        </div>
      `,
      `
        <button class="dd-btn" id="tplCancel" type="button">Cancel</button>
        <button class="dd-btn dd-btn-primary" id="tplApply" type="button">Apply</button>
      `
    );
    document.getElementById("tplCancel").onclick = closeModal;
    document.getElementById("tplApply").onclick = async () => {
      await applyTemplate();
      closeModal();
    };
  });

  // Toolbelt drag → insert
  const toolbelt = document.getElementById("edToolbelt");
  let dragTool = null;

  toolbelt.querySelectorAll(".dd-tool").forEach(el => {
    el.addEventListener("dragstart", (e) => {
      dragTool = el.getAttribute("data-tool");
      e.dataTransfer.setData("text/plain", dragTool);
    });
  });

  document.getElementById("edHolder").addEventListener("dragover", (e) => e.preventDefault());
  document.getElementById("edHolder").addEventListener("drop", async (e) => {
    e.preventDefault();
    const t = e.dataTransfer.getData("text/plain") || dragTool;
    if (!t) return;

    if (t === "h2") editor.blocks.insert("header", { text:"Heading", level:2 }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "p") editor.blocks.insert("paragraph", { text:"Text…" }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "ul") editor.blocks.insert("list", { style:"unordered", items:["—"] }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "table") editor.blocks.insert("table", { content:[["Field","Value"],["—","—"]] }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "divider") editor.blocks.insert("delimiter", {}, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "tip") editor.blocks.insert("paragraph", { text:"!!! tip\n    Tip goes here.\n" }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "info") editor.blocks.insert("paragraph", { text:"!!! info\n    Info goes here.\n" }, {}, editor.blocks.getBlocksCount(), true);
    else if (t === "warn") editor.blocks.insert("paragraph", { text:"!!! warning\n    Warning goes here.\n" }, {}, editor.blocks.getBlocksCount(), true);

    setStatus("Block inserted");
    renderPreview();
  });

  // Blocks → markdown (simple)
  function esc(s){ return String(s ?? "").replace(/\r/g,""); }
  function blocksToMarkdown(data){
    const out = [];
    for(const b of (data.blocks||[])){
      if(b.type==="header"){
        const lvl = Math.min(6, Math.max(1, b.data.level||2));
        out.push(`${"#".repeat(lvl)} ${esc(b.data.text).replace(/\n/g," ")}`); out.push("");
      } else if(b.type==="paragraph"){
        out.push(esc(b.data.text)); out.push("");
      } else if(b.type==="list"){
        const items = b.data.items||[];
        if((b.data.style||"unordered")==="ordered") items.forEach((it,i)=> out.push(`${i+1}. ${esc(it)}`));
        else items.forEach(it=> out.push(`- ${esc(it)}`));
        out.push("");
      } else if(b.type==="quote"){
        out.push(`> ${esc(b.data.text)}`); if(b.data.caption) out.push(`> — ${esc(b.data.caption)}`); out.push("");
      } else if(b.type==="code"){
        out.push("```"); out.push(esc(b.data.code)); out.push("```"); out.push("");
      } else if(b.type==="table"){
        const c = b.data.content||[];
        if(c.length){
          const head = `| ${c[0].map(esc).join(" | ")} |`;
          const sep  = `|${c[0].map(()=> "---").join("|")}|`;
          out.push(head); out.push(sep);
          for(let r=1;r<c.length;r++) out.push(`| ${c[r].map(esc).join(" | ")} |`);
          out.push("");
        }
      } else if(b.type==="delimiter"){
        out.push("---"); out.push("");
      }
    }
    return out.join("\n").trim() + "\n";
  }

  async function getMarkdown(){
    const data = await editor.save();
    return blocksToMarkdown(data);
  }

  async function renderPreview(){
    const md = await getMarkdown();
    if(typeof marked === "undefined"){
      preview.innerHTML = `<div style="opacity:.75;border:1px dashed rgba(255,255,255,.12);border-radius:16px;padding:16px;">Preview unavailable (offline).</div>`;
      previewStatus.textContent = "Offline";
      return;
    }
    const html = marked.parse(md, { breaks:true, gfm:true });
    preview.innerHTML = (typeof DOMPurify !== "undefined") ? DOMPurify.sanitize(html) : html;
    previewStatus.textContent = "Live";
  }

  // Autosave
  let t = null;
  function scheduleAutosave(){
    clearTimeout(t);
    t = setTimeout(async ()=>{
      const p = (edPath.value||"").trim() || "index.md";
      const md = await getMarkdown();
      localStorage.setItem(`ddwiki:v3:draft:${p}`, md);
      setStatus(`Autosaved • ${p}`);
    }, 900);
  }

  btnDraftS.addEventListener("click", async ()=>{
    const p = (edPath.value||"").trim() || "index.md";
    const md = await getMarkdown();
    localStorage.setItem(`ddwiki:v3:draft:${p}`, md);
    setStatus(`Draft saved • ${p}`);
  });

  btnDraftL.addEventListener("click", async ()=>{
    const p = (edPath.value||"").trim() || "index.md";
    const md = localStorage.getItem(`ddwiki:v3:draft:${p}`);
    if(!md){ setStatus(`No draft • ${p}`); return; }
    await editor.render({ blocks: [{ type:"code", data:{ code: md } }] });
    setStatus(`Draft loaded • ${p}`);
    renderPreview();
  });

  // Load existing (as code block to preserve formatting)
  btnLoad.addEventListener("click", async ()=>{
    const p = (edPath.value||"").trim();
    if(!p){ setStatus("Set a path first."); return; }
    const url = rawUrl(p);
    setStatus(`Loading • ${p}`);
    try{
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const md = await res.text();
      await editor.render({ blocks: [{ type:"code", data:{ code: md } }] });
      setStatus(`Loaded • ${p}`);
      renderPreview();
    }catch(e){
      setStatus(`Load failed • ${p}`);
    }
  });

  // Media picker (from generated /assets/media_index.json)
  async function loadMediaIndex(){
    const url = `/assets/media_index.json?r=${Date.now()}`;
    try{
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) return null;
      return await res.json();
    }catch{
      return null;
    }
  }

  btnMed.addEventListener("click", async ()=>{
    const idx = await loadMediaIndex();
    const imgs = idx?.images || [];
    const auds = idx?.audio || [];

    const body = `
      <div style="display:grid;gap:10px;">
        <div style="opacity:.85;">Pick existing repo media, or paste a URL.</div>

        <div style="display:grid;gap:8px;">
          <label class="dd-label">Search</label>
          <input id="mSearch" class="dd-input" style="min-width:100%;" placeholder="type to filter..." />
        </div>

        <div style="display:grid;gap:12px;">
          <div>
            <div style="font-weight:800;margin-bottom:6px;">Images</div>
            <div id="mImgs" style="display:grid;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr));"></div>
          </div>
          <div>
            <div style="font-weight:800;margin-bottom:6px;">Audio</div>
            <div id="mAuds" style="display:grid;gap:8px;"></div>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:10px;">
            <div style="font-weight:800;margin-bottom:6px;">URL Inserts</div>
            <input id="mImgUrl" class="dd-input" style="min-width:100%;margin-bottom:8px;" placeholder="Image URL (https://...)" />
            <input id="mYtUrl" class="dd-input" style="min-width:100%;margin-bottom:8px;" placeholder="YouTube URL (https://youtube.com/watch?v=...)" />
            <input id="mMp3Url" class="dd-input" style="min-width:100%;" placeholder="Audio URL (mp3)" />
          </div>
        </div>
      </div>
    `;

    const foot = `
      <button class="dd-btn" id="mCancel" type="button">Cancel</button>
      <button class="dd-btn dd-btn-primary" id="mInsert" type="button">Insert</button>
    `;

    openModal("Media", body, foot);

    const imgsEl = document.getElementById("mImgs");
    const audsEl = document.getElementById("mAuds");
    const search = document.getElementById("mSearch");

    let selected = { img:null, aud:null };

    function renderLists(q=""){
      const qq = q.toLowerCase().trim();
      const fi = imgs.filter(x => !qq || x.name.toLowerCase().includes(qq)).slice(0, 12);
      const fa = auds.filter(x => !qq || x.name.toLowerCase().includes(qq)).slice(0, 12);

      imgsEl.innerHTML = fi.map(x => `
        <button class="dd-btn" type="button" data-img="${x.path}" style="height:auto;padding:10px;border-radius:16px;display:grid;gap:6px;text-align:left;">
          <img src="/${x.path}" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.10);" />
          <div style="font-weight:800;font-size:.9em;opacity:.92;">${x.name}</div>
        </button>
      `).join("") || `<div style="opacity:.7;">No images found.</div>`;

      audsEl.innerHTML = fa.map(x => `
        <button class="dd-btn" type="button" data-aud="${x.path}" style="height:auto;padding:10px;border-radius:16px;display:grid;gap:6px;text-align:left;">
          <div style="font-weight:800;opacity:.92;">${x.name}</div>
          <audio class="dd-audio" controls src="/${x.path}"></audio>
        </button>
      `).join("") || `<div style="opacity:.7;">No audio found.</div>`;

      imgsEl.querySelectorAll("[data-img]").forEach(b => b.onclick = () => { selected.img = b.getAttribute("data-img"); selected.aud = null; setStatus("Selected image"); });
      audsEl.querySelectorAll("[data-aud]").forEach(b => b.onclick = () => { selected.aud = b.getAttribute("data-aud"); selected.img = null; setStatus("Selected audio"); });
    }

    renderLists();
    search.oninput = () => renderLists(search.value);

    document.getElementById("mCancel").onclick = closeModal;

    document.getElementById("mInsert").onclick = async () => {
      const blocks = [];
      const imgUrl = (document.getElementById("mImgUrl").value||"").trim();
      const ytUrl  = (document.getElementById("mYtUrl").value||"").trim();
      const mp3Url = (document.getElementById("mMp3Url").value||"").trim();

      if (selected.img) {
        blocks.push({ type:"paragraph", data:{ text:`<figure class="dd-figure"><img src="/${selected.img}" alt="${selected.img}"><figcaption></figcaption></figure>` } });
      }
      if (selected.aud) {
        blocks.push({ type:"paragraph", data:{ text:`<audio class="dd-audio" controls src="/${selected.aud}"></audio>` } });
      }
      if (imgUrl) {
        blocks.push({ type:"paragraph", data:{ text:`<figure class="dd-figure"><img src="${imgUrl}" alt="Image"><figcaption></figcaption></figure>` } });
      }
      if (ytUrl) {
        const emb = ytUrl.includes("watch?v=") ? ytUrl.replace("watch?v=","embed/") : ytUrl;
        blocks.push({ type:"paragraph", data:{ text:`<div class="dd-embed"><iframe src="${emb}" frameborder="0" allowfullscreen></iframe></div>` } });
      }
      if (mp3Url) {
        blocks.push({ type:"paragraph", data:{ text:`<audio class="dd-audio" controls src="${mp3Url}"></audio>` } });
      }

      if (blocks.length) {
        const cur = await editor.save();
        await editor.render({ blocks: [...(cur.blocks||[]), ...blocks] });
        renderPreview();
        setStatus("Media inserted");
      }
      closeModal();
    };
  });

  // Export .md
  btnExport.addEventListener("click", async ()=>{
    const md = await getMarkdown();
    const path = (edPath.value||"page.md").trim().split("/").pop();
    const name = (path || "page.md").endsWith(".md") ? path : (path + ".md");
    const blob = new Blob([md], { type:"text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(`Exported • ${name}`);
  });

  // Submit → issue request
  btnSubmit.addEventListener("click", async ()=>{
    const path = (edPath.value||"").trim();
    if(!path){ setStatus("Set a path first."); return; }
    const md = await getMarkdown();
    const type = edType.value;
    const title = edTitle.value.trim() || "Untitled";

    const tm = TYPE_MAP.find(x=>x.id===type) || TYPE_MAP[0];

    const payload = {
      tag: "WikiEdit",
      mode: edMode.value,
      type,
      title,
      path: path.replace(/^\/+/,""),
      index_update: autoAddIndex && tm.index ? { index_path: tm.index } : null,
      content_markdown: md
    };

    const json = JSON.stringify(payload, null, 2);

    try { await navigator.clipboard.writeText(json); } catch {}

    const issueTitle = encodeURIComponent(`WikiEdit: ${payload.path}`);
    const url = `https://github.com/${REPO}/issues/new?template=wiki_request.yml&title=${issueTitle}`;
    window.open(url, "_blank");

    openModal(
      "Submit WikiRequest",
      `<div style="display:grid;gap:10px;">
         <div><b>Payload copied</b> (if allowed). Paste it into the Issue field <b>Payload (JSON)</b>.</div>
         <textarea style="width:100%;min-height:240px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.02);color:inherit;padding:10px;">${json.replace(/</g,"&lt;")}</textarea>
         <div style="opacity:.75;">After review, apply the label <b>WikiEdit</b> to publish.</div>
       </div>`,
      `<button class="dd-btn dd-btn-primary" type="button" id="okClose">Done</button>`
    );
    document.getElementById("okClose").onclick = closeModal;
  });

  // initial
  (async ()=>{
    edPath.value = guessPath();
    await applyTemplate();
    await renderPreview();
  })();
})();
