// ── DIAGNOSTICS ────────────────────────────────────────────────
window.onerror = function(msg, url, line) {
    console.error("ERROR DETECTADO: " + msg + "\nEn: " + url + "\nLínea: " + line);
    return false;
};
// alert("SISTEMA CARGADO - Si no ves esto, el archivo script.js está roto.");

// ────────────────────────────────────────────────────────────────
//  AR ANALYTICS DASHBOARD – script.js
// ────────────────────────────────────────────────────────────────

// ── GLOBAL DATA & PERSISTENCE ──────────────────────────────────
const STORAGE_KEY = 'ar_dashboard_data';
const SCHEMA_VERSION = 11; // Increment this when DASHBOARD_DATA structure changes
let currentCaFilter = 'all'; // Filter for Cash App items
let activeTab = 'overview'; // Track currently active tab globally
let currentLang = 'es';    // Language toggle state ('es' | 'en')

const SUBSIDIARY_MAPPING = {
    "101": "Americas", "102": "Americas", "103": "Americas", "104": "Americas", "105": "Americas", 
    "107": "Americas", "108": "Americas", "111": "Americas", "115": "Americas", "116": "Sysomos", 
    "117": "Americas", "121": "Americas", "130": "Americas", "131": "Americas", "133": "Americas", 
    "140": "Americas", "144": "Americas", "151": "Americas", "158": "Americas", "188": "Americas",
    "910": "Americas", "920": "Americas", "923": "Americas", "930": "Americas", "940": "Americas", "950": "Americas",
    "106": "Sysomos",  "326": "Sysomos", "116": "Sysomos",
    "201": "APAC", "211": "APAC", "212": "APAC", "221": "APAC", "231": "APAC", "241": "APAC", 
    "243": "APAC", "251": "APAC", "261": "APAC", "271": "APAC", "281": "APAC", "291": "APAC",
    "302": "EMEA", "311": "EMEA", "312": "EMEA", "321": "EMEA", "323": "EMEA", "331": "EMEA",
    "334": "EMEA", "335": "EMEA", "341": "EMEA", "351": "EMEA", "361": "EMEA", "371": "EMEA", "381": "EMEA",
    "382": "EMEA", "383": "EMEA", "391": "EMEA", "392": "EMEA", "401": "EMEA", "411": "EMEA", "412": "EMEA",
    "421": "EMEA", "431": "EMEA", "441": "EMEA", "451": "EMEA", "461": "EMEA", "511": "EMEA", "512": "EMEA",
    "513": "EMEA", "514": "EMEA", "521": "EMEA", "531": "EMEA", "541": "EMEA", "611": "EMEA", "621": "EMEA",
    "631": "EMEA", "711": "EMEA", "721": "EMEA", "731": "EMEA", "741": "EMEA", "751": "EMEA", "761": "EMEA",
    "771": "EMEA", "811": "EMEA", "821": "EMEA"
};

function saveState() {
  const toSave = JSON.parse(JSON.stringify(DATA));
  toSave.__version = SCHEMA_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    // ── SCHEMA VERSION CHECK ──────────────────────────────────────
    // If saved version doesn't match current schema, discard stale data
    // to prevent crashes from structural mismatches.
    if (!parsed.__version || parsed.__version !== SCHEMA_VERSION) {
      console.warn('[AR Dashboard] Schema version mismatch. Clearing localStorage and loading defaults.');
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    delete parsed.__version;
    // Deep merge loaded state into DATA
    Object.assign(DATA, parsed);
  } catch (err) {
    console.error('[AR Dashboard] Error loading saved state, clearing:', err);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resyncData() {
  // 1. Recalculate Total AR from Aging buckets
  const ag = DATA.aging;
  DATA.totalAR = ag.current + ag.d30 + ag.d60 + ag.d90 + ag.d90p;

  // 2. Sync Executive Summary KPIs
  const kpiTotal = document.getElementById('kpi-total');
  if (kpiTotal) kpiTotal.textContent = fmt(DATA.totalAR);

  const kpiDso = document.getElementById('kpi-dso');
  if (kpiDso) kpiDso.textContent = DATA.dso.actual + ' días';

  const dsoDiff = (DATA.dso.actual - DATA.dso.target).toFixed(1);
  const dsoDelta = document.getElementById('kpi-dso-delta');
  if (dsoDelta) {
    if (+dsoDiff > 0) {
      dsoDelta.textContent = `↑ ${dsoDiff} días vs objetivo`;
      dsoDelta.className = 'kpi-delta negative';
    } else {
      dsoDelta.textContent = `↓ ${Math.abs(dsoDiff)} días vs objetivo`;
      dsoDelta.className = 'kpi-delta positive';
    }
  }

  // 3. Sync Cash App KPIs strictly from item sums
  const ca = DATA.cashapp;
  if (ca.items) {
    // Unapplied = Total bucket
    ca.kpis.unapplied = ca.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

    // Suspense = Pending or Unknown (client with ?)
    ca.kpis.suspense = ca.items
      .filter(i => i.status === 'Pendiente' || (i.client && i.client.includes('?')))
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
  }

  // 4. Update all UI elements that might be visible
  refreshAllUI();
  saveState();
}

function refreshAllUI() {
  const ca = DATA.cashapp;
  const elements = {
    'kpi-total': fmt(DATA.totalAR),
    'kpi-collected': fmt(DATA.collected || Math.round(DATA.totalAR * 0.45)),
    'kpi-risk': DATA.clients.filter(c => c.score >= 70).length,
    'ca-unapplied': fmt(ca.kpis.unapplied),
    'ca-suspense': fmt(ca.kpis.suspense),
    'ca-automatch': ca.kpis.autoMatch + '%',
    'ca-refunds': fmt(ca.refunds.total),
    'kpi-working-capital': fmt(DATA.treasury.workingCapital),
    'kpi-cashflow-mtd': fmt(DATA.treasury.cashFlowMTD.net),
    'kpi-credit-available': fmt(DATA.treasury.financingLines.available),
    'fx-rate': '$' + DATA.fxExposure.rateUSD.toFixed(2) + ' MXN',
    'fx-net-exposure': fmt(DATA.fxExposure.netExposure),
    'fx-hedges': fmt(DATA.fxExposure.hedgingAmount),
    'fx-billing-errors': DATA.logistics.billingErrorRate.toFixed(2) + '%',
    'budget-actual': fmt(DATA.budgetControl.actual[DATA.budgetControl.actual.length - 1]),
    'budget-variance': (() => {
      const actVal = DATA.budgetControl.actual[DATA.budgetControl.actual.length - 1];
      const budVal = DATA.budgetControl.budget[DATA.budgetControl.budget.length - 1];
      const varPct = ((actVal - budVal) / budVal * 100).toFixed(1);
      return (varPct >= 0 ? '+' : '') + varPct + '%';
    })(),
    'budget-margin': '25.0%'
  };

  Object.entries(elements).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  updateDsoGauges();

  // Refresh active tab charts and tables
  const activeBtn = document.querySelector('.nav-btn.active');
  if (activeBtn) {
    // Use setTimeout to ensure Chart.js CDN has loaded
    if (typeof Chart !== 'undefined') {
      initCharts(activeBtn.dataset.tab);
    } else {
      setTimeout(() => initCharts(activeBtn.dataset.tab), 300);
    }
  }
}

function resetData() {
  if (confirm('¿Restablecer datos originales del archivo data.js? Perderás los cambios no guardados en el archivo.')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

// Inicializar con DASHBOARD_DATA (de data.js) para respetar ediciones manuales
const DATA = JSON.parse(JSON.stringify(DASHBOARD_DATA));

// ── CHART INSTANCES ────────────────────────────────────────────
const charts = {};

// ── TAB SWITCHER ────────────────────────────────────────────────
const titles = {
  overview: 'Resumen Financiero', dso: 'DSO & Cobranza', arap: 'AR & AP Hub',
  forecast: 'Cash Flow & Forecast', mexusa: 'México-USA & FX',
  cashapp: 'Conciliación Bancaria', refunds: 'Reembolsos / RFT', unapplied: 'NetSuite / No Aplicados PMT'
};
function switchTab(id, btn) {
  const targetTab = document.getElementById('tab-' + id);
  if (!targetTab) return;
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  targetTab.classList.add('active');
  btn.classList.add('active');
  activeTab = id; // Keep global activeTab in sync
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[id] || id;
  // lazy-init charts
  setTimeout(() => { initCharts(id); }, 50);
}

// ── HELPERS ────────────────────────────────────────────────────
const fmt = n => {
  // Use en-US to force comma as thousands separator as requested
  return '$' + Math.round(n).toLocaleString('en-US');
};
const pct = (a, t) => ((a / t) * 100).toFixed(1) + '%';

// Unapplied Filters Global handler
function handleUaFilterChange() {
  const year = document.getElementById('ua-filter-year').value;
  const month = document.getElementById('ua-filter-month').value;
  const region = document.getElementById('ua-filter-region').value;
  const info = document.getElementById('ua-filter-info');
  if (info) {
    const yTxt = year === 'ALL' ? 'Todos los años' : year;
    const mTxt = month === 'ALL' ? 'Todos los meses' : month;
    const rTxt = region === 'ALL' ? 'Todas las regiones' : region;
    info.innerHTML = `Vista Activa: ${rTxt} / ${mTxt} ${yTxt}<br><span style="color: var(--text3); font-size: 9px; font-weight: 400;">*Valores normalizados en USD</span>`;
  }
  buildUnapplied(year, month, region);
}

// FX Normalization Helpers
const FX_RATES = { 'USD': 1.0, 'EUR': 1.08, 'MXN': 0.058, 'GBP': 1.25, 'CAD': 0.74 };
const getUSD = (amt, cur) => amt * (FX_RATES[(cur || 'USD').toUpperCase()] || 1.0);

const COLORS = {
  blue: '#215CFF',
  purple: '#E961A2',
  green: '#19C057',
  orange: '#f59e0b',
  red: '#ef4444',
  yellow: '#eab308',
  bg: '#030303',
  surface: '#0a0b10',
  text: '#ffffff',
  text2: '#94a3b8'
};

function chartDefaults() {
  Chart.defaults.color = COLORS.text2;
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.03)';
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.font.size = 16;
  Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.02)';
  Chart.defaults.scale.grid.drawBorder = false;

  // Global Tooltip Styling for better readability on high-res screens
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.98)';
  Chart.defaults.plugins.tooltip.padding = 16;
  Chart.defaults.plugins.tooltip.titleFont = { size: 16, weight: 'bold', family: 'Inter' };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 15, family: 'Inter' };
  Chart.defaults.plugins.tooltip.footerFont = { size: 14 };
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.boxPadding = 8;
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.usePointStyle = true;
  
  // Let's add drop shadow via custom plugin for all charts
  Chart.register({
    id: 'glowPlugin',
    beforeDatasetsDraw: function(chart) {
      let ctx = chart.ctx;
      ctx.save();
      if (chart.config.type === 'line') {
        ctx.shadowColor = 'rgba(176, 38, 255, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      } else if (chart.config.type === 'doughnut') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
      } else if (chart.config.type === 'bar') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
      }
    },
    afterDatasetsDraw: function(chart) {
      chart.ctx.restore();
    }
  });
}

// ── CIRCULAR GAUGE DRAWING ─────────────────────────────────────
// ── PREMIUM CIRCULAR GAUGE DRAWING ────────────────────────────
function drawCircularGauge(canvasId, value, targetVal, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const MAX = canvasId.toLowerCase().includes('cei') ? 100 : 60;

  ctx.clearRect(0, 0, w, h);

  const paddingY = 18;
  const lineWidth = 12;

  const cx = w / 2;
  const cy = h * 0.85; 
  const maxR = Math.min(cx - lineWidth, cy - paddingY);
  const r = maxR;

  const start = Math.PI;
  const end = 2 * Math.PI;

  // Background arc (dark gray)
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Value arc with solid neon color and glow
  const pct = Math.min(value / MAX, 1);
  const valEnd = start + pct * Math.PI;

  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, valEnd);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Target marker - single stylish line
  if (targetVal) {
    const tPct = Math.min(targetVal / MAX, 1);
    const ta = start + tPct * Math.PI;
    const innerR = r - Math.max(lineWidth/2 + 4, 10);
    const outerR = r + Math.max(lineWidth/2 + 4, 10);
    const tx1 = cx + innerR * Math.cos(ta), ty1 = cy + innerR * Math.sin(ta);
    const tx2 = cx + outerR * Math.cos(ta), ty2 = cy + outerR * Math.sin(ta);

    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.strokeStyle = '#f1fa8c'; // Bright yellow for target
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function updateDsoGauges() {
  const d = DATA.dso;
  drawCircularGauge('gaugeActual', d.actual, d.target, d.actual > d.target ? COLORS.orange : COLORS.blue);
  drawCircularGauge('gaugePrev', d.prev, d.target, COLORS.purple);
  drawCircularGauge('gaugeBest', d.best, d.target, COLORS.green);
  
  if (document.getElementById('gaugeTarget')) {
    drawCircularGauge('gaugeTarget', d.target, null, COLORS.yellow);
  }
  if (document.getElementById('gaugeCei')) {
    const ceiVal = DATA.ceiHistory ? DATA.ceiHistory[DATA.ceiHistory.length - 1] : 93.4;
    drawCircularGauge('gaugeCei', ceiVal, 90.0, COLORS.green);
  }

  const elActual = document.getElementById('gaugeActualVal'); if (elActual) elActual.textContent = d.actual;
  const elPrev = document.getElementById('gaugePrevVal'); if (elPrev) elPrev.textContent = d.prev;
  const elBest = document.getElementById('gaugeBestVal'); if (elBest) elBest.textContent = d.best;
  const elTarget = document.getElementById('gaugeTargetVal'); if (elTarget) elTarget.textContent = d.target;
  const elCei = document.getElementById('gaugeCeiVal'); if (elCei) elCei.textContent = (DATA.ceiHistory ? DATA.ceiHistory[DATA.ceiHistory.length - 1] : 93.4).toFixed(1);
}

let activeKpiCardIndex = 1;

function selectKpiCard(index) {
  activeKpiCardIndex = index;
  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById(`kpi-card-${i}`);
    if (card) {
      if (i === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    }
  }
  updateOverviewChart();
}

// VANILLA CANVAS TREND CHART - premium design
function drawTrendChart(canvasId, labels, data, lineColor) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !data || data.length === 0) return;
  var dpr = window.devicePixelRatio || 1;
  var parent = canvas.parentElement;
  var W = parent ? (parent.offsetWidth  || parent.clientWidth  || 640) : 640;
  var H = parent ? (parent.offsetHeight || parent.clientHeight || 260) : 260;
  if (W < 50) { W = 640; } if (H < 50) { H = 260; }
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var dataMin = Math.min.apply(null, data);
  var dataMax = Math.max.apply(null, data);
  var dataDiff = dataMax - dataMin || dataMax * 0.05 || 1;
  var pad = { top: 40, right: 110, bottom: 44, left: 80 };
  var cW = W - pad.left - pad.right;
  var cH = H - pad.top - pad.bottom;
  var minV = dataMin - dataDiff * 0.4;
  var maxV = dataMax + dataDiff * 0.4;
  var range = maxV - minV || 1;

  ctx.clearRect(0, 0, W, H);

  function xPos(i) { return pad.left + (i / Math.max(data.length - 1, 1)) * cW; }
  function yPos(v) { return pad.top + cH - ((v - minV) / range) * cH; }
  function fmtVal(v) {
    if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
    if (v >= 1000)    return '$' + (v/1000).toFixed(0) + 'K';
    return '$' + v.toFixed(0);
  }

  // ── Background subtle dark ───────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.012)';
  ctx.fillRect(pad.left, pad.top, cW, cH);

  // ── Grid + Y axis ─────────────────────────────────────────────
  var steps = 5;
  for (var s = 0; s <= steps; s++) {
    var gy  = pad.top + (s / steps) * cH;
    var gv  = maxV - (s / steps) * range;
    var isZero = (Math.abs(gv) < range * 0.01);
    ctx.save();
    ctx.setLineDash(isZero ? [] : [3, 5]);
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + cW, gy);
    ctx.strokeStyle = isZero ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = isZero ? 1.5 : 1; ctx.stroke(); ctx.restore();
    ctx.fillStyle  = 'rgba(148,163,184,0.65)';
    ctx.font       = '500 11px Inter,sans-serif';
    ctx.textAlign  = 'right';
    ctx.fillText(fmtVal(gv), pad.left - 10, gy + 4);
  }

  // ── X labels ─────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.font      = '600 12px Inter,sans-serif';
  ctx.textAlign = 'center';
  for (var li = 0; li < labels.length; li++) ctx.fillText(labels[li], xPos(li), H - 10);

  // ── Area gradient ─────────────────────────────────────────────
  var areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
  areaGrad.addColorStop(0,   lineColor + '45');
  areaGrad.addColorStop(0.5, lineColor + '18');
  areaGrad.addColorStop(1,   lineColor + '04');
  ctx.beginPath(); ctx.moveTo(xPos(0), yPos(data[0]));
  for (var ai = 1; ai < data.length; ai++) {
    var cpxa = (xPos(ai-1) + xPos(ai)) / 2;
    ctx.bezierCurveTo(cpxa, yPos(data[ai-1]), cpxa, yPos(data[ai]), xPos(ai), yPos(data[ai]));
  }
  ctx.lineTo(xPos(data.length-1), pad.top + cH); ctx.lineTo(xPos(0), pad.top + cH);
  ctx.closePath(); ctx.fillStyle = areaGrad; ctx.fill();

  // ── Glow line ─────────────────────────────────────────────────
  ctx.save(); ctx.shadowColor = lineColor; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.moveTo(xPos(0), yPos(data[0]));
  for (var li2 = 1; li2 < data.length; li2++) {
    var cpxl = (xPos(li2-1) + xPos(li2)) / 2;
    ctx.bezierCurveTo(cpxl, yPos(data[li2-1]), cpxl, yPos(data[li2]), xPos(li2), yPos(data[li2]));
  }
  ctx.strokeStyle = lineColor; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.stroke(); ctx.restore();

  // ── Dots ─────────────────────────────────────────────────────
  var maxIdx = data.indexOf(dataMax); var lastIdx = data.length - 1;
  for (var di = 0; di < data.length; di++) {
    var dx = xPos(di); var dy = yPos(data[di]);
    var isKey = (di === maxIdx || di === lastIdx);
    if (isKey) { ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI*2); ctx.fillStyle = lineColor + '28'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(dx, dy, isKey ? 5 : 3, 0, Math.PI*2);
    ctx.fillStyle = '#07080c'; ctx.fill();
    ctx.strokeStyle = lineColor; ctx.lineWidth = isKey ? 2.5 : 1.8; ctx.stroke();
    if (isKey) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '600 10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(fmtVal(data[di]), dx, dy - 16);
    }
  }

  // ── Right-side info panel ─────────────────────────────────────
  var lastVal = data[lastIdx]; var firstVal = data[0];
  var pctChange = ((lastVal - firstVal) / firstVal * 100);
  var isUp = pctChange >= 0;
  var accentClr = isUp ? '#19C057' : '#ef4444';

  var px = pad.left + cW + 16;
  var py = pad.top;

  // Current value
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font      = '700 16px Inter,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(fmtVal(lastVal), px, py + 18);

  ctx.fillStyle = 'rgba(148,163,184,0.65)';
  ctx.font      = '500 10px Inter,sans-serif';
  ctx.fillText('Actual', px, py + 32);

  // % change
  var pctTxt = (isUp ? '+' : '') + pctChange.toFixed(1) + '%';
  ctx.fillStyle = accentClr;
  ctx.font      = '700 13px Inter,sans-serif';
  ctx.fillText(pctTxt, px, py + 54);
  ctx.fillStyle = 'rgba(148,163,184,0.55)';
  ctx.font      = '500 10px Inter,sans-serif';
  ctx.fillText('vs inicio', px, py + 66);

  // Max
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font      = '600 12px Inter,sans-serif';
  ctx.fillText(fmtVal(dataMax), px, py + 90);
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font      = '500 10px Inter,sans-serif';
  ctx.fillText('Maximo', px, py + 102);

  // Min
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font      = '600 12px Inter,sans-serif';
  ctx.fillText(fmtVal(dataMin), px, py + 122);
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font      = '500 10px Inter,sans-serif';
  ctx.fillText('Minimo', px, py + 134);
}

function updateOverviewChart() {
  const isEn = currentLang === 'en';
  let titleText = '';
  let data = [];
  let color = '';

  const factors = [0.92, 0.96, 0.94, 0.98, 0.965, 1.0];

  if (activeKpiCardIndex === 1) {
    titleText = isEn ? 'Total Portfolio Trend' : 'Tendencia de Cartera Total';
    data = factors.map(f => Math.round(DATA.totalAR * f));
    color = COLORS.blue;
  } else if (activeKpiCardIndex === 2) {
    titleText = isEn ? 'Working Capital Trend' : 'Tendencia de Capital de Trabajo';
    data = factors.map(f => Math.round(DATA.treasury.workingCapital * f));
    color = COLORS.purple;
  } else if (activeKpiCardIndex === 3) {
    titleText = isEn ? 'Net Cash Flow MTD Trend' : 'Tendencia de Flujo Neto MTD';
    data = factors.map(f => Math.round(DATA.treasury.cashFlowMTD.net * f));
    color = COLORS.green;
  } else if (activeKpiCardIndex === 4) {
    titleText = isEn ? 'Financing Lines Trend' : 'Tendencia de Líneas de Financiamiento';
    data = factors.map(f => Math.round(DATA.treasury.financingLines.available * f));
    color = COLORS.orange;
  }

  const chartTitleEl = document.querySelector('.overview-chart-card .chart-card-header h3');
  if (chartTitleEl) chartTitleEl.textContent = titleText;

  drawTrendChart('overviewAgingChart', DATA.months, data, color, color);
  charts.overviewAging = { vanillaChart: true };
}

