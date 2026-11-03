/* ==========================================================================
   1. THEME & VIEW SWITCHING (DROPDOWN COMPATIBLE)
   ========================================================================== */
let currentTheme = 'consumer';
let storedUploadFiles = [];
let activeObjectUrls = [];

function revokeObjectUrls() {
  activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
  activeObjectUrls = [];
}

function showLanding() {
  document.getElementById('landingView').style.display = 'block';
  document.getElementById('portalWorkspace').style.display = 'none';

  // Reset dropdown state on landing page
  const portalSelect = document.getElementById('portalSelect');
  if (portalSelect) portalSelect.value = "";

  // Remove theme attribute so neither portal styling is active by default
  document.body.removeAttribute('data-theme');
  currentTheme = 'consumer';
  document.getElementById('logoIcon').innerText = "⚖";
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Resume canvas animation loop if it was paused
  ensureAnimationRunning();
}

function handleNavSelect(value) {
  if (!value) return;

  if (value === 'records') {
    openRecordsModal();
    // Keep dropdown displaying the active workspace mode (or blank if home)
    const onLanding = document.getElementById('landingView').style.display !== 'none';
    document.getElementById('portalSelect').value = onLanding ? "" : currentTheme;
    return;
  }

  switchTheme(value);
}

function switchTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  document.getElementById('landingView').style.display = 'none';
  document.getElementById('portalWorkspace').style.display = 'block';

  const isInspector = (theme === 'inspector');
  const portalSelect = document.getElementById('portalSelect');
  if (portalSelect) portalSelect.value = theme;

  document.getElementById('wsTitle').innerText = isInspector ? "Enforcement Officer Workspace" : "Consumer Protection Scan";
  document.getElementById('wsBadge').innerText = isInspector ? "Mode: Authority" : "Mode: Citizen";
  document.getElementById('logoIcon').innerText = isInspector ? "🛡️" : "⚖";

  clearWorkspace();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   2. RELIABLE DIRECT IMAGE TRIGGERS & DRAG-AND-DROP
   ========================================================================== */
const inputGallery = document.getElementById('fileInputGallery');
const inputCamera = document.getElementById('fileInputCamera');
const dropzoneBox = document.getElementById('dropzoneBox');

function triggerCamera(e) {
  if (e) e.stopPropagation();
  if (inputCamera) {
    inputCamera.value = ''; // Reset value to allow selecting identical file again
    inputCamera.click();
  }
}

function triggerGallery(e) {
  if (e) e.stopPropagation();
  if (inputGallery) {
    inputGallery.value = ''; // Reset value to allow selecting identical file again
    inputGallery.click();
  }
}

function handleFiles(e) {
  const incomingFiles = Array.from(e.target.files || []);
  if (!incomingFiles.length) return;

  // Append new files up to 3 total
  storedUploadFiles = storedUploadFiles.concat(incomingFiles).slice(0, 3);
  window.mockResponseData = null; // Invalidate mock data when real photos are used

  renderSlotPreviews();
}

if (inputGallery) inputGallery.addEventListener('change', handleFiles);
if (inputCamera) inputCamera.addEventListener('change', handleFiles);

// Enable Drag-and-Drop file intake on the capture dropzone
if (dropzoneBox) {
  ['dragenter', 'dragover'].forEach(name => {
    dropzoneBox.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneBox.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzoneBox.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneBox.classList.remove('dragover');
    }, false);
  });

  dropzoneBox.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      handleFiles({ target: { files: dt.files } });
    }
  }, false);
}

function renderSlotPreviews() {
  revokeObjectUrls();

  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`slot${i}`);
    if (!slot) continue;

    const file = storedUploadFiles[i - 1];
    if (file) {
      let previewUrl = '';
      if (typeof file === 'string') {
        previewUrl = file;
      } else {
        previewUrl = URL.createObjectURL(file);
        activeObjectUrls.push(previewUrl);
      }
      slot.innerHTML = `<span class="slot-tag">Angle ${i}</span><img src="${previewUrl}" alt="Angle ${i}" />`;
    } else {
      slot.innerHTML = `<span class="slot-tag">Angle ${i}</span><span class="slot-placeholder">Waiting...</span>`;
    }
  }
  resetTerminal();
}

function clearWorkspace() {
  revokeObjectUrls();
  storedUploadFiles = [];
  window.mockResponseData = null;
  if (inputGallery) inputGallery.value = '';
  if (inputCamera) inputCamera.value = '';
  renderSlotPreviews();
  resetTerminal();
}

function resetTerminal() {
  const term = document.getElementById('terminal');
  if (term) {
    term.innerHTML = `<div style="color: var(--text-dim);">Awaiting image ingest sequence...<span class="cursor-blink"></span></div>`;
  }
  const rc = document.getElementById('resultCard');
  if (rc) rc.style.display = 'none';
}

