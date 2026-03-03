<style>
/* Hide ToC on editor page */
.md-sidebar--secondary { display: none !important; }
.md-content { padding-right: 0 !important; }
</style>

<div class="dd-hero dd-hero--page">
  <div class="dd-hero-inner">
    <h1>Editor</h1>
    <p>Create → Preview → Submit (WikiRequest) → Approve with <b>WikiEdit</b> label.</p>
  </div>
</div>

<div class="dd-editor3" id="ddEditor3">
  <div class="dd-editor3-top">
    <div class="dd-row">
      <div class="dd-group">
        <div class="dd-label">Action</div>
        <select id="edMode" class="dd-select">
          <option value="update">Edit existing</option>
          <option value="create">Create new</option>
        </select>
      </div>

      <div class="dd-group">
        <div class="dd-label">Page type</div>
        <select id="edType" class="dd-select"></select>
      </div>

      <div class="dd-group">
        <div class="dd-label">Title</div>
        <input id="edTitle" class="dd-input" placeholder="e.g. Grunt" />
      </div>

      <div class="dd-group">
        <div class="dd-label">Path</div>
        <input id="edPath" class="dd-input" placeholder="auto-generated (or edit)" />
      </div>

      <button id="edGenPath" class="dd-btn" type="button">Generate</button>
      <button id="edLoad" class="dd-btn" type="button">Load</button>
      <button id="edTemplate" class="dd-btn dd-btn-primary" type="button">Template</button>
    </div>

    <div class="dd-row dd-row-right">
      <button id="edMedia" class="dd-btn" type="button">Media</button>
      <button id="edAddIndex" class="dd-btn" type="button">Auto-add to Index: ON</button>
      <button id="edSaveDraft" class="dd-btn" type="button">Save Draft</button>
      <button id="edLoadDraft" class="dd-btn" type="button">Load Draft</button>
      <button id="edSubmit" class="dd-btn dd-btn-primary" type="button">Submit (Issue)</button>
      <button id="edExport" class="dd-btn" type="button">Export .md</button>
    </div>
  </div>

  <div class="dd-editor3-body">
    <div class="dd-pane dd-pane-editor">
      <div class="dd-pane-head">
        <div class="dd-pane-title">Blocks</div>
        <div class="dd-pane-meta" id="edStatus">Ready</div>
      </div>
      <div id="edHolder" class="dd-blocks"></div>
    </div>

    <div class="dd-pane dd-pane-preview">
      <div class="dd-pane-head">
        <div class="dd-pane-title">Preview</div>
        <div class="dd-pane-meta" id="edPreviewStatus">Live</div>
      </div>
      <div id="edPreview" class="dd-preview"></div>
    </div>

    <aside class="dd-toolbelt" id="edToolbelt">
      <div class="dd-toolbelt-head">
        <div class="dd-toolbelt-title">Toolbelt</div>
        <div class="dd-toolbelt-sub">Drag blocks in</div>
      </div>

      <div class="dd-toolbelt-list">
        <div class="dd-tool" draggable="true" data-tool="h2">Heading</div>
        <div class="dd-tool" draggable="true" data-tool="p">Text</div>
        <div class="dd-tool" draggable="true" data-tool="ul">Bullets</div>
        <div class="dd-tool" draggable="true" data-tool="table">Table</div>
        <div class="dd-tool" draggable="true" data-tool="divider">Divider</div>
        <div class="dd-tool" draggable="true" data-tool="tip">Tip Callout</div>
        <div class="dd-tool" draggable="true" data-tool="info">Info Callout</div>
        <div class="dd-tool" draggable="true" data-tool="warn">Warning Callout</div>
      </div>

      <div class="dd-toolbelt-foot">
        <div class="dd-muted">
          Publishing is via Issues. Your label <b>WikiEdit</b> approves.
        </div>
      </div>
    </aside>
  </div>
</div>

<div class="dd-modal" id="edModal" aria-hidden="true">
  <div class="dd-modal-card">
    <div class="dd-modal-head">
      <div class="dd-modal-title" id="edModalTitle">Tool</div>
      <button class="dd-btn dd-btn-icon" id="edModalClose" type="button">✕</button>
    </div>
    <div class="dd-modal-body" id="edModalBody"></div>
    <div class="dd-modal-foot" id="edModalFoot"></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.2/dist/editorjs.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.1/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/list@1.9.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/table@2.4.1/dist/table.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/quote@2.6.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/code@2.9.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.3.0/dist/bundle.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.11/dist/purify.min.js"></script>