// ── CHART BUILDERS ─────────────────────────────────────────────
function initCharts(tab) {
  if (tab === 'overview' || tab === '__all') {
    // Vanilla canvas chart — no CDN dependency
    updateOverviewChart();
  }

  if (tab === 'dso') {
    updateDsoGauges();
    const dsoTrendEl = document.getElementById('dsoTrendChart');
    if (!charts.dsoTrend && dsoTrendEl) {
      charts.dsoTrend = new Chart(dsoTrendEl, {
        type: 'line',
        data: {
          labels: DATA.months,
          datasets: [
            {
              label: 'DSO Real',
              data: DATA.dsoHistory,
              borderColor: COLORS.green,
              backgroundColor: 'rgba(57, 255, 20, 0.15)',
              fill: true,
              tension: 0.5,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: COLORS.bg,
              borderWidth: 2
            },
            { label: 'Objetivo', data: Array(6).fill(DATA.dso.target), borderColor: COLORS.yellow, borderDash: [5, 5], pointRadius: 0, fill: false, borderWidth: 2 },
            { label: 'Best DSO', data: Array(6).fill(DATA.dso.best), borderColor: COLORS.green, borderDash: [3, 3], pointRadius: 0, fill: false, borderWidth: 1 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: true, position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } },
            tooltip: { backgroundColor: '#1c2038', titleColor: '#fff', bodyColor: '#8892b0', borderColor: '#252a45', borderWidth: 1 }
          },
          scales: {
            y: { min: 20, max: 45, grid: { color: 'rgba(35, 40, 64, 0.5)' }, ticks: { font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    const dsoCompositionEl = document.getElementById('dsoCompositionChart');
    if (!charts.dsoComposition && dsoCompositionEl) {
      // Simulation of DSO components: Terms vs Delays
      charts.dsoComposition = new Chart(dsoCompositionEl, {
        type: 'bar',
        data: {
          labels: DATA.months,
          datasets: [
            { label: 'Términos de Crédito (Base)', data: [25, 25, 25, 25, 25, 25], backgroundColor: 'rgba(168, 85, 247, 0.6)', stack: 'stack0', borderRadius: { bottomLeft: 6, bottomRight: 6, topLeft: 0, topRight: 0 } },
            { label: 'Retraso en Cobro', data: DATA.dsoHistory.map(v => v - 25), backgroundColor: 'rgba(217, 70, 239, 0.6)', stack: 'stack0', borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 } }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
            title: { display: false }
          },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, min: 0, max: 50, grid: { color: 'rgba(35, 40, 64, 0.5)' } }
          }
        }
      });
    }
  }

  if (tab === 'aging' || tab === 'arap') {
    const ag = DATA.aging;
    const total = ag.current + ag.d30 + ag.d60 + ag.d90 + ag.d90p;
    const elCurr = document.getElementById('aging-current'); if (elCurr) elCurr.textContent = fmt(ag.current);
    const el30 = document.getElementById('aging-30'); if (el30) el30.textContent = fmt(ag.d30);
    const el60 = document.getElementById('aging-60'); if (el60) el60.textContent = fmt(ag.d60);
    const el90 = document.getElementById('aging-90'); if (el90) el90.textContent = fmt(ag.d90);
    const el90p = document.getElementById('aging-90plus'); if (el90p) el90p.textContent = fmt(ag.d90p);
    const elCurrPct = document.getElementById('aging-current-pct'); if (elCurrPct) elCurrPct.textContent = pct(ag.current, total);
    const el30Pct = document.getElementById('aging-30-pct'); if (el30Pct) el30Pct.textContent = pct(ag.d30, total);
    const el60Pct = document.getElementById('aging-60-pct'); if (el60Pct) el60Pct.textContent = pct(ag.d60, total);
    const el90Pct = document.getElementById('aging-90-pct'); if (el90Pct) el90Pct.textContent = pct(ag.d90, total);
    const el90pPct = document.getElementById('aging-90plus-pct'); if (el90pPct) el90pPct.textContent = pct(ag.d90p, total);
    if (!charts.agingBar && document.getElementById('agingBarChart')) {
      charts.agingBar = new Chart(document.getElementById('agingBarChart'), {
        type: 'bar',
        data: {
          labels: ['Corriente', '1–30 días', '31–60 días', '61–90 días', '+90 días'],
          datasets: [{
            label: 'Saldo (USD)',
            data: [ag.current, ag.d30, ag.d60, ag.d90, ag.d90p],
            backgroundColor: [COLORS.green, COLORS.blue, COLORS.yellow, COLORS.orange, COLORS.red],
            borderRadius: 8, borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          layout: { padding: 8 },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#232840' }, ticks: { display: true, font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { font: { size: 10 }, color: COLORS.text2 } }
          }
        }
      });
    }
    if (!charts.agingStacked && document.getElementById('agingStackedChart')) {
      const top8 = [...DATA.clients].sort((a, b) => b.balance - a.balance).slice(0, 8);
      const getRand = (b, f) => Math.round(b * f + Math.random() * b * 0.04);
      const stacked = top8.map(c => {
        const base = c.balance;
        const o = c.overdue;
        if (o < 30) return [base * 0.85, base * 0.15, 0, 0, 0];
        if (o < 60) return [base * 0.4, base * 0.25, base * 0.25, base * 0.1, 0];
        if (o < 90) return [base * 0.2, base * 0.15, base * 0.2, base * 0.3, base * 0.15];
        return [base * 0.1, base * 0.1, base * 0.15, base * 0.25, base * 0.4];
      });
      const mkDs = (label, col, idx) => ({
        label, data: top8.map((_, i) => Math.round(stacked[i][idx])),
        backgroundColor: col, borderRadius: 4, borderSkipped: false
      });
      charts.agingStacked = new Chart(document.getElementById('agingStackedChart'), {
        type: 'bar',
        data: {
          labels: top8.map(c => c.name.split(' ')[0]),
          datasets: [
            mkDs('Corriente', COLORS.green, 0), mkDs('1–30d', COLORS.blue, 1),
            mkDs('31–60d', COLORS.yellow, 2), mkDs('61–90d', COLORS.orange, 3), mkDs('+90d', COLORS.red, 4)
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: 10 },
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } }, y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.03)', borderDash: [4, 4], drawBorder: false }, ticks: { font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } } }
        }
      });
    }
  }

  if (tab === 'risk' || tab === 'arap') buildRiskTable();
  if (tab === 'segmentation' || tab === 'arap') buildSegmentation();
  if (tab === 'projection' || tab === 'forecast') {
    buildProjectionChart();
    buildProjectionTable();
  }
  if (tab === 'cashapp') {
    buildCashApp();
  }
  if (tab === 'refunds' || tab === '__all') {
    buildRefunds();
    buildRefundComparisonChart();
  }
  if (tab === 'unapplied') {
    const y = document.getElementById('ua-filter-year')?.value || '2026';
    const m = document.getElementById('ua-filter-month')?.value || 'APRIL';
    const r = document.getElementById('ua-filter-region')?.value || 'ALL';
    buildUnapplied(y, m, r);
  }

  if (tab === 'mexusa') {
    if (!charts.fxRateHistory && document.getElementById('fxRateHistoryChart')) {
      charts.fxRateHistory = new Chart(document.getElementById('fxRateHistoryChart'), {
        type: 'line',
        data: {
          labels: DATA.budgetControl.months,
          datasets: [{
            label: 'USD/MXN',
            data: DATA.fxExposure.fxRateHistory,
            borderColor: COLORS.blue,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 16.5, max: 18.5, grid: { color: 'rgba(255, 255, 255, 0.03)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (!charts.fxExposure && document.getElementById('fxExposureChart')) {
      charts.fxExposure = new Chart(document.getElementById('fxExposureChart'), {
        type: 'bar',
        data: {
          labels: ['Activos', 'Pasivos', 'Coberturas'],
          datasets: [{
            label: 'USD Eq.',
            data: [DATA.fxExposure.usdAssets, DATA.fxExposure.usdLiabilities, DATA.fxExposure.hedgingAmount],
            backgroundColor: [COLORS.green, COLORS.red, COLORS.blue],
            borderRadius: 8,
            barThickness: 25
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.03)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  }

  if (tab === 'budget') {
    if (!charts.budgetControl && document.getElementById('budgetControlChart')) {
      charts.budgetControl = new Chart(document.getElementById('budgetControlChart'), {
        type: 'bar',
        data: {
          labels: DATA.budgetControl.months,
          datasets: [
            {
              label: 'Presupuesto',
              data: DATA.budgetControl.budget,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderRadius: 6
            },
            {
              label: 'Real',
              data: DATA.budgetControl.actual,
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top' } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.03)' } }
          }
        }
      });
    }

    if (!charts.routeProfitability && document.getElementById('routeProfitabilityChart')) {
      charts.routeProfitability = new Chart(document.getElementById('routeProfitabilityChart'), {
        type: 'bar',
        data: {
          labels: DATA.profitability.routes.map(r => r.name.replace('México - ', '')),
          datasets: [{
            label: 'Margen Operativo (%)',
            data: DATA.profitability.routes.map(r => r.margin),
            backgroundColor: COLORS.purple,
            borderRadius: 8,
            barThickness: 30
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { min: 0, max: 40, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(255, 255, 255, 0.03)' } }
          }
        }
      });
    }

    const tbody = document.getElementById('profitabilityTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      DATA.profitability.clients.forEach(c => {
        const clientAR = DATA.clients.find(cl => cl.name === c.name);
        const balanceVal = clientAR ? clientAR.balance : (c.profitAmt / (c.profitPct / 100));
        const overdueDays = clientAR ? clientAR.overdue : 0;
        
        let statusHtml = '';
        if (overdueDays === 0) {
          statusHtml = `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 11px;">Al Corriente</span>`;
        } else if (overdueDays <= 30) {
          statusHtml = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 8px; border-radius: 6px; font-size: 11px;">Vencido (${overdueDays}d)</span>`;
        } else {
          statusHtml = `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-size: 11px;">Mucha Morosidad (${overdueDays}d)</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600; color: #fff;">${c.name}</td>
          <td>${fmt(balanceVal)}</td>
          <td style="color: #10b981; font-weight: 600;">${c.profitPct}%</td>
          <td style="font-weight: 600;">${fmt(c.profitAmt)}</td>
          <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

// ── UNAPPLIED PAYMENTS ──────────────────────────────────────────
function buildUnapplied(filterYear = '2026', filterMonth = 'APRIL', filterRegion = 'ALL') {
  const ua = DATA.cashapp.unappliedPayments;
  if (!ua) return;
  const isEn = currentLang === 'en';

  const getMonthData = (y, m, reg) => {
    const res = { americas: 0, apac: 0, emea: 0, sysomos: 0 };
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    
    ua.monthlyData.forEach(d => {
        const dY = parseInt(d.year);
        const fY = y === 'ALL' ? 9999 : parseInt(y);
        
        const dMIdx = months.indexOf(d.month);
        const fMIdx = m === 'ALL' ? 11 : months.indexOf(m);
        
        const matchR = (reg === 'ALL' || d.region.toUpperCase() === reg);
        
        let matchDate = false;
        if (dY < fY) {
            matchDate = true;
        } else if (dY === fY) {
            if (dMIdx <= fMIdx) matchDate = true;
        }

        if (matchDate && matchR) {
            const r = d.region.toLowerCase();
            if (res[r] !== undefined) res[r] += d.total;
        }
    });
    return res;
  };

  const current = getMonthData(filterYear, filterMonth, filterRegion);
  
  // Previous Period Logic
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  let prevYear = filterYear;
  let prevMonth = 'ALL';
  let showDeltas = true;

  if (filterYear === 'ALL') {
    showDeltas = false; 
  } else if (filterMonth === 'ALL') {
    prevYear = (filterYear !== 'ALL' ? (parseInt(filterYear) - 1).toString() : 'ALL');
    prevMonth = 'ALL';
  } else {
    const idx = months.indexOf(filterMonth);
    if (idx === 0) {
      prevYear = (parseInt(filterYear) - 1).toString();
      prevMonth = "DECEMBER";
    } else {
      prevMonth = months[idx - 1];
    }
  }

  const previous = showDeltas ? getMonthData(prevYear, prevMonth, filterRegion) : { americas: 0, apac: 0, emea: 0, sysomos: 0 };

  // Check for overrides
  const overrides = ua.overrides || {};
  const currentKey = `${filterYear}|${filterMonth}`;
  if (overrides[currentKey]) {
    const o = overrides[currentKey];
    if (o.americas !== undefined) current.americas = o.americas;
    if (o.apac !== undefined) current.apac = o.apac;
    if (o.emea !== undefined) current.emea = o.emea;
    if (o.sysomos !== undefined) current.sysomos = o.sysomos;
  }

  const total = current.americas + current.apac + current.emea + current.sysomos;
  const prevTotal = previous.americas + previous.apac + previous.emea + previous.sysomos;
  const change = total - prevTotal;
  const changePct = prevTotal === 0 ? 0 : ((change / prevTotal) * 100).toFixed(1);

  const setKpi = (id, val, deltaId, pVal, regionKey = null) => {
    const el = document.getElementById(id); 
    if (el) {
        el.textContent = fmt(val);
        // Add manual override capability
        if (regionKey) {
            el.setAttribute('contenteditable', 'true');
            el.style.cursor = 'edit';
            el.title = 'Haz clic para modificar manualmente';
            el.onblur = (e) => {
                const newVal = parseFloat(e.target.textContent.replace(/[^-0-9.]/g, ''));
                if (!isNaN(newVal)) handleUaOverride(regionKey, newVal, filterYear, filterMonth);
            };
        }
    }
    const del = document.getElementById(deltaId);
    if (del) {
      if (!showDeltas) {
        del.style.display = 'none';
      } else {
        const diff = val - pVal;
        const pctVal = pVal === 0 ? 0 : ((diff / pVal) * 100).toFixed(1);
        del.style.display = 'inline-block';
        del.textContent = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(pctVal)}%`;
        del.className = `kpi-delta ${diff > 0 ? 'negative' : 'positive'}`;
      }
    }
  };
  setKpi('ua-total', total, 'ua-total-delta', prevTotal);
  setKpi('ua-americas', current.americas, 'ua-americas-delta', previous.americas, 'americas');
  setKpi('ua-apac', current.apac, 'ua-apac-delta', previous.apac, 'apac');
  setKpi('ua-emea', current.emea, 'ua-emea-delta', previous.emea, 'emea');
  setKpi('ua-sysomos', current.sysomos, 'ua-sysomos-delta', previous.sysomos, 'sysomos');

  const setSub = (id, val) => { 
    const el = document.getElementById(id); 
    if (el) {
      if (!showDeltas) el.parentElement.style.display = 'none';
      else {
        el.parentElement.style.display = 'block';
        el.textContent = fmt(val); 
      }
    }
  };
  setSub('ua-total-feb', prevTotal);
  setSub('ua-americas-feb', previous.americas);
  setSub('ua-apac-feb', previous.apac);
  setSub('ua-emea-feb', previous.emea);
  setSub('ua-sysomos-feb', previous.sysomos);

  // 2. Charts
  const regEl = document.getElementById('uaRegionalChart');
  if (regEl) {
    if (charts.uaRegional) charts.uaRegional.destroy();
    const labels = [];
    const currData = [];
    const pData = [];
    if (filterRegion === 'ALL' || filterRegion === 'AMERICAS') { labels.push('Americas'); currData.push(current.americas); pData.push(previous.americas); }
    if (filterRegion === 'ALL' || filterRegion === 'APAC') { labels.push('APAC'); currData.push(current.apac); pData.push(previous.apac); }
    if (filterRegion === 'ALL' || filterRegion === 'EMEA') { labels.push('EMEA'); currData.push(current.emea); pData.push(previous.emea); }
    if (filterRegion === 'ALL' || filterRegion === 'SYSOMOS') { labels.push('Sysomos'); currData.push(current.sysomos); pData.push(previous.sysomos); }
    const datasets = [];
    if (showDeltas) datasets.push({ label: prevMonth, data: pData, backgroundColor: '#7c3aed', borderRadius: 6 });
    datasets.push({ label: filterMonth === 'ALL' ? filterYear : filterMonth, data: currData, backgroundColor: '#2EB6B9', borderRadius: 6 });
    charts.uaRegional = new Chart(regEl, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e2e8f0' } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', callback: v => fmt(v) } }
        }
      }
    });
  }

  // 3. Side-by-Side Comparison Tables
  // 3. Side-by-Side Comparison Tables
  const mkRow = (reg, val, isPrev = false) => {
    const y = isPrev ? prevYear : filterYear;
    const m = isPrev ? prevMonth : filterMonth;
    const rKey = reg.toLowerCase();
    return `<tr>
      <td>${reg}</td>
      <td>USD</td>
      <td style="text-align: right; font-weight:700; cursor:edit; border-bottom:1px dashed rgba(255,255,255,0.1);" 
          title="Doble clic para editar"
          ondblclick="this.contentEditable=true; this.focus();" 
          onblur="this.contentEditable=false; handleUaOverride('${rKey}', this.textContent, '${y}', '${m}')">${fmt(val)}</td>
    </tr>`;
  };

  const tCurr = document.getElementById('ua-comp-table-curr');
  const tPrev = document.getElementById('ua-comp-table-prev');
  const hCurr = document.getElementById('ua-comp-title-curr');
  const hPrev = document.getElementById('ua-comp-title-prev');
  const gCurr = document.getElementById('ua-comp-total-curr');
  const gPrev = document.getElementById('ua-comp-total-prev');

  if (tCurr) {
    hCurr.textContent = `as of ${filterMonth} ${filterYear}`;
    tCurr.innerHTML = mkRow('Americas', current.americas) + mkRow('APAC', current.apac) + mkRow('EMEA', current.emea) + mkRow('Sysomos', current.sysomos);
    gCurr.textContent = fmt(total);
  }
  if (tPrev) {
    if (!showDeltas) {
      tPrev.parentElement.parentElement.parentElement.style.display = 'none';
    } else {
      tPrev.parentElement.parentElement.parentElement.style.display = 'block';
      hPrev.textContent = `as of ${prevMonth} ${prevYear}`;
      tPrev.innerHTML = mkRow('Americas', previous.americas, true) + mkRow('APAC', previous.apac, true) + mkRow('EMEA', previous.emea, true) + mkRow('Sysomos', previous.sysomos, true);
      gPrev.textContent = fmt(prevTotal);
    }
  }

  // 4. Algorithm Insights (Simplified/Dynamic)

  const histEl = document.getElementById('uaHistoryChart');
  if (histEl) {
    if (charts.uaHistory) charts.uaHistory.destroy();
    charts.uaHistory = new Chart(histEl, {
      type: 'bar',
      data: {
        labels: ua.history.years,
        datasets: [
          { label: 'Americas', data: ua.history.americas, backgroundColor: COLORS.blue, borderRadius: 6 },
          { label: 'APAC', data: ua.history.apac, backgroundColor: COLORS.green, borderRadius: 6 },
          { label: 'EMEA', data: ua.history.emea, backgroundColor: COLORS.orange, borderRadius: 6 },
          { label: 'Sysomos', data: ua.history.sysomos, backgroundColor: COLORS.purple, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#94a3b8', callback: v => '$' + (v / 1000).toFixed(0) + 'K' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const pivotBody = document.getElementById('uaPivotSummaryBody');
  if (pivotBody) {
    const rows = [
        { n: 'Americas', c: current.americas, p: previous.americas }, 
        { n: 'APAC', c: current.apac, p: previous.apac }, 
        { n: 'EMEA', c: current.emea, p: previous.emea },
        { n: 'Sysomos', c: current.sysomos, p: previous.sysomos }
    ];
    pivotBody.innerHTML = rows.map(r => {
      const d = r.c - r.p; const p = r.p === 0 ? 0 : ((d / r.p) * 100).toFixed(1);
      const regKey = r.n.toLowerCase();
      return `<tr>
        <td>${r.n}</td>
        <td style="font-weight:700; cursor:edit; border-bottom:1px dashed rgba(255,255,255,0.2);" 
            title="Doble clic para editar"
            ondblclick="this.contentEditable=true; this.focus();" 
            onblur="this.contentEditable=false; handleUaOverride('${regKey}', this.textContent, '${filterYear}', '${filterMonth}')">${fmt(r.c)}</td>
        <td>${fmt(r.p)}</td>
        <td class="${d>0?'text-negative':'text-positive'}">${fmt(d)}</td>
        <td class="${d>0?'text-negative':'text-positive'}">${p}%</td>
      </tr>`;
    }).join('') + `<tr style="background:rgba(255,255,255,0.02); font-weight:800;"><td>Grand Total</td><td>${fmt(total)}</td><td>${fmt(prevTotal)}</td><td class="${change>0?'text-negative':'text-positive'}">${fmt(change)}</td><td class="${change>0?'text-negative':'text-positive'}">${changePct}%</td></tr>`;
  }

  const buildPivot = (id, dataArr) => {
    const el = document.getElementById(id); if (!el) return;
    let sum = 0;
    el.innerHTML = ua.history.years.map((y, i) => {
      sum += dataArr[i];
      return `<tr><td>${y}</td><td style="text-align:right;">${fmt(dataArr[i])}</td></tr>`;
    }).join('') + `<tr style="font-weight:800; border-top:1px solid #333;"><td>Grand Total</td><td style="text-align:right;">${fmt(sum)}</td></tr>`;
  };
  buildPivot('uaPivotAmBody', ua.history.americas);
  buildPivot('uaPivotApacBody', ua.history.apac);
  buildPivot('uaPivotEmeaBody', ua.history.emea);
  buildPivot('uaPivotSysomosBody', ua.history.sysomos);

  // 5. Table
  const tbody = document.getElementById('uaTableBody');
  if (tbody) {
    const filteredItems = filterRegion === 'ALL' ? ua.topItems : ua.topItems.filter(i => i.region.toUpperCase() === filterRegion);
    tbody.innerHTML = filteredItems.map(i => `<tr><td>${i.date}</td><td><strong>${i.customer}</strong></td><td>${fmt(i.amount)}</td><td>USD</td><td><span class="badge-role">${i.region}</span></td></tr>`).join('');
  }

  generateUnappliedInsights(total, prevTotal, change, changePct, current, previous);
  buildUaDetailColumns(filterYear, filterMonth);
}

function generateUnappliedInsights(total, prevTotal, change, pct, current, prev) {
  const container = document.querySelector('.insights-box'); if (!container) return;
  const list = document.getElementById('ua-insights-list'); if (!list) return;
  
  const fmtK = (v) => { const abs = Math.abs(v); if (abs >= 1000000) return (abs / 1000000).toFixed(2) + 'M'; if (abs >= 1000) return (abs / 1000).toFixed(1) + 'K'; return abs.toFixed(0); };
  const trend = change > 0 ? "aumento" : "disminución";
  const trendColor = change > 0 ? "#ff4d4d" : "#00e676";
  
  let narrative = `
    <div id="ua-narrative-report" style="color: #e2e8f0; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 15px;">
            El saldo total de pagos no aplicados para el periodo actual es de <strong style="color:var(--blue);">${fmt(total)}</strong>. 
            Esto representa una <strong>${trend} neta de ${fmt(Math.abs(change))}</strong> (<span style="color:${trendColor}; font-weight:700;">${Math.abs(pct)}%</span>) 
            en comparación con los ${fmt(prevTotal)} del mes anterior.
        </p>

        <p style="margin-bottom: 15px;">
            <span style="color:var(--orange); font-weight:700;">Desglose Regional:</span> 
            La región de <strong>Americas</strong> concentra ${fmt(current.americas)}, mientras que 
            <strong>EMEA</strong> registra un total de <strong>${fmt(current.emea)}</strong>. Por su parte, 
            <strong>APAC</strong> y <strong>Sysomos</strong> cierran con ${fmt(current.apac)} y ${fmt(current.sysomos)} respectivamente.
        </p>

        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border-left: 4px solid var(--blue); margin-bottom: 15px;">
            <strong style="color:#fff; display:block; margin-bottom:5px;">💡 Análisis de Gestión:</strong>
            ${change > 0 
                ? "Se observa un incremento en el flujo de pagos pendientes. Se recomienda priorizar la conciliación de partidas mayores a 30 días para evitar el envejecimiento de la cartera." 
                : "La gestión de aplicaciones muestra una tendencia positiva de limpieza. El equipo ha logrado reducir el saldo pendiente, optimizando la visibilidad del flujo de caja."}
        </div>

        <p style="font-style: italic; color: var(--text3); font-size: 13px;">
            *Nota: Este análisis considera la unificación de todas las pestañas del reporte de NetSuite, eliminando duplicados por número de documento para garantizar la integridad de los saldos regionales.
        </p>
    </div>
    
    <button onclick="copyUaReportToClipboard()" style="margin-top:15px; background:var(--blue); color:#000; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:800; font-size:14px; transition:all 0.3s ease; box-shadow:0 4px 15px rgba(46, 182, 185, 0.3);">
        📋 Copiar Análisis para Reporte
    </button>
  `;

  list.innerHTML = narrative;
}

function copyUaReportToClipboard() {
    const el = document.getElementById('ua-narrative-report');
    if (!el) return;

    // Create a temporary textarea to strip HTML but keep structure
    const text = el.innerText || el.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Análisis copiado al portapapeles.', 'success');
    }).catch(err => {
        showToast('❌ Error al copiar texto.', 'error');
    });
}

function handleUaOverride(region, rawVal, year, month) {
    const val = typeof rawVal === 'string' ? parseFloat(rawVal.replace(/[^-0-9.]/g, '')) : rawVal;
    if (isNaN(val)) return;

    const ua = DATA.cashapp.unappliedPayments;
    if (!ua.overrides) ua.overrides = {};
    
    const key = `${year}|${month}`;
    if (!ua.overrides[key]) ua.overrides[key] = {};
    
    ua.overrides[key][region.toLowerCase()] = val;
    
    console.log(`Manual Override Applied: ${region} = ${val} for ${key}`);
    saveState();
    
    // Refresh only the affected views without full re-render if possible
    buildUnapplied(year, month, 'ALL');
    showToast(`✅ Monto para ${region} actualizado manualmente.`);
}



// ── NEW U/P DETAIL 3-COLUMN PANEL ──────────────────────────────
function buildUaDetailColumns(filterYear, filterMonth) {
  const ua = DATA.cashapp.unappliedPayments;
  const fmt2 = v => {
    if (!v || v === 0) return '—';
    return '$' + Number(v).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  };

  // Month label for title
  const monthLabels = {JANUARY:'January',FEBRUARY:'February',MARCH:'March',APRIL:'April',MAY:'May',JUNE:'June',JULY:'July',AUGUST:'August',SEPTEMBER:'September',OCTOBER:'October',NOVEMBER:'November',DECEMBER:'December'};
  const label = filterMonth === 'ALL' ? filterYear : `${monthLabels[filterMonth] || filterMonth} ${filterYear}`;
  const titleEl = document.getElementById('ua-detail-title');
  if (titleEl) titleEl.textContent = `Total Change details as of ${label}`;

  const renderCol = (containerId, totalId, items) => {
    const cont = document.getElementById(containerId);
    const totEl = document.getElementById(totalId);
    if (!cont) return;

    if (!items || items.length === 0) {
      cont.innerHTML = `<div style="padding:24px 16px; text-align:center; color:var(--text3); font-size:15px; font-style:italic;">Sin datos para este período</div>`;
      if (totEl) totEl.textContent = '$0.00';
      return;
    }

    let runTotal = 0;
    cont.innerHTML = items.map((item, idx) => {
      const amount = typeof item.amount === 'number' ? item.amount : 0;
      runTotal += amount;
      const bg = idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent';
      const amtDisplay = amount > 0 ? fmt2(amount) : (item.currency && item.currency !== 'USD' ? `<span style="color:var(--text3);font-size:12px;">${item.currency}</span>` : '—');
      const amtColor = amount > 0 ? '#fff' : 'var(--text3)';
      return `<div style="display:grid; grid-template-columns:106px 1fr auto; background:${bg}; border-bottom:1px solid rgba(255,255,255,0.04); align-items:center;">
        <div style="padding:11px 12px; font-size:14px; color:var(--text3); white-space:nowrap; font-variant-numeric:tabular-nums;">${item.date || ''}</div>
        <div style="padding:11px 12px; font-size:14px; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${(item.customer||item.name||'').replace(/"/g,"'")}">${item.customer || item.name || ''}</div>
        <div style="padding:11px 16px; font-size:15px; color:${amtColor}; font-weight:700; text-align:right; white-space:nowrap;">${amtDisplay}</div>
      </div>`;
    }).join('');

    if (totEl) totEl.textContent = runTotal > 0 ? fmt2(runTotal) : '$0.00';
  };

  let amItems = [], apItems = [], emItems = [], syItems = [];
  
  // Data source: filter topItems by region AND current month/year selection
  const allItems = ua.topItems || [];
  console.log("Current Filter:", { filterMonth, filterYear });
  if (allItems.length > 0) {
      console.log("Data Sample:", allItems[0]);
      // Optional: console.table(allItems.slice(0, 10)); // Uncomment if needed
  }

  const regionFilter = r => (i) => {
    const regMatch = (i.region||'').toLowerCase() === r.toLowerCase();
    const yearMatch = filterYear === 'ALL' || String(i.year) === String(filterYear);
    const monthMatch = filterMonth === 'ALL' || String(i.month).toUpperCase() === String(filterMonth).toUpperCase();
    return regMatch && yearMatch && monthMatch;
  };
  amItems = allItems.filter(regionFilter('americas'));
  apItems = allItems.filter(regionFilter('apac'));
  emItems = allItems.filter(regionFilter('emea'));
  syItems = allItems.filter(regionFilter('sysomos'));
  console.log(`Results: Americas=${amItems.length}, APAC=${apItems.length}, EMEA=${emItems.length}, Sysomos=${syItems.length}`);

  // If empty, show a summary row from monthlyData
  const getMonthTotal = (reg) => {
    if (!ua.monthlyData) return 0;
    return ua.monthlyData
      .filter(d => d.region.toLowerCase() === reg && (filterYear === 'ALL' || d.year === filterYear) && (filterMonth === 'ALL' || d.month === filterMonth))
      .reduce((s, d) => s + d.total, 0);
  };
  if (amItems.length === 0) amItems = [{ date: label, customer: `Total Americas – ${label}`, amount: getMonthTotal('americas'), currency: 'USD' }];
  if (apItems.length === 0) apItems = [{ date: label, customer: `Total APAC – ${label}`, amount: getMonthTotal('apac'), currency: 'USD' }];
  if (emItems.length === 0) emItems = [{ date: label, customer: `Total EMEA – ${label}`, amount: getMonthTotal('emea'), currency: 'USD' }];
  if (syItems.length === 0) syItems = [{ date: label, customer: `Total Sysomos – ${label}`, amount: getMonthTotal('sysomos'), currency: 'USD' }];

  renderCol('ua-detail-americas', 'ua-detail-americas-total', amItems);
  renderCol('ua-detail-apac',     'ua-detail-apac-total',     apItems);
  renderCol('ua-detail-emea',     'ua-detail-emea-total',     emItems);
  renderCol('ua-detail-sysomos',  'ua-detail-sysomos-total',  syItems);
}


// ── REFUNDS INTERANNUAL COMPARISON ─────────────────────────────
function buildRefundComparisonChart() {
  const rf = DATA.cashapp.refunds;
  const el = document.getElementById('refComparisonChart');
  if (!el || !rf) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const monthNames = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const monthNamesFull = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // 1. Find the latest month in the data
  let latestSortKey = 0;
  if (rf.items && rf.items.length > 0) {
    rf.items.forEach(item => {
      if (!item.created) return;
      const parts = item.created.toLowerCase().split('-');
      if (parts.length >= 2) {
        const mStr = parts[1].trim();
        const yStr = parts.length >= 3 ? parts[2].trim() : '26';
        const mNum = monthNames.indexOf(mStr) + 1;
        const fullYear = yStr.length === 2 ? 2000 + parseInt(yStr) : parseInt(yStr);
        const key = fullYear * 100 + mNum;
        if (key > latestSortKey) latestSortKey = key;
      }
    });
  }

  // If no data, use current date
  if (latestSortKey === 0) {
    const now = new Date();
    latestSortKey = now.getFullYear() * 100 + (now.getMonth() + 1);
  }

  // 2. Generate a rolling 6-month window ending at latestSortKey
  const rollingLabels = [];
  const rollingKeys = []; // [202511, 202512, 202601, ...]
  
  let curYear = Math.floor(latestSortKey / 100);
  let curMonth = latestSortKey % 100;

  for (let i = 0; i < 6; i++) {
    const label = `${monthNamesFull[curMonth-1]} '${curYear.toString().slice(-2)}`;
    rollingLabels.unshift(label);
    rollingKeys.unshift(curYear * 100 + curMonth);
    
    curMonth--;
    if (curMonth === 0) {
      curMonth = 12;
      curYear--;
    }
  }

  // 3. Aggregate data for these 6 months
  const dataPoints = {}; // { 202603: { 'USD': 100, ... } }
  rollingKeys.forEach(k => dataPoints[k] = {});

  if (rf.items) {
    rf.items.forEach(item => {
      if (!item.created) return;
      const parts = item.created.toLowerCase().split('-');
      if (parts.length >= 2) {
        const mStr = parts[1].trim();
        const yStr = parts.length >= 3 ? parts[2].trim() : '26';
        const mNum = monthNames.indexOf(mStr) + 1;
        const fullYear = yStr.length === 2 ? 2000 + parseInt(yStr) : parseInt(yStr);
        const key = fullYear * 100 + mNum;
        
        if (dataPoints[key]) {
          const cur = item.currency || 'USD';
          const amt = Number(item.amount) || 0;
          dataPoints[key][cur] = (dataPoints[key][cur] || 0) + amt;
        }
      }
    });
  }

  const currenciesSet = new Set();
  rollingKeys.forEach(k => {
    Object.keys(dataPoints[k]).forEach(cur => currenciesSet.add(cur));
  });
  const currenciesFound = Array.from(currenciesSet);
  if (currenciesFound.length === 0) currenciesFound.push('USD');

  // 4. Update KPIs with FX Normalization
  const totalActualUSD = rf.items.reduce((s, i) => s + getUSD(Number(i.amount) || 0, i.currency || 'USD'), 0);
  
  // Like-for-Like simulation: only sum prevYear months that have data in current window
  const baselineMonthUSD = 25000; 
  let totalPrevUSD = 0;
  rollingKeys.forEach(k => {
     let monthTotalUSD = 0;
     currenciesFound.forEach(cur => {
        const amt = dataPoints[k][cur] || 0;
        monthTotalUSD += getUSD(amt, cur);
     });
     if (monthTotalUSD > 0) totalPrevUSD += baselineMonthUSD;
  });

  const growthPct = totalPrevUSD > 0 ? ((totalActualUSD - totalPrevUSD) / totalPrevUSD * 100).toFixed(1) : '0.0';

  const elActual = document.getElementById('refCompTotalActual');
  const elActualSub = document.getElementById('refCompTotalActualSub');
  const elGrowth = document.getElementById('refCompGrowth');
  const elBest = document.getElementById('refCompBestMonth');
  const elCount = document.getElementById('refTotalCount');

  if (elActual) elActual.textContent = fmt(totalActualUSD);
  if (elActualSub) {
     // Breakdown in subtext
     const breakdown = currenciesFound.map(cur => {
        const total = rf.items.reduce((s, i) => i.currency === cur ? s + (Number(i.amount) || 0) : s, 0);
        return `${fmt(total)} ${cur}`;
     }).join(' · ');
     elActualSub.textContent = breakdown;
  }
  if (elGrowth) {
    const sign = +growthPct >= 0 ? '+' : '';
    elGrowth.textContent = `${sign}${growthPct}%`;
    const card = document.getElementById('refGrowthCard');
    if (card) card.style.borderLeft = +growthPct > 0 ? '4px solid #ef4444' : '4px solid #10b981';
    if (elGrowth) elGrowth.style.color = +growthPct > 0 ? '#ef4444' : '#10b981';
  }
  if (elCount) elCount.textContent = rf.items.length;

  // Best Month calculation (For Refunds: MINIMUM is best)
  let minMonthUSD = Infinity;
  let bestMonthLabel = rollingLabels[0];
  rollingKeys.forEach((k, i) => {
     let monthTotalUSD = 0;
     currenciesFound.forEach(cur => {
        monthTotalUSD += getUSD(dataPoints[k][cur] || 0, cur);
     });
     if (monthTotalUSD < minMonthUSD && monthTotalUSD > 0) {
       minMonthUSD = monthTotalUSD;
       bestMonthLabel = rollingLabels[i];
     }
  });
  if (minMonthUSD === Infinity) minMonthUSD = 0;
  if (elBest) elBest.textContent = `${bestMonthLabel} · ${fmt(minMonthUSD)}`;

  // 5. Delta Badges (MoM)
  const deltaRow = document.getElementById('refCompDeltaRow');
  if (deltaRow) {
    deltaRow.innerHTML = '';
    rollingKeys.forEach((k, i) => {
      if (i === 0) return;
      const prevK = rollingKeys[i-1];
      let currTotalUSD = 0, prevTotalUSD = 0;
      currenciesFound.forEach(cur => {
        currTotalUSD += getUSD(dataPoints[k][cur] || 0, cur);
        prevTotalUSD += getUSD(dataPoints[prevK][cur] || 0, cur);
      });
      if (prevTotalUSD === 0 && currTotalUSD === 0) return;
      
      const diff = currTotalUSD - prevTotalUSD;
      const pctVal = prevTotalUSD > 0 ? ((diff / prevTotalUSD) * 100).toFixed(1) : '100';
      const sign = diff >= 0 ? '+' : '';
      // FOR REFUNDS: diff > 0 is Negative (Red), diff < 0 is Positive (Green)
      const cls = diff > 0 ? 'negative' : 'positive';
      const badge = document.createElement('div');
      badge.className = `comp-delta-badge ${cls}`;
      badge.style.minWidth = '80px';
      badge.innerHTML = `<span class="delta-month" style="font-size:12px;">${rollingLabels[i]}</span><span style="font-size:16px;">${sign}${pctVal}%</span>`;
      deltaRow.appendChild(badge);
    });
  }

  // 6. Build Chart with Premium Colors
  const CURRENCY_COLORS = { 
    'USD': '#a855f7', // Vivid Purple
    'EUR': '#3b82f6', // Bright Blue
    'MXN': '#10b981', // Emerald
    'GBP': '#f59e0b', // Amber
    'CAD': '#ec4899'  // Pink
  };
  const datasets = currenciesFound.map((cur, i) => {
    const col = CURRENCY_COLORS[cur] || (i === 0 ? '#a855f7' : '#3b82f6');
    return {
      label: `Refunds (${cur})`,
      data: rollingKeys.map(k => dataPoints[k][cur] || 0),
      borderColor: col, borderWidth: 3, pointRadius: 4, pointHoverRadius: 7,
      pointBackgroundColor: col, pointBorderColor: '#fff', pointBorderWidth: 2, tension: 0.4, fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, hexToRgbA(col, 0.15));
        gradient.addColorStop(1, hexToRgbA(col, 0));
        return gradient;
      }
    };
  });

  function hexToRgbA(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
      r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
    }
    return `rgba(${+r},${+g},${+b},${alpha})`;
  }

  if (!charts.refComparison) {
    charts.refComparison = new Chart(el, {
      type: 'line',
      data: { labels: rollingLabels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#fff', font: { weight: '600' }, usePointStyle: true, padding: 20 } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 16, titleFont: { size: 18, weight: 'bold' }, bodyFont: { size: 16 },
            borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, displayColors: true, boxPadding: 8,
            callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8', font: { size: 12 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 12 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } }
        }
      }
    });
  } else {
    charts.refComparison.data.labels = rollingLabels;
    charts.refComparison.data.datasets = datasets;
    charts.refComparison.update();
  }

  // Populate Detailed Summary (Consolidated)
  const detailBox = document.getElementById('refChartDetails');
  if (detailBox) {
      detailBox.innerHTML = '';
      
      // Title for the section
      const summaryTitle = document.createElement('div');
      summaryTitle.style.cssText = `grid-column: 1 / -1; font-size: 13px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; opacity: 0.8;`;
      summaryTitle.textContent = 'Consolidado Histórico (Ventana de 6 Meses)';
      detailBox.appendChild(summaryTitle);

      currenciesFound.forEach(cur => {
         // Sum across all rolling months for this currency
         const totalAmt = rollingKeys.reduce((s, k) => s + (dataPoints[k][cur] || 0), 0);
         if (totalAmt === 0 && currenciesFound.length > 1) return;

         const usdEq = getUSD(totalAmt, cur);
         const color = CURRENCY_COLORS[cur] || '#fff';
         const card = document.createElement('div');
         card.style.cssText = `background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 16px; flex: 1; min-width: 220px; transition: all 0.3s ease;`;
         
         // Format original amount: only use $ if it's USD
         const originalFmt = cur === 'USD' ? fmt(totalAmt) : Math.round(totalAmt).toLocaleString('en-US') + ' ' + cur;

         card.innerHTML = `
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; box-shadow: 0 0 12px ${color};"></div>
            <div style="flex: 1;">
               <div style="font-size: 12px; color: var(--text2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600;">Total ${cur}</div>
               <div style="font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.8px;">${originalFmt}</div>
               ${cur !== 'USD' ? `<div style="font-size: 14px; color: var(--text3); margin-top: 6px; font-weight: 500;">≈ ${fmt(usdEq)} USD Eq.</div>` : ''}
            </div>
         `;
         detailBox.appendChild(card);
      });
  }
}

// ── REFUNDS ANALYSIS ───────────────────────────────────────────
function buildRefunds() {
  const rf = DATA.cashapp.refunds;
  
  // Calculate KPIs and aggregate data for charts
  const totalAmtByCurrency = {};
  let maxAge = 0;
  const statusCounts = {};
  const subAmt = {};
  const subCur = {}; // Map to track currency for each subsidiary
  
  rf.items.forEach(item => {
    const amt = Number(item.amount) || 0;
    const cur = item.currency || 'USD';
    totalAmtByCurrency[cur] = (totalAmtByCurrency[cur] || 0) + amt;
    if (item.age > maxAge) maxAge = item.age;
    
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    subAmt[item.subsidiary] = (subAmt[item.subsidiary] || 0) + amt;
    subCur[item.subsidiary] = cur; // Store currency code
  });
  
  // Update Top KPIs
  const totalAmtHtml = Object.entries(totalAmtByCurrency).map(([cur, amt]) => {
    return `<div style="display:flex; align-items:baseline; gap:10px; margin-bottom: 4px;">${fmt(amt)} <span style="font-size: 16px; color: var(--text2); font-weight: 600; opacity: 0.7;">${cur}</span></div>`;
  }).join('');
  
  const elTotal = document.getElementById('refTotalAmt');
  if (elTotal) elTotal.innerHTML = totalAmtHtml || '$0';
  
  const elCount = document.getElementById('refTotalCount');
  if (elCount) elCount.textContent = rf.items.length;
  
  const elAge = document.getElementById('refMaxAge');
  if (elAge) elAge.textContent = maxAge;

  // Chart 1: Subsidiary Doughnut
  const subLabels = Object.keys(subAmt);
  const subData = Object.values(subAmt);
  const subEl = document.getElementById('refSubsidiaryChart');
  if (subEl) {
    if (!charts.refSubsidiaryChart) {
      charts.refSubsidiaryChart = new Chart(subEl, {
        type: 'doughnut',
        data: {
          labels: subLabels,
          datasets: [{
            data: subData,
            backgroundColor: [COLORS.blue, COLORS.purple, COLORS.green, COLORS.yellow, COLORS.orange],
            borderWidth: 0, borderRadius: 8, spacing: 4, hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '80%',
          plugins: { 
            legend: { position: 'right', labels: { color: COLORS.text2, font: { size: 16, family: 'Inter' }, usePointStyle: true, pointStyle: 'circle', boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const val = context.raw;
                  const pct = ((val / total) * 100).toFixed(1) + '%';
                  return ` ${context.label}: $${val.toLocaleString()} (${pct})`;
                }
              }
            }
          }
        }
      });
    } else {
      charts.refSubsidiaryChart.data.labels = subLabels;
      charts.refSubsidiaryChart.data.datasets[0].data = subData;
      charts.refSubsidiaryChart.update();
    }
  }

  // Chart 2: Status Doughnut
  const statusLabels = Object.keys(statusCounts);
  const statusData = Object.values(statusCounts);
  const statusEl = document.getElementById('refStatusChart');
  if (statusEl) {
    if (!charts.refStatusChart) {
      charts.refStatusChart = new Chart(statusEl, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: [COLORS.red, COLORS.yellow, COLORS.green],
            borderWidth: 0, borderRadius: 8, spacing: 4, hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '80%',
          plugins: { 
            legend: { position: 'right', labels: { color: COLORS.text2, font: { size: 16, family: 'Inter' }, usePointStyle: true, pointStyle: 'circle', boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const val = context.raw;
                  const pct = ((val / total) * 100).toFixed(1) + '%';
                  return ` ${context.label}: ${val} (${pct})`;
                }
              }
            }
          }
        }
      });
    } else {
      charts.refStatusChart.data.labels = statusLabels;
      charts.refStatusChart.data.datasets[0].data = statusData;
      charts.refStatusChart.update();
    }
  }

  // Populate Details for Doughnut Charts
  const subDetail = document.getElementById('refSubsidiaryDetails');
  if (subDetail) {
    subDetail.innerHTML = '';
    const total = subData.reduce((a, b) => a + b, 0);
    subLabels.forEach((label, i) => {
      const val = subData[i];
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
      const col = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.yellow, COLORS.orange][i % 5];
      const item = document.createElement('div');
      item.style.cssText = `display: flex; justify-content: space-between; align-items: center; font-size: 17px; color: var(--text); padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 6px;`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${col};"></div>
          <span style="color: var(--text2); font-size: 16px;">${label}</span>
        </div>
        <div style="font-weight: 600;">${Math.round(val).toLocaleString('en-US')} <span style="font-size: 14px; color: var(--text2);">${subCur[label] || 'USD'}</span> <span style="color: var(--text2); font-weight: 400; font-size: 14px;">(${pct}%)</span></div>
      `;
      subDetail.appendChild(item);
    });
  }

  const statusDetail = document.getElementById('refStatusDetails');
  if (statusDetail) {
    statusDetail.innerHTML = '';
    const total = statusData.reduce((a, b) => a + b, 0);
    statusLabels.forEach((label, i) => {
      const val = statusData[i];
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
      const col = [COLORS.red, COLORS.yellow, COLORS.green][i % 3];
      const item = document.createElement('div');
      item.style.cssText = `display: flex; justify-content: space-between; align-items: center; font-size: 17px; color: var(--text); padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 6px;`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${col};"></div>
          <span style="color: var(--text2); font-size: 16px;">${label}</span>
        </div>
        <div style="font-weight: 600;">${val.toLocaleString('en-US')} <span style="color: var(--text2); font-weight: 400; font-size: 14px;">solicitudes</span></div>
      `;
      statusDetail.appendChild(item);
    });
  }

  // Table: Pending Refunds
  const tableBody = document.getElementById('refundTableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
    rf.items.forEach((item, index) => {
      const cls = item.status === 'Pendiente' ? 'critical' : (item.status === 'Validando' ? 'high' : 'medium');
      const ageColor = item.age > 10 ? 'color: var(--red)' : '';
      
      let formattedDate = item.created;
      if (item.created) {
        const parts = item.created.toLowerCase().split('-');
        if (parts.length >= 2) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
          const y = parts.length >= 3 ? (parts[2].length === 2 ? '20'+parts[2] : parts[2]) : '';
          formattedDate = y ? `${d}-${m}-${y}` : `${d}-${m}`;
        }
      }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="background-color: rgba(16, 185, 129, 0.15); color: #10b981;"><strong>${item.rftNumber}</strong></td>
        <td>${formattedDate}</td>
        <td>${item.subsidiary}</td>
        <td>${Number(item.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
        <td>${item.currency}</td>
        <td><span style="${ageColor}; font-weight: bold;">${item.age}</span></td>
        <td>${item.responsable}</td>
        <td><a href="${item.link}" target="_blank" style="color: var(--blue); text-decoration: underline;">${item.link}</a></td>
        <td><span class="risk-badge ${cls}">${item.status}</span></td>
        <td>
          <button onclick="editRefund(${index})" style="background:none;border:none;color:var(--yellow);cursor:pointer;margin-right:8px;" title="Editar">✏️</button>
          <button onclick="deleteRefund(${index})" style="background:none;border:none;color:var(--red);cursor:pointer;" title="Eliminar">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // --- NEW: Generate Intelligent Insights for Refunds ---
  const refInsightsList = document.getElementById('ref-insights-list');
  if (refInsightsList) {
    refInsightsList.innerHTML = '';
    
    // Insight 1: Concentration by Subsidiary
    const sortedSubs = Object.entries(subAmt).sort((a, b) => b[1] - a[1]);
    if (sortedSubs.length > 0) {
      const topSub = sortedSubs[0][0];
      const topVal = sortedSubs[0][1];
      const totalAll = Object.values(subAmt).reduce((a, b) => a + b, 0);
      const subPct = totalAll > 0 ? ((topVal / totalAll) * 100).toFixed(1) : 0;
      
      const li = document.createElement('li');
      li.style.marginBottom = "15px";
      li.innerHTML = `<strong>Concentración Operativa:</strong> La subsidiaria <strong>${topSub}</strong> concentra el ${subPct}% del volumen total de reembolsos. Se recomienda revisar si existen cuellos de botella específicos en los procesos de validación de esta entidad.`;
      refInsightsList.appendChild(li);
    }

    // Insight 2: Status Efficiency
    const pendingCount = statusCounts['Pendiente'] || 0;
    const totalCount = rf.items.length;
    const pendingPct = totalCount > 0 ? ((pendingCount / totalCount) * 100).toFixed(1) : 0;
    
    const liEff = document.createElement('li');
    liEff.style.marginBottom = "8px";
    if (pendingPct > 40) {
      liEff.innerHTML = `<strong>Alerta de Procesamiento:</strong> El <strong>${pendingPct}%</strong> de las solicitudes están en estado <em>Pendiente</em>. Un porcentaje alto sugiere una carga de trabajo excedida o falta de documentación inicial por parte del solicitante.`;
    } else {
      liEff.innerHTML = `<strong>Flujo de Validación Saludable:</strong> El nivel de solicitudes pendientes es bajo (${pendingPct}%). La mayoría de los reembolsos están en etapas avanzadas de validación o ya completados.`;
    }
    refInsightsList.appendChild(liEff);

    // Insight 3: Currency & Exposure
    const nonUsdAmt = Object.entries(totalAmtByCurrency).reduce((s, [cur, amt]) => cur !== 'USD' ? s + getUSD(amt, cur) : s, 0);
    const totalUsdEq = Object.entries(totalAmtByCurrency).reduce((s, [cur, amt]) => s + getUSD(amt, cur), 0);
    const exposurePct = totalUsdEq > 0 ? ((nonUsdAmt / totalUsdEq) * 100).toFixed(1) : 0;

    const liCur = document.createElement('li');
    liCur.style.marginBottom = "15px";
    liCur.innerHTML = `<strong>Impacto Cambiario:</strong> El ${exposurePct}% de los reembolsos se originan en monedas distintas al USD. La fluctuación de tipos de cambio (especialmente EUR/GBP) impacta directamente en el reporte consolidado de AR.`;
    refInsightsList.appendChild(liCur);

    // Insight 4: Average Age
    const avgAge = rf.items.length > 0 ? (rf.items.reduce((s, i) => s + (i.age || 0), 0) / rf.items.length).toFixed(1) : 0;
    const liAge = document.createElement('li');
    if (avgAge > 7) {
      liAge.innerHTML = `<strong>Ciclo de Vida Extendido:</strong> El tiempo promedio de resolución es de <strong>${avgAge} días</strong>. <em>Acción recomendada: Priorizar los casos que superan los 10 días para evitar reclamos de clientes.</em>`;
    } else {
      liAge.innerHTML = `<strong>Eficiencia en Resolución:</strong> El ciclo promedio de reembolso es de ${avgAge} días, cumpliendo con los estándares de servicio al cliente (SLA).`;
    }
    refInsightsList.appendChild(liAge);
  }
}

window.deleteRefund = function(index) {
  if (confirm('¿Seguro que deseas eliminar este registro?')) {
    DATA.cashapp.refunds.items.splice(index, 1);
    saveState();
    buildRefunds();
    buildRefundComparisonChart();
  }
};

window.editRefund = function(index) {
  const tableBody = document.getElementById('refundTableBody');
  const row = tableBody.children[index];
  const item = DATA.cashapp.refunds.items[index];
  
  row.innerHTML = `
    <td><input type="text" id="edit_rft_${index}" value="${item.rftNumber}" style="width:80px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="text" id="edit_cre_${index}" value="${item.created}" style="width:70px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="text" id="edit_sub_${index}" value="${item.subsidiary}" style="width:110px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="number" id="edit_amt_${index}" value="${item.amount}" style="width:90px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="text" id="edit_cur_${index}" value="${item.currency}" style="width:50px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="number" id="edit_age_${index}" value="${item.age}" style="width:50px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="text" id="edit_res_${index}" value="${item.responsable}" style="width:80px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td><input type="text" id="edit_lnk_${index}" value="${item.link}" style="width:100px;background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;"></td>
    <td>
      <select id="edit_sta_${index}" style="background:var(--surface);color:var(--text);border:1px solid #444;padding:4px;border-radius:4px;">
        <option value="Pendiente" ${item.status==='Pendiente'?'selected':''}>Pendiente</option>
        <option value="Validando" ${item.status==='Validando'?'selected':''}>Validando</option>
        <option value="Completado" ${item.status==='Completado'?'selected':''}>Completado</option>
      </select>
    </td>
    <td>
      <button onclick="saveEditRefund(${index})" style="background:none;border:none;color:var(--green);cursor:pointer;margin-right:8px;" title="Guardar">✔️</button>
      <button onclick="buildRefunds()" style="background:none;border:none;color:var(--red);cursor:pointer;" title="Cancelar">❌</button>
    </td>
  `;
};

window.saveEditRefund = function(index) {
  const item = DATA.cashapp.refunds.items[index];
  item.rftNumber = document.getElementById(`edit_rft_${index}`).value;
  item.created = document.getElementById(`edit_cre_${index}`).value;
  item.subsidiary = document.getElementById(`edit_sub_${index}`).value;
  item.amount = Number(document.getElementById(`edit_amt_${index}`).value);
  item.currency = document.getElementById(`edit_cur_${index}`).value;
  item.age = Number(document.getElementById(`edit_age_${index}`).value);
  item.responsable = document.getElementById(`edit_res_${index}`).value;
  item.link = document.getElementById(`edit_lnk_${index}`).value;
  item.status = document.getElementById(`edit_sta_${index}`).value;
  
  saveState();
  buildRefunds();
  buildRefundComparisonChart();
}

// ── CASH APPLICATIONS ──────────────────────────────────────────
function filterCashApp(type) {
  // If clicking same filter, toggle to 'all'
  if (currentCaFilter === type) {
    currentCaFilter = 'all';
  } else {
    currentCaFilter = type;
  }

  // Visual update of cards
  document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('active-filter'));
  if (currentCaFilter !== 'all') {
    const card = document.getElementById(`ca-card-${currentCaFilter}`);
    if (card) card.classList.add('active-filter');
  }

  // Update Table Title
  const title = document.getElementById('ca-table-title');
  if (title) {
    if (currentCaFilter === 'unapplied') title.textContent = 'Partidas Pendientes: Unapplied Cash';
    else if (currentCaFilter === 'suspense') title.textContent = 'Partidas Pendientes: Suspense Account';
    else title.textContent = 'Top Partidas Pendientes de Aplicar';
  }

  buildCashApp();
}

function buildCashApp() {
  const ca = DATA.cashapp;

  document.getElementById('ca-unapplied').textContent = fmt(ca.kpis.unapplied);
  document.getElementById('ca-suspense').textContent = fmt(ca.kpis.suspense);
  document.getElementById('ca-automatch').textContent = ca.kpis.autoMatch + '%';
  if (document.getElementById('ca-time')) {
    document.getElementById('ca-time').textContent = ca.kpis.manTime + ' min';
  }

  // --- Generate Insights ---
  const insightsList = document.getElementById('ca-insights-list');
  if (insightsList) {
    insightsList.innerHTML = '';

    // Insight 1: Auto-match rate
    const autoInsight = document.createElement('li');
    if (ca.kpis.autoMatch >= 80) {
      autoInsight.innerHTML = `<strong>Tasa de Aplicación Automática Saludable:</strong> El sistema está emparejando automáticamente el ${ca.kpis.autoMatch}% de los ingresos, reduciendo significativamente la carga manual.`;
      autoInsight.style.marginBottom = "15px";
    } else {
      autoInsight.innerHTML = `<strong>Oportunidad de Eficiencia (${ca.kpis.autoMatch}%):</strong> Aumentar el auto-match reduciría el tiempo extra manual promedio que actualmente requiere ${ca.kpis.manTime} min por partida.`;
      autoInsight.style.marginBottom = "15px";
    }
    insightsList.appendChild(autoInsight);

    // Insight 2: Unapplied vs Suspense
    const unappInsight = document.createElement('li');
    unappInsight.innerHTML = `<strong>Flujo de Efectivo Retenido:</strong> Actualmente, existen <strong>${fmt(ca.kpis.unapplied)}</strong> pendientes de aplicar a las cuentas de los clientes. Reducir esta cantidad impactaría positivamente en el flujo de caja inmediato. De este monto total, <strong>${fmt(ca.kpis.suspense)}</strong> se encuentran etiquetados como <em>Cuenta de Suspenso</em> por estar totalmente sin identificar.`;
    unappInsight.style.marginBottom = "15px";
    insightsList.appendChild(unappInsight);

    // Insight 3: Biggest Suspense Offender
    const sus = ca.suspense;
    const maxSusVal = Math.max(sus.noRef, sus.invalidAmt, sus.noClient, sus.doublePay);
    let topReason = '';
    if (maxSusVal === sus.noRef) topReason = "Falta de Referencia";
    else if (maxSusVal === sus.invalidAmt) topReason = "Monto Inválido";
    else if (maxSusVal === sus.noClient) topReason = "Cliente No Encontrado";
    else topReason = "Doble Pago";

    const susInsight = document.createElement('li');
    susInsight.innerHTML = `<strong>Causa Principal de Descuadres:</strong> El motivo #1 de partidas sin registrar es por <strong>${topReason}</strong> (${maxSusVal}% en la muestra de suspenso). <em>Acción recomendada: Automatizar recordatorios para que los clientes adjunten esta información en sus comprobantes de pago.</em>`;
    susInsight.style.marginBottom = "15px";
    insightsList.appendChild(susInsight);

    // Insight 4: YoY Comparison Chart Analysis
    const history = ca.appliedCashHistory;
    if (history && Object.keys(history).length >= 1) {
      const yearKeys = Object.keys(history);
      const key1 = yearKeys[0];
      const key2 = yearKeys[1]; // might be undefined

      const curr = history[key1];
      const prev = key2 ? history[key2] : null;
      const months = DATA.months;

      const totalCurr = curr.reduce((s, v) => s + v, 0);
      const label1 = key1.replace('year', '').replace('currentYear', '2026');
      
      const yoyInsight = document.createElement('li');
      yoyInsight.style.marginTop = "10px";
      yoyInsight.style.paddingTop = "10px";
      yoyInsight.style.borderTop = "1px solid rgba(255,255,255,0.06)";

      if (prev) {
        const totalPrev = prev.reduce((s, v) => s + v, 0);
        const yoyPct = ((totalCurr - totalPrev) / totalPrev * 100).toFixed(1);
        const label2 = key2.replace('year', '').replace('prevYear', '2025');

        // Best and worst month by delta
        const deltas = curr.map((v, i) => ({ month: months[i], delta: v - (prev[i] || 0), pct: prev[i] ? ((v - prev[i]) / prev[i] * 100).toFixed(1) : '0' }));
        const bestMonth = deltas.reduce((a, b) => b.delta > a.delta ? b : a);
        const worstMonth = deltas.reduce((a, b) => b.delta < a.delta ? b : a);

        // Acceleration: compare avg growth of last 3 vs first 3 months
        const firstHalf = deltas.slice(0, Math.floor(deltas.length / 2));
        const secondHalf = deltas.slice(Math.floor(deltas.length / 2));
        const avgFirst = firstHalf.reduce((s, d) => s + parseFloat(d.pct), 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((s, d) => s + parseFloat(d.pct), 0) / (secondHalf.length || 1);
        const isAccelerating = avgSecond > avgFirst;
        const trendLabel = isAccelerating
          ? `<span style="color:#10b981">acelerando ▲</span> (promedio reciente +${avgSecond.toFixed(1)}% vs inicio +${avgFirst.toFixed(1)}%)`
          : `<span style="color:#f59e0b">desacelerando ▼</span> (promedio reciente +${avgSecond.toFixed(1)}% vs inicio +${avgFirst.toFixed(1)}%)`;

        const yoySign = yoyPct >= 0 ? '+' : '';
        const yoyColor = yoyPct >= 0 ? '#10b981' : '#ef4444';

        yoyInsight.innerHTML = `
          <strong>📈 Análisis Interanual (${label1} vs ${label2}):</strong>
          El efectivo aplicado acumulado en ${label1} es de <strong style="color:#3b82f6">${fmt(totalCurr)}</strong>,
          ${totalCurr > totalPrev ? 'superando' : 'por debajo de'} los <strong style="color:rgba(255,255,255,0.5)">${fmt(totalPrev)}</strong> de ${label2}
          — un ${totalCurr > totalPrev ? 'crecimiento' : 'cambio'} de <strong style="color:${yoyColor}">${yoySign}${yoyPct}%</strong>.
          El mes con mayor mejora fue <strong style="color:#10b981">${bestMonth.month} (+${bestMonth.pct}%)</strong>.
          La tendencia está ${trendLabel}.`;
      } else {
        yoyInsight.innerHTML = `
          <strong>📈 Análisis de Efectivo Aplicado (${label1}):</strong>
          El efectivo aplicado acumulado en ${label1} es de <strong style="color:#3b82f6">${fmt(totalCurr)}</strong>.
          No hay datos de años anteriores para realizar una comparativa interanual, pero el flujo se mantiene estable.`;
      }
      insightsList.appendChild(yoyInsight);
    }
  }

  // Chart 1: Auto vs Manual applying matching rate per month
  const months = DATA.months;
  const baseAuto = Number(ca.kpis.autoMatch) || 80;
  const autoData = months.map(() => Math.min(100, Math.floor(baseAuto + (Math.random() * 10 - 5))));
  const manData = autoData.map(v => 100 - v);

  const caMatchEl = document.getElementById('caMatchChart');
  if (caMatchEl) {
    if (!charts.caMatch) {
      charts.caMatch = new Chart(caMatchEl, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Automático (%)', data: autoData, backgroundColor: COLORS.green, borderRadius: 4 },
            { label: 'Manual (%)', data: manData, backgroundColor: COLORS.orange, borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 14, font: { size: 16 } } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 14 } } },
            y: { stacked: true, max: 100, grid: { color: '#232840' }, ticks: { font: { size: 14 } } }
          }
        }
      });
    } else {
      charts.caMatch.data.labels = months;
      charts.caMatch.data.datasets[0].data = autoData;
      charts.caMatch.data.datasets[1].data = manData;
      charts.caMatch.update();
    }
  }

  buildCashComparison();

  // Chart 2: Aging of Unapplied Cash (Data Driven)
  const items = ca.items || [];
  let d0_3 = 0, d4_7 = 0, d8_14 = 0, d15p = 0;
  
  items.forEach(item => {
    const days = Number(item.days) || 0;
    if (days <= 3) d0_3 += item.amount;
    else if (days <= 7) d4_7 += item.amount;
    else if (days <= 14) d8_14 += item.amount;
    else d15p += item.amount;
  });

  // If no items, fallback to dummy data or zeros
  if (items.length === 0) {
    const total = ca.kpis.unapplied || 0;
    d0_3 = total * 0.6;
    d4_7 = total * 0.25;
    d8_14 = total * 0.1;
    d15p = total * 0.05;
  }

  const caAgingEl = document.getElementById('caAgingChart');
  if (caAgingEl) {
    if (!charts.caAging) {
      charts.caAging = new Chart(caAgingEl, {
        type: 'doughnut',
        data: {
          labels: ['0-3 días', '4-7 días', '8-14 días', '+15 días'],
          datasets: [{
            data: [d0_3, d4_7, d8_14, d15p],
            backgroundColor: [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: {
            legend: { display: true, position: 'right', labels: { boxWidth: 14, font: { size: 16 } } },
            tooltip: { enabled: true, callbacks: { label: (ctx) => ' ' + fmt(ctx.raw) } }
          }
        }
      });
    } else {
      charts.caAging.data.datasets[0].data = [d0_3, d4_7, d8_14, d15p];
      charts.caAging.update();
    }
  }

  // Chart 3: Suspense Composition
  const suspData = [ca.suspense.noRef, ca.suspense.invalidAmt, ca.suspense.noClient, ca.suspense.doublePay];

  const caSuspenseEl = document.getElementById('caSuspenseChart');
  if (caSuspenseEl) {
    if (!charts.caSuspense) {
      charts.caSuspense = new Chart(caSuspenseEl, {
        type: 'pie',
        data: {
          labels: ['Falta Referencia', 'Monto Inválido', 'Cliente No Encontrado', 'Doble Pago'],
          datasets: [{
            data: suspData,
            backgroundColor: [COLORS.orange, COLORS.purple, COLORS.yellow, COLORS.red],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'right', labels: { boxWidth: 14, font: { size: 16 } } },
            tooltip: { enabled: true }
          }
        }
      });
    } else {
      charts.caSuspense.data.datasets[0].data = suspData;
      charts.caSuspense.update();
    }
  }

  // Table: Top Unapplied Items
  const tableBody = document.getElementById('caTableBody');
  if (tableBody) {
    tableBody.innerHTML = '';

    // Filter logic unified with resyncData
    let items = ca.items;
    if (currentCaFilter === 'unapplied') {
      items = ca.items; // Everything is unapplied
    } else if (currentCaFilter === 'suspense') {
      items = ca.items.filter(i => i.status === 'Pendiente' || (i.client && i.client.includes('?')));
    }

    items.forEach(item => {
      const cls = item.status === 'Investigando' ? 'high' : item.status === 'Contactado' ? 'medium' : 'critical';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.ref}</strong></td>
        <td>${fmt(item.amount)}</td>
        <td>${item.date}</td>
        <td><span style="color:var(--red)">${item.days}</span></td>
        <td>${item.client}</td>
        <td><span class="risk-badge ${cls}">${item.status}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

// ── YEARLY CASH COMPARISON ──────────────────────────────────────
function buildCashComparison() {
  const history = DATA.cashapp.appliedCashHistory;
  if (!history) return;
  const el = document.getElementById('caComparisonChart');
  if (!el) return;

  const yearKeys = Object.keys(history);
  if (yearKeys.length === 0) return;

  const allMonths = DATA.months;
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';

  // Filter out empty keys and sort them so currentYear/prevYear are first if they exist
  const validKeys = yearKeys.filter(k => k.trim() !== '' && history[k] && history[k].length > 0);
  if (validKeys.length === 0) return;

  const key1 = validKeys[0];
  const key2 = validKeys[1];
  const data1 = history[key1] || [];
  const data2 = history[key2] || [];
  
  // Sync labels with data length to avoid gaps on the right
  const months = allMonths.slice(0, data1.length);

  const getLabel = (k) => {
    let l = k.replace('year', '').replace('Year', '');
    const low = l.toLowerCase();
    if (low.includes('current') || low.includes('actual') || k === 'currentYear') {
      return isEn ? 'Current (2026)' : 'Actual (2026)';
    }
    if (low.includes('prev') || low.includes('anterior') || k === 'prevYear') {
      return isEn ? 'Previous (2025)' : 'Anterior (2025)';
    }
    // If it's just a number, leave it. If not, capitalize.
    if (isNaN(l)) l = l.charAt(0).toUpperCase() + l.slice(1);
    return l;
  };

  const label1 = getLabel(key1);
  const label2 = key2 ? getLabel(key2) : '';

  // ── Populate KPI summary pills ──────────────────────────────────
  const total1 = data1.reduce((s, v) => s + v, 0);
  const total2 = data2.length > 0 ? data2.reduce((s, v) => s + v, 0) : 0;
  
  const growthPct = total2 > 0 ? ((total1 - total2) / total2 * 100).toFixed(1) : '0.0';
  const bestIdx = data1.indexOf(Math.max(...data1));

  const el2026 = document.getElementById('compTotal2026');
  const el2025 = document.getElementById('compTotal2025');
  const elGrowth = document.getElementById('compGrowth');
  const elBest = document.getElementById('compBestMonth');

  if (el2026) {
    el2026.textContent = fmt(total1);
    const labelEl = el2026.previousElementSibling;
    if (labelEl) labelEl.textContent = (isEn ? 'Total Applied ' : 'Total Aplicado ') + label1;
  }
  if (el2025) {
    if (key2) {
      el2025.textContent = fmt(total2);
      const labelEl = el2025.previousElementSibling;
      if (labelEl) labelEl.textContent = (isEn ? 'Total Applied ' : 'Total Aplicado ') + label2;
      el2025.parentElement.style.display = '';
    } else {
      el2025.parentElement.style.display = 'none';
    }
  }
  if (elGrowth) {
    if (key2) {
      const sign = growthPct >= 0 ? '+' : '';
      elGrowth.textContent = `${sign}${growthPct}%`;
      elGrowth.style.color = +growthPct >= 0 ? '#10b981' : '#ef4444';
      elGrowth.parentElement.style.display = '';
    } else {
      elGrowth.parentElement.style.display = 'none';
    }
  }
  if (elBest) {
    const bestLabel = (isEn ? 'Best Month (' : 'Mejor Mes (') + label1 + ')';
    const labelEl = elBest.previousElementSibling;
    if (labelEl) labelEl.textContent = bestLabel;
    elBest.textContent = `${months[bestIdx]} · ${fmt(data1[bestIdx])}`;
  }

  // ── Populate month delta badges ─────────────────────────────────
  const deltaRow = document.getElementById('caCompDeltaRow');
  if (deltaRow) {
    deltaRow.innerHTML = ''; // Always clear to rebuild
    if (key2) {
      months.forEach((m, i) => {
        const val1 = data1[i] || 0;
        const val2 = data2[i] || 0;
        if (val2 === 0) return;
        
        const delta = val1 - val2;
        const pct = ((delta / val2) * 100).toFixed(1);
        const sign = delta >= 0 ? '+' : '';
        const cls = delta >= 0 ? 'positive' : 'negative';
        const badge = document.createElement('div');
        badge.className = `comp-delta-badge ${cls}`;
        badge.innerHTML = `<span class="delta-month">${m}</span><span>${sign}${pct}%</span>`;
        deltaRow.appendChild(badge);
      });
    }
  }

  // ── Build or update chart ───────────────────────────────────────
  if (!charts.caComparison) {
    const datasets = [];
    
    // Update the chart tag (e.g. "2026 vs 2025")
    const chartTag = document.querySelector('#tab-cashapp .chart-tag');
    if (chartTag && validKeys.length >= 2) {
      chartTag.textContent = `${label1} vs ${label2}`;
    }

    const COLORS_LIST = ['#3b82f6', 'rgba(255,255,255,0.4)', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#eab308'];

    validKeys.forEach((yk, idx) => {
      const label = getLabel(yk);
      const color = COLORS_LIST[idx % COLORS_LIST.length];
      const isPrimary = idx === 0;

      datasets.push({
        label: label,
        data: history[yk],
        borderColor: color,
        backgroundColor: isPrimary ? 'rgba(59,130,246,0.12)' : 'transparent',
        borderDash: isPrimary ? [] : [6, 4],
        fill: isPrimary,
        tension: 0.45,
        pointRadius: isPrimary ? 5 : 3,
        pointHoverRadius: isPrimary ? 8 : 6,
        pointBackgroundColor: color,
        borderWidth: isPrimary ? 3 : 2,
        order: idx + 1
      });
    });

    charts.caComparison = new Chart(el, {
      type: 'line',
      data: {
        labels: months,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { 
              color: COLORS.text, 
              font: { size: 16 },
              padding: 20,
              usePointStyle: false,
              boxWidth: 30
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17,19,26,0.97)',
            titleColor: '#fff',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (items) => months[items[0].dataIndex],
              beforeBody: () => '─────────────────',
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const val = ctx.raw;
                return `  ${ctx.dataset.label}: ${fmt(val)}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: COLORS.text2, font: { size: 15 }, padding: 6 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] }, ticks: { color: COLORS.text2, font: { size: 15 }, padding: 8, callback: v => '$' + (v / 1000000).toFixed(1) + 'M' }, border: { display: false } }
        }
      }
    });
  } else {
    // Re-initialize if the number of years changed or labels changed
    const currentDatasetCount = charts.caComparison.data.datasets.length;
    const newDatasetCount = Object.keys(history).length;
    
    if (currentDatasetCount !== newDatasetCount) {
      charts.caComparison.destroy();
      delete charts.caComparison;
      buildCashComparison(); // Re-run to create fresh
    } else {
      // Just update data of existing datasets
      const yearKeys = Object.keys(history);
      yearKeys.forEach((yk, idx) => {
        if (charts.caComparison.data.datasets[idx]) {
          charts.caComparison.data.datasets[idx].data = history[yk];
        }
      });
      charts.caComparison.update();
    }
  }
}

// ── RISK TABLE ─────────────────────────────────────────────────
function buildRiskTable() {
  const body = document.getElementById('riskTableBody');
  if (body.children.length > 0) return;
  const risky = [...DATA.clients].filter(c => c.score >= 50).sort((a, b) => b.score - a.score);
  risky.forEach(c => {
    const cls = c.score >= 80 ? 'critical' : c.score >= 60 ? 'high' : 'medium';
    const lbl = c.score >= 80 ? 'Crítico' : c.score >= 60 ? 'Alto' : 'Medio';
    const trendHtml = c.trend === 'up' ? '<span class="trend-tag trend-up">▲ Deteriorando</span>' :
      c.trend === 'down' ? '<span class="trend-tag trend-down">▼ Mejorando</span>' :
        '<span class="trend-tag trend-stable">→ Estable</span>';
    const barColor = c.score >= 80 ? COLORS.red : c.score >= 60 ? COLORS.orange : COLORS.yellow;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${fmt(c.balance)}</td>
      <td>${c.overdue} días</td>
      <td>${c.limitExc > 0 ? '<span style="color:var(--red)">+' + c.limitExc + '%</span>' : '<span style="color:var(--green)">No excedido</span>'}</td>
      <td>${trendHtml}</td>
      <td>
        <div class="score-bar-wrap">
          <div class="score-bar"><div class="score-fill" style="width:${c.score}%;background:${barColor}"></div></div>
          <span style="font-size:16px;font-weight:700;color:${barColor}">${c.score}</span>
        </div>
      </td>
      <td><span class="risk-badge ${cls}">${lbl}</span></td>`;
    body.appendChild(tr);
  });
}

// ── SEGMENTATION MATRIX ────────────────────────────────────────
function buildSegmentation() {
  const quads = { strategic: [], alert: [], stable: [], lowrisk: [] };
  DATA.clients.forEach(c => quads[c.seg].push(c));
  const render = (id, arr) => {
    const el = document.getElementById('seg-' + id);
    if (el.children.length > 0) return;
    arr.forEach(c => {
      const div = document.createElement('div');
      div.className = 'client-chip';
      div.innerHTML = `<span class="cn">${c.name}</span><span class="cv">${fmt(c.balance)}</span>`;
      el.appendChild(div);
    });
  };
  render('strategic', quads.strategic);
  render('alert', quads.alert);
  render('stable', quads.stable);
  render('lowrisk', quads.lowrisk);
}

// ── PROJECTION ─────────────────────────────────────────────────
function buildProjectionChart() {
  if (charts.projection) {
    charts.projection.destroy();
    delete charts.projection;
  }
  
  // ── Weekly detection logic ──────────────────────────────────────
  // Instead of hardcoded strings, we'll try to extract the day number
  const getWeekIndex = (weekStr) => {
    if (!weekStr) return -1;
    // Extract numbers from string (e.g., "Mar 04" -> 4, "2026-03-05" -> 5)
    const matches = weekStr.match(/\d+/g);
    if (!matches || matches.length === 0) return -1;
    
    // Assume the last or only number is the day if it's <= 31
    const day = parseInt(matches[matches.length - 1]);
    if (day >= 1 && day <= 7) return 0;
    if (day >= 8 && day <= 14) return 1;
    if (day >= 15 && day <= 21) return 2;
    if (day >= 22) return 3;
    return -1;
  };

  const isEn = currentLang === 'en';
  const weeks = isEn 
    ? ['Week 1 (Mar 1–7)', 'Week 2 (Mar 8–14)', 'Week 3 (Mar 15–21)', 'Week 4 (Mar 22–31)']
    : ['Semana 1 (Mar 1–7)', 'Semana 2 (Mar 8–14)', 'Semana 3 (Mar 15–21)', 'Semana 4 (Mar 22–31)'];

  const dataByWeek = [
    { high: 0, med: 0, low: 0 },
    { high: 0, med: 0, low: 0 },
    { high: 0, med: 0, low: 0 },
    { high: 0, med: 0, low: 0 }
  ];

  DATA.projection.forEach(p => {
    const idx = getWeekIndex(p.week);
    if (idx !== -1 && dataByWeek[idx]) {
      dataByWeek[idx][p.prob] += p.amount;
    }
  });

  const projectionEl = document.getElementById('projectionChart');
  if (projectionEl) {
    charts.projection = new Chart(projectionEl, {
    type: 'bar',
    data: {
      labels: weeks,
      datasets: [
        { label: isEn ? 'High Probability' : 'Alta Probabilidad', data: dataByWeek.map(w => w.high), backgroundColor: COLORS.green, borderRadius: 6, stack: 's' },
        { label: isEn ? 'Medium Probability' : 'Media Probabilidad', data: dataByWeek.map(w => w.med), backgroundColor: COLORS.yellow, borderRadius: 0, stack: 's' },
        { label: isEn ? 'Low Probability' : 'Baja Probabilidad', data: dataByWeek.map(w => w.low), backgroundColor: COLORS.red, borderRadius: 0, stack: 's' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: 10 },
      plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 14, font: { size: 16 } } } },
      scales: { 
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 14 } } }, 
        y: { stacked: true, grid: { color: '#232840' }, ticks: { font: { size: 14 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } } 
      }
    }
  });
}
}

function buildProjectionTable() {
  const cont = document.getElementById('projectionTable');
  if (cont.children.length > 0) return;
  const table = document.createElement('table');
  table.className = 'proj-table';
  table.innerHTML = `<thead><tr><th>Cliente</th><th>Fecha Estimada</th><th>Monto Proyectado</th><th>Probabilidad</th><th>Estado</th></tr></thead><tbody></tbody>`;
  const body = table.querySelector('tbody');
  DATA.projection.forEach(p => {
    const probClass = p.prob === 'high' ? 'prob-high' : p.prob === 'med' ? 'prob-med' : 'prob-low';
    const probText = p.prob === 'high' ? 'Alta (≥75%)' : p.prob === 'med' ? 'Media (40-74%)' : 'Baja (<40%)';
    const status = p.prob === 'high' ? '✔ Comprometido' : p.prob === 'med' ? '⏳ En Negociación' : '⚠ Incierto';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${p.client}</strong></td><td>${p.week}, 2026</td><td>${fmt(p.amount)}</td><td class="${probClass}">${probText}</td><td>${status}</td>`;
    body.appendChild(tr);
  });
  cont.appendChild(table);
}

// ── DATA REGENERATION ──────────────────────────────────────────
function regenerateData() {
  const rnd = (a, b) => +(a + (Math.random() * (b - a))).toFixed(1);
  DATA.dso.actual = rnd(33, 45);
  DATA.dso.prev = rnd(31, 42);
  DATA.aging.current = Math.round(1200000 + Math.random() * 900000);
  DATA.aging.d30 = Math.round(700000 + Math.random() * 500000);
  DATA.aging.d60 = Math.round(400000 + Math.random() * 400000);
  DATA.aging.d90 = Math.round(250000 + Math.random() * 350000);
  DATA.aging.d90p = Math.round(150000 + Math.random() * 300000);
  DATA.totalAR = DATA.aging.current + DATA.aging.d30 + DATA.aging.d60 + DATA.aging.d90 + DATA.aging.d90p;

  // Randomize Refunds
  DATA.cashapp.refunds.total = Math.round(50000 + Math.random() * 100000);
  DATA.cashapp.refunds.history = DATA.months.map(() => Math.round(10000 + Math.random() * 20000));
  DATA.cashapp.refunds.items.forEach(item => {
    item.amount = Math.round(2000 + Math.random() * 15000);
  });
  // Destroy all cached charts so they rebuild
  Object.values(charts).forEach(c => c.destroy && c.destroy());
  Object.keys(charts).forEach(k => delete charts[k]);
  // Clear rendered tables/segments
  ['riskTableBody', 'seg-strategic', 'seg-alert', 'seg-stable', 'seg-lowrisk'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
  });
  const projTable = document.getElementById('projectionTable');
  if (projTable) projTable.innerHTML = '';
  // Update KPIs
  document.getElementById('kpi-total').textContent = fmt(DATA.totalAR);
  document.getElementById('kpi-dso').textContent = DATA.dso.actual + ' días';
  const dsoDiff = (DATA.dso.actual - DATA.dso.target).toFixed(1);
  const dsoDelta = document.getElementById('kpi-dso-delta');
  if (dsoDiff > 0) {
    dsoDelta.textContent = `↑ ${dsoDiff} días vs objetivo`;
    dsoDelta.className = 'kpi-delta negative';
  } else {
    dsoDelta.textContent = `↓ ${Math.abs(dsoDiff)} días vs objetivo`;
    dsoDelta.className = 'kpi-delta positive';
  }
  document.getElementById('kpi-collected').textContent = fmt(Math.round(DATA.totalAR * 0.45));
  resyncData();
  initCharts(activeTab);
  showToast('🔄 Datos regenerados exitosamente');
}

// ════════════════════════════════════════════════════════════════
//  UPLOAD MODAL – Subir datos reales (CSV / JSON)
// ════════════════════════════════════════════════════════════════

let _pendingFile = null;

function openUploadModal() {
  document.getElementById('uploadModal').classList.add('open');
  resetDropZone();
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('open');
  resetDropZone();
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('uploadModal')) closeUploadModal();
}

function resetDropZone() {
  _pendingFile = null;
  const dz = document.getElementById('dropZone');
  dz.classList.remove('dragover', 'has-file');
  dz.innerHTML = `
    <div class="drop-icon">📄</div>
    <p class="drop-text">Arrastra tu archivo aquí</p>
    <p class="drop-sub">o haz <strong>clic</strong> para seleccionar</p>
    <p class="drop-types">Formatos soportados: <strong>.csv</strong> · <strong>.json</strong></p>
    <input type="file" id="fileInput" accept=".csv,.json" style="display:none" onchange="handleFileSelect(event)">`;
  const status = document.getElementById('uploadStatus');
  status.style.display = 'none';
  status.className = 'upload-status';
  document.getElementById('btnLoad').disabled = true;
}

// ── Drag & Drop ─────────────────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.add('dragover');
}
function handleDragLeave(e) {
  document.getElementById('dropZone').classList.remove('dragover');
}
function handleDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('dropZone');
  dz.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

// ── Process selected file ───────────────────────────────────────
function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (['xls', 'xlsx'].includes(ext)) {
    processXlsFile(file);
    return;
  }

  if (!['csv', 'json', 'xls', 'xlsx'].includes(ext)) {
    showStatus('❌ Formato no válido. Usa .csv, .json o .xls/xlsx', 'error');
    return;
  }
  _pendingFile = file;
  const dz = document.getElementById('dropZone');
  if (dz) {
    dz.classList.add('has-file');
    dz.innerHTML = `
      <div class="drop-icon">✅</div>
      <p class="drop-text">${file.name}</p>
      <p class="drop-sub">Archivo listo para procesar</p>
      <button class="action-btn" onclick="resetDropZone()" style="margin-top:10px; background:rgba(255,255,255,0.1); color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:12px;">Cambiar</button>
    `;
  }
  const btnLoad = document.getElementById('btnLoad');
  if (btnLoad) {
    btnLoad.disabled = false;
    btnLoad.onclick = () => {
      if (ext === 'xls' || ext === 'xlsx') {
        processXlsFile(file);
      } else {
        loadFileData(file, ext);
      }
    };
  }
  showStatus(`✔ "${file.name}" seleccionado. Presiona "Cargar Archivo" para actualizar el dashboard.`, 'success');
}

function processXlsFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const validDatasets = [];
            const headerKeys = ["subsidiary", "subsidiaria", "amount", "monto", "remaining", "date", "fecha", "number", "número"];
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const currentMonthIdx = new Date().getMonth();

            workbook.SheetNames.forEach(name => {
                const ws = workbook.Sheets[name];
                if (!ws['!ref']) return;
                
                const sampleRows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: "" }).slice(0, 10);
                let sheetScore = 0;
                let hasEssential = false;

                sampleRows.forEach(row => {
                    if (!Array.isArray(row)) return;
                    const rowStr = row.join(" ").toLowerCase();
                    let rowMatches = 0;
                    headerKeys.forEach(k => {
                        if (rowStr.includes(k)) rowMatches++;
                    });
                    if (rowStr.includes("amount") || rowStr.includes("remaining")) {
                        if (rowStr.includes("subsidiary") || rowStr.includes("date") || rowStr.includes("number")) hasEssential = true;
                    }
                    sheetScore = Math.max(sheetScore, rowMatches);
                });

                let isOld = false;
                monthNames.forEach((m, idx) => {
                    if (idx < currentMonthIdx && name.toLowerCase().includes(m)) isOld = true;
                });

                if (hasEssential && sheetScore >= 2 && !isOld) {
                    console.log(`✅ Sheet "${name}" qualified.`);
                    const fullData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                    validDatasets.push({ name: name, data: fullData });
                }
            });

            if (validDatasets.length === 0) {
                // Fallback: pick the largest sheet if everything was filtered
                let best = workbook.SheetNames[0];
                let maxR = 0;
                workbook.SheetNames.forEach(n => {
                    const range = XLSX.utils.decode_range(workbook.Sheets[n]['!ref'] || "A1:A1");
                    const r = range.e.r - range.s.r;
                    if (r > maxR) { maxR = r; best = n; }
                });
                validDatasets.push({ name: best, data: XLSX.utils.sheet_to_json(workbook.Sheets[best], { header: 1, defval: "" }) });
            }

            let allProcessed = [];
            validDatasets.forEach(item => {
                const extracted = parseSheetItems(item.data, item.name);
                allProcessed = allProcessed.concat(extracted);
            });
            
            if (allProcessed.length > 0) {
                updateUnappliedData(allProcessed);
                showToast(`¡Éxito! Cargados ${allProcessed.length} registros de ${validDatasets.length} pestañas.`);
                closeUploadModal();
            } else {
                showToast("No se encontraron datos válidos.", "error");
            }
        } catch (err) {
            console.error("XLS Error:", err);
            showToast("Error crítico procesando Excel.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}


// ── Parse & Load ────────────────────────────────────────────────
function loadFileData(file, ext) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (ext === 'json') {
        const parsed = JSON.parse(e.target.result);
        applyData(parsed);
      } else {
        parseCSVAndApply(e.target.result);
      }
    } catch (err) {
      showStatus('❌ Error al parsear el archivo: ' + err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ── CSV Parser ──────────────────────────────────────────────────
function parseCSVAndApply(csvText) {
  // Helper to safely parse numbers from strings with commas, symbols, etc.
  const n = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const clean = val.toString().replace(/[^-0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  // Try to find sections, if Excel fused them we will parse row by row grouping headers
  const lines = csvText.trim().split('\n').map(l => l.trim().replace(/\r/g, '')).filter(l => l && !l.startsWith('#'));
  const parsed = {};

  // Group rows by identifying header rows (rows without numbers, or specific known headers)
  let currentHeaders = null;
  let currentRows = [];

  const processGroup = (headers, rows) => {
    if (!headers || headers.length === 0 || rows.length === 0) return;

    // Check for empty CSV trailing lines
    if (headers.length === 1 && headers[0] === "") return;

    // Detect type by columns present using robust exact matches of common patterns
    if (headers.includes('dso_actual') || headers.includes('total_ar')) {
      const r = rows[0] || {};
      parsed.dso = {
        actual: n(r.dso_actual),
        prev: n(r.dso_prev),
        best: n(r.dso_best),
        target: n(r.dso_target)
      };
      if (r.total_ar) parsed.totalAR = n(r.total_ar);
      if (r.collected) parsed.collected = n(r.collected);
    }

    if (headers.includes('aging_bucket') && headers.includes('amount')) {
      parsed.aging = {};
      rows.forEach(r => {
        const b = (r.aging_bucket || r.bucket || '').toLowerCase();
        const v = n(r.amount || r.saldo);
        if (b.includes('corr') || b === 'current') parsed.aging.current = v;
        else if (b.includes('1') || b.includes('30')) parsed.aging.d30 = v;
        else if (b.includes('31') || b.includes('60')) parsed.aging.d60 = v;
        else if (b.includes('61') || b.includes('90')) parsed.aging.d90 = v;
        else if (b.includes('+90') || b.includes('90+')) parsed.aging.d90p = v;
      });
    }

    if (headers.includes('name') && headers.includes('balance') && headers.includes('overdue')) {
      parsed.clients = rows.map(r => ({
        name: r.name,
        balance: n(r.balance),
        overdue: n(r.overdue),
        limitExc: n(r.limitexc || r.limit_exc),
        trend: r.trend || 'stable',
        score: n(r.score || 50),
        seg: r.seg || 'stable'
      }));
    }

    if (headers.includes('client') && headers.includes('week') && headers.includes('amount')) {
      parsed.projection = rows.map(r => ({
        client: r.client,
        week: r.week,
        amount: n(r.amount),
        prob: r.prob || 'med'
      }));
    }

    if (headers.includes('month') && headers.includes('dso')) {
      parsed.months = rows.map(r => r.month);
      parsed.dsoHistory = rows.map(r => n(r.dso));
    }

    if (headers.some(h => h.includes('ca_unapplied')) || headers.some(h => h.includes('ca_automatch'))) {
      const r = rows[0] || {};
      parsed.cashapp = parsed.cashapp || { kpis: {}, suspense: {}, items: [] };
      parsed.cashapp.kpis = {
        unapplied: n(r.ca_unapplied),
        suspense: n(r.ca_suspense),
        autoMatch: n(r.ca_automatch),
        manTime: n(r.ca_mantime)
      };
    }

    if (headers.some(h => h.includes('sus_noref')) || headers.some(h => h.includes('sus_invalidamt'))) {
      const r = rows[0] || {};
      parsed.cashapp = parsed.cashapp || { kpis: {}, suspense: {}, items: [] };
      parsed.cashapp.suspense = {
        noRef: n(r.sus_noref),
        invalidAmt: n(r.sus_invalidamt),
        noClient: n(r.sus_noclient),
        doublePay: n(r.sus_doublepay)
      };
    }

    if (headers.some(h => h.includes('ca_ref')) || headers.some(h => h.includes('ca_status'))) {
      parsed.cashapp = parsed.cashapp || { kpis: {}, suspense: {}, items: [], appliedCashHistory: null };
      parsed.cashapp.items = rows.filter(r => r.ca_ref).map(r => ({
        ref: r.ca_ref,
        amount: n(r.ca_amount),
        date: r.ca_date || '',
        days: n(r.ca_days),
        client: r.ca_client || '',
        status: r.ca_status || ''
      }));
    }

    if (headers.includes('rft_number')) {
      parsed.cashapp = parsed.cashapp || { kpis: {}, suspense: {}, items: [], refunds: { items: [] } };
      parsed.cashapp.refunds = parsed.cashapp.refunds || { items: [] };
      parsed.cashapp.refunds.items = rows.filter(r => r.rft_number).map(r => ({
        rftNumber: r.rft_number,
        created: r.created || '',
        subsidiary: r.subsidiary || '',
        amount: n(r.amount),
        currency: r.currency || '',
        age: n(r.age),
        responsable: r.responsable || '',
        link: r.link || '',
        status: r.status || 'Pendiente'
      }));
    }

    // Section 9: Comparativa Interanual (YoY Cash Applied History)
    const yoyHeader = headers.find(h => h.includes('ca_history') || h === 'month');
    if (yoyHeader) {
      parsed.cashapp = parsed.cashapp || { kpis: {}, suspense: {}, items: [], appliedCashHistory: {} };
      const historyObj = {};
      
      // Identify all year columns (exclude the month column)
      const yearHeaders = headers.filter(h => h !== yoyHeader && h !== '');
      
      yearHeaders.forEach(yh => {
        // Map common headers back to internal keys if needed, or just use the header name
        let key = yh;
        if (yh === 'ca_history_curr') key = 'currentYear';
        if (yh === 'ca_history_prev') key = 'prevYear';
        
        historyObj[key] = rows.map(r => n(r[yh]));
      });
      
      parsed.cashapp.appliedCashHistory = historyObj;
      
      if (!parsed.months) {
        parsed.months = rows.map(r => r[yoyHeader]);
      }
    }
  };

  const isHeaderRow = (cols) => {
    // A row is likely a header if it contains specific known keywords
    return cols.some(c => ['dso_actual', 'aging_bucket', 'name', 'client', 'month', 'ca_unapplied', 'sus_noref', 'ca_ref', 'ca_history_month', 'rft_number'].includes(c));
  };

  for (let i = 0; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map(c => c.trim().toLowerCase());

    if (isHeaderRow(rawCols)) {
      if (currentHeaders) {
        processGroup(currentHeaders, currentRows);
      }
      currentHeaders = rawCols;
      currentRows = [];
    } else if (currentHeaders) {
      const vals = lines[i].split(',').map(v => v.replace(/[\r\n]+/g, '').trim());
      // Skip totally blank rows
      if (vals.some(v => v !== '')) {
        const obj = {};
        currentHeaders.forEach((h, idx) => obj[h] = vals[idx] ? vals[idx] : '');
        currentRows.push(obj);
      }
    }
  }

  // Process last group
  if (currentHeaders && currentRows.length > 0) {
    processGroup(currentHeaders, currentRows);
  }

  applyData(parsed);
}

// ── Apply data to dashboard ─────────────────────────────────────
function applyData(parsed) {
  let changed = 0;

  if (parsed.dso) {
    Object.assign(DATA.dso, parsed.dso);
    changed++;
  }
  if (parsed.aging) {
    Object.assign(DATA.aging, parsed.aging);
    changed++;
  }
  if (parsed.totalAR) { DATA.totalAR = parsed.totalAR; changed++; }
  if (parsed.collected) { DATA.collected = parsed.collected; changed++; }
  if (parsed.clients && parsed.clients.length > 0) {
    DATA.clients = parsed.clients;
    changed++;
  }
  if (parsed.projection && parsed.projection.length > 0) {
    DATA.projection = parsed.projection;
    // Destroy the projection chart and table so they rebuild with fresh data
    if (charts.projection) { charts.projection.destroy(); delete charts.projection; }
    const pt = document.getElementById('projectionTable');
    if (pt) pt.innerHTML = '';
    changed++;
  }
  if (parsed.months && parsed.months.length > 0) {
    DATA.months = parsed.months;
    DATA.dsoHistory = parsed.dsoHistory;
    if (charts.overviewAging) { charts.overviewAging.destroy(); delete charts.overviewAging; }
    changed++;
  }
  if (parsed.cashapp) {
    if (parsed.cashapp.kpis && Object.keys(parsed.cashapp.kpis).length > 0) DATA.cashapp.kpis = parsed.cashapp.kpis;
    if (parsed.cashapp.suspense && Object.keys(parsed.cashapp.suspense).length > 0) DATA.cashapp.suspense = parsed.cashapp.suspense;
    if (parsed.cashapp.items && parsed.cashapp.items.length > 0) DATA.cashapp.items = parsed.cashapp.items;
    if (parsed.cashapp.refunds && parsed.cashapp.refunds.items && parsed.cashapp.refunds.items.length > 0) {
      DATA.cashapp.refunds.items = parsed.cashapp.refunds.items;
    }
    // Apply new YoY comparison chart data
    if (parsed.cashapp.appliedCashHistory) {
      DATA.cashapp.appliedCashHistory = parsed.cashapp.appliedCashHistory;
      // Destroy cached chart so it rebuilds with fresh data
      if (charts.caComparison) { charts.caComparison.destroy(); delete charts.caComparison; }
      // Clear delta badges so they regenerate
      const dr = document.getElementById('caCompDeltaRow');
      if (dr) dr.innerHTML = '';
    }
    changed++;
  }

  resyncData();
  closeUploadModal();
  showToast('✅ Dashboard actualizado con datos reales', 'success');
}

// ── EXPORT CSV ─────────────────────────────────────────────────
function exportCSV() {
  const d = DATA;
  let csv = "";

  // 1. Resumen DSO y Totales
  csv += "dso_actual,dso_prev,dso_best,dso_target,total_ar,collected\n";
  csv += `${d.dso.actual},${d.dso.prev},${d.dso.best},${d.dso.target},${d.totalAR},${d.collected}\n\n`;

  // 2. Reporte de Antigüedad (Aging)
  csv += "aging_bucket,amount\n";
  csv += `current,${d.aging.current}\n`;
  csv += `d30,${d.aging.d30}\n`;
  csv += `d60,${d.aging.d60}\n`;
  csv += `d90,${d.aging.d90}\n`;
  csv += `d90p,${d.aging.d90p}\n\n`;

  // 3. Clientes
  csv += "name,balance,overdue,limitExc,trend,score,seg\n";
  d.clients.forEach(c => {
    csv += `${c.name},${c.balance},${c.overdue},${c.limitExc},${c.trend},${c.score},${c.seg}\n`;
  });
  csv += "\n";

  // 4. Proyección
  csv += "client,week,amount,prob\n";
  d.projection.forEach(p => {
    csv += `${p.client},${p.week},${p.amount},${p.prob}\n`;
  });
  csv += "\n";

  // 5. Histórico DSO
  csv += "month,dso\n";
  d.months.forEach((m, i) => {
    csv += `${m},${d.dsoHistory[i] || 0}\n`;
  });
  csv += "\n";

  // 6. Cash App KPIs
  csv += "ca_unapplied,ca_suspense,ca_automatch,ca_mantime\n";
  csv += `${d.cashapp.kpis.unapplied},${d.cashapp.kpis.suspense},${d.cashapp.kpis.autoMatch},${d.cashapp.kpis.manTime}\n\n`;

  // 7. Cash App Suspense Composition
  csv += "sus_noref,sus_invalidamt,sus_noclient,sus_doublepay\n";
  csv += `${d.cashapp.suspense.noRef},${d.cashapp.suspense.invalidAmt},${d.cashapp.suspense.noClient},${d.cashapp.suspense.doublePay}\n\n`;

  // 8. Cash App Items Table
  csv += "ca_ref,ca_amount,ca_date,ca_days,ca_client,ca_status\n";
  d.cashapp.items.forEach(item => {
    csv += `${item.ref},${item.amount},${item.date},${item.days},${item.client},${item.status}\n`;
  });
  csv += "\n";

  // 9. Comparativa Interanual de Efectivo Aplicado (Gráfica YoY)
  if (d.cashapp.appliedCashHistory) {
    const h = d.cashapp.appliedCashHistory;
    const yearKeys = Object.keys(h);
    
    // Header
    csv += "ca_history_month," + yearKeys.join(",") + "\n";
    
    // Rows
    d.months.forEach((m, i) => {
      const vals = yearKeys.map(yk => h[yk][i] || 0);
      csv += `${m},` + vals.join(",") + "\n";
    });
    csv += "\n";
  }

  // 10. Refunds Table
  csv += "rft_number,created,subsidiary,amount,currency,age,responsable,link,status\n";
  d.cashapp.refunds.items.forEach(item => {
    csv += `${item.rftNumber},${item.created},${item.subsidiary},${item.amount},${item.currency},${item.age},${item.responsable},${item.link},${item.status}\n`;
  });
  csv += "\n";

  // Crear y descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "ar_datos_exportados.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('✅ Archivo CSV descargado correctamente', 'success');
}

// ── Format tabs in modal ─────────────────────────────────────────
function showFmtTab(type) {
  document.getElementById('fmtPanelCSV').style.display = type === 'csv' ? '' : 'none';
  document.getElementById('fmtPanelJSON').style.display = type === 'json' ? '' : 'none';
  document.getElementById('fmtTabCSV').className = 'fmt-tab' + (type === 'csv' ? ' active' : '');
  document.getElementById('fmtTabJSON').className = 'fmt-tab' + (type === 'json' ? ' active' : '');
}

// ── Status msg in modal ──────────────────────────────────────────
function showStatus(msg, type) {
  const el = document.getElementById('uploadStatus');
  el.textContent = msg;
  el.className = 'upload-status ' + type;
  el.style.display = '';
}

// ── Toast notification ───────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = 'toast'; }, 4000);
}

// ── ADD CLIENT MODAL ────────────────────────────────────────────
function openAddClientModal() {
  document.getElementById('addClientModal').classList.add('open');
}

function closeAddClientModal() {
  document.getElementById('addClientModal').classList.remove('open');
  document.getElementById('addClientForm').reset();
}

function handleAddClientOverlayClick(e) {
  if (e.target === document.getElementById('addClientModal')) {
    closeAddClientModal();
  }
}

function handleAddClientSubmit(e) {
  e.preventDefault();

  const v = Number(document.getElementById('acBalance').value);
  const o = Number(document.getElementById('acOverdue').value);

  const newClient = {
    name: document.getElementById('acName').value,
    balance: v,
    overdue: o,
    limitExc: Number(document.getElementById('acLimitExc').value),
    trend: document.getElementById('acTrend').value,
    score: Number(document.getElementById('acScore').value),
    seg: document.getElementById('acSeg').value
  };

  DATA.clients.push(newClient);

  if (o <= 0) DATA.aging.current += v;
  else if (o <= 30) DATA.aging.d30 += v;
  else if (o <= 60) DATA.aging.d60 += v;
  else if (o <= 90) DATA.aging.d90 += v;
  else DATA.aging.d90p += v;

  DATA.totalAR += v;

  resyncData();
  closeAddClientModal();
  showToast('✅ Cliente agregado exitosamente', 'success');
}



// ── SINGLE INIT POINT ──────────────────────────────────────────
// All initialization runs ONCE here, after all functions are defined.
document.addEventListener('DOMContentLoaded', () => {
  (function initDashboard() {
    loadState();       // Merge saved state (with schema version check)
    // Wait for Chart.js CDN to be ready before initializing
    function tryInit() {
      if (typeof Chart !== 'undefined') {
        chartDefaults();   // Configure Chart.js global defaults
        resyncData();      // Sync data → DOM → charts
        // Extra delayed call to ensure overview chart renders correctly
        // Force redraw after layout is complete (canvas has real dimensions now)
        setTimeout(function() {
          charts.overviewAging = null;
          updateOverviewChart();
        }, 150);
      } else {
        // Chart.js not yet loaded — retry in 100ms
        setTimeout(tryInit, 100);
      }
    }
    tryInit();
    if (window.lucide) {
      lucide.createIcons();
    }
  })();
});

// Guarantee chart draws after full page load + layout
window.addEventListener('load', function() {
  setTimeout(function() {
    charts.overviewAging = null;
    updateOverviewChart();
  }, 80);
});

// ── LANGUAGE TOGGLE (I18N) ──────────────────────────────────────────
// (currentLang declared at top of file as a global)

const esToEn = {
  // ── SIDEBAR NAV LABELS ──────────────────────────
  "Resumen Financiero": "Financial Summary",
  "DSO & Cobranza": "DSO & Collections",
  "AR & AP Hub": "AR & AP Hub",
  "Cash Flow & Forecast": "Cash Flow & Forecast",
  "México-USA & FX": "Mexico-USA & FX",
  "Conciliación Bancaria": "Bank Reconciliation",
  "Conciliación": "Reconciliation",
  "Reembolsos / RFT": "Refunds / RFT",
  "No Aplicados PMT": "Unapplied PMT",
  "NetSuite / No Aplicados PMT": "NetSuite / Unapplied PMT",
  // ── SIDEBAR FOOTER ──────────────────────────────
  "Agregar Cliente": "Add Client",
  "Subir Datos Reales": "Upload Real Data",
  "Exportar CSV": "Export CSV",
  "Restablecer Datos": "Reset Data",
  "Abr 2026": "Apr 2026",
  "Abr": "Apr",
  // ── DASHBOARD HEADER ────────────────────────────
  "Finance & Collections · Griska": "Finance & Collections · Griska",
  "Resumen Ejecutivo · Abril 2026": "Executive Summary · April 2026",
  "Resumen Ejecutivo · Abr 2026": "Executive Summary · Apr 2026",
  "FINANCIAL TEAM MEMBERS": "FINANCIAL TEAM MEMBERS",
  "Cartera Saludable": "Healthy Portfolio",
  "Active Now": "Active Now",
  // ── KPI OVERVIEW LABELS ─────────────────────────
  "CARTERA TOTAL (AR)": "TOTAL PORTFOLIO (AR)",
  "CAPITAL DE TRABAJO": "WORKING CAPITAL",
  "FLUJO NETO MTD": "NET FLOW MTD",
  "LÍNEAS DE FINANCIAMIENTO": "FINANCING LINES",
  "78% de la Meta": "78% of Goal",
  "83% del Objetivo": "83% of Target",
  "90% Logrado": "90% Achieved",
  "57% Disponible": "57% Available",
  "78% de la meta": "78% of goal",
  "83% del objetivo": "83% of target",
  "90% logrado": "90% achieved",
  "57% disponible": "57% available",
  "Bajo Riesgo": "Low Risk",
  "Tendencia de Cartera Total": "Total Portfolio Trend",
  "Oct 2025 - Mar 2026": "Oct 2025 - Mar 2026",
  "Máximo": "Maximum",
  "Mínimo": "Minimum",
  // ── WELCOME SECTION ─────────────────────────────
  "Welcome back!": "Welcome back!",
  "Your portfolio is currently showing a": "Your portfolio is currently showing a",
  "increase": "increase",
  "in collections compared to last month. Keep it up!": "in collections compared to last month. Keep it up!",
  // ── CLIENTES PRINCIPALES TABLE ──────────────────
  "Clientes Principales": "Key Clients",
  "CLIENTE": "CLIENT",
  "SALDO EXPOSICIÓN": "EXPOSURE BALANCE",
  "ESTATUS": "STATUS",
  // ── ACTIVIDAD DE COBROS ─────────────────────────
  "Actividad de Cobros (Suspense)": "Collections Activity (Suspense)",
  // ── MONEDAS Y FX ─────────────────────────────────
  "Monedas & Exposición Cambiaria": "Currencies & FX Exposure",
  "Tipo de Cambio (MXN)": "Exchange Rate (MXN)",
  "Tipo de Cambio": "Exchange Rate",
  // ── PAGE TITLE SUBTITLES ────────────────────────
  "Resumen Ejecutivo": "Executive Summary",
  "Análisis DSO": "DSO Analysis",
  "Análisis de Riesgo": "Risk Analysis",
  "Segmentación de Cartera": "Portfolio Segmentation",
  "Proyección de Recaudos": "Collections Projection",
  "Análisis de Refunds": "Refunds Analysis",
  "Pagos No Aplicados": "Unapplied Payments",
  // ── EXISTING ENTRIES ────────────────────────────
  "de la Meta": "of Goal",
  "del Objetivo": "of Target",
  "Logrado": "Achieved",
  "Disponible": "Available",
  "Bajo Riesgo": "Low Risk",
  "Resumen Ejecutivo": "Executive Summary",
  "Cuentas por Cobrar · Análisis Estratégico": "Accounts Receivable · Strategic Analysis",
  "Resumen": "Overview",
  "Riesgo": "Risk",
  "Segmentación": "Segmentation",
  "Proyección": "Projection",
  "Agregar Cliente": "Add Client",
  "Subir Datos Reales": "Upload Real Data",
  "Exportar CSV": "Export CSV",
  "Restablecer Datos": "Reset Data",
  "Cartera Total": "Total Portfolio",
  "DSO Actual": "Current DSO",
  "Recaudado MTD": "Collected MTD",
  "Clientes en Riesgo": "At-Risk Clients",
  "vs mes anterior": "vs previous month",
  "vs objetivo": "vs target",
  "nuevos esta semana": "new this week",
  "Distribución de Cartera por Antigüedad": "Portfolio Aging Distribution",
  "Composición de Riesgo": "Risk Composition",
  "Abril": "April",
  "Objetivo:": "Target:",
  "Arriba del objetivo": "Above Target",
  "Mes Anterior": "Previous Month",
  "Deterioro": "Deterioration",
  "Meta Saludable": "Healthy Goal",
  "Objetivo Anual": "Annual Target",
  "Objetivo Fijo": "Fixed Target",
  "Tendencia DSO (6 Meses)": "DSO Trend (6 Months)",
  "Real vs Meta": "Actual vs Target",
  "Composición del DSO": "DSO Composition",
  "Base vs Retraso": "Base vs Delay",
  "Corriente": "Current",
  "días": "days",
  "dias": "days",
  "Aging Report – Desglose por Antigüedad": "Aging Report – Breakdown by Age",
  "Monto": "Amount",
  "Aging por Cliente": "Aging by Client",
  "Clientes con Mayor Riesgo de Impago": "Clients with Highest Default Risk",
  "Clasificados por score de riesgo compuesto": "Ranked by composite risk score",
  "Cliente": "Client",
  "Saldo Vencido": "Overdue Balance",
  "Días Vencido": "Days Overdue",
  "Límite Excedido": "Limit Exceeded",
  "Tendencia 6M": "6M Trend",
  "Score Riesgo": "Risk Score",
  "Clasificación": "Classification",
  "Crítico": "Critical",
  "Alto": "High",
  "Medio": "Medium",
  "Deteriorando": "Deteriorating",
  "Mejorando": "Improving",
  "Estable": "Stable",
  "No excedido": "Not exceeded",
  "Matriz de Segmentación de Cartera": "Portfolio Segmentation Matrix",
  "Valor del Cliente vs. Riesgo de Cobro": "Client Value vs. Collection Risk",
  "Clientes Estratégicos": "Strategic Clients",
  "Bajo Riesgo": "Low Risk",
  "Alto Valor": "High Value",
  "Clientes en Alerta": "Alert Clients",
  "Alto Riesgo": "High Risk",
  "Bajo Valor": "Low Value",
  "Clientes Estables": "Stable Clients",
  "Proyección 30 días": "30-Day Projection",
  "Confianza": "Confidence",
  "Recaudo Probable": "Probable Collection",
  "Recaudo Posible": "Possible Collection",
  "En Riesgo": "At Risk",
  "Prob. alta": "High prob.",
  "Prob. media": "Med prob.",
  "Proyección Semanal de Recaudos": "Weekly Collection Projection",
  "Próximos 30 Días": "Next 30 Days",
  "Calendario de Vencimientos por Cliente": "Client Maturity Calendar",
  "Fecha Estimada": "Estimated Date",
  "Monto Proyectado": "Projected Amount",
  "Probabilidad": "Probability",
  "Estado": "Status",
  "Comprometido": "Committed",
  "En Negociación": "In Negotiation",
  "Incierto": "Uncertain",
  "Pendiente de aplicar": "Pending application",
  "Partidas sin identificar": "Unidentified items",
  "Eficiencia del sistema": "System efficiency",
  "Por procesar": "To be processed",
  "Análisis Inteligente de Cash Applications": "Intelligent Cash Application Analysis",
  "Tasa de Aplicación Automática Saludable": "Healthy Automatic Application Rate",
  "Oportunidad de Eficiencia": "Efficiency Opportunity",
  "Flujo de Efectivo Retenido": "Retained Cash Flow",
  "Causa Principal de Descuadres": "Main Cause of Mismatches",
  "Aplicación Automática vs Manual": "Automatic vs Manual Application",
  "Últimos 6 Meses": "Last 6 Months",
  "Tendencia de Refunds": "Refunds Trend",
  "Antigüedad de Unapplied Cash": "Aging of Unapplied Cash",
  "Composición de Partidas Sin Identificar": "Composition of Unidentified Items",
  "Top Partidas Pendientes de Aplicar": "Top Pending Items",
  "Detalle de depósitos recibidos que no han podido ser conciliados contra facturas.": "Details of received deposits unable to be reconciled.",
  "Referencia / Banco": "Reference / Bank",
  "Fecha de Depósito": "Deposit Date",
  "Días sin aplicar": "Days unapplied",
  "Posible Origen": "Possible Origin",
  "Estatus": "Status",
  "Análisis de Refunds": "Refunds Analysis",
  "Detalle de las solicitudes de devolución pendientes de validación y pago.": "Details of refund requests pending validation and payment.",
  "Monto Refund": "Refund Amount",
  "Motivo": "Reason",
  "Fecha Solicitud": "Request Date",
  "Responsable": "Owner",
  "Acciones": "Actions",
  "Cartera Saludable": "Healthy Portfolio",
  "Investigando": "Investigating",
  "Contactado": "Contacted",
  "Pendiente": "Pending",
  "Desconocido": "Unknown",
  "Doble Pago": "Double Payment",
  "Error en Factura": "Invoice Error",
  "Nota de Crédito": "Credit Note",
  "Falta de Referencia": "Missing Reference",
  "Monto Inválido": "Invalid Amount",
  "Cliente No Encontrado": "Client Not Found",
  "Validando": "Validating",
  "Semana": "Week",
  "Últimos": "Last",
  "Tasa de Aplicación Automática Saludable:": "Healthy Automatic Application Rate:",
  "El sistema está emparejando automáticamente el": "The system is automatically matching",
  "de los ingresos, reduciendo significativamente la carga manual.": "of income, significantly reducing manual effort.",
  "Oportunidad de Eficiencia": "Efficiency Opportunity",
  "Aumentar el auto-match reduciría el tiempo extra manual promedio que actualmente requiere": "Increasing auto-match would reduce the average manual overtime currently required",
  "min por partida.": "min per item.",
  "Flujo de Efectivo Retenido:": "Retained Cash Flow:",
  "Actualmente, existen": "Currently, there are",
  "pendientes de aplicar a las cuentas de los clientes. Reducir esta cantidad impactaría positivamente en el flujo de caja inmediato. De este monto total,": "pending application to client accounts. Reducing this amount would positively impact immediate cash flow. Of this total amount,",
  "se encuentran etiquetados como": "are labeled as",
  "Cuenta de Suspenso": "Suspense Account",
  "por estar totalmente sin identificar.": "for being completely unidentified.",
  "Causa Principal de Descuadres:": "Main Cause of Mismatches:",
  "El motivo #1 de partidas sin registrar es por": "The #1 reason for unregistered items is",
  "en la muestra de suspenso": "in the suspense sample",
  "Acción recomendada: Automatizar recordatorios para que los clientes adjunten esta información en sus comprobantes de pago.": "Recommended action: Automate reminders for clients to attach this information to their payment receipts.",
  "Comparativa Interanual de Efectivo Aplicado": "Year-on-Year Applied Cash Comparison",
  "Año Actual (2026)": "Current Year (2026)",
  "Año Anterior (2025)": "Previous Year (2025)",
  "Análisis Interanual": "Year-on-Year Analysis",
  "El efectivo aplicado acumulado en": "The accumulated applied cash in",
  "superando los": "surpassing",
  "por debajo de los": "below",
  "un crecimiento de": "a growth of",
  "un cambio de": "a change of",
  "El mes con mayor mejora fue": "The month with the greatest improvement was",
  "La tendencia está": "The trend is",
  "acelerando": "accelerating",
  "desacelerando": "decelerating",
  "promedio reciente": "recent average",
  "vs inicio": "vs start",
  "Total Aplicado": "Total Applied",
  "Mejor Mes": "Best Month",
  "Alta Probabilidad": "High Probability",
  "Media Probabilidad": "Medium Probability",
  "Baja Probabilidad": "Low Probability",
  "Crítico": "Critical",
  "Alto": "High",
  "Medio": "Medium",
  "Estable": "Stable",
  "Mejorando": "Improving",
  "Deteriorando": "Deteriorating",
  "No excedido": "Not exceeded",
  "días": "days",
  "Actual": "Actual",
  "Anterior": "Previous",
  "Ene": "Jan", "Feb": "Feb", "Mar": "Mar", "Abr": "Apr", "May": "May", "Jun": "Jun",
  "Jul": "Jul", "Ago": "Aug", "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dic": "Dec",
  "Análisis Inteligente de Refunds": "Intelligent Refunds Analysis",
  "Concentración Operativa:": "Operational Concentration:",
  "Alerta de Procesamiento:": "Processing Alert:",
  "Impacto Cambiario:": "FX Impact:",
  "Ciclo de Vida Extendido:": "Extended Lifecycle:",
  "subsidiaria": "subsidiary",
  "concentra el": "concentrates",
  "del volumen total de reembolsos. Se recomienda revisar si existen cuellos de botella específicos en los procesos de validación de esta entidad.": "of the total refund volume. It is recommended to check for specific bottlenecks in the validation processes of this entity.",
  "de las solicitudes están en estado": "of requests are in",
  "Pendiente. Un porcentaje alto sugiere una carga de trabajo excedida o falta de documentación inicial por parte del solicitante.": "Pending. A high percentage suggests an overloaded workload or lack of initial documentation from the requester.",
  "sugiere una carga de trabajo excedida o falta de documentación inicial por parte del solicitante.": "suggests an overloaded workload or lack of initial documentation from the requester.",
  "Flujo de Validación Saludable:": "Healthy Validation Flow:",
  "El nivel de solicitudes pendientes es bajo": "The level of pending requests is low",
  "La mayoría de los reembolsos están en etapas avanzadas de validación o ya completados.": "Most refunds are in advanced stages of validation or already completed.",
  "de los reembolsos se originan en monedas distintas al USD. La fluctuación de tipos de cambio (especialmente EUR/GBP) impacta directamente en el reporte consolidado de AR.": "of refunds originate in currencies other than USD. Fluctuations in exchange rates (especially EUR/GBP) directly impact the consolidated AR report.",
  "El tiempo promedio de resolución es de": "The average resolution time is",
  "Acción recomendada: Priorizar los casos que superan los 10 días para evitar reclamos de clientes.": "Recommended action: Prioritize cases exceeding 10 days to avoid client claims.",
  "Consolidado Histórico (Ventana de 6 Meses)": "Historical Consolidated (6-Month Window)",
  "Total": "Total",
  "USD Eq.": "USD Eq.",
  "El": "The",
  "La": "The",
  "Un": "A",
  "un": "a",
  "especialmente": "especially",
  "porcentaje": "percentage",
  "solicitudes": "requests",
  "reembolsos": "refunds",
  "Partidas Pendientes": "Pending Items",
  "Evolución de Reembolsos por Moneda": "Refunds Evolution by Currency",
  "Análisis de tendencias · Últimos 6 meses móviles": "Trend analysis · Last 6 rolling months",
  "CONSOLIDADO HISTÓRICO (VENTANA DE 6 MESES)": "HISTORICAL CONSOLIDATED (6-MONTH WINDOW)",
  "Distribución y Segmentación": "Distribution & Segmentation",
  "Análisis por subsidiaria y estado de validación.": "Analysis by subsidiary and validation status.",
  "Por Subsidiaria": "By Subsidiary",
  "Por Estatus": "By Status",
  "Gestión de Solicitudes Individuales": "Individual Requests Management",
  "Detalle de las partidas pendientes de validación y pago.": "Details of pending items for validation and payment.",
  "ENE": "JAN", "FEB": "FEB", "MAR": "MAR", "ABR": "APR", "MAY": "MAY", "JUN": "JUN",
  "JUL": "JUL", "AGO": "AUG", "SEP": "SEP", "OCT": "OCT", "NOV": "NOV", "DIC": "DEC",
  "Unapplied Payments": "Unapplied Payments",
  "Total Unapplied PMT": "Total Unapplied PMT",
  "Distribución por Región": "Distribution by Region",
  "Histórico de Unapplied Cash (2022-2026)": "Unapplied Cash History (2022-2026)",
  "Top Partidas Pendientes (Nuevas)": "Top Pending Items (New)",
  "Detalle de los ingresos recibidos en Marzo 2026 sin aplicar.": "Details of received income in March 2026 without application.",
  "Por Región": "By Region",
  "Análisis Inteligente de Unapplied Payments": "Intelligent Unapplied Payments Analysis",
  "Generando análisis algorítmico...": "Generating algorithmic analysis...",
  "Reducción Significativa:": "Significant Reduction:",
  "Líder de Eficiencia:": "Efficiency Leader:",
  "Alerta en EMEA:": "EMEA Alert:",
  "Concentración de Cartera:": "Portfolio Concentration:",
  "Variación YoY": "YoY Variation",
  "Pico Histórico": "Historical Peak",
  "Total 2026 YTD": "Total 2026 YTD",
  "Comparativa Regional (Mar vs Feb)": "Regional Comparison (Mar vs Feb)",
  "Marzo 2026": "March 2026",
  "Febrero 2026": "February 2026",
  "Progreso Mensual (Mar vs Feb):": "Monthly Progress (Mar vs Feb):",
  "Mayor Mejora Regional:": "Top Regional Improvement:",
  "Alerta Interanual EMEA:": "EMEA Interannual Alert:",
  "Concentración de Cartera:": "Portfolio Concentration:",
  "Muestra el flujo de reducción de fondos sin aplicar por geografía.": "Shows the reduction flow of unapplied funds by geography.",
  "Evolución del capital retenido en los últimos 5 años.": "Evolution of retained capital over the last 5 years."
};

const enToEs = Object.fromEntries(Object.entries(esToEn).map(([k,v]) => [v,k]));

const titlesEn = {
  overview: 'Executive Summary', dso: 'DSO Analysis', aging: 'Aging Report',
  risk: 'Risk Analysis', segmentation: 'Portfolio Segmentation', projection: 'Collections Projection',
  cashapp: 'Cash Applications', refunds: 'Refunds', unapplied: 'Unapplied Payments',
  arap: 'AR & AP Hub', forecast: 'Cash Flow & Forecast', mexusa: 'Mexico-USA & FX'
};
const titlesEs = {
  overview: 'Resumen Ejecutivo', dso: 'Análisis DSO', aging: 'Aging Report',
  risk: 'Análisis de Riesgo', segmentation: 'Segmentación de Cartera', projection: 'Proyección de Recaudos',
  cashapp: 'Conciliación Bancaria', refunds: 'Análisis de Refunds', unapplied: 'Pagos No Aplicados',
  arap: 'AR & AP Hub', forecast: 'Cash Flow & Forecast', mexusa: 'México-USA & FX'
};

// ── NAV BUTTON LABEL MAPS (for sidebar translation) ────────────────────────
const navLabelsEn = {
  overview: 'Financial Summary',
  dso: 'DSO & Collections',
  arap: 'AR & AP Hub',
  forecast: 'Cash Flow & Forecast',
  mexusa: 'Mexico-USA & FX',
  cashapp: 'Reconciliation',
  refunds: 'Refunds / RFT',
  unapplied: 'Unapplied PMT'
};
const navLabelsEs = {
  overview: 'Resumen Financiero',
  dso: 'DSO & Cobranza',
  arap: 'AR & AP Hub',
  forecast: 'Cash Flow & Forecast',
  mexusa: 'México-USA & FX',
  cashapp: 'Conciliación',
  refunds: 'Reembolsos / RFT',
  unapplied: 'No Aplicados PMT'
};

function translateDOMNode(element, dict) {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    let text = node.nodeValue;
    if (text.trim() === '') continue;
    
    let changed = false;
    for (const key of keys) {
      // Use word boundaries to avoid replacing substrings inside other words
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(?<![a-zA-ZáéíóúñÁÉÍÓÚÑ])' + escaped + '(?![a-zA-ZáéíóúñÁÉÍÓÚÑ])', 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, dict[key]);
        changed = true;
      }
    }
    if (changed) node.nodeValue = text;
  }
}

// Custom observer to translate dynamic table rows immediately after they are generated
const observer = new MutationObserver((mutations) => {
  if (currentLang === 'es') return;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (node.tagName === 'TR' || node.classList.contains('client-chip') || node.tagName === 'LI') {
          translateDOMNode(node, esToEn);
        } else {
          // Fallback for dynamically appended complex blocks
          const els = node.querySelectorAll ? node.querySelectorAll('tr, .client-chip, li') : [];
          els.forEach(el => translateDOMNode(el, esToEn));
        }
      }
    });
  });
});

// Attach observer to containers
window.addEventListener('load', () => {
    const containersToWatch = [
        'riskTableBody', 'seg-strategic', 'seg-alert', 'seg-stable', 'seg-lowrisk', 
        'projectionTable', 'caTableBody', 'refundTableBody', 'uaTableBody', 'ca-insights-list', 
        'ref-insights-list', 'refChartDetails', 'refCompDeltaRow', 'caCompDeltaRow'
    ];
    containersToWatch.forEach(id => {
        const el = document.getElementById(id);
        if(el) observer.observe(el, { childList: true, subtree: true, characterData: true });
    });
});

function toggleLang() {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  document.getElementById('langText').textContent = currentLang.toUpperCase();
  
  const dict = currentLang === 'en' ? esToEn : enToEs;
  translateDOMNode(document.body, dict);

  // Translate sidebar nav button labels (static DOM text nodes not caught by walker)
  const navLabels = currentLang === 'en' ? navLabelsEn : navLabelsEs;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const tab = btn.dataset.tab;
    if (navLabels[tab]) {
      // Replace only the text node, keeping the icon span intact
      const iconSpan = btn.querySelector('.nav-icon');
      // Remove existing text nodes
      Array.from(btn.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) btn.removeChild(node);
      });
      // Append translated label
      btn.appendChild(document.createTextNode(' ' + navLabels[tab]));
    }
  });

  // Translate sidebar footer buttons
  const footerBtns = {
    'add-client-btn': currentLang === 'en' ? '+ Add Client' : '+ Agregar Cliente',
    'upload-real-btn': currentLang === 'en' ? '↑ Upload Real Data' : '↑ Subir Datos Reales',
    'export-data-btn': currentLang === 'en' ? '↓ Export CSV' : '↓ Exportar CSV'
  };
  Object.entries(footerBtns).forEach(([cls, label]) => {
    const btn = document.querySelector('.' + cls);
    if (btn) {
      const iconSpan = btn.querySelector('.btn-icon');
      Array.from(btn.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) btn.removeChild(node);
      });
      btn.appendChild(document.createTextNode(' ' + label.replace(/^[+↑↓] /, '')));
    }
  });

  // Translate sidebar date
  const reportDateEl = document.querySelector('.report-date');
  if (reportDateEl) {
    reportDateEl.textContent = currentLang === 'en' ? 'Apr 2026' : 'Abr 2026';
  }

  // Translate header super-title
  const superTitle = document.querySelector('.super-title');
  if (superTitle) {
    superTitle.textContent = currentLang === 'en'
      ? 'Finance & Collections · Griska'
      : 'Finance & Collections · Griska';
  }

  // Update titles map
  if (currentLang === 'en') {
    Object.assign(titles, titlesEn);
  } else {
    Object.assign(titles, titlesEs);
  }
  const activeTabObj = document.querySelector('.nav-btn.active');
  if (activeTabObj) {
    document.getElementById('page-title').textContent = titles[activeTabObj.dataset.tab];
  }

  updateChartsLang();
}

function updateChartsLang() {
  const isEn = currentLang === 'en';
  const dict = isEn ? esToEn : enToEs;
  
  const translateLabels = (chart) => {
    if (!chart || !chart.data.labels) return;
    chart.data.labels = chart.data.labels.map(l => dict[l] || l);
  };

  if (charts.overviewAging) {
    translateLabels(charts.overviewAging);
    updateOverviewChart();
  }
  if (charts.riskDonut) {
    charts.riskDonut.data.labels = isEn ? ['High Risk', 'Medium Risk', 'Low Risk'] : ['Riesgo Alto', 'Riesgo Medio', 'Riesgo Bajo'];
    charts.riskDonut.update();
  }
  if (charts.dsoTrend) {
    translateLabels(charts.dsoTrend);
    charts.dsoTrend.data.datasets[0].label = isEn ? 'Actual DSO' : 'DSO Real';
    charts.dsoTrend.data.datasets[1].label = isEn ? 'Target' : 'Objetivo';
    charts.dsoTrend.update();
  }
  if (charts.dsoComposition) {
    translateLabels(charts.dsoComposition);
    charts.dsoComposition.data.datasets[0].label = isEn ? 'Credit Terms (Base)' : 'Términos de Crédito (Base)';
    charts.dsoComposition.data.datasets[1].label = isEn ? 'Collection Delay' : 'Retraso en Cobro';
    charts.dsoComposition.update();
  }
  if (charts.agingBar) {
    charts.agingBar.data.labels = isEn ? ['Current', '1-30 days', '31-60 days', '61-90 days', '+90 days'] : ['Corriente', '1–30 días', '31–60 días', '61–90 días', '+90 días'];
    charts.agingBar.data.datasets[0].label = isEn ? 'Balance (USD)' : 'Saldo (USD)';
    charts.agingBar.update();
  }
  if (charts.agingStacked) {
    translateLabels(charts.agingStacked);
    charts.agingStacked.data.datasets[0].label = isEn ? 'Current' : 'Corriente';
    charts.agingStacked.update();
  }
  if (charts.caMatch) {
    translateLabels(charts.caMatch);
    charts.caMatch.data.datasets[0].label = isEn ? 'Automatic (%)' : 'Automático (%)';
    charts.caMatch.data.datasets[1].label = isEn ? 'Manual (%)' : 'Manual (%)';
    charts.caMatch.update();
  }
  if (charts.caAging) {
    charts.caAging.data.labels = isEn ? ['0-3 days', '4-7 days', '8-14 days', '+15 days'] : ['0-3 días', '4-7 días', '8-14 días', '+15 días'];
    charts.caAging.update();
  }
  if (charts.caSuspense) {
    charts.caSuspense.data.labels = isEn ? ['Missing Ref', 'Invalid Amount', 'Client Not Found', 'Double Payment'] : ['Falta Referencia', 'Monto Inválido', 'Cliente No Encontrado', 'Doble Pago'];
    charts.caSuspense.update();
  }
  if (charts.projection) {
    charts.projection.data.labels = isEn ? ['Week 1 (Mar 1-7)', 'Week 2 (Mar 8-14)', 'Week 3 (Mar 15-21)', 'Week 4 (Mar 22-31)'] : ['Semana 1 (Mar 1–7)', 'Semana 2 (Mar 8–14)', 'Semana 3 (Mar 15–21)', 'Semana 4 (Mar 22–31)'];
    charts.projection.data.datasets[0].label = isEn ? 'High Probability' : 'Alta Probabilidad';
    charts.projection.data.datasets[1].label = isEn ? 'Medium Probability' : 'Media Probabilidad';
    charts.projection.data.datasets[2].label = isEn ? 'Low Probability' : 'Baja Probabilidad';
    charts.projection.update();
  }
  if (charts.caComparison) {
    translateLabels(charts.caComparison);
    charts.caComparison.data.datasets[0].label = isEn ? 'Current Year (2026)' : 'Año Actual (2026)';
    charts.caComparison.data.datasets[1].label = isEn ? 'Previous Year (2025)' : 'Año Anterior (2025)';
    charts.caComparison.update();
  }
  if (charts.uaRegional) {
    translateLabels(charts.uaRegional);
    charts.uaRegional.data.datasets[0].label = isEn ? 'April 2026' : 'Abril 2026';
    charts.uaRegional.data.datasets[1].label = isEn ? 'March 2026' : 'Marzo 2026';
    charts.uaRegional.update();
  }
  if (charts.uaHistory) {
    translateLabels(charts.uaHistory);
    charts.uaHistory.update();
  }
}



function parseSheetItems(rows, sheetName = "") {
    const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const sheetItems = [];

    // --- Robust Header Row & Column Detection ---
    let headerRowIdx = 0;
    let idxSub = -1, idxDate = -1, idxNum = -1, idxAmt = -1, idxCust = -1;

    const subKeys = ["subsidiary", "entidad", "sub"];
    const dateKeys = ["date", "fecha"];
    const numKeys = ["number", "número", "doc", "referencia"];
    const amtKeys = ["remaining", "pendiente", "saldo", "amount remaining", "amount rem", "monto", "monto restante"];
    const custKeys = ["customer", "cliente", "name", "nombre"];

    for (let i = 0; i < Math.min(rows.length, 25); i++) {
        if (!Array.isArray(rows[i])) continue;
        const row = rows[i].map(c => String(c || "").toLowerCase().trim());
        const sub = row.findIndex(c => subKeys.some(k => c.includes(k)));
        const date = row.findIndex(c => dateKeys.some(k => c.includes(k)));
        const amt = row.findIndex(c => amtKeys.some(k => c.includes(k)));
        
        if (amt !== -1 && (date !== -1 || sub !== -1)) {
            headerRowIdx = i;
            idxSub = sub;
            idxDate = date;
            idxAmt = amt;
            idxNum = row.findIndex(c => numKeys.some(k => c.includes(k)));
            idxCust = row.findIndex(c => custKeys.some(k => c.includes(k)));
            break;
        }
    }

    const colSub = idxSub !== -1 ? idxSub : 0;
    const colDate = idxDate !== -1 ? idxDate : 1;
    const colNum = idxNum !== -1 ? idxNum : 3;
    const colAmt = idxAmt !== -1 ? idxAmt : 7;
    const colCust = idxCust !== -1 ? idxCust : 10;

    const seenNumbers = new Set();

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const subFull = String(row[colSub] || "").trim();
        const lowSub = subFull.toLowerCase();
        if (lowSub === "total" || lowSub === "grand total" || lowSub === "subtotal" || lowSub.includes("subsidiary")) continue;
        
        const docNum = String(row[colNum] || "").trim().toUpperCase();
        if (docNum && seenNumbers.has(docNum)) continue;
        if (docNum) seenNumbers.add(docNum);
        
        const match = subFull.match(/(\d{3})/);
        const subCode = match ? match[1] : "";
        let region = SUBSIDIARY_MAPPING[subCode];
        
        if (!region) {
            const lowSheet = sheetName.toLowerCase();
            const lowSubFull = subFull.toLowerCase();
            const combo = lowSubFull + " " + lowSheet;
            
            if (combo.includes("sysomos") || combo.includes("326") || combo.includes("106") || combo.includes("116")) region = "Sysomos";
            else if (combo.includes("apac") || combo.includes("singapore") || combo.includes("australia") || combo.includes("japan") || combo.includes("china")) region = "APAC";
            else if (combo.includes("emea") || combo.includes("europe") || combo.includes("london") || combo.includes("uk") || combo.includes("nether") || combo.includes("germany") || combo.includes("france") || combo.includes("dubai") || combo.includes("africa")) region = "EMEA";
            else if (combo.includes("americas") || combo.includes("us") || combo.includes("canada") || combo.includes("brazil") || combo.includes("mexico") || combo.includes("latam")) region = "Americas";
            else region = "Americas"; // Default fallback
        }
        
        const dateRaw = row[colDate];
        if (!dateRaw) continue;
        let dateObj;
        if (typeof dateRaw === 'number') dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
        else if (typeof dateRaw === 'string') {
            dateObj = new Date(dateRaw);
            if (isNaN(dateObj.getTime())) {
                const parts = dateRaw.split(/[/-]/);
                if (parts.length === 3) {
                    if (parts[2].length === 4) dateObj = new Date(Date.UTC(parts[2], parseInt(parts[1]) - 1, parseInt(parts[0])));
                    else if (parts[0].length === 4) dateObj = new Date(Date.UTC(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2])));
                }
            }
        }
        if (!dateObj || isNaN(dateObj.getTime())) continue;
        
        const year = dateObj.getUTCFullYear();
        const month = MONTHS[dateObj.getUTCMonth()];
        
        let amountRaw = row[colAmt];
        let amount = 0;
        if (typeof amountRaw === 'number') amount = Math.abs(amountRaw);
        else {
            let str = String(amountRaw || "0").trim();
            if (str.startsWith('(') && str.endsWith(')')) str = '-' + str.substring(1, str.length - 1);
            amount = Math.abs(parseFloat(str.replace(/[^-0-9.]/g, ''))) || 0;
        }
        if (amount === 0) continue;
        
        const customer = String(row[colCust] || "").trim();
        const lowCust = customer.toLowerCase();
        if (lowCust === "total" || lowCust === "grand total" || lowCust === "subtotal" || customer === "") continue;

        sheetItems.push({
            date: dateObj.toLocaleDateString(),
            year: year.toString(),
            month: month,
            customer: customer,
            amount: amount,
            region: region
        });
    }
    return sheetItems;
}

function updateUnappliedData(topItems) {
    try {
        const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const aggregated = {}; 
        const regionalHistory = {
            Americas: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
            APAC: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
            EMEA: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
            Sysomos: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 }
        };

        topItems.forEach(item => {
            const key = `${item.region}|${item.year}|${item.month}`;
            aggregated[key] = (aggregated[key] || 0) + item.amount;
            if (regionalHistory[item.region] && regionalHistory[item.region][item.year] !== undefined) {
                regionalHistory[item.region][item.year] += item.amount;
            }
        });
        console.log(`Total topItems ingested: ${topItems.length}`);

        // Convert aggregated to monthlyData format
        const newMonthlyData = Object.keys(aggregated).map(k => {
            const [r, y, m] = k.split('|');
            return { region: r, year: y, month: m, total: aggregated[k] };
        });

    // Sort top items and keep a much larger buffer for detail views
    topItems.sort((a, b) => b.amount - a.amount);
    const topLimit = topItems.slice(0, 10000);

    // Update DATA object
    const ua = DATA.cashapp.unappliedPayments;
    ua.topItems = topLimit;
    
    // Find latest month in data (Numeric comparison)
    const latest = newMonthlyData.reduce((prev, curr) => {
        const mIdx = (m) => MONTHS.indexOf(m);
        const cY = parseInt(curr.year);
        const pY = parseInt(prev.year);
        if (cY > pY) return curr;
        if (cY === pY && mIdx(curr.month) > mIdx(prev.month)) return curr;
        return prev;
    }, { year: "0", month: "JANUARY" });

    // Find previous month data from the EXISTING data (before overwrite)
    const existingData = DATA.cashapp.unappliedPayments.monthlyData || [];
    const mIdx = MONTHS.indexOf(latest.month);
    const prevMonth = mIdx === 0 ? "DECEMBER" : MONTHS[mIdx - 1];
    const prevYear = mIdx === 0 ? (parseInt(latest.year) - 1).toString() : latest.year;
    
    // Sum from either the new file OR the existing data
    const getBestTotal = (y, m) => {
        const fromNew = newMonthlyData.filter(d => d.year === y && d.month === m).reduce((s, d) => s + d.total, 0);
        if (fromNew > 0) return fromNew;
        return existingData.filter(d => d.year === y && d.month === m).reduce((s, d) => s + d.total, 0);
    };

    // Update summary - Use the Grand Total (Sum of all rows) because U/P is a stock metric
    const grandTotal = topItems.reduce((s, i) => s + i.amount, 0);
    const latestTotal = grandTotal; // Total from current file is our new baseline
    const prevTotal = getBestTotal(prevYear, prevMonth) || 3191946.26; // Fallback to our last known good March total

    ua.summary.total = grandTotal;
    ua.summary.prevTotal = prevTotal;
    ua.summary.change = grandTotal - prevTotal;
    ua.summary.changePct = prevTotal === 0 ? 0 : ((grandTotal - prevTotal) / prevTotal * 100).toFixed(1);

    // Update regions for current month
    ["Americas", "APAC", "EMEA", "Sysomos"].forEach(r => {
        const rLower = r.toLowerCase();
        const totalForRegion = topItems.filter(i => i.region === r).reduce((s, i) => s + i.amount, 0);
        
        // Find prev total for this region
        let rPrev = newMonthlyData.find(d => d.region === r && d.year === prevYear && d.month === prevMonth)?.total || 0;
        if (rPrev === 0) {
            rPrev = existingData.find(d => d.region === r && d.year === prevYear && d.month === prevMonth)?.total || 0;
        }
        // Specific fallback for our reconciliation
        if (rPrev === 0 && prevMonth === "MARCH" && prevYear === "2026") {
            if (r === "Americas") rPrev = 1129137;
            if (r === "APAC") rPrev = 225887;
            if (r === "EMEA") rPrev = 1557220.26;
            if (r === "Sysomos") rPrev = 279703;
        }
        
        ua.regions[rLower] = {
            total: totalForRegion,
            febTotal: rPrev,
            change: totalForRegion - rPrev,
            changePct: rPrev === 0 ? 0 : ((totalForRegion - rPrev) / rPrev * 100).toFixed(1),
            newUP: 0
        };
    });

    console.log("Ingestion Summary:", {
        Total: grandTotal,
        Americas: ua.regions.americas.total,
        APAC: ua.regions.apac.total,
        EMEA: ua.regions.emea.total,
        Sysomos: ua.regions.sysomos.total
    });

    ua.monthlyData = newMonthlyData;
    ua.history = {
        years: ['2022', '2023', '2024', '2025', '2026'],
        americas: [2022, 2023, 2024, 2025, 2026].map(y => regionalHistory.Americas[y]),
        apac: [2022, 2023, 2024, 2025, 2026].map(y => regionalHistory.APAC[y]),
        emea: [2022, 2023, 2024, 2025, 2026].map(y => regionalHistory.EMEA[y]),
        sysomos: [2022, 2023, 2024, 2025, 2026].map(y => regionalHistory.Sysomos[y])
    };

    // Update UI
    document.getElementById('ua-filter-year').value = latest.year;
    document.getElementById('ua-filter-month').value = latest.month;
    
    // Update labels in index.html (optional but good for consistency)
    const infoEl = document.getElementById('ua-filter-info');
    if (infoEl) {
        const monthLabel = latest.month.charAt(0) + latest.month.slice(1).toLowerCase();
        infoEl.innerHTML = `Vista Activa: ${monthLabel} ${latest.year}<br><span style="color: var(--text3); font-size: 9px; font-weight: 400;">*Valores normalizados en USD</span>`;
    }
    
    // Update trend labels
    const prevMonthLabel = "vs " + prevMonth.substring(0, 3) + " " + prevYear.substring(2);
    document.querySelectorAll('.kpi-trend').forEach(el => {
        el.childNodes[0].nodeValue = prevMonthLabel + ": ";
    });

    saveState();
    buildUnapplied(latest.year, latest.month, 'ALL');
    const totalLoaded = topItems.reduce((s, i) => s + i.amount, 0);
    alert(`¡ÉXITO TOTAL!\n\nSe cargaron ${topItems.length} partidas.\nMonto total detectado: $${totalLoaded.toLocaleString()}\nPeriodo: ${latest.month} ${latest.year}`);
    } catch (err) {
        console.error("Critical Error in processExtractedData:", err);
        alert(`Error Crítico: ${err.message}\n\nOcurrió un error al procesar las filas del archivo.`);
    }
}

// ── EXPORT EXCEL ────────────────────────────────────────────────
function downloadDetailedExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Librería XLSX no cargada. Por favor, revisa tu conexión a internet.');
    return;
  }

  const ua = DATA.cashapp.unappliedPayments;
  const year = document.getElementById('ua-filter-year').value;
  const month = document.getElementById('ua-filter-month').value;
  const region = document.getElementById('ua-filter-region').value;

  // 1. Data Gathering
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Executive Summary
  const summaryRows = [
    ["UNAPPLIED PAYMENTS REPORT", "", "", `Generated: ${new Date().toLocaleDateString()}`],
    ["Period:", `${month} ${year}`, "Region:", region],
    [],
    ["REGIONAL COMPARISON (MoM)"],
    ["Region", "Currency", "Current Amount", "Prev Amount", "Change ($)", "Change (%)"]
  ];

  const getMonthData = (y, m) => {
    const res = { americas: 0, apac: 0, emea: 0 };
    ua.monthlyData.forEach(d => {
      if ((y === 'ALL' || d.year === y) && (m === 'ALL' || d.month === m)) {
        const r = d.region.toLowerCase();
        if (res[r] !== undefined) res[r] += d.total;
      }
    });
    return res;
  };

  // Previous logic
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  let prevYear = year;
  let prevMonth = 'ALL';
  if (month !== 'ALL') {
    const idx = months.indexOf(month);
    if (idx === 0) { prevYear = (parseInt(year)-1).toString(); prevMonth = "DECEMBER"; }
    else { prevMonth = months[idx-1]; }
  }

  const curr = getMonthData(year, month);
  const prev = getMonthData(prevYear, prevMonth);

  const addReg = (name) => {
    const c = curr[name.toLowerCase()];
    const p = prev[name.toLowerCase()];
    const diff = c - p;
    const pct = p === 0 ? 0 : (diff / p * 100).toFixed(1);
    summaryRows.push([name, "USD", c, p, diff, pct + "%"]);
  };
  addReg("Americas");
  addReg("APAC");
  addReg("EMEA");
  
  const totC = curr.americas + curr.apac + curr.emea;
  const totP = prev.americas + prev.apac + prev.emea;
  const totD = totC - totP;
  const totPct = totP === 0 ? 0 : (totD / totP * 100).toFixed(1);
  summaryRows.push(["GRAND TOTAL", "USD", totC, totP, totD, totPct + "%"]);

  summaryRows.push([], ["HISTORICAL TREND (5 YEARS)"], ["Year", "Americas", "APAC", "EMEA", "Total"]);
  ua.history.years.forEach((y, i) => {
    const am = ua.history.americas[i];
    const ap = ua.history.apac[i];
    const em = ua.history.emea[i];
    summaryRows.push([y, am, ap, em, am + ap + em]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Executive Summary");

  // Sheet 2: Detailed Transactions
  const detailRows = [["Date", "Customer / Reference", "Amount", "Currency", "Region"]];
  ua.topItems.forEach(i => {
    detailRows.push([i.date, i.customer, i.amount, "USD", i.region]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, ws2, "Transaction Details");

  // Export
  XLSX.writeFile(wb, `Unapplied_Payments_Report_${month}_${year}.xlsx`);
}