/* ==========================================================================
   3. DEMO MOCKS PRESETS
   ========================================================================== */
function loadMock(type) {
  clearWorkspace();

  if (type === 'clean') {
    window.mockResponseData = {
      product_name: "Amul Pasteurised Butter",
      generic_name: "Butter",
      manufacturer_name: "Gujarat Cooperative Milk Marketing Federation Ltd.",
      manufacturer_address: "Amul Dairy Road, Anand - 388001, Gujarat, India",
      net_quantity: "500 g",
      mrp: "₹275.00",
      unit_sale_price: "₹0.55/g",
      manufacturing_date: "09/2026",
      use_by_date: "Best before 12 months from packaging",
      consumer_care_details: "Toll Free: 1800 258 3333 | customercare@amul.coop"
    };

    // Preset SVG thumbnail representations
    const cleanSvg = (label) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><rect x="20" y="20" width="260" height="260" rx="12" fill="%231e293b" stroke="%2310b981" stroke-width="3"/><text x="150" y="140" fill="%23ffffff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${label}</text><text x="150" y="170" fill="%2310b981" font-size="13" font-family="sans-serif" text-anchor="middle">✓ Statutory Declared</text></svg>`;

    storedUploadFiles = [
      cleanSvg("Amul Butter Front"),
      cleanSvg("MRP & USP Panel"),
      cleanSvg("Packer & Expiry Panel")
    ];
  } else {
    window.mockResponseData = {
      product_name: "Crunchy Spiced Wafers",
      generic_name: "Potato Chips",
      manufacturer_name: "Snack Time Ltd.",
      manufacturer_address: false, // VIOLATION: Missing physical factory address
      net_quantity: "75 g",
      mrp: "₹30.00",
      unit_sale_price: false, // VIOLATION: Missing unit sale price
      manufacturing_date: false, // VIOLATION: Missing manufacturing date
      use_by_date: "Best before 6 months from packing",
      consumer_care_details: false // VIOLATION: Missing consumer care
    };

    const failSvg = (label) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><rect x="20" y="20" width="260" height="260" rx="12" fill="%231e293b" stroke="%23ef4444" stroke-width="3"/><text x="150" y="140" fill="%23ffffff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${label}</text><text x="150" y="170" fill="%23ef4444" font-size="13" font-family="sans-serif" text-anchor="middle">⚠ Missing Declarations</text></svg>`;

    storedUploadFiles = [
      failSvg("Chips Pack Front"),
      failSvg("Back Panel (No USP)"),
      failSvg("Barcode Flap (No Mfg Date)")
    ];
  }

  renderSlotPreviews();

  const term = document.getElementById('terminal');
  if (term) {
    const isClean = (type === 'clean');
    term.innerHTML = `<div style="color: var(--text-dim);">> Loaded preset: <strong style="color:${isClean ? 'var(--success)' : 'var(--danger)'}">${isClean ? 'Compliant Product' : 'Non-Compliant Product (4 Violations)'}</strong>.<br/>> Click <strong>Run AI Inspection Scan</strong> to evaluate against Rule 6 (2011).<span class="cursor-blink"></span></div>`;
  }
}

/* ==========================================================================
   4. AUDIT PIPELINE & EXECUTION
   ========================================================================== */
