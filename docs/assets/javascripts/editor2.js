(() => {
  const REPO = "LabyEDM/RobloxDeadlyDelivery";
  const BRANCH = "main";

  const $ = (id) => document.getElementById(id);

  const modeSel = $("ddMode");
  const pathInp = $("ddPath");
  const tplSel  = $("ddTemplate");
  const btnTpl  = $("ddApplyTemplate");
  const btnLoad = $("ddLoad");
  const btnSD   = $("ddSaveDraft");
  const btnLD   = $("ddLoadDraft");
  const btnMed  = $("ddInsertMedia");
  const btnTbl  = $("ddInsertTable");
  const btnPrev = $("ddTogglePreview");
  const btnSub  = $("ddSubmit");
  const btnExp  = $("ddExport");

  const status = $("ddStatus");
  const previewStatus = $("ddPreviewStatus");
  const preview = $("ddPreview");

  const modal = $("ddModal");
  const modalTitle = $("ddModalTitle");
  const modalBody  = $("ddModalBody");
  const modalFoot  = $("ddModalFoot");
  $("ddModalClose").addEventListener("click", () => closeModal());

  const DRAFT_KEY = (p) => `ddwiki:v2:draft:${p}`;

  function setStatus(t){ status.textContent = t; }
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

  // --- Templates (Editor.js block format) ---
  const TEMPLATES = [
    { id:"blank", name:"Blank", data:{ blocks:[] } },
    { id:"enemy", name:"Enemy Page", data:{ blocks:[
      { type:"header", data:{ text:"Enemy Name", level:1 } },
      { type:"paragraph", data:{ text:"Short description." } },
      { type:"header", data:{ text:"Infobox", level:2 } },
      { type:"paragraph", data:{ text:"| Field | Value |\\n|---|---|\\n| Threat | — |\\n| Floors | — |\\n| Drops | — |\\n" } },
      { type:"header", data:{ text:"Behavior", level:2 } },
      { type:"list", data:{ style:"unordered", items:["—","—"] } },
      { type:"header", data:{ text:"Drops", level:2 } },
      { type:"paragraph", data:{ text:"| Drop | Chance | Notes |\\n|---|---:|---|\\n| — | — | — |\\n" } },
    ]}},
    { id:"boss", name:"Boss Page", data:{ blocks:[
      { type:"header", data:{ text:"Boss Name", level:1 } },
      { type:"paragraph", data:{ text:"Short overview + where to find." } },
      { type:"header", data:{ text:"Mechanics", level:2 } },
      { type:"list", data:{ style:"unordered", items:["Phase 1 —","Phase 2 —","Enrage —"] } },
      { type:"header", data:{ text:"Rewards", level:2 } },
      { type:"paragraph", data:{ text:"| Reward | Condition | Notes |\\n|---|---|---|\\n| — | — | — |\\n" } },
    ]}},
    { id:"update", name:"Update Log Entry", data:{ blocks:[
      { type:"header", data:{ text:"YYYY-MM-DD — Update Title", level:3 } },
      { type:"list", data:{ style:"unordered", items:["Change 1","Change 2","Notes"] } },
      { type:"delimiter", data:{} }
    ]}},
  ];

  // Populate template select
  tplSel.innerHTML = TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  tplSel.value = "blank";

  // --- Editor.js instance ---
  const editor = new EditorJS({
    holder: "ddBlocks",
    tools: {
      header: Header,
      list: List,
      table: Table,
      quote: Quote,
      code: CodeTool,
      delimiter: Delimiter,
    },
    data: TEMPLATES.find(t=>t.id==="blank").data,
    autofocus: true,
    onChange: () => { renderPreview(); scheduleAutosave(); }
  });

  // --- Convert blocks to Markdown (limited, but solid for a wiki) ---
  function esc(s){ return String(s ?? "").replace(/\r/g,""); }

  function blocksToMarkdown(data){
    const out = [];
    for(const b of (data.blocks||[])){
      if(b.type==="header"){
        const lvl = Math.min(6, Math.max(1, b.data.level||2));
        out.push(`${"#".repeat(lvl)} ${esc(b.data.text).replace(/\n/g," ")}`);
        out.push("");
      } else if(b.type==="paragraph"){
        out.push(esc(b.data.text));
        out.push("");
      } else if(b.type==="list"){
        const items = b.data.items||[];
        if((b.data.style||"unordered")==="ordered"){
          items.forEach((it,i)=> out.push(`${i+1}. ${esc(it)}`));
        } else {
          items.forEach(it=> out.push(`- ${esc(it)}`));
        }
        out.push("");
      } else if(b.type==="quote"){
        out.push(`> ${esc(b.data.text)}`);
        if(b.data.caption) out.push(`> — ${esc(b.data.caption)}`);
        out.push("");
      } else if(b.type==="code"){
        out.push("```");
        out.push(esc(b.data.code));
        out.push("```");
        out.push("");
      } else if(b.type==="table"){
        const content = b.data.content||[];
        if(content.length){
          const head = `| ${content[0].map(esc).join(" | ")} |`;
          const sep  = `|${content[0].map(()=> "---").join("|")}|`;
          out.push(head);
          out.push(sep);
          for(let r=1;r<content.length;r++){
            out.push(`| ${content[r].map(esc).join(" | ")} |`);
          }
          out.push("");
        }
      } else if(b.type==="delimiter"){
        out.push("---");
        out.push("");
      } else {
        // fallback
        out.push(`<!-- Unsupported block: ${b.type} -->`);
        out.push("");
      }
    }
    return out.join("\n").trim() + "\n";
  }

  async function getMarkdown(){
    const data = await editor.save();
    return blocksToMarkdown(data);
  }

  // --- Preview ---
  async function renderPreview(){
    const md = await getMarkdown();
    if(typeof marked === "undefined"){
      preview.innerHTML = `<div style="opacity:.75;border:1px dashed rgba(255,255,255,.12);border-radius:16px;padding:16px;">Preview engine unavailable (offline).</div>`;
      previewStatus.textContent = "Offline";
      return;
    }
    const html = marked.parse(md, { breaks:true, gfm:true });
    preview.innerHTML = (typeof DOMPurify !== "undefined") ? DOMPurify.sanitize(html) : html;
    previewStatus.textContent = "Live";
  }
  renderPreview();

  // --- Autosave ---
  let t = null;
  function scheduleAutosave(){
    clearTimeout(t);
    t = setTimeout(async ()=>{
      const p = (pathInp.value||"").trim() || "index.md";
      const md = await getMarkdown();
      localStorage.setItem(DRAFT_KEY(p), md);
      setStatus(`Autosaved • ${p}`);
    }, 900);
  }

  // --- Actions ---
  btnTpl.addEventListener("click", async ()=>{
    const tpl = TEMPLATES.find(t=>t.id===tplSel.value) || TEMPLATES[0];
    await editor.render(tpl.data);
    setStatus(`Template applied • ${tpl.name}`);
    renderPreview();
  });

  btnSD.addEventListener("click", async ()=>{
    const p = (pathInp.value||"").trim() || "index.md";
    const md = await getMarkdown();
    localStorage.setItem(DRAFT_KEY(p), md);
    setStatus(`Draft saved • ${p}`);
  });

  btnLD.addEventListener("click", async ()=>{
    const p = (pathInp.value||"").trim() || "index.md";
    const md = localStorage.getItem(DRAFT_KEY(p));
    if(!md){ setStatus(`No draft • ${p}`); return; }
    // Minimal import: put markdown into a single paragraph block so you can keep working
    await editor.render({ blocks: [{ type:"paragraph", data:{ text: md.replace(/</g,"&lt;") } }] });
    setStatus(`Draft loaded • ${p}`);
    renderPreview();
  });

  btnLoad.addEventListener("click", async ()=>{
    const p = (pathInp.value||"").trim();
    if(!p){ setStatus("Enter a page path to load."); return; }
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/docs/${p.replace(/^\/+/,"")}`;
    setStatus(`Loading • ${p}`);
    try{
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const md = await res.text();
      await editor.render({ blocks: [{ type:"paragraph", data:{ text: md.replace(/</g,"&lt;") } }] });
      setStatus(`Loaded • ${p}`);
      renderPreview();
    }catch(e){
      setStatus(`Load failed • ${p}`);
    }
  });

  btnPrev.addEventListener("click", ()=>{
    const panePrev = document.getElementById("ddPanePreview");
    panePrev.style.display = (panePrev.style.display==="none") ? "" : "none";
  });

  btnExp.addEventListener("click", async ()=>{
    const p = ((pathInp.value||"").trim() || "page.md").split("/").pop();
    const md = await getMarkdown();
    const blob = new Blob([md], { type:"text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = p.endsWith(".md") ? p : (p + ".md");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(`Exported • ${a.download}`);
  });

  // Media tool: inserts clean embed blocks (URL based for now)
  btnMed.addEventListener("click", ()=>{
    openModal(
      "Media",
      `
      <div style="display:grid;gap:10px;">
        <div style="opacity:.85;">Insert media by URL (clean, wiki-safe).</div>

        <label class="dd-label">Image URL</label>
        <input id="mImg" class="dd-input" placeholder="https://.../image.png" style="min-width:100%;" />

        <label class="dd-label">YouTube URL</label>
        <input id="mYt" class="dd-input" placeholder="https://youtube.com/watch?v=..." style="min-width:100%;" />

        <label class="dd-label">Audio URL (mp3)</label>
        <input id="mMp3" class="dd-input" placeholder="https://.../file.mp3" style="min-width:100%;" />
      </div>
      `,
      `
      <button class="dd-btn" id="mCancel" type="button">Cancel</button>
      <button class="dd-btn dd-btn-primary" id="mInsert" type="button">Insert</button>
      `
    );

    document.getElementById("mCancel").onclick = closeModal;
    document.getElementById("mInsert").onclick = async () => {
      const img = (document.getElementById("mImg").value||"").trim();
      const yt  = (document.getElementById("mYt").value||"").trim();
      const mp3 = (document.getElementById("mMp3").value||"").trim();

      const blocks = [];
      if(img){
        blocks.push({ type:"paragraph", data:{ text:`<figure class="dd-figure"><img src="${img}" alt="Image"><figcaption></figcaption></figure>` } });
      }
      if(yt){
        // keep it simple — user can paste proper embed later, preview renders it
        blocks.push({ type:"paragraph", data:{ text:`<div class="dd-embed"><iframe src="${yt.replace("watch?v=","embed/")}" frameborder="0" allowfullscreen></iframe></div>` } });
      }
      if(mp3){
        blocks.push({ type:"paragraph", data:{ text:`<audio class="dd-audio" controls src="${mp3}"></audio>` } });
      }

      if(blocks.length){
        const cur = await editor.save();
        await editor.render({ blocks: [...(cur.blocks||[]), ...blocks] });
        renderPreview();
        setStatus("Media inserted");
      }
      closeModal();
    };
  });

  // Table builder: quick “CSV-ish” UI
  btnTbl.addEventListener("click", ()=>{
    openModal(
      "Table Builder",
      `
      <div style="display:grid;gap:10px;">
        <div style="opacity:.85;">Paste rows (comma-separated). First row = header.</div>
        <textarea id="tCsv" style="width:100%;min-height:180px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.02);color:inherit;padding:10px;"></textarea>
      </div>
      `,
      `
      <button class="dd-btn" id="tCancel" type="button">Cancel</button>
      <button class="dd-btn dd-btn-primary" id="tInsert" type="button">Insert</button>
      `
    );

    document.getElementById("tCancel").onclick = closeModal;
    document.getElementById("tInsert").onclick = async () => {
      const raw = (document.getElementById("tCsv").value||"").trim();
      if(!raw){ closeModal(); return; }
      const rows = raw.split(/\r?\n/).map(l => l.split(",").map(x=>x.trim()));
      const cur = await editor.save();
      await editor.render({ blocks: [...(cur.blocks||[]), { type:"table", data:{ content: rows } }] });
      renderPreview();
      setStatus("Table inserted");
      closeModal();
    };
  });

  // Submit: creates an Issue payload (copy + open issue template)
  btnSub.addEventListener("click", async ()=>{
    const p = (pathInp.value||"").trim();
    if(!p){ setStatus("Set a page path first."); return; }
    const md = await getMarkdown();
    const payload = {
      mode: modeSel.value,
      path: p.replace(/^\/+/,""),
      content_markdown: md
    };

    const payloadText = JSON.stringify(payload, null, 2);

    try{
      await navigator.clipboard.writeText(payloadText);
    }catch{}

    // Open issue form template (user just paste JSON into the Payload field)
    const title = encodeURIComponent(`WIKI PUBLISH: ${p}`);
    const url = `https://github.com/${REPO}/issues/new?template=wiki_publish.yml&title=${title}`;
    window.open(url, "_blank");

    openModal(
      "Submit (Issue)",
      `
      <div style="display:grid;gap:10px;">
        <div><b>Payload copied</b> (if your browser allowed it). Paste this into the Issue form field named <b>Payload (JSON)</b>.</div>
        <textarea style="width:100%;min-height:220px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.02);color:inherit;padding:10px;">${payloadText.replace(/</g,"&lt;")}</textarea>
      </div>
      `,
      `<button class="dd-btn dd-btn-primary" type="button" id="okClose">Done</button>`
    );
    document.getElementById("okClose").onclick = closeModal;
  });

  // Mobile: show preview on tap
  btnPrev && btnPrev.addEventListener("click", ()=>{ renderPreview(); });

  setStatus("Ready");
})();
