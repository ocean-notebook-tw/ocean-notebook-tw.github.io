const UNIT11 = (() => {
/* ===== 海洋星球 互動遊戲（依 海洋科學序列教材 G3-G5 第1.1節） ===== */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = 'ocean-planet-1-1-v1';
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 狀態 ---------- */
const fresh = () => ({
  v: 1, name: getName(), stage: 0, maxStage: 0, badges: [],
  idea: '', guess: null, guessWhy: '', guessTags: [], evSort: {},
  task: 1, found: {}, targets: null, boundary: null,
  best: { land: 0, ocean: 0 }, longest: null,
  viewDone: false, viewAns: null,
  modelSort: {}, modelPick: null,
  toss: { land: 0, ocean: 0, hist: [], manual: 0, auto: 0 }, tossMeaning: null, guess2: null,
  planet: null, planetWhy: '', revised: '', concepts: [false, false, false], vocab: [], log: [], doneAll: false, ai: {}
});
let S = load();
  if (!S.name) S.name = getName();
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.v === 1) return Object.assign(fresh(), v); } catch (e) { } return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
const aiHere = (host, o) => host && AI.slot(host, Object.assign({ store: S.ai, onSave: save }, o));
function log(t) { if (!S.log.includes(t)) { S.log.push(t); save(); } }

/* ---------- 陸地判斷（等距圓柱投影點陣，0.18° 精度） ---------- */
const LW = 2048, LH = 1024; let LMASK = null;
function buildMask() {
  const c = document.createElement('canvas'); c.width = LW; c.height = LH;
  const g = c.getContext('2d', { willReadFrequently: true });
  const p = d3.geoEquirectangular().scale(LW / (2 * Math.PI)).translate([LW / 2, LH / 2]);
  g.fillStyle = '#000'; g.beginPath(); d3.geoPath(p, g)(LAND); g.fill();
  const d = g.getImageData(0, 0, LW, LH).data; LMASK = new Uint8Array(LW * LH);
  for (let i = 0; i < LW * LH; i++) LMASK[i] = d[i * 4 + 3] > 127 ? 1 : 0;
}
const normLon = l => ((l + 180) % 360 + 360) % 360 - 180;
function isLand(lon, lat) {
  lon = normLon(lon);
  const x = Math.min(LW - 1, Math.max(0, Math.floor((lon + 180) / 360 * LW)));
  const y = Math.min(LH - 1, Math.max(0, Math.floor((90 - lat) / 180 * LH)));
  return LMASK[y * LW + x] === 1;
}
/* 海洋名稱（近似分區，適合國小程度的辨識） */
function oceanName(lon, lat) {
  lon = normLon(lon);
  if (lon > 46.5 && lon < 55.5 && lat > 36.5 && lat < 47.5) return '裏海';
  if (lat >= 70) return '北極海';
  if (lat >= 66) return (lon > -45 && lon < 25) ? '大西洋' : '北極海';
  if (lat <= -60) return '南冰洋';
  if (lat >= 0) {
    const b = lat < 9 ? -78 : lat < 14 ? -84 : lat < 18.5 ? -92 : -100;
    if (lon < b || lon >= 100) return '太平洋';
    if (lon < 20) return '大西洋';
    if (lon < 45 && lat >= 30) return '大西洋';
    if (lat < 30) return '印度洋';
    return '大西洋';
  }
  const west = lat > -56 ? -69.5 : -67;
  if (lon >= west && lon < 20) return '大西洋';
  if (lon >= 20 && lon < 147) {
    if (lat > -8 && lon >= 105) return '太平洋';
    if (lon >= 129 && lat > -18) return '太平洋';
    return '印度洋';
  }
  return '太平洋';
}
const randomLL = () => [Math.random() * 360 - 180, Math.asin(2 * Math.random() - 1) * 180 / Math.PI];

