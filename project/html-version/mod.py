import os

path = '/home/aio/manualbook-generator/project/html-version/new.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_block = """    <!-- IMPORT DOCX BLOCK -->
    <div style="display:flex;flex-direction:column;gap:12px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
      <div style="font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#a0aec0">Import</div>
      <label class="btn btn-ghost" style="background:transparent;color:#e2e8f0;border:1px dashed rgba(0,210,255,0.3);cursor:pointer; display:flex; justify-content:center; align-items:center; padding:8px; border-radius:6px; font-size:13px; transition:all 0.2s;" onmouseover="this.style.background='rgba(0,210,255,0.1)'" onmouseout="this.style.background='transparent'">
        <span style="margin-right:6px">⬆</span> <span id="importDocxEditorBtnText" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width:180px;">Pilih file DOCX</span>
        <input type="file" id="docxInputEditorSide" accept=".docx" style="display:none">
      </label>
      <button class="btn btn-primary" id="generateDocxBtn" disabled style="background:#00d2ff;color:#0f1117;width:100%; border:none; padding:8px; border-radius:6px; font-weight:600; font-size:13px; cursor:not-allowed; opacity:0.5; transition:all 0.2s;">✦ Generate Halaman</button>
      <div class="status" id="importStatusEditor" style="font-size:11px;line-height:1.5;color:#6b7382;">Pilih file DOCX dulu, lalu klik Generate.</div>
    </div>
"""

script_block = """
<!-- Prevent leaving page accidentally -->
<script>
window.addEventListener('beforeunload', function (e) {
  if (window.hasUnsavedChanges || window.hasUnsavedProjectChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
</script>

<script src="docx-importer.js"></script>
<script>
    let selectedDocxFile = null;
    document.getElementById('docxInputEditorSide').addEventListener('change', function(e) {
      selectedDocxFile = e.target.files[0];
      const statusEl = document.getElementById('importStatusEditor');
      const genBtn = document.getElementById('generateDocxBtn');
      const btnText = document.getElementById('importDocxEditorBtnText');
      if(selectedDocxFile) {
        btnText.innerText = selectedDocxFile.name;
        statusEl.innerText = "File siap. Klik Generate.";
        statusEl.style.color = "#4ade80";
        genBtn.disabled = false;
        genBtn.style.opacity = "1";
        genBtn.style.cursor = "pointer";
      } else {
        btnText.innerText = "Pilih file DOCX";
        statusEl.innerText = "Pilih file DOCX dulu, lalu klik Generate.";
        statusEl.style.color = "#6b7382";
        genBtn.disabled = true;
        genBtn.style.opacity = "0.5";
        genBtn.style.cursor = "not-allowed";
      }
    });

    document.getElementById('generateDocxBtn').addEventListener('click', function() {
      if(!selectedDocxFile) return;
      const statusEl = document.getElementById('importStatusEditor');
      
      window.handleDocxUpload(selectedDocxFile, function(msg, status) {
         statusEl.innerText = msg;
         if (status === 'err') statusEl.style.color = "#f87171";
         else if (status === 'ok') statusEl.style.color = "#4ade80";
         else statusEl.style.color = "#00d2ff";
      });
    });

    window.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'import') {
        setTimeout(() => {
          const compSidebar = document.getElementById('componentsSidebar');
          if (compSidebar && !compSidebar.classList.contains('open')) {
             compSidebar.classList.add('open');
             const pdfPages = document.getElementById('pdfPages');
             if(pdfPages) pdfPages.classList.add('components-sidebar-open');
          }
          document.getElementById('docxInputEditorSide').click();
        }, 500);
      }
    });
</script>
</body>
</html>"""

# Inject Import Block
target_1 = '<div class="components-body">'
new_content = content.replace(target_1, target_1 + '\n' + import_block, 1)

# Inject Script Block
target_2 = """</body>
</html>"""
new_content = new_content.replace(target_2, script_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Modified new.html successfully")
