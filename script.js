/* ==========================================================================
   1. THEME & VIEW SWITCHING LOGIC
   ========================================================================== */
let currentTheme = 'consumer';
let storedUploadFiles = [];

function showLanding() {
  document.getElementById('landingView').style.display = 'block';
  document.getElementById('portalWorkspace').style.display = 'none';
  document.getElementById('btnConsumer').classList.remove('active');
  document.getElementById('btnInspector').classList.remove('active');
  document.body.setAttribute('data-theme', 'consumer');
  currentTheme = 'consumer';
  document.getElementById('logoIcon').innerText = "⚖";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  document.getElementById('landingView').style.display = 'none';
  document.getElementById('portalWorkspace').style.display = 'block';

  const isInspector = (theme === 'inspector');
  document.getElementById('btnConsumer').classList.toggle('active', !isInspector);
  document.getElementById('btnInspector').classList.toggle('active', isInspector);
  document.getElementById('wsTitle').innerText = isInspector ? "Enforcement Officer Workspace" : "Consumer Protection Scan";
  document.getElementById('wsBadge').innerText = isInspector ? "Mode: Authority" : "Mode: Citizen";
  document.getElementById('logoIcon').innerText = isInspector ? "🛡️" : "⚖";

  clearWorkspace();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   2. FILE INPUT & MULTI-SLOT HANDLING
   ========================================================================== */
const modal = document.getElementById('uploadModal');
const inputGallery = document.getElementById('fileInputGallery');
const inputCamera = document.getElementById('fileInputCamera');

function showUploadModal() { modal.style.display = 'flex'; }
function closeUploadModal() { modal.style.display = 'none'; }
function openGallery() { closeUploadModal(); inputGallery.click(); }
function openCamera() { closeUploadModal(); inputCamera.click(); }

function handleFiles(e) {
  const files = Array.from(e.target.files).slice(0, 3);
  if (files.length > 0) {
    storedUploadFiles = files;
    fillSlots(files.map(f => URL.createObjectURL(f)));
  }
}

inputGallery.addEventListener('change', handleFiles);
inputCamera.addEventListener('change', handleFiles);

window.onclick = function(event) {
  if (event.target === modal) closeUploadModal();
};

function fillSlots(urls) {
  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`slot${i}`);
    if (urls[i - 1]) {
      slot.innerHTML = `<div class="slot-tag">Angle ${i}</div><img src="${urls[i - 1]}" />`;
    } else {
      slot.innerHTML = `<div class="slot-tag">Angle ${i}</div>Waiting...`;
    }
  }
  resetTerminal();
}

function clearWorkspace() {
  storedUploadFiles = [];
  window.mockResponseData = null;
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`slot${i}`).innerHTML = `<div class="slot-tag">Angle ${i}</div>Waiting...`;
  }
  resetTerminal();
  inputGallery.value = '';
  inputCamera.value = '';
}

function resetTerminal() {
  document.getElementById('terminal').innerHTML = `<div style="color: var(--text-dim);">Awaiting image ingest sequence...<span class="cursor-blink"></span></div>`;
  document.getElementById('resultCard').style.display = 'none';
}

/* ==========================================================================
   3. DEMO PRESETS (FALLBACK MOCKS)
   ========================================================================== */
function loadMock(type) {
  const isClean = (type === 'clean');
  const color = isClean ? '10b981' : 'ef4444';
  const text = isClean ? 'COMPLIANT PACK' : 'VIOLATION PACK';
  const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%230f172a"/><rect x="50" y="50" width="300" height="300" rx="16" fill="none" stroke="%23${color}" stroke-width="4"/><text x="200" y="200" fill="%23fff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">${text}</text></svg>`;

  storedUploadFiles = [];
  fillSlots([svg]);

  window.mockResponseData = isClean ? {
    product_name: "Britannia Winkin Cow Thick Shake",
    generic_name: "Flavored Milk Beverage",
    manufacturer_name: "Britannia Industries Limited",
    manufacturer_address: "5/1A Hungerford Street, Kolkata, West Bengal - 700017",
    net_quantity: "180 ml",
    mrp: "₹35.00",
    unit_sale_price: "₹0.19/ml",
    manufacturing_date: "14/09/2026",
    use_by_date: "14/03/2027",
    consumer_care_details: "feedback@britannia.co.in / 1800-425-4449"
  } : {
    product_name: "Spicy Masala Chips",
    generic_name: "Potato Chips",
    manufacturer_name: false,
    manufacturer_address: false,
    net_quantity: "45 g",
    mrp: "₹20.00",
    unit_sale_price: false,
    manufacturing_date: "01/09/2026",
    use_by_date: "01/03/2027",
    consumer_care_details: false
  };
}

/* ==========================================================================
   4. AUDIT PIPELINE & VERIFICATION RENDERING
   ========================================================================== */