/* ---------- 地球儀元件 ---------- */
class Globe {
  constructor(host, o = {}) {
    this.o = o; this.host = host;
    this.c = document.createElement('canvas'); this.c.className = 'globe-canvas';
    this.c.setAttribute('role', 'img'); this.c.setAttribute('aria-label', '可以拖曳轉動的地球儀');
    host.appendChild(this.c); this.g = this.c.getContext('2d');
    this.rot = o.rot || [-121, -15, 0];
    this.p = d3.geoOrthographic().clipAngle(90).precision(0.4);
    this.path = d3.geoPath(this.p, this.g); this.grat = d3.geoGraticule10();
    this.markers = []; this.lines = []; this.live = null; this.mode = 'rotate'; this.finger = false; this.locked = false;
    this.size(); this.bind();
    this.ro = new ResizeObserver(() => { if (this.size()) this.draw(); }); this.ro.observe(host);
    this.draw();
  }
  size() {
    const w = Math.floor(this.host.clientWidth || 320); const s = Math.max(240, Math.min(w, this.o.max || 500));
    if (s === this.S) return false;
    this.dpr = window.devicePixelRatio || 1; this.S = s; this.R = s / 2 - 6;
    this.c.style.width = s + 'px'; this.c.style.height = s + 'px'; this.c.width = s * this.dpr; this.c.height = s * this.dpr;
    this.p.translate([s / 2, s / 2]).scale(this.R); return true;
  }
  center() { return [normLon(-this.rot[0]), -this.rot[1]]; }
  visible(ll) { return d3.geoDistance(ll, this.center()) < Math.PI / 2 - 0.02; }
  pt(e) { const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  ll(pt, clamp) {
    let [x, y] = pt; const cx = this.S / 2, dx = x - cx, dy = y - cx, d = Math.hypot(dx, dy);
    if (d > this.R) { if (!clamp) return null; x = cx + dx / d * this.R * 0.97; y = cx + dy / d * this.R * 0.97; }
    this.p.rotate(this.rot); return this.p.invert([x, y]);
  }
  bind() {
    const c = this.c; let st = null;
    c.addEventListener('pointerdown', e => {
      if (this.locked) return; c.setPointerCapture(e.pointerId);
      const pt = this.pt(e); st = { x: pt[0], y: pt[1], t: performance.now(), r0: [...this.rot], moved: false, pt };
      if (this.mode === 'draw' && this.o.onDrawStart) { this.ptr = pt; if (this.o.onDrawStart(this, pt)) { this.drawing = true; this.loop(); } }
    });
    c.addEventListener('pointermove', e => {
      if (!st) return; const pt = this.pt(e); const dx = pt[0] - st.x, dy = pt[1] - st.y;
      if (Math.hypot(dx, dy) > 6) st.moved = true;
      if (this.mode === 'draw') { if (this.drawing) { this.ptr = pt; this.o.onDrawMove && this.o.onDrawMove(this, pt); } return; }
      if (st.moved && !this.locked && !this.o.noDrag) {
        const k = 90 / this.R;
        this.rot = [st.r0[0] + dx * k, Math.max(-85, Math.min(85, st.r0[1] - dy * k)), 0];
        this.draw(); this.o.onRotate && this.o.onRotate(this);
      }
    });
    const end = () => {
      if (!st) return;
      if (this.mode === 'draw') { if (this.drawing) { this.drawing = false; this.o.onDrawEnd && this.o.onDrawEnd(this); } }
      else if (!st.moved && performance.now() - st.t < 600) { const ll = this.ll(st.pt); if (ll && this.o.onTap) this.o.onTap(ll, this); }
      st = null;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  }
  loop() {
    const step = () => {
      if (!this.drawing) return;
      const [x, y] = this.ptr, cx = this.S / 2, dx = x - cx, dy = y - cx, d = Math.hypot(dx, dy);
      if (d > this.R * 0.66) {
        const k = Math.min(1.5, (d - this.R * 0.66) / (this.R * 0.3) * 1.5);
        this.rot = [this.rot[0] - dx / d * k, Math.max(-85, Math.min(85, this.rot[1] + dy / d * k)), 0];
        this.o.onDrawMove && this.o.onDrawMove(this, this.ptr);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  nudge(dl, dp) { this.rot = [this.rot[0] + dl, Math.max(-85, Math.min(85, this.rot[1] + dp)), 0]; this.draw(); this.o.onRotate && this.o.onRotate(this); }
  spinTo(ll, ms = 1800, turns = 1) {
    return new Promise(res => {
      const r0 = [...this.rot]; let l1 = -ll[0]; const base = r0[0] + turns * 360 * (Math.random() < .5 ? 1 : -1);
      l1 = l1 + 360 * Math.round((base - l1) / 360); const p1 = -ll[1];
      if (reduceMotion()) ms = 250;
      const t0 = performance.now(); this.locked = true;
      const f = t => {
        const u = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3);
        this.rot = [r0[0] + (l1 - r0[0]) * e, r0[1] + (p1 - r0[1]) * e, 0]; this.draw();
        if (u < 1) requestAnimationFrame(f); else { this.locked = false; this.o.onRotate && this.o.onRotate(this); res(); }
      };
      requestAnimationFrame(f);
    });
  }
  stats(n = 26) {
    const out = { land: 0, ocean: 0, names: {} }; const cx = this.S / 2; this.p.rotate(this.rot);
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const x = (i / n) * 2 - 1, y = (j / n) * 2 - 1; if (x * x + y * y > 1) continue;
      const ll = this.p.invert([cx + x * this.R, cx + y * this.R]); if (!ll) continue;
      if (isLand(ll[0], ll[1])) out.land++; else { out.ocean++; const nm = oceanName(ll[0], ll[1]); out.names[nm] = (out.names[nm] || 0) + 1; }
    }
    out.pct = Math.round(out.ocean / (out.ocean + out.land) * 100); return out;
  }
  draw() {
    const g = this.g, cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.clearRect(0, 0, this.S, this.S); this.p.rotate(this.rot);
    g.beginPath(); this.path({ type: 'Sphere' }); g.fillStyle = col('--globe-sea'); g.fill();
    g.beginPath(); this.path(this.grat); g.strokeStyle = col('--globe-grid'); g.lineWidth = .7; g.stroke();
    g.beginPath(); this.path(LAND); g.fillStyle = col('--globe-land'); g.fill(); g.strokeStyle = col('--globe-land-edge'); g.lineWidth = .8; g.stroke();
    const gr = g.createRadialGradient(this.S * .36, this.S * .32, this.R * .05, this.S / 2, this.S / 2, this.R);
    gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
    g.beginPath(); this.path({ type: 'Sphere' }); g.fillStyle = gr; g.fill(); g.strokeStyle = col('--globe-rim'); g.lineWidth = 2.5; g.stroke();
    for (const L of [...this.lines, this.live].filter(Boolean)) {
      if (L.pts.length < 2) continue;
      g.beginPath(); this.path({ type: 'LineString', coordinates: L.pts });
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 7; g.stroke();
      g.strokeStyle = L.color; g.lineWidth = 4.5; g.stroke();
    }
    g.font = '600 14px ' + col('--font-body');
    for (const m of this.markers) {
      if (!this.visible(m.ll)) continue; const [x, y] = this.p(m.ll);
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = col('--coral'); g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
      const w = g.measureText(m.label).width + 14; g.fillStyle = 'rgba(255,255,255,.92)';
      g.beginPath(); g.roundRect ? g.roundRect(x + 9, y - 13, w, 24, 6) : g.rect(x + 9, y - 13, w, 24); g.fill();
      g.fillStyle = '#14324a'; g.fillText(m.label, x + 16, y + 4);
    }
    if (this.finger) {
      const c = this.S / 2; g.lineWidth = 3; g.strokeStyle = '#fff';
      g.beginPath(); g.arc(c, c, 13, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(c - 22, c); g.lineTo(c - 8, c); g.moveTo(c + 8, c); g.lineTo(c + 22, c); g.moveTo(c, c - 22); g.lineTo(c, c - 8); g.moveTo(c, c + 8); g.lineTo(c, c + 22); g.stroke();
      g.beginPath(); g.arc(c, c, 4, 0, Math.PI * 2); g.fillStyle = col('--coral'); g.fill();
    }
    this.o.onDraw && this.o.onDraw(this);
  }
  destroy() { this.ro.disconnect(); }
}

/* ---------- 共用片段 ---------- */
const DOC = `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
  <circle cx="32" cy="32" r="30" fill="var(--sea)"/>
  <path d="M6 40 Q16 34 24 40 T42 40 T58 40 L58 50 Q32 66 6 50Z" fill="var(--sea-soft)" opacity=".9"/>
  <circle cx="32" cy="28" r="15" fill="#f6d7b8"/>
  <path d="M17 26 Q32 6 47 26 Q40 18 32 18 Q24 18 17 26Z" fill="#33261c"/>
  <rect x="19" y="23" width="26" height="11" rx="5.5" fill="#bfe6f7" stroke="#14324a" stroke-width="2"/>
  <line x1="32" y1="23" x2="32" y2="34" stroke="#14324a" stroke-width="2"/>
  <path d="M27 38 Q32 41 37 38" stroke="#7a3b2a" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;
const guide = html => `<div class="guide">${DOC}<div class="bubble"><b>海博士：</b>${html}</div></div>`;
const head = (title, ref) => `<div class="sheet-head"><h2>${title}</h2><span class="ref">教師手冊對照｜${ref}</span></div>`;
const tallyMarks = n => '正'.repeat(Math.floor(n / 5)) + ['', '一', '丅', '下', '止'][n % 5];

const STAGES = [
  { t: '筆記本封面', s: '封面' },
  { t: '第一個想法', s: '第一個想法' },
  { t: '多少海洋？多少陸地？', s: '多少海洋？' },
  { t: '地球儀探索', s: '地球儀探索' },
  { t: '討論模型', s: '模型' },
  { t: '拋接地球儀', s: '拋接地球儀' },
  { t: '海洋星球？', s: '海洋星球？' }
];
const CONCEPTS = ['地球只有一個海洋。', '科學家使用模型來幫助理解和解釋事物。', '地球的大部分（約71%）是被海洋覆蓋。'];
const VOCAB = ['證據', '模型'];
const GUESS = { A: [50, 50], B: [25, 75], C: [75, 25], D: [90, 10] };

let globe = null;
function go(i) { if (i > S.maxStage) return; S.stage = i; save(); render(); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); }
function complete(i) {
  if (!S.badges.includes(i)) S.badges.push(i);
  S.maxStage = Math.max(S.maxStage, Math.min(i + 1, STAGES.length - 1)); save(); renderChrome();
}
function nextBtn(i, label = '前往下一站') { return `<div class="row"><button class="btn" id="next">${label} →</button></div>`; }
function bindNext(i) { const b = $('#next'); if (b) b.onclick = () => go(i + 1); }

/* ---------- 版面框架 ---------- */
function renderChrome() {
  $('#who').textContent = S.name ? `調查員：${S.name}` : '';
  $('#track').innerHTML = STAGES.map((st, i) => `<button class="st ${S.badges.includes(i) ? 'done' : ''} ${S.stage === i ? 'cur' : ''}" data-go="${i}" ${i > S.maxStage ? 'disabled' : ''}><span class="n">${i === 0 ? '封' : i}</span>${st.s}</button>`).join('');
  $$('#track [data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
  $('#wall').innerHTML = `<h3>概念牆</h3>${CONCEPTS.map((c, i) => `<div class="concept ${S.concepts[i] ? 'got' : ''}">${S.concepts[i] ? esc(c) : `關鍵概念 ${i + 1}：還沒發現`}</div>`).join('')}`;
  $('#vocab').innerHTML = VOCAB.map(v => `<span class="${S.vocab.includes(v) ? 'got' : ''}">${v}</span>`).join('');
  $('#badges').innerHTML = STAGES.slice(1).map((st, k) => `<span class="badge ${S.badges.includes(k + 1) ? 'got' : ''}" title="${st.t}">${k + 1}</span>`).join('');
}
function render() {
  if (globe) { globe.destroy(); globe = null; }
  renderChrome();
  AI.setContext({ unit: '1.1 海洋星球', stage: STAGES[S.stage].t });
  const el = $('#stage'); el.innerHTML = '';
  [stCover, stIdea, stGuess, stExplore, stModel, stToss, stPlanet][S.stage](el);
}

/* ---------- 共用：新的關鍵概念 / 詞彙 對話框 ---------- */
function overlay(html, onClose) {
  const ov = document.createElement('div'); ov.className = 'ov'; ov.innerHTML = `<div class="dlg" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(ov); const b = $('[data-close]', ov); b && b.focus();
  $$('[data-close]', ov).forEach(x => x.onclick = () => { ov.remove(); onClose && onClose(); });
  return ov;
}
function unlockConcept(i, then) {
  if (S.concepts[i]) { then && then(); return; }
  S.concepts[i] = true; save(); log(`發現關鍵概念：${CONCEPTS[i]}`);
  overlay(`<h3 class="q">發現新的關鍵概念！</h3><div class="concept got">${CONCEPTS[i]}</div><p class="muted">它會貼在右邊的概念牆上，隨時可以回去複習。</p><div class="row"><button class="btn" data-close>貼到概念牆</button></div>`, () => { renderChrome(); then && then(); });
}
function addVocab(v, def) {
  if (S.vocab.includes(v)) return; S.vocab.push(v); save(); renderChrome();
  overlay(`<h3 class="q">新的科學詞彙：<span style="color:var(--sea)">${v}</span></h3><p>${def}</p><div class="row"><button class="btn" data-close>記住了</button></div>`);
}

/* ===== 0 封面 ===== */
function stCover(el) {
  el.innerHTML = `<div class="stack">
  <div class="cover">
    <div class="stack" style="gap:8px"><span class="muted" style="font-size:14px;letter-spacing:.06em">海洋科學序列教材 G3–G5 初階海洋素養｜第 1.1 節</span><h2>海洋星球</h2>
      <p>地球表面有多少被海水覆蓋？世界上的海洋是彼此相連的嗎？打開你的調查筆記本，一起找出證據吧！</p></div>
    <div class="panel stack" style="gap:10px"><b>今天的調查路線</b>
      <div class="plan">
        <span>1</span><span>寫下第一個想法</span>
        <span>2</span><span>多少海洋？多少陸地？</span>
        <span>3</span><span>地球儀探索（3 個任務）</span>
        <span>4</span><span>討論模型</span>
        <span>5</span><span>拋接地球儀</span>
        <span>6</span><span>海洋星球？</span>
      </div></div>
  </div>
  ${guide(`<span id="hiName">${S.name ? esc(S.name) + '，' : ''}</span>你好！在這個單元裡，你會學到海洋科學家是如何<b>發現問題、推測答案</b>。接下來的時間，你要像海洋科學家一樣思考與行動。<br>科學家會用<b>調查筆記本</b>記錄觀察到的現象、想法、問題和調查結果。<span id="hiAsk">${S.name ? '確認筆記本封面上的名字，就可以開始調查了！' : '先在筆記本封面寫上你的名字吧！'}</span>`)}
  <div class="panel stack" style="gap:10px">
    <label for="nm"><b>調查筆記本　姓名</b></label>
    <input type="text" id="nm" maxlength="20" placeholder="例如：王小海" value="${esc(S.name)}">
    <div class="row"><button class="btn" id="open">打開筆記本，開始調查 →</button><span class="muted" id="nmh"></span></div>
  </div></div>`;
  $('#open').onclick = () => {
    const v = $('#nm').value.trim(); if (!v) { $('#nmh').textContent = '請先寫上你的名字。'; $('#nm').focus(); return; }
    S.name = v; setName(v); complete(0); go(1);
  };
  $('#nm').oninput = e => { const v = e.target.value.trim(); $('#hiName').textContent = v ? v + '，' : ''; };
  $('#nm').onkeydown = e => { if (e.key === 'Enter') $('#open').click(); };
}

/* ===== 1 第一個想法 ===== */
function stIdea(el) {
  const tips = ['水的溫度', '陽光照得到嗎', '水有多深', '水壓', '鹹不鹹', '水的流動', '海浪大小', '海底的樣子', '住了哪些生物', '水的顏色'];
  el.innerHTML = `${head('第一個想法', 'p.8–10 寫下最初的想法 1–7')}
  <div class="stack">
  ${guide('寫下你現在的想法，可以幫你知道自己了解海洋多少。<b>這不會被打分數</b>。單元結束前，你會再看一次這個問題，看看自己學到了什麼。')}
  <div class="panel stack" style="gap:10px">
    <p class="q">在不同地方，海洋有什麼不同？</p>
    <ul style="margin:0;padding-left:1.2em" class="muted">
      <li>假如你走入海洋的不同區域，你會觀察並記下哪些差異？</li>
      <li>從海面到水下深處，會有哪些差異？</li>
      <li>從海中央到海岸邊、在夏威夷和在阿拉斯加，海洋又會有哪些不同？</li></ul>
  </div>
  <div class="panel timer" id="tm">
    <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--rule)" stroke-width="6"/><circle id="arc" cx="32" cy="32" r="26" fill="none" stroke="var(--sea)" stroke-width="6" stroke-dasharray="163.4" stroke-dashoffset="0" transform="rotate(-90 32 32)" stroke-linecap="round"/><text id="sec" x="32" y="38" text-anchor="middle" font-size="16" fill="var(--ink)">60</text></svg>
    <div class="stack" style="gap:6px"><b>安靜思考 1 分鐘</b><span class="muted" style="font-size:15px">先想一想不同部分的海洋有什麼不同，再開始寫。</span>
      <div class="row"><button class="btn sec" id="think">開始思考</button><button class="btn-plain" id="skip">我想好了</button></div></div>
  </div>
  <div class="panel stack" style="gap:10px">
    <label for="idea"><b>我的第一個想法</b>　<span class="muted" style="font-size:14px">寫越多越好，也可以舉例子，或寫你去過、知道的海洋。</span></label>
    <textarea id="idea" placeholder="我覺得……">${esc(S.idea)}</textarea>
    <div class="row" style="gap:6px"><span class="muted" style="font-size:14px">想不到的話，可以從這些角度想想看：</span>${tips.map(t => `<button class="chip" data-tip="${t}">${t}</button>`).join('')}</div>
    <div class="row"><button class="btn" id="saveIdea">寫好了，放進筆記本</button><span class="muted" id="cnt"></span></div>
  </div>
  <div id="after"></div></div>`;
  const ta = $('#idea'), cnt = () => $('#cnt').textContent = `已寫 ${ta.value.trim().length} 字`;
  ta.oninput = () => { S.idea = ta.value; save(); cnt(); }; cnt();
  $$('[data-tip]').forEach(b => b.onclick = () => { if (ta.value.includes(b.dataset.tip + '：')) { ta.focus(); return; } ta.value += (ta.value && !/\n$/.test(ta.value) ? '\n' : '') + b.dataset.tip + '：'; ta.focus(); ta.oninput(); });
  let tmr = null;
  $('#think').onclick = () => {
    if (tmr) return; let s = 60; $('#think').disabled = true;
    tmr = setInterval(() => { s--; $('#sec').textContent = s; $('#arc').setAttribute('stroke-dashoffset', 163.4 * (1 - s / 60)); if (s <= 0) { clearInterval(tmr); $('#tm .muted').textContent = '時間到！開始寫下你的想法吧。'; ta.focus(); } }, 1000);
  };
  $('#skip').onclick = () => { clearInterval(tmr); ta.focus(); };
  $('#saveIdea').onclick = () => {
    if (ta.value.trim().length < 5) { $('#cnt').textContent = '再多寫一點點吧（至少 5 個字）。'; return; }
    S.idea = ta.value.trim(); log('寫下了第一個想法'); complete(1);
    showAfter(true);
  };
  const showAfter = fresh => {
    const rec = S.ai['u11-idea'];
    if (fresh && rec && rec.answer !== S.idea) { delete S.ai['u11-idea']; save(); }
    $('#after').innerHTML = `<div class="stack"><div id="aiI"></div>${nextBtn(1)}</div>`; bindNext(1);
    aiHere($('#aiI'), { id: 'u11-idea', getAnswer: () => S.idea, auto: fresh });
  };
  if (S.badges.includes(1)) showAfter(false);
}

/* ===== 2 多少海洋？多少陸地？ ===== */
function wsSVG(land, sea) {
  const W = 200, H = 90, x = W * land / 100;
  /* 區塊太窄時，標籤改放到虛線外側，避免文字壓到線或被切掉 */
  const lab = (cx, w, pct, word, col, side) => {
    let tx = cx, anchor = 'middle';
    if (w < 36) { anchor = side === 'end' ? 'end' : 'start'; tx = side === 'end' ? x - 4 : x + 4; }
    return `<text x="${tx}" y="20" text-anchor="${anchor}" font-size="13" font-weight="700" fill="${col}">${pct}%</text><text x="${tx}" y="34" text-anchor="${anchor}" font-size="11" fill="${col}">${word}</text>`;
  };
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.2"/>
    <rect x="${x}" y="50" width="${W - x - 1}" height="${H - 51}" fill="var(--sea-soft)"/>
    <path d="M1 40 Q${x * .3} 36 ${x * .55} 42 T${x} 50" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <path d="M${x} 50 ${Array.from({ length: Math.max(1, Math.floor((W - x) / 12)) }, (_, i) => `q3 -4 6 0 q3 4 6 0`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1"/>
    <line x1="${x}" y1="4" x2="${x}" y2="${H - 2}" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="4 3"/>
    ${lab(x / 2, x, land, '陸地', 'var(--ink)', 'start')}${lab(x + (W - x) / 2, W - x, sea, '海水', 'var(--sea)', 'end')}</svg>`;
}
function stGuess(el) {
  const WHY = [
    '「我感覺」是心裡的想法，沒有量過、也沒有觀察過，所以是感覺或看法，不是證據。',
    '「數一數」是實際觀察地球儀得到的結果，別人來數也會得到差不多的答案，所以是證據。',
    '住在陸地上，不代表陸地比較多。這是從自己的生活猜出來的想法，沒有觀察或測量，所以是看法。',
    '拋了 20 次、記下 14 次落在海洋，這是實際做實驗、記錄下來的數字，所以是證據。',
    '喜歡什麼顏色，和海洋有多大沒有關係。這是個人的喜好，不是觀察或測量，所以是看法。',
    '太空照片是用相機真實拍下的地球，從照片上觀察到大部分是藍色，所以是證據。'];
  const ST = [
    ['我感覺地球大部分被海洋覆蓋。', 'f'],
    ['我在地球儀上數一數，藍色的部分比黃色的部分多很多。', 'e'],
    ['我覺得陸地應該比較多，因為我住在陸地上。', 'f'],
    ['拋接地球儀 20 次，食指有 14 次落在海洋上。', 'e'],
    ['藍色是我最喜歡的顏色，所以海洋一定很大。', 'f'],
    ['從太空拍的地球照片中，大部分是藍色的。', 'e']];
  const why = ['我在地圖上看過', '我在地球儀上看過', '我在電視或書上看過', '我感覺是這樣', '我猜的'];
  el.innerHTML = `${head('多少海洋？多少陸地？', 'p.10 地球儀探索 1–2；投影片 1-1')}
  <div class="stack">
  <div class="panel stack" style="gap:12px">
    <p class="q">哪張圖最能說明地球表面的水域與陸地的面積比例？</p>
    <div class="abcd">${Object.entries(GUESS).map(([k, v]) => `<button class="choice ${S.guess === k ? 'on' : ''}" data-g="${k}"><span class="lab">${k}</span>${wsSVG(v[0], v[1])}</button>`).join('')}</div>
    <div id="whyBox" ${S.guess ? '' : 'hidden'} class="stack" style="gap:8px">
      <b>你為什麼這樣想？</b>
      <div class="row" style="gap:6px">${why.map(w => `<button class="chip ${S.guessTags.includes(w) ? 'on' : ''}" data-w="${w}">${w}</button>`).join('')}</div>
      <input type="text" id="gw" placeholder="也可以自己寫理由" value="${esc(S.guessWhy)}">
      <div class="row"><button class="btn" id="lock">記下我的想法</button></div>
      <div id="lockFb"></div>
    </div>
  </div>
  <div id="evi" ${S.guess && S.guessLocked ? '' : 'hidden'} class="stack">
    <div id="aiG"></div>
    <div class="panel stack" style="gap:12px"><p class="q">哪些是證據？哪些只是感覺或看法？</p>
      <div class="cards">${ST.map(([t, a], i) => {
        const v = S.evSort[i]; const cls = v ? (v === a ? 'right' : 'wrong') : '';
        return `<div class="card ${cls}" data-i="${i}"><span>${t}</span><div class="row"><button class="choice" data-s="e">證據</button><button class="choice" data-s="f">感覺或看法</button></div><span class="fbx muted" style="font-size:14px">${v ? (v === a ? '答對了！' : '再想想看：這是測量或觀察得來的資訊嗎？') : ''}</span></div>`;
      }).join('')}</div>
    </div>
    <div id="evWhy"></div>
    <div id="after2"></div>
  </div></div>`;
  $$('[data-g]').forEach(b => b.onclick = () => { S.guess = b.dataset.g; save(); $$('[data-g]').forEach(x => x.classList.toggle('on', x === b)); $('#whyBox').hidden = false; });
  $$('[data-w]').forEach(b => b.onclick = () => { const w = b.dataset.w; S.guessTags = S.guessTags.includes(w) ? S.guessTags.filter(x => x !== w) : [...S.guessTags, w]; b.classList.toggle('on'); save(); });
  $('#gw').oninput = e => { S.guessWhy = e.target.value; save(); };
  const guessText = () => `我選 ${S.guess} 圖（陸地 ${GUESS[S.guess][0]}%、海水 ${GUESS[S.guess][1]}%）。理由：${[...S.guessTags, S.guessWhy].filter(Boolean).join('、') || '沒有寫'}`;
  const showLock = fresh => {
    $('#lockFb').innerHTML = `<div class="fb info">已記下：你選了 <b>${S.guess}</b>。等一下我們會用證據來檢查它！</div>`;
    const rec = S.ai['u11-guess'];
    if (fresh && rec && rec.answer !== guessText()) { delete S.ai['u11-guess']; save(); }
    $('#aiG').innerHTML = '';
    aiHere($('#aiG'), { id: 'u11-guess', button: '請海博士看看我的理由', minLen: 1, getAnswer: guessText, auto: fresh });
  };
  $('#lock').onclick = () => {
    S.guessLocked = true; save(); log(`第一次猜測：選了 ${S.guess} 圖（陸地 ${GUESS[S.guess][0]}%、海水 ${GUESS[S.guess][1]}%）`);
    $('#evi').hidden = false; showLock(true); addVocab('證據', '證據就是資訊，例如測量或觀察得來的資訊，可以幫助我們解釋事物或回答問題。');
  };
  if (S.guessLocked && S.guess) showLock(false);
  const judgeOwn = (s, k) => {
    const ev = /[0-9０-９]|量|測|數了|數一數|記錄|紀錄|觀察|看到|拍|照片|實驗|資料|調查|次|公尺|公里|度|%/.test(s);
    const fe = /覺得|感覺|喜歡|討厭|應該|可能|好像|猜|一定|認為|可怕|漂亮|好看|希望/.test(s);
    const verdict = ev && !fe ? 'e' : fe && !ev ? 'f' : null;
    if (!verdict) return '這句話有點難判斷喔！想一想：它是你實際觀察、測量或記錄到的嗎？如果是，就是證據；如果是心裡的想法或喜好，就是感覺或看法。可以把句子寫得更清楚再試一次。';
    const why = verdict === 'e' ? '因為它是從觀察、測量或記錄得來的資訊，別人去查證也會得到差不多的結果。' : '因為它是心裡的想法或感受，沒有經過觀察或測量。';
    const agree = !k ? '' : k === verdict ? '你判斷對了！' : `你選了「${label(k)}」，再想想看喔。`;
    return `${agree}海博士覺得這句話是「${label(verdict)}」，${why}`;
  };
  const label = k => k === 'e' ? '證據' : '感覺或看法';
  const askWhy = (i, picked) => {
    const key = 'u11-evwhy-' + i; delete S.ai[key]; save();
    const box = $('#evWhy'); box.innerHTML = '';
    aiHere(box, { id: key, qaId: 'u11-evwhy', auto: true, minLen: 1,
      getAnswer: () => `句子：「${ST[i][0]}」。我選了「${label(picked)}」。為什麼不對呢？`,
      extra: () => ({ sentence: ST[i][0], student_choice: label(picked), correct: label(ST[i][1]) }),
      fallback: () => WHY[i] + '再試一次看看！' });
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const check = () => {
    const allRight = ST.every(([, a], i) => S.evSort[i] === a);
    if (allRight) {
      complete(2);
      if ($('#ownQ')) return;
      $('#evWhy').innerHTML = '';
      $('#after2').innerHTML = `<div class="stack"><div class="fb ok">全部分對了！</div>
        <div class="panel stack" style="gap:10px" id="ownQ"><span class="ref" style="align-self:flex-start">換你出題</span>
          <p class="q">自己寫一句關於海洋的話，可以是證據，也可以是感覺，請海博士來判斷！</p>
          <p class="muted" style="font-size:15px">例如：「我在海邊量了水溫，是 28 度。」或「我覺得海洋很可怕。」</p>
          <input type="text" id="ownS" maxlength="80" placeholder="寫一句話……" value="${esc(S.ownS || '')}">
          <div class="row"><span>你覺得它是：</span><button class="choice ${S.ownK === 'e' ? 'on' : ''}" data-ok="e">證據</button><button class="choice ${S.ownK === 'f' ? 'on' : ''}" data-ok="f">感覺或看法</button></div>
          <div id="aiOwn"></div></div>
        <p class="muted" style="font-size:15px">接下來，我們要用<b>地球儀</b>來找出「海水和陸地各覆蓋多少地球」的證據。</p>${nextBtn(2)}</div>`; bindNext(2);
      const fresh = () => { if (ownSlot && S.ai['u11-evown'] && S.ai['u11-evown'].thread.length) ownSlot.reset(); };
      $('#ownS').oninput = e => { S.ownS = e.target.value; save(); fresh(); };
      $$('[data-ok]').forEach(x => x.onclick = () => { S.ownK = x.dataset.ok; save(); $$('[data-ok]').forEach(y => y.classList.toggle('on', y === x)); fresh(); });
      const ownSlot = aiHere($('#aiOwn'), { id: 'u11-evown', button: '請海博士判斷', minLen: 4,
        getAnswer: () => (S.ownS || '').trim() ? `我寫的句子：「${S.ownS.trim()}」。我覺得它是：${S.ownK ? label(S.ownK) : '還不確定'}。` : '',
        fallback: () => judgeOwn(S.ownS || '', S.ownK) });
    }
  };
  $$('.card[data-i]').forEach(card => {
    const i = +card.dataset.i, a = ST[i][1];
    $$('[data-s]', card).forEach(b => b.onclick = () => {
      S.evSort[i] = b.dataset.s; save(); const ok = b.dataset.s === a;
      card.classList.toggle('right', ok); card.classList.toggle('wrong', !ok);
      $('.fbx', card).innerHTML = ok ? (a === 'e' ? '答對了！這是觀察或測量得來的資訊。' : '答對了！這只是感覺或看法。') : '再想想看：這是測量或觀察得來的資訊嗎？ <button class="chip" data-why>問海博士為什麼</button>';
      const w = $('[data-why]', card); if (w) w.onclick = () => askWhy(i, b.dataset.s);
      check();
    });
  });
  check();
}

/* ===== 3 地球儀探索 ===== */
function stExplore(el) {
  const T = S.task;
  const can2 = S.boundary === 'no', can3 = S.longest === 'ocean';
  el.innerHTML = `${head('地球儀探索', 'p.10–12 地球儀探索 3–10')}
  <div class="stack">
  ${guide('這是你的電子地球儀。<b>用手指拖曳</b>就能轉動它，也可以按「隨機轉動」。先自由轉一轉，看看能發現什麼，再完成下面三個任務。')}
  <div class="tabs" role="tablist">
    <button class="tab ${T === 1 ? 'on' : ''}" data-t="1">任務 1　找出海洋</button>
    <button class="tab ${T === 2 ? 'on' : ''}" data-t="2" ${can2 ? '' : 'disabled'}>任務 2　描出最長的路</button>
    <button class="tab ${T === 3 ? 'on' : ''}" data-t="3" ${can3 ? '' : 'disabled'}>任務 3　大部分是水</button>
  </div>
  <div class="globe-area">
    <div class="globe-host"><div class="globe-box" id="gb"></div>
      <div class="row" id="gctl"><button class="btn sec" id="spin">隨機轉動</button>
        <div class="pad" aria-label="轉動按鈕"><span></span><button data-n="0,-15" aria-label="往北轉">↑</button><span></span><button data-n="15,0" aria-label="往西轉">←</button><button data-n="0,15" aria-label="往南轉">↓</button><button data-n="-15,0" aria-label="往東轉">→</button></div></div>
    </div>
    <div class="stack" id="tp" style="min-width:0"></div>
  </div>
  <div id="after3"></div></div>`;
  $$('[data-t]').forEach(b => b.onclick = () => { S.task = +b.dataset.t; save(); render(); });
  const opts = { rot: [-150, 0, 0] };
  globe = new Globe($('#gb'), opts);
  $('#spin').onclick = () => globe.spinTo(randomLL(), 1600, 1);
  $$('[data-n]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.n.split(',').map(Number); globe.nudge(a, c); });
  [task1, task2, task3][T - 1]($('#tp'), opts);
}
function task1(tp) {
  const ALL = ['太平洋', '大西洋', '印度洋', '北極海'];
  if (!S.targets) { S.targets = shuffle(ALL); save(); }
  globe.markers = Object.entries(S.found).map(([k, ll]) => ({ ll, label: k })); globe.draw();
  const cur = () => S.targets.find(t => !S.found[t]);
  const paint = msg => {
    const c = cur();
    tp.innerHTML = `<div class="panel stack" style="gap:10px">
      <b>任務 1：說出不同海洋區域的名稱</b>
      <p>在地球儀上找出這些區域，找到了就<b>點一下</b>它。</p>
      <div class="targets">${S.targets.map(t => `<span class="tg ${S.found[t] ? 'done' : t === c ? 'cur' : ''}">${S.found[t] ? '✓ ' : ''}${t}</span>`).join('')}</div>
      ${c ? `<p class="q">請找出：<span style="color:var(--coral)">${c}</span></p>` : ''}
      <div id="msg">${msg || ''}</div></div>
      <div id="bq"></div>`;
    if (!c) boundaryQ();
  };
  const boundaryQ = () => {
    const ans = S.boundary;
    $('#bq').innerHTML = `<div class="panel stack" style="gap:10px">
      <p class="q">你可以找到太平洋終點和大西洋起點的確切界線嗎？</p>
      <p class="muted">轉一轉地球儀，沿著兩片海洋找找看，它們中間有沒有一條清楚的線？</p>
      <div class="row"><button class="choice ${ans === 'yes' ? 'wrong' : ''}" data-b="yes">YES，找得到</button><button class="choice ${ans === 'no' ? 'right' : ''}" data-b="no">NO，找不到</button></div>
      <div id="bfb">${ans === 'no' ? okBoundary() : ans === 'yes' ? noBoundary() : ''}</div></div>`;
    const t2 = $('#toT2'); if (t2) t2.onclick = () => { S.task = 2; save(); render(); };
    aiHere($('#aiB'), { id: 'u11-boundary', ask: true, placeholder: '我的證據是……' });
    $$('[data-b]').forEach(b => b.onclick = () => {
      S.boundary = b.dataset.b; save();
      if (S.boundary === 'no') { log('發現：海洋之間沒有確切的界線，所有海洋都連在一起'); unlockConcept(0, () => render()); }
      else { $$('[data-b]').forEach(x => x.className = 'choice' + (x === b ? ' wrong' : '')); $('#bfb').innerHTML = noBoundary(); }
    });
  };
  const okBoundary = () => `<div class="fb ok">沒錯！海洋之間<b>沒有邊界</b>，水可以從一個海洋流到另一個海洋。科學家把這些海盆叫做「大洋」，但其實它們只是<b>同一個大海洋的不同部分</b>。</div><div id="aiB"></div><div class="row"><button class="btn" id="toT2">前往任務 2 →</button></div>`;
  const noBoundary = () => `<div class="fb no">真的嗎？試著從太平洋往南、再往東轉，沿著南美洲最南端看看。海水是不是一直連在一起，沒有斷開？</div>`;
  globe.o.onTap = ll => {
    const c = cur(); if (!c) return;
    if (isLand(ll[0], ll[1])) { paint(`<div class="fb no">這裡是陸地喔！要點在藍色的海洋上。</div>`); return; }
    const nm = oceanName(ll[0], ll[1]);
    if (nm === c) {
      S.found[c] = ll; save(); log(`在地球儀上找到了${c}`);
      globe.markers.push({ ll, label: c }); globe.draw();
      paint(`<div class="fb ok">找到了！這裡是<b>${c}</b>。${cur() ? '' : '四個海洋區域都找到了！'}</div>`);
    } else if (nm === '裏海') paint(`<div class="fb info">這裡是裏海，它其實是一個很大的湖，被陸地包圍。再找找看<b>${c}</b>！</div>`);
    else paint(`<div class="fb no">這裡是<b>${nm}</b>，不是${c}。轉一轉地球儀，再找找看！</div>`);
  };
  paint(S.found[S.targets[0]] ? '' : `<div class="fb info">小提示：北極海在地球儀的最上面，字很小，要仔細看喔！</div>`);
}
function task2(tp) {
  let mode = S._dmode || 'land';
  const colors = { land: 'var(--warn)', ocean: '#ffffff' };
  const realColor = m => m === 'land' ? getComputedStyle(document.documentElement).getPropertyValue('--coral').trim() : '#ffffff';
  globe.mode = 'draw'; globe.c.classList.add('drawmode');
  let cur = null, curLen = 0, broke = '';
  const km = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += d3.geoDistance(pts[i - 1], pts[i]); return Math.round(s * 6371); };
  const fmt = n => n.toLocaleString('zh-TW');
  const paint = () => {
    tp.innerHTML = `<div class="panel stack" style="gap:10px">
      <b>任務 2：在地球儀上描繪陸地和海洋最長的路線</b>
      <p>用手指在地球儀上描繪，<b>手指不能離開地球儀</b>，越遠越好。手指移到地球儀邊緣，地球儀就會跟著轉。</p>
      <div class="row"><button class="choice ${mode === 'land' ? 'on' : ''}" data-m="land">描繪陸地</button><button class="choice ${mode === 'ocean' ? 'on' : ''}" data-m="ocean">描繪海洋</button></div>
      <div class="kv"><span>這一次</span><span class="big" id="nowLen">${fmt(curLen)} 公里</span>
        <span>陸地最長</span><span><b>${fmt(S.best.land)}</b> 公里</span><span>海洋最長</span><span><b>${fmt(S.best.ocean)}</b> 公里</span></div>
      <div id="dmsg">${broke}</div></div><div id="lq"></div>`;
    $$('[data-m]').forEach(b => b.onclick = () => { mode = S._dmode = b.dataset.m; broke = ''; paint(); });
    if (S.best.land > 0 && S.best.ocean > 0) longQ();
  };
  const longQ = () => {
    const a = S.longest;
    $('#lq').innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">你能在陸地或海洋中的哪一個，描出較長的路？</p>
      <div class="row"><button class="choice ${a === 'land' ? 'wrong' : ''}" data-l="land">陸地</button><button class="choice ${a === 'ocean' ? 'right' : ''}" data-l="ocean">海洋</button></div><div id="lfb">${a === 'ocean' ? okLong() : ''}</div></div>`;
    $$('[data-l]').forEach(b => b.onclick = () => {
      S.longest = b.dataset.l; save();
      if (S.longest === 'ocean') { log(`描繪路線：海洋最長 ${fmt(S.best.ocean)} 公里，陸地最長 ${fmt(S.best.land)} 公里`); $$('[data-l]').forEach(x => x.className = 'choice' + (x.dataset.l === 'ocean' ? ' right' : '')); $('#lfb').innerHTML = okLong(); $('#toT3').onclick = () => { S.task = 3; save(); render(); }; mountL(); }
      else {
        $$('[data-l]').forEach(x => x.className = 'choice' + (x === b ? ' wrong' : ''));
        $('#lfb').innerHTML = `<div class="fb no">${S.best.land > S.best.ocean ? `你的陸地路線比較長，但海洋其實可以描得更遠喔！試試沿著南極洲外圍的海洋，繞地球一整圈。` : `看看你的證據：海洋路線 ${fmt(S.best.ocean)} 公里，陸地路線 ${fmt(S.best.land)} 公里。哪一個比較長？`}</div>`;
      }
    });
    if (a === 'ocean') { $('#toT3').onclick = () => { S.task = 3; save(); render(); }; mountL(); }
  };
  const mountL = () => aiHere($('#aiL'), { id: 'u11-longest', ask: true, placeholder: '我覺得海洋……', extra: () => ({ ocean_km: S.best.ocean, land_km: S.best.land }) });
  const okLong = () => `<div class="fb ok">沒錯！陸地被海洋隔開，很快就描到盡頭；海洋<b>全部相連，而且很大</b>，可以一直描下去。</div><div id="aiL"></div><div class="row"><button class="btn" id="toT3">前往任務 3 →</button></div>`;
  globe.o.onDrawStart = (g, pt) => {
    const ll = g.ll(pt); if (!ll) return false;
    const land = isLand(ll[0], ll[1]);
    if ((mode === 'land') !== land) { broke = `<div class="fb no">要從${mode === 'land' ? '陸地' : '海洋'}開始描喔！</div>`; $('#dmsg').innerHTML = broke; return false; }
    cur = { pts: [ll], color: realColor(mode) }; g.live = cur; curLen = 0; broke = ''; $('#dmsg').innerHTML = ''; g.draw(); return true;
  };
  globe.o.onDrawMove = (g, pt) => {
    if (!cur) return; const ll = g.ll(pt, true); if (!ll) return;
    const last = cur.pts[cur.pts.length - 1]; const d = d3.geoDistance(last, ll); if (d < 0.004) { g.draw(); return; }
    const steps = Math.ceil(d / 0.004), it = d3.geoInterpolate(last, ll);
    for (let s = 1; s <= steps; s++) {
      const q = it(s / steps);
      if (isLand(q[0], q[1]) !== (mode === 'land')) {
        cur.pts.push(q); finish(`<div class="fb no">${mode === 'land' ? '碰到海了！' : '碰到陸地了！'}這條路線結束了，長度 ${fmt(km(cur.pts))} 公里。再試一次，看能不能更長！</div>`); g.drawing = false; return;
      }
    }
    cur.pts.push(ll); curLen = km(cur.pts); const n = $('#nowLen'); if (n) n.textContent = fmt(curLen) + ' 公里'; g.draw();
  };
  const finish = msg => {
    if (!cur) return; const L = km(cur.pts); curLen = L;
    if (L > S.best[mode]) { S.best[mode] = L; save(); }
    globe.lines = [cur]; globe.live = null; cur = null; broke = msg || `<div class="fb info">手指離開了！這條路線長 ${fmt(L)} 公里。</div>`; globe.draw(); paint();
  };
  globe.o.onDrawEnd = () => finish();
  paint();
}
function task3(tp) {
  const OPTS = ['太平洋', '大西洋', '印度洋', '北極海'];
  let reached = S.viewDone, dom = null;
  const paint = st => {
    const ans = S.viewAns;
    tp.innerHTML = `<div class="panel stack" style="gap:10px">
      <b>任務 3：大部分是水的看法</b>
      <p>轉動地球儀，讓你<b>眼前看到的幾乎都是水</b>，越多越好！目標：海洋超過 85%。</p>
      <div class="meter" aria-hidden="true"><i id="mi" style="width:${st.pct}%"></i></div>
      <div class="row" style="justify-content:space-between"><span style="color:var(--sea)"><b>海洋 <span id="mp">${st.pct}</span>%</b></span><span style="color:var(--warn)"><b>陸地 <span id="ml">${100 - st.pct}</span>%</b></span></div>
      <div id="vmsg"></div></div><div id="vq"></div>`;
    if (reached) viewQ();
  };
  const viewQ = () => {
    const ans = S.viewAns, right = S.viewRight;
    $('#vq').innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">你看到的是哪一片海洋呢？</p>
      <div class="row">${OPTS.map(o => `<button class="choice ${ans === o ? (o === right ? 'right' : 'wrong') : ''}" data-v="${o}">${o}</button>`).join('')}</div><div id="vfb">${ans && ans === right ? okView() : ''}</div></div>`;
    $$('[data-v]').forEach(b => b.onclick = () => {
      S.viewAns = b.dataset.v; save();
      if (S.viewAns === S.viewRight) { log(`轉動地球儀找到幾乎都是水的一面：${S.viewRight}`); viewQ(); bindFinish(); }
      else { $$('[data-v]').forEach(x => x.className = 'choice' + (x === b ? ' wrong' : '')); $('#vfb').innerHTML = `<div class="fb no">再看看地球儀正中間，那一大片藍色是哪一個海洋？</div>`; }
    });
    if (ans === right) bindFinish();
  };
  const okView = () => `<div class="fb ok">答對了！地球上有好大一部分都是水，像<b>太平洋</b>就大到可以佔滿地球儀的一整面。很多地圖只畫出一個或幾個國家，即使是世界地圖，也常常把海洋縮小了，所以我們常常低估海洋有多大。</div>
      <div class="fb info"><b>想一想：</b>一開始你覺得地球上有多少是海洋？如果證據和你原本的想法不一樣，<b>根據證據改變想法，就是科學思維</b>。</div>
      <div class="row"><button class="btn" id="fin3">完成地球儀探索 →</button></div>`;
  const bindFinish = () => { const b = $('#fin3'); if (b) b.onclick = () => { complete(3); go(4); }; };
  const upd = g => {
    const st = g.stats(); const mp = $('#mp');
    if (mp) { mp.textContent = st.pct; $('#ml').textContent = 100 - st.pct; $('#mi').style.width = st.pct + '%'; }
    if (!reached && st.pct >= 85) {
      reached = true; S.viewDone = true;
      const names = Object.entries(st.names).filter(([k]) => OPTS.includes(k)).sort((a, b) => b[1] - a[1]);
      S.viewRight = names.length ? names[0][0] : '太平洋'; save();
      $('#vmsg').innerHTML = `<div class="fb ok">太厲害了！你眼前有 ${st.pct}% 都是海洋。</div>`; viewQ();
    } else if (!reached) $('#vmsg').innerHTML = st.pct >= 70 ? `<div class="fb info">快到了！再轉一點點。</div>` : '';
  };
  let pend = false; globe.o.onRotate = g => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; upd(g); }); };
  paint(globe.stats()); upd(globe);
}

/* ===== 4 討論模型 ===== */
function stModel(el) {
  const CARDS = [
    ['形狀是圓的', 'y'], ['各大洲之間的大小比例差不多', 'y'], ['有顯示海洋和陸地的面積', 'y'],
    ['比真的地球小很多', 'n'], ['是塑膠做的、裡面充滿空氣', 'n'], ['可以拿在手上丟來丟去', 'n'], ['摸起來平平的，沒有高山和深海', 'n']];
  const MODELS = [['地球儀', 'globe'], ['世界地圖', 'world'], ['台灣地圖', 'tw']];
  el.innerHTML = `${head('討論模型', 'p.14 討論模型 1–4；p.15 科學筆記')}
  <div class="stack">
  ${guide('<b>模型</b>可以幫助科學家透過簡化或顯而易見的方式，去理解事物。地球儀就是地球的模型！科學家也會用地圖、電腦程式或塑膠模型，來表示地球的全部或一部分。')}
  <div class="panel stack" style="gap:12px"><p class="q">地球儀哪裡像真實的地球？哪裡不像？</p>
    <div class="cards">${CARDS.map(([t, a], i) => {
      const v = S.modelSort[i]; return `<div class="card ${v ? (v === a ? 'right' : 'wrong') : ''}" data-i="${i}"><span>${t}</span><div class="row"><button class="choice" data-s="y">像真實地球</button><button class="choice" data-s="n">不像</button></div></div>`;
    }).join('')}</div>
    <div id="mfb"></div></div>
  <div id="m2" hidden class="panel stack" style="gap:12px"><p class="q">想看出「海洋有多大」，哪一種模型最適合？</p>
    <div class="row">${MODELS.map(([t, k]) => `<button class="choice ${S.modelPick === k ? (k === 'globe' ? 'right' : 'wrong') : ''}" data-p="${k}">${t}</button>`).join('')}</div><div id="pfb"></div></div>
  <div id="after4"></div></div>`;
  const check = () => {
    if (CARDS.every(([, a], i) => S.modelSort[i] === a)) {
      $('#mfb').innerHTML = `<div class="fb ok">全部分對了！模型沒辦法和真實的東西一模一樣。不過，正因為地球儀比地球小很多，我們反而<b>更容易看到海洋覆蓋了多少地球</b>，以及地球上有多少陸地。</div>`;
      $('#m2').hidden = false; pick();
    }
  };
  const pick = () => {
    if (S.modelPick === 'globe') {
      $('#pfb').innerHTML = `<div class="fb ok">沒錯！地圖常常只畫一個國家，或把海洋縮小；地球儀能顯示所有廣闊的海洋區域。科學家會為了不同目的，選擇不同的模型，世界上沒有一種模型可以滿足所有目的。</div>`;
      if (!S.concepts[1]) unlockConcept(1, () => { addVocab('模型', '模型是用簡化的方式來呈現真實事物（例如物件或過程），像地球儀、地圖、電腦程式都是模型。'); done(); }); else done();
    } else if (S.modelPick) $('#pfb').innerHTML = `<div class="fb no">${S.modelPick === 'tw' ? '台灣地圖只畫出一小塊地方，看不到整個海洋喔。' : '世界地圖可以看到全世界，但常常把海洋畫得比較小，邊緣也被切開了。'}再想想看！</div>`;
  };
  const done = () => { complete(4); log('討論模型：地球儀是地球的模型，有像也有不像的地方'); $('#after4').innerHTML = `<div class="stack"><div id="aiM"></div>${nextBtn(4)}</div>`; bindNext(4); aiHere($('#aiM'), { id: 'u11-model', ask: true, placeholder: '我見過……模型，它像真的東西的地方是……，不像的地方是……' }); };
  $$('.card[data-i]').forEach(card => {
    const i = +card.dataset.i, a = CARDS[i][1];
    $$('[data-s]', card).forEach(b => b.onclick = () => { S.modelSort[i] = b.dataset.s; save(); const ok = b.dataset.s === a; card.classList.toggle('right', ok); card.classList.toggle('wrong', !ok); check(); });
  });
  $$('[data-p]').forEach(b => b.onclick = () => { S.modelPick = b.dataset.p; save(); $$('[data-p]').forEach(x => x.className = 'choice' + (x === b ? (x.dataset.p === 'globe' ? ' right' : ' wrong') : '')); pick(); });
  check();
}

/* ===== 5 拋接地球儀 ===== */
function stToss(el) {
  const T = S.toss;
  el.innerHTML = `${head('拋接地球儀', 'p.14–16 拋接地球儀活動 1–8；p.17 處理非預期的結果')}
  <div class="stack">
  ${guide('科學家擁有越多能用來解釋的證據，就越有信心。我們來收集更多證據！<br>按下「拋出地球儀」，地球儀會隨機轉動後停下來。<b>白色準心就是你右手食指碰到的地方</b>，判斷它落在陸地還是海洋。要公平喔，結果全憑機率！')}
  <div class="globe-area">
    <div class="globe-host"><div class="globe-box" id="gb"></div>
      <div class="row"><button class="btn" id="toss">拋出地球儀！</button><button class="btn ghost" id="auto" hidden>快速拋 20 次</button></div>
      <div id="ask" class="stack" style="gap:8px;align-items:center"></div>
    </div>
    <div class="stack" style="min-width:0">
      <div class="panel stack" style="gap:10px"><b>記錄板（用「正」字記錄）</b>
        <div class="tally" id="tally"></div></div>
      <div class="panel stack" style="gap:6px"><b>食指落在海洋的比例</b><span class="muted" style="font-size:14px">拋越多次，結果越可靠。</span><div id="chart"></div></div>
    </div>
  </div>
  <div id="mean"></div>
  <div id="after5"></div></div>`;
  globe = new Globe($('#gb'), { rot: [-121, -23, 0], noDrag: true }); globe.finger = true; globe.draw();
  globe.mode = 'none';
  let phase = 'ready';
  const pct = () => { const n = T.land + T.ocean; return n ? Math.round(T.ocean / n * 100) : 0; };
  const paintTally = () => {
    const n = T.land + T.ocean;
    $('#tally').innerHTML = `<span class="lbl land">陸地</span><span class="marks">${tallyMarks(T.land) || '　'}</span><b>${T.land}</b>
      <span class="lbl sea">海洋</span><span class="marks">${tallyMarks(T.ocean) || '　'}</span><b>${T.ocean}</b>
      <span>合計</span><span class="muted">海洋佔 <b style="color:var(--sea)">${pct()}%</b></span><b>${n}</b>`;
    $('#chart').innerHTML = chart(T.hist);
    $('#auto').hidden = T.manual < 5;
    if (n >= 25) meaning();
    else $('#mean').innerHTML = `<div class="fb info">已經拋了 ${n} 次。${T.manual < 5 ? `再自己拋 ${5 - T.manual} 次，就能使用「快速拋 20 次」。` : ''}收集到 25 次以上的證據，就可以開始分析結果。</div>`;
  };
  const record = type => { T[type]++; T.hist.push(Math.round(T.ocean / (T.land + T.ocean) * 1000) / 10); save(); };
  $('#toss').onclick = async () => {
    if (phase !== 'ready') return; phase = 'spin'; $('#toss').disabled = true; $('#ask').innerHTML = '';
    await globe.spinTo(randomLL(), 1700, 2);
    phase = 'ask';
    $('#ask').innerHTML = `<b>你的右手食指碰到哪裡？</b><div class="row"><button class="choice" data-a="land">陸地</button><button class="choice" data-a="ocean">海洋</button></div>`;
    $$('[data-a]').forEach(b => b.onclick = () => {
      if (phase !== 'ask') return; phase = 'ready';
      const c = globe.center(), truth = isLand(c[0], c[1]) ? 'land' : 'ocean', ok = b.dataset.a === truth;
      record(truth); T.manual++; save();
      $('#ask').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}">${ok ? '判斷正確！' : '仔細看，準心其實落在' + (truth === 'land' ? '陸地' : '海洋') + '上。'}已記錄一筆「${truth === 'land' ? '陸地' : '海洋'}」。</div>`;
      $('#toss').disabled = false; paintTally();
    });
  };
  $('#auto').onclick = async () => {
    $('#auto').disabled = true; $('#toss').disabled = true;
    for (let i = 0; i < 20; i++) { const ll = randomLL(); record(isLand(ll[0], ll[1]) ? 'land' : 'ocean'); T.auto++; }
    save(); await globe.spinTo(randomLL(), 900, 1); paintTally(); $('#auto').disabled = false; $('#toss').disabled = false;
    $('#ask').innerHTML = `<div class="fb info">已自動拋接 20 次，結果加進記錄板了。</div>`;
  };
  function meaning() {
    const p = pct(), m = S.tossMeaning, n = T.land + T.ocean;
    const odd = p < 55;
    const OPT = [['land', '地球大部分被陸地覆蓋'], ['ocean', '地球大部分被海洋覆蓋'], ['same', '海洋和陸地一樣多']];
    $('#mean').innerHTML = `<div class="panel stack" style="gap:10px">
      <p class="q">拋了 ${n} 次，食指落在海洋的比例是 ${p}%。這個證據表示什麼？</p>
      ${odd ? `<div class="fb info">結果和你在地球儀上看到的不太一樣？別擔心，拋接地球儀有<b>機率</b>的成分，次數越多結果越可靠。再多拋幾次看看！科學家也常常遇到互相矛盾的證據。</div>` : ''}
      <div class="row">${OPT.map(([k, t]) => `<button class="choice ${m === k ? (k === 'ocean' ? 'right' : 'wrong') : ''}" data-m="${k}">${t}</button>`).join('')}</div>
      <div id="mfb2"></div></div><div id="rev"></div>`;
    $$('[data-m]').forEach(b => b.onclick = () => { S.tossMeaning = b.dataset.m; save(); meaning(); });
    if (m === 'ocean') revisit(); else if (m) $('#mfb2').innerHTML = `<div class="fb no">看看記錄板：海洋的「正」字比陸地多還是少？</div>`;
  }
  function revisit() {
    const g0 = S.guess, g2 = S.guess2;
    $('#rev').innerHTML = `<div class="panel stack" style="gap:12px">
      <p class="q">我們的想法如何改變？</p>
      <p>你一開始選了 <b>${g0 || '（沒有選）'}</b>${g0 ? `（陸地 ${GUESS[g0][0]}%、海水 ${GUESS[g0][1]}%）` : ''}。看了這些證據，現在你覺得哪一張最接近？</p>
      <div class="abcd">${Object.entries(GUESS).map(([k, v]) => `<button class="choice ${g2 === k ? (k === 'B' ? 'right' : 'wrong') : ''}" data-r="${k}"><span class="lab">${k}</span>${wsSVG(v[0], v[1])}</button>`).join('')}</div>
      <div id="rfb"></div></div>`;
    $$('[data-r]').forEach(b => b.onclick = () => {
      S.guess2 = b.dataset.r; save();
      if (S.guess2 === 'B') { log(`拋接地球儀 ${T.land + T.ocean} 次：海洋 ${T.ocean} 次、陸地 ${T.land} 次（海洋 ${pct()}%）`); log(`修正後的猜測：${g0 || '—'} → B`); }
      revisit();
    });
    if (g2 === 'B') {
      const changed = g0 && g0 !== 'B';
      $('#rfb').innerHTML = `<div class="fb ok">${changed ? `你從 ${g0} 改成了 B。<b>當想法和證據不符時，根據證據改變想法，就是科學思維！</b>` : '你的證據支持你原本的想法，很棒！'}<br>科學家對地球做了很多測量，所有證據都表明：<b>大約 71% 的地球被海洋覆蓋</b>，最接近 B 圖。</div>`;
      if (!S.concepts[2]) unlockConcept(2, () => fin()); else fin();
    } else if (g2) $('#rfb').innerHTML = `<div class="fb no">${g2} 圖的海水是 ${GUESS[g2][1]}%。你的拋接結果是 ${pct()}% 落在海洋，哪一張比較接近？</div>`;
  }
  function fin() {
    complete(5);
    $('#after5').innerHTML = `<div class="stack"><div id="aiT"></div><p class="muted" style="font-size:14px">接下來的單元，我們會進一步調查這個問題。</p>${nextBtn(5)}</div>`; bindNext(5);
    aiHere($('#aiT'), { id: 'u11-important', ask: true, placeholder: '我認為這很重要，因為……', extra: () => ({ tosses: T.land + T.ocean, ocean_pct: pct() }) });
  }
  paintTally();
}
function chart(h) {
  const W = 320, H = 170, L = 34, R = 12, T = 12, B = 26, n = h.length;
  const xs = i => L + (n <= 1 ? 0 : i / (n - 1)) * (W - L - R), ys = v => T + (1 - v / 100) * (H - T - B);
  const ticks = [0, 25, 50, 75, 100];
  const line = n ? h.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ') : '';
  const area = n > 1 ? `${line} L${xs(n - 1).toFixed(1)} ${ys(0)} L${xs(0)} ${ys(0)}Z` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="海洋比例隨拋接次數的變化">
    ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${ys(t)}" y2="${ys(t)}" stroke="var(--rule)" stroke-width="1"/><text x="${L - 6}" y="${ys(t) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${t}%</text>`).join('')}
    <line x1="${L}" x2="${W - R}" y1="${ys(71)}" y2="${ys(71)}" stroke="var(--coral)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="${W - R}" y="${ys(71) - 5}" text-anchor="end" font-size="10.5" fill="var(--coral)">科學家測量：約 71%</text>
    ${area ? `<path d="${area}" fill="var(--sea)" opacity=".12"/>` : ''}
    ${line ? `<path d="${line}" fill="none" stroke="var(--sea)" stroke-width="2.2" stroke-linejoin="round"/>` : ''}
    ${n ? `<circle cx="${xs(n - 1)}" cy="${ys(h[n - 1])}" r="4" fill="var(--sea)"/>` : `<text x="${(L + W - R) / 2}" y="${H / 2}" text-anchor="middle" font-size="12" fill="var(--muted)">拋出地球儀後，這裡會出現折線</text>`}
    <text x="${L}" y="${H - 6}" font-size="10" fill="var(--muted)">第 1 次</text><text x="${W - R}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--muted)">第 ${Math.max(n, 1)} 次</text>
  </svg>`;
}

/* ===== 6 海洋星球？ ===== */
function stPlanet(el) {
  const T = S.toss, n = T.land + T.ocean;
  const ev = [`拋接地球儀 ${n} 次，${n ? Math.round(T.ocean / n * 100) : 0}% 落在海洋`, `海洋路線描了 ${S.best.ocean.toLocaleString('zh-TW')} 公里`, '地球儀上可以轉到幾乎全是海洋的一面', '海洋之間沒有界線，全部相連'];
  el.innerHTML = `${head('海洋星球？', 'p.16 步驟 9；p.17 科學筆記與回顧提示')}
  <div class="stack">
  ${guide('因為地球大部分被海洋覆蓋，所以有些人說，我們應該把地球稱為「<b>海洋星球</b>」。但也有人說「陸地星球」更準確：因為和地球的岩石比起來，海洋其實只是很淺的一層。你覺得呢？')}
  <div class="panel stack" style="gap:12px"><p class="q">你認為哪個是我們星球最準確的名字？</p>
    <div class="row"><button class="choice ${S.planet === 'ocean' ? 'on' : ''}" data-pl="ocean">海洋星球</button><button class="choice ${S.planet === 'land' ? 'on' : ''}" data-pl="land">陸地星球</button></div>
    <div id="pwhy" ${S.planet ? '' : 'hidden'} class="stack" style="gap:8px">
      <b>哪些證據讓你這樣想？</b><span class="muted" style="font-size:14px">點一下可以把證據加進理由裡。</span>
      <div class="row" style="gap:6px">${ev.map(e => `<button class="chip" data-ev="${esc(e)}">${esc(e)}</button>`).join('')}</div>
      <textarea id="pw" style="min-height:100px" placeholder="我認為……，因為……">${esc(S.planetWhy)}</textarea>
      <div id="pfb3"></div>
    </div></div>
  <div class="panel stack" style="gap:10px"><p class="q">回顧：在不同地方，海洋有什麼不同？</p>
    <div class="fb info" style="white-space:pre-wrap"><b>我的第一個想法：</b>\n${esc(S.idea || '（還沒寫）')}</div>
    <label for="rv"><b>現在，你想補充或修改什麼？</b></label>
    <textarea id="rv" style="min-height:100px" placeholder="我學到了……／我想補充……">${esc(S.revised)}</textarea>
    <div id="aiR"></div>
    <p class="muted" style="font-size:14px">在第 1.8 節，你還會再寫一次修訂後的想法。</p>
  </div>
  <div class="panel stack" style="gap:8px"><p class="q">關於海洋，你還有什麼問題？還想知道什麼？</p>
    <textarea id="qs" style="min-height:80px" placeholder="我想知道……">${esc(S.questions || '')}</textarea><div id="aiQ"></div></div>
  <div class="row"><button class="btn" id="finish">完成第 1.1 節</button><span class="muted" id="fh"></span></div>
  <div id="end"></div></div>`;
  $$('[data-pl]').forEach(b => b.onclick = () => { S.planet = b.dataset.pl; save(); $$('[data-pl]').forEach(x => x.classList.toggle('on', x === b)); $('#pwhy').hidden = false; side(); });
  let planetSlot = null;
  const side = () => { if (!S.planet || planetSlot) return; planetSlot = aiHere($('#pfb3'), { id: 'u11-planet', button: '請海博士看看我的理由', getAnswer: () => `我選「${S.planet === 'ocean' ? '海洋星球' : '陸地星球'}」。理由：${S.planetWhy}`, extra: () => ({ tosses: n, ocean_pct: n ? Math.round(T.ocean / n * 100) : 0, ocean_path_km: S.best.ocean }) }); };
  side();
  const pw = $('#pw'); pw.oninput = () => { S.planetWhy = pw.value; save(); };
  $$('[data-ev]').forEach(b => b.onclick = () => { pw.value += (pw.value ? '、' : '') + b.dataset.ev; pw.oninput(); });
  $('#rv').oninput = e => { S.revised = e.target.value; save(); };
  $('#qs').oninput = e => { S.questions = e.target.value; save(); };
  aiHere($('#aiR'), { id: 'u11-revise', button: '請海博士比較我的想法', getAnswer: () => S.revised, extra: () => ({ first_idea: S.idea }) });
  aiHere($('#aiQ'), { id: 'u11-question', mode: 'question', button: '問海博士', getAnswer: () => S.questions || '' });
  $('#finish').onclick = () => {
    if (!S.planet || S.planetWhy.trim().length < 4) { $('#fh').textContent = '先選一個名字，並寫下你的理由。'; return; }
    $('#fh').textContent = ''; S.doneAll = true; complete(6); log(`我認為地球最準確的名字是：${S.planet === 'ocean' ? '海洋星球' : '陸地星球'}`);
    endScreen();
  };
  if (S.doneAll) endScreen();
  function endScreen() {
    $('#end').innerHTML = `<div class="panel stack" style="gap:12px;border-color:var(--ok)">
      <h3 class="q" style="color:var(--ok)">恭喜 ${esc(S.name)}，完成第 1.1 節「海洋星球」！</h3>
      <p>你收集了 ${S.badges.filter(b => b > 0).length} 枚徽章，並在概念牆貼上了 ${S.concepts.filter(Boolean).length} 個關鍵概念。下一節「模擬洋流」，我們會繼續調查海洋。</p>
      ${NB.endButtons()}</div>`;
    $('#nb2').onclick = openNotebook; $('#copyNb').onclick = copyNotebook;
  }
}

/* ---------- 筆記本 ---------- */
function notebookText() {
  const T = S.toss, n = T.land + T.ocean;
  return [`【海洋星球 調查筆記本】調查員：${S.name}`,
    `一、第一個想法：${S.idea || '—'}`,
    `二、多少海洋？第一次猜測：${S.guess || '—'}；理由：${[...S.guessTags, S.guessWhy].filter(Boolean).join('、') || '—'}`,
    `三、地球儀探索：找到 ${Object.keys(S.found).join('、') || '—'}；海洋最長路線 ${S.best.ocean} 公里、陸地最長路線 ${S.best.land} 公里`,
    `四、拋接地球儀：共 ${n} 次，海洋 ${T.ocean} 次、陸地 ${T.land} 次（海洋 ${n ? Math.round(T.ocean / n * 100) : 0}%）`,
    `五、修正後的猜測：${S.guess || '—'} → ${S.guess2 || '—'}`,
    `六、地球最準確的名字：${S.planet === 'ocean' ? '海洋星球' : S.planet === 'land' ? '陸地星球' : '—'}；理由：${S.planetWhy || '—'}`,
    `七、補充後的想法：${S.revised || '—'}`,
    `八、我還想知道：${S.questions || '—'}`,
    `九、和海博士的討論：${Object.entries(S.ai || {}).filter(([, r]) => r.thread && r.thread.length).map(([k, r]) => `\n［${(window.QA && (QA[k] || QA[k.replace(/-\d+$/, '')]) || {}).stage || k}］` + r.thread.map(m => (m.r === 's' ? '我：' : '海博士：') + m.t).join('\n')).join('') || '—'}`,
    `概念牆：${CONCEPTS.filter((_, i) => S.concepts[i]).join(' ') || '—'}`].join('\n');
}
function copyNotebook() { NB.copy(notebookText(), $('#cpm')); }
function openNotebook() {
  const T = S.toss, n = T.land + T.ocean, pct = n ? Math.round(T.ocean / n * 100) : 0;
  const { sec, text, card, bars, talks } = NB;
  const OCEANS = ['太平洋', '大西洋', '印度洋', '北極海'];
  const mini = (k, lab) => `<figure class="nb-fig"><figcaption>${lab}｜<b>${k}</b> 圖</figcaption>${wsSVG(GUESS[k][0], GUESS[k][1])}</figure>`;
  const html = `
    ${sec('我的想法改變了', `<div class="nb-two">${card('一開始', text(S.idea, '還沒寫'))}${card('現在', text(S.revised, '完成第 6 站「海洋星球？」後會出現'), 'now')}</div>`)}
    <h4 class="nb-h">我收集到的證據</h4>
    <div class="nb-grid">
      ${sec('多少海洋？多少陸地？', S.guess ? `<div class="nb-guess">${mini(S.guess, '一開始')}${S.guess2 ? `<span class="nb-arrow" aria-hidden="true">→</span>${mini(S.guess2, '看了證據後')}` : ''}</div>${S.guess2 ? '' : '<p class="nb-empty">完成「拋接地球儀」後，會看到你修正後的選擇。</p>'}` : '', '完成第 2 站後會出現')}
      ${sec('在地球儀上找到的海洋', Object.keys(S.found).length ? `<div class="nb-chips">${OCEANS.map(o => `<span class="${S.found[o] ? 'ok' : ''}">${S.found[o] ? '✓ ' : ''}${o}</span>`).join('')}</div>${S.boundary === 'no' ? '<p class="nb-text">發現：海洋之間找不到界線，全部連在一起。</p>' : ''}` : '', '完成「地球儀探索」任務 1 後會出現')}
      ${sec('描出最長的路', S.best.ocean || S.best.land ? bars([{ t: '海洋', v: S.best.ocean, u: '公里', c: 'var(--sea)' }, { t: '陸地', v: S.best.land, u: '公里', c: 'var(--land)' }]) : '', '完成「地球儀探索」任務 2 後會出現')}
      ${sec('拋接地球儀', n ? `<div class="tally"><span class="lbl sea">海洋</span><span class="marks">${tallyMarks(T.ocean)}</span><b>${T.ocean}</b><span class="lbl land">陸地</span><span class="marks">${tallyMarks(T.land) || '　'}</span><b>${T.land}</b></div>
        <p class="nb-text">共拋 ${n} 次，食指落在海洋的比例是 <b style="color:var(--sea)">${pct}%</b>（科學家測量：約 71%）。</p>${chart(T.hist)}` : '', '完成第 5 站「拋接地球儀」後會出現')}
    </div>
    ${sec('我的結論：地球最準確的名字', S.planet ? `<p class="nb-big">${S.planet === 'ocean' ? '海洋星球' : '陸地星球'}</p>${text(S.planetWhy, '還沒寫理由')}` : '', '完成第 6 站後會出現')}
    ${sec('我學到的關鍵概念', S.concepts.some(Boolean) ? `<div class="nb-concepts">${CONCEPTS.map((c, i) => S.concepts[i] ? `<div class="concept got">${esc(c)}</div>` : '').join('')}</div>` : '', '在調查中發現關鍵概念後，會貼在這裡')}
    ${sec('我和海博士的討論', talks(S.ai), '請海博士看看你的想法後，對話會記在這裡')}
    ${sec('關於海洋，我還想知道', text(S.questions, '完成第 6 站後會出現'))}`;
  NB.open(`海洋星球｜${S.name || '調查員'}`, `<span>徽章 <b>${S.badges.filter(b => b > 0).length}</b>/6</span><span>關鍵概念 <b>${S.concepts.filter(Boolean).length}</b>/3</span>`, html, notebookText);
}

/* ---------- 啟動 ---------- */
function start() {
  $('#brandTitle').textContent = '海洋星球'; $('#brandSub').textContent = '調查筆記本｜第 1.1 節';
  if (!S.name) S.name = getName();
  if (!window.d3) { $('#stage').innerHTML = '<div class="fb no">地圖程式載入失敗，請檢查網路連線後重新整理頁面。</div>'; return; }
  if (!LMASK) buildMask();
  $('#nbBtn').onclick = openNotebook;
  $('#reset').onclick = () => {
    overlay(`<h3 class="q">要重新開始嗎？</h3><p><b>只清除這個單元</b>：這一節的筆記本內容、徽章和概念會清除，名字和其他單元保留。</p><p><b>換下一位同學</b>：清除這台電腦上所有單元的進度和名字。</p><div class="row"><button class="btn" id="yes">只清除這個單元</button><button class="btn sec" id="allYes">換下一位同學</button><button class="btn-plain" data-close>取消</button></div>`);
    $('#yes').onclick = () => { S = fresh(); save(); $('.ov').remove(); render(); };
    $('#allYes').onclick = () => { $('.ov').remove(); confirmClearAll(); };
  };
  if (S.stage > S.maxStage) S.stage = S.maxStage;
  render();
}

return { start, stop: () => { if (globe) { globe.destroy(); globe = null; } }, progress: () => ({ done: S.badges.filter(b => b > 0).length, total: STAGES.length - 1 }) };
})();

