<style>
/* Hide ToC + fixed right sidebar while editing (this page only) */
.md-sidebar--secondary { display: none !important; }
.md-content { padding-right: 0 !important; }
</style>

<div class="dd-hero dd-hero--page">
  <div class="dd-hero-inner">
    <h1>Editor</h1>
    <p>Create / edit pages with blocks • preview • submit for publish.</p>
  </div>
</div>

<div class="dd-editor2" id="ddEditor2">
  <div class="dd-editor2-top">
    <div class="dd-row">
      <div class="dd-group">
        <div class="dd-label">Mode</div>
        <select id="ddMode" class="dd-select">
          <option value="update">Edit existing</option>
          <option value="create">Create new</option>
        </select>
      </div>

      <div class="dd-group">
        <div class="dd-label">Page path</div>
        <input id="ddPath" class="dd-input" placeholder="e.g. game-content/enemies/grunt.md" />
      </div>

      <div class="dd-group">
        <div class="dd-label">Template</div>
        <select id="ddTemplate" class="dd-select"></select>
      </div>

      <button id="ddApplyTemplate" class="dd-btn dd-btn-primary" type="button">Apply</button>
      <button id="ddLoad" class="dd-btn" type="button">Load</button>
      <button id="ddSaveDraft" class="dd-btn" type="button">Save Draft</button>
      <button id="ddLoadDraft" class="dd-btn" type="button">Load Draft</button>
    </div>

    <div class="dd-row dd-row-right">
      <button id="ddInsertMedia" class="dd-btn" type="button">Media</button>
      <button id="ddInsertTable" class="dd-btn" type="button">Table</button>
      <button id="ddTogglePreview" class="dd-btn dd-hide-desktop" type="button">Preview</button>
      <button id="ddSubmit" class="dd-btn dd-btn-primary" type="button">Submit (Issue)</button>
      <button id="ddExport" class="dd-btn" type="button">Export .md</button>
    </div>
  </div>

  <div class="dd-editor2-body">
    <div class="dd-pane dd-pane-editor" id="ddPaneEditor">
      <div class="dd-pane-head">
        <div class="dd-pane-title">Blocks</div>
        <div class="dd-pane-meta" id="ddStatus">Ready</div>
      </div>
      <div id="ddBlocks" class="dd-blocks"></div>
    </div>

    <div class="dd-pane dd-pane-preview" id="ddPanePreview">
      <div class="dd-pane-head">
        <div class="dd-pane-title">Preview</div>
        <div class="dd-pane-meta" id="ddPreviewStatus">Live</div>
      </div>
      <div id="ddPreview" class="dd-preview"></div>
    </div>
  </div>

  <div class="dd-editor2-foot">
    <div class="dd-muted">
      Submit creates a GitHub Issue payload. A bot workflow can publish it into the repo.
    </div>
  </div>

  <div class="dd-modal" id="ddModal" aria-hidden="true">
    <div class="dd-modal-card">
      <div class="dd-modal-head">
        <div class="dd-modal-title" id="ddModalTitle">Tool</div>
        <button class="dd-btn dd-btn-icon" id="ddModalClose" type="button">✕</button>
      </div>
      <div class="dd-modal-body" id="ddModalBody"></div>
      <div class="dd-modal-foot" id="ddModalFoot"></div>
    </div>
  </div>
</div>

<!-- Block editor + markdown preview -->
<script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.2/dist/editorjs.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.1/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/list@1.9.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/table@2.4.1/dist/table.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/quote@2.6.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/code@2.9.0/dist/bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.3.0/dist/bundle.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.11/dist/purify.min.js"></script>