async function startTerminalScan() {
  const hasLiveFiles = storedUploadFiles.length > 0 && typeof storedUploadFiles[0] !== 'string';
  const hasMock = Boolean(window.mockResponseData);

  if (!hasLiveFiles && !hasMock) {
    alert("Action Restricted: Please snap or upload 1 to 3 packaging photos first, or select a demo preset.");
    return;
  }

  const term = document.getElementById('terminal');
  term.innerHTML = '';
  document.getElementById('resultCard').style.display = 'none';
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.style.display = 'none';

  const logSteps = [
    `> Ingesting package visual arrays... [OK]`,
    `> Matrix downscaling (max_dimension: 1024)... [OK]`,
    `> Transposing smartphone EXIF orientation matrix... [OK]`
  ];

  for (const step of logSteps) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerText = step;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
    await new Promise(r => setTimeout(r, 160));
  }

  let extractedFields = null;

  if (hasLiveFiles) {
    const statusLine = document.createElement('div');
    statusLine.className = 'term-line';
    statusLine.innerHTML = `> Querying local Qwen2.5-VL via Ollama (temperature=0.0)... <span class="cursor-blink"></span>`;
    term.appendChild(statusLine);
    term.scrollTop = term.scrollHeight;

    const formData = new FormData();
    storedUploadFiles.forEach(file => {
      if (file instanceof File) formData.append('files', file);
    });

    try {
      const res = await fetch('/api/v1/audit', { method: 'POST', body: formData });
      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.detail) errDetail += ` - ${errJson.detail}`;
        } catch (_) {}
        throw new Error(errDetail);
      }
      const json = await res.json();
      extractedFields = json.data || json.result || json.audit || json;
      statusLine.innerHTML = `> Querying local Qwen2.5-VL via Ollama (temperature=0.0)... [OK]`;
    } catch (err) {
      statusLine.innerHTML = `> Querying local Qwen2.5-VL via Ollama (temperature=0.0)... [FAILED]`;
      
      const errDiv = document.createElement('div');
      errDiv.className = 'term-line warning';
      errDiv.style.color = 'var(--danger)';
      errDiv.style.fontWeight = 'bold';
      errDiv.innerText = `> [ERROR] Backend inference failed: ${err.message}`;
      term.appendChild(errDiv);

      const tipDiv = document.createElement('div');
      tipDiv.className = 'term-line';
      tipDiv.style.color = 'var(--text-dim)';
      tipDiv.style.marginTop = '6px';
      tipDiv.innerText = `> Tip: Ensure Ollama is running ('ollama serve') and model 'qwen2.5vl:7b' is pulled.`;
      term.appendChild(tipDiv);

      // Do NOT call renderCompleteAudit({}) on backend failure
      return;
    }
  } else {
    const simLine = document.createElement('div');
    simLine.className = 'term-line';
    simLine.innerText = `> Synthesizing mock preset statutory parameters... [OK]`;
    term.appendChild(simLine);
    await new Promise(r => setTimeout(r, 200));
    extractedFields = window.mockResponseData;
  }

  const evalLine = document.createElement('div');
  evalLine.className = 'term-line';
  evalLine.innerText = `> Evaluating 10 statutory clauses under Rules (2011)... [OK]`;
  term.appendChild(evalLine);
  await new Promise(r => setTimeout(r, 160));

  renderCompleteAudit(extractedFields);
}

function renderCompleteAudit(data) {
  const term = document.getElementById('terminal');
  const rc = document.getElementById('resultCard');
  const detailsContainer = document.getElementById('resultDetails');
  const verdictBadge = document.getElementById('resultVerdict');

  const labelMap = {
    product_name: "Rule 6(1) Product Trade Name",
    generic_name: "Rule 6(1)(b) Generic Name",
    manufacturer_name: "Rule 6(1)(a) Manufacturer Name",
    manufacturer_address: "Rule 6(1)(a) Packer Address",
    net_quantity: "Rule 6(1)(c) Net Metric Quantity",
    mrp: "Rule 6(1)(e) Declared MRP",
    unit_sale_price: "Rule 6(1)(s) Unit Sale Price (USP)",
    manufacturing_date: "Rule 6(1)(d) Date of Packing",
    use_by_date: "Rule 6(1)(d) Best Before / Expiry",
    consumer_care_details: "Rule 6(1)(n) Consumer Helpline"
  };

  let missingCount = 0;
  let itemsHTML = '';

  for (const [key, label] of Object.entries(labelMap)) {
    const rawVal = data ? data[key] : null;
    const isPresent = (
      rawVal !== false &&
      rawVal !== null &&
      rawVal !== undefined &&
      rawVal !== "false" &&
      rawVal !== "None" &&
      rawVal !== "N/A" &&
      rawVal !== ""
    );

    if (!isPresent) missingCount++;

    const displayVal = isPresent ? rawVal : '<em style="color:var(--danger)">Missing / Non-Compliant</em>';

    itemsHTML += `
      <div class="audit-item ${isPresent ? '' : 'violation'}">
        <div class="audit-info">
          <div class="audit-key">${label}</div>
          <div class="audit-val">${displayVal}</div>
        </div>
        <div class="audit-pill ${isPresent ? 'pill-pass' : 'pill-fail'}">
          ${isPresent ? 'FOUND' : 'MISSING'}
        </div>
      </div>
    `;
  }

  const isClean = (missingCount === 0);

  const finalMsg = document.createElement('div');
  finalMsg.className = `term-line ${isClean ? 'success' : 'warning'}`;
  finalMsg.style.fontWeight = 'bold';
  finalMsg.style.marginTop = '8px';
  finalMsg.innerHTML = isClean
    ? `> [SUCCESS] Audit Complete: All 10 Statutory Declarations Verified.<span class="cursor-blink"></span>`
    : `> [ALERT] Audit Complete: ${missingCount} Statutory Violation(s) Flagged.<span class="cursor-blink"></span>`;
  term.appendChild(finalMsg);
  term.scrollTop = term.scrollHeight;

  if (isClean) {
    verdictBadge.className = 'result-verdict-badge compliant';
    verdictBadge.innerText = 'VERIFIED: COMPLIANT';
  } else {
    verdictBadge.className = 'result-verdict-badge non-compliant';
    verdictBadge.innerText = `NON-COMPLIANT (${missingCount} VIOLATIONS)`;
  }

  detailsContainer.innerHTML = itemsHTML;
  rc.style.display = 'block';

  if (currentTheme === 'inspector') {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.style.display = 'block';
  }
}