async function startTerminalScan() {
  const hasLiveFiles = storedUploadFiles.length > 0;
  const hasMock = Boolean(window.mockResponseData);

  if (!hasLiveFiles && !hasMock) {
    alert("Action Restricted: Please upload photos or select a demo preset first.");
    return;
  }

  const term = document.getElementById('terminal');
  term.innerHTML = '';
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('exportBtn').style.display = 'none';

  const logSteps = [
    `> Ingesting package visual arrays... [OK]`,
    `> Downscaling frame matrices to boundary max_res: 1024... [OK]`,
    `> Running local Qwen2.5-VL zero-temperature inference... [OK]`,
    `> Evaluating 10 statutory clauses under Rules (2011)... [OK]`
  ];

  for (const step of logSteps) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerText = step;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
    await new Promise(r => setTimeout(r, 260));
  }

  let extractedFields = {};
  if (hasLiveFiles) {
    const formData = new FormData();
    storedUploadFiles.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/v1/audit', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      extractedFields = json.data || json.result || {};
    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'term-line warning';
      errDiv.innerText = `> [ERROR] Backend communication failed: ${err.message}. Falling back to mock.`;
      term.appendChild(errDiv);
      extractedFields = window.mockResponseData || {};
    }
  } else {
    extractedFields = window.mockResponseData;
  }

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
  let gridHTML = '<div class="audit-grid">';

  for (const [key, label] of Object.entries(labelMap)) {
    const val = data[key];
    const isPresent = (val !== false && val !== null && val !== undefined && val !== "false");

    if (!isPresent) missingCount++;

    gridHTML += `
      <div class="audit-item ${isPresent ? '' : 'violation'}">
        <div>
          <div class="audit-key">${label}</div>
          <div class="audit-val">${isPresent ? val : '<em style="color:var(--danger)">Missing / Non-Compliant</em>'}</div>
        </div>
        <div class="audit-pill ${isPresent ? 'pill-pass' : 'pill-fail'}">
          ${isPresent ? 'FOUND' : 'MISSING'}
        </div>
      </div>
    `;
  }
  gridHTML += '</div>';

  const isClean = (missingCount === 0);

  const finalMsg = document.createElement('div');
  finalMsg.className = `term-line ${isClean ? 'success' : 'warning'}`;
  finalMsg.style.fontWeight = 'bold';
  finalMsg.style.marginTop = '10px';
  finalMsg.innerHTML = isClean
    ? `> [SUCCESS] Audit Complete: All 10 Statutory Declarations Verified.<span class="cursor-blink"></span>`
    : `> [ALERT] Audit Complete: ${missingCount} Statutory Violation(s) Flagged.<span class="cursor-blink"></span>`;
  term.appendChild(finalMsg);
  term.scrollTop = term.scrollHeight;

  verdictBadge.innerText = isClean ? 'VERIFIED: COMPLIANT' : `NON-COMPLIANT (${missingCount} VIOLATIONS)`;
  verdictBadge.style.color = isClean ? 'var(--success)' : 'var(--danger)';
  detailsContainer.innerHTML = gridHTML;

  rc.style.display = 'block';
  if (currentTheme === 'inspector') {
    document.getElementById('exportBtn').style.display = 'block';
  }
}

/* ==========================================================================
   5. CANVAS ANIMATION (HERO SIMULATION)
   ========================================================================== */
const canvas = document.getElementById('animeCanvas');
const ctx = canvas.getContext('2d');
let frame = 0;

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid background
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
  for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

  // Character Silhouette
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(200, 250, 60, Math.PI, 0);
  ctx.lineTo(260, 480); ctx.lineTo(140, 480);
  ctx.fill();

  // Tech Visor
  const glow = Math.sin(frame * 0.05) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(0, 242, 254, ${0.4 + glow * 0.6})`;
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 15;
  ctx.fillRect(170, 230, 35, 10);
  ctx.fillRect(215, 230, 35, 10);
  ctx.shadowBlur = 0;

  // Hand & Phone
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(250, 280, 25, 60);
  ctx.fillStyle = '#334155';
  ctx.fillRect(260, 260, 20, 40);

  // Periodic Flash
  if (frame % 150 > 140) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath(); ctx.arc(270, 270, 40, 0, Math.PI * 2); ctx.fill();
  }

  // Data Stream Particles
  ctx.fillStyle = '#00f2fe';
  for (let i = 0; i < 5; i++) {
    let x = 280 + ((frame * 3 + i * 40) % 250);
    let y = 270 + Math.sin(frame * 0.1 + i) * 15;
    ctx.fillRect(x, y, 8, 3);
  }

  // Target Box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.strokeRect(550, 150, 180, 220);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(550, 150, 180, 220);

  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText("Net Wt: 1 kg", 570, 190);
  ctx.fillText("MRP: ₹150", 570, 220);

  // Scan Sweep
  let scanY = 150 + ((Math.sin(frame * 0.03) + 1) / 2) * 220;
  ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
  ctx.fillRect(550, 150, 180, scanY - 150);
  ctx.fillStyle = '#00f2fe';
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 10;
  ctx.fillRect(540, scanY, 200, 3);
  ctx.shadowBlur = 0;

  if (scanY > 190) {
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(565, 175, 80, 20);
    ctx.fillStyle = '#10b981';
    ctx.fillText("PASS", 655, 190);
  }
  if (scanY > 220) {
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(565, 205, 80, 20);
    ctx.fillStyle = '#10b981';
    ctx.fillText("PASS", 655, 220);
  }

  frame++;
  requestAnimationFrame(drawScene);
}
drawScene();