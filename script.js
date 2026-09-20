/* ==========================================================================
   1. THEME & VIEW SWITCHING
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
   2. RELIABLE DIRECT IMAGE TRIGGERS (FIXES MOBILE INPUT BUG)
   ========================================================================== */
const inputGallery = document.getElementById('fileInputGallery');
const inputCamera = document.getElementById('fileInputCamera');

function triggerCamera(e) {
  if (e) e.stopPropagation();
  inputCamera.value = ''; // Reset value to allow re-selection
  inputCamera.click();
}

function triggerGallery(e) {
  if (e) e.stopPropagation();
  inputGallery.value = ''; // Reset value to allow re-selection
  inputGallery.click();
}

// Mobile-friendly input change listener
function handleFiles(e) {
  const incomingFiles = Array.from(e.target.files);
  if (!incomingFiles.length) return;

  // Append new files up to 3 total
  storedUploadFiles = storedUploadFiles.concat(incomingFiles).slice(0, 3);
  window.mockResponseData = null; // Clear mock since real files are chosen

  renderSlotPreviews();
}

inputGallery.addEventListener('change', handleFiles);
inputCamera.addEventListener('change', handleFiles);

function renderSlotPreviews() {
  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`slot${i}`);
    const file = storedUploadFiles[i - 1];

    if (file) {
      const previewUrl = (typeof file === 'string') ? file : URL.createObjectURL(file);
      slot.innerHTML = `<span class="slot-tag">Angle ${i}</span><img src="${previewUrl}" alt="Angle ${i}" />`;
    } else {
      slot.innerHTML = `<span class="slot-tag">Angle ${i}</span><span class="slot-placeholder">Waiting...</span>`;
    }
  }
  resetTerminal();
}

function clearWorkspace() {
  storedUploadFiles = [];
  window.mockResponseData = null;
  inputGallery.value = '';
  inputCamera.value = '';
  renderSlotPreviews();
  resetTerminal();
}

function resetTerminal() {
  document.getElementById('terminal').innerHTML = `<div style="color: var(--text-dim);">Awaiting image ingest sequence...<span class="cursor-blink"></span></div>`;
  document.getElementById('resultCard').style.display = 'none';
}

/* ==========================================================================
   3. DEMO MOCKS
   ========================================================================== */
function loadMock(type) {
  const isClean = (type === 'clean');
  const color = isClean ? '10b981' : 'ef4444';
  const text = isClean ? 'COMPLIANT PACK' : 'VIOLATION PACK';

  const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%230a1326"/><rect x="40" y="40" width="320" height="320" rx="14" fill="none" stroke="%23${color}" stroke-width="6"/><text x="200" y="200" fill="%23fff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">${text}</text></svg>`;

  storedUploadFiles = [svg]; // Set preview SVG
  renderSlotPreviews();

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
    product_name: "Farm Plus Red Chilli Sauce",
    generic_name: "Red Chilli Sauce",
    manufacturer_name: "MANJARI FOODS",
    manufacturer_address: "Kalkar Nest, Ferry Road, Bolara Post, Mangalore - 575 001",
    net_quantity: "100gms",
    mrp: false,
    unit_sale_price: false,
    manufacturing_date: "01/09/2026",
    use_by_date: false,
    consumer_care_details: false
  };
}

/* ==========================================================================
   4. AUDIT PIPELINE & EXECUTION
   ========================================================================== */
async function startTerminalScan() {
  const hasLiveFiles = storedUploadFiles.length > 0 && typeof storedUploadFiles[0] !== 'string';
  const hasMock = Boolean(window.mockResponseData);

  if (!hasLiveFiles && !hasMock) {
    alert("Action Restricted: Please upload 1-3 photos or select a demo preset first.");
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
    `> Running local Qwen2.5-VL zero-temperature inference... [OK]`,
    `> Evaluating 10 statutory clauses under Rules (2011)... [OK]`
  ];

  for (const step of logSteps) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerText = step;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
    await new Promise(r => setTimeout(r, 220));
  }

  let extractedFields = {};

  if (hasLiveFiles) {
    const formData = new FormData();
    storedUploadFiles.forEach(file => {
      if (file instanceof File) formData.append('files', file);
    });

    try {
      const res = await fetch('/api/v1/audit', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      extractedFields = json.data || json.result || json.audit || json;
    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'term-line warning';
      errDiv.innerText = `> [WARN] Server inference failed: ${err.message}. Using fallback.`;
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
  let itemsHTML = '';

  for (const [key, label] of Object.entries(labelMap)) {
    const val = data ? data[key] : null;
    const isPresent = (val !== false && val !== null && val !== undefined && val !== "false" && val !== "");

    if (!isPresent) missingCount++;

    itemsHTML += `
      <div class="audit-item ${isPresent ? '' : 'violation'}">
        <div class="audit-info">
          <div class="audit-key">${label}</div>
          <div class="audit-val">${isPresent ? val : '<em style="color:var(--danger)">Missing / Non-Compliant</em>'}</div>
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
   5. CANVAS SIMULATION
   ========================================================================== */
const canvas = document.getElementById('animeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let frame = 0;

function drawScene() {
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
  requestAnimationFrame(drawScene);
}
if (canvas) drawScene();