/* ==========================================================================
   5. CANVAS SIMULATION (RESOURCE-EFFICIENT LOOP)
   ========================================================================== */
const canvas = document.getElementById('animeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let frame = 0;
let animFrameId = null;

function drawScene() {
  const landing = document.getElementById('landingView');
  // Pause animation when landing view is hidden to save GPU/CPU & battery
  if (!landing || landing.style.display === 'none') {
    animFrameId = null;
    return;
  }

  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(200, 250, 60, Math.PI, 0);
  ctx.lineTo(260, 480); ctx.lineTo(140, 480);
  ctx.fill();

  const glow = Math.sin(frame * 0.05) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(0, 242, 254, ${0.4 + glow * 0.6})`;
  ctx.fillRect(170, 230, 35, 10);
  ctx.fillRect(215, 230, 35, 10);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.strokeRect(520, 150, 180, 220);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(520, 150, 180, 220);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText("Net Wt: 1 kg", 540, 190);
  ctx.fillText("MRP: ₹150", 540, 220);

  let scanY = 150 + ((Math.sin(frame * 0.03) + 1) / 2) * 220;
  ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
  ctx.fillRect(520, 150, 180, scanY - 150);
  ctx.fillStyle = '#00f2fe';
  ctx.fillRect(510, scanY, 200, 3);

  frame++;
  animFrameId = requestAnimationFrame(drawScene);
}

function ensureAnimationRunning() {
  if (!animFrameId && canvas) {
    animFrameId = requestAnimationFrame(drawScene);
  }
}

if (canvas) ensureAnimationRunning();

/* ==========================================================================
   6. DATABASE RECORDS MODAL LOGIC
   ========================================================================== */
const recordsModal = document.getElementById('recordsModal');
const recordsList = document.getElementById('recordsList');

function openRecordsModal() {
  if (recordsModal) {
    recordsModal.style.display = 'flex';
    fetchDatabaseRecords();
  }
}

function closeRecordsModal() {
  if (recordsModal) {
    recordsModal.style.display = 'none';
  }
}

// Dismiss modal on clicking outer backdrop overlay
if (recordsModal) {
  recordsModal.addEventListener('click', (e) => {
    if (e.target === recordsModal) {
      closeRecordsModal();
    }
  });
}

// Dismiss modal on pressing Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && recordsModal && recordsModal.style.display !== 'none') {
    closeRecordsModal();
  }
});

async function fetchDatabaseRecords() {
  if (!recordsList) return;
  recordsList.innerHTML = '<p style="color: var(--text-dim);">Querying database.db...</p>';

  try {
    const res = await fetch('/api/v1/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const records = await res.json();

    if (!records || records.length === 0) {
      recordsList.innerHTML = '<p style="color: var(--text-dim);">No scanned products found in database.db.</p>';
      return;
    }

    // Helper to check if a database field is absent
    function formatFieldPill(label, value) {
      const isMissing = !value || value === "Missing" || value === "N/A" || value === "false" || value === false || value === "None";
      const displayVal = isMissing ? "Missing" : value;
      const extraClass = isMissing ? "missing-field" : "";

      return `<div class="db-field-pill ${extraClass}"><strong>${label}:</strong> ${displayVal}</div>`;
    }

    recordsList.innerHTML = records.map(item => `
  <div class="db-record-card">
    <div class="db-record-header">
      <span class="db-record-title">#${item.product_id} — ${item.product_name || 'Unnamed Product'}</span>
      <span class="db-record-meta">${item.created_at || 'Just now'}</span>
    </div>
    <div class="db-record-grid">
      ${formatFieldPill("Generic", item.generic_name)}
      ${formatFieldPill("MRP", item.mrp)}
      ${formatFieldPill("Unit Sale Price", item.unit_sale_price)}
      ${formatFieldPill("Net Quantity", item.net_quantity)}
      ${formatFieldPill("Mfg Date", item.manufacturing_date)}
      ${formatFieldPill("Expiry", item.use_by_date)}
      <div class="db-field-pill ${(!item.manufacturer_name && !item.manufacturer_address) ? 'missing-field' : ''}" style="grid-column: 1 / -1;">
        <strong>Manufacturer:</strong> ${item.manufacturer_name || 'Missing'}, ${item.manufacturer_address || 'Address not declared'}
      </div>
    </div>
  </div>
`).join('');
  } catch (err) {
    recordsList.innerHTML = `<p style="color: var(--danger);">Failed to load records: ${err.message}</p>`;
  }
}
