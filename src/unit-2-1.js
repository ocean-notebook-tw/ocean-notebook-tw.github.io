const UNIT21 = (() => {
/* ===== 介紹海洋生物 互動遊戲（依 海洋科學序列教材 G3-G5 第2.1節） ===== */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = 'ocean-life-2-1-v1';
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 16 張生物適應圖卡 ---------- */
const ORGS = [
  { id: 'boxfish', n: '箱魨', where: '溫暖的珊瑚礁', breathe: 'water', eat: '藻類和小型無脊椎動物', fact: '身體外面包著像盒子一樣的硬骨板，可以保護自己；受到威脅時，皮膚還會分泌毒素。' },
  { id: 'clownfish', n: '小丑魚', where: '溫暖的珊瑚礁', breathe: 'water', eat: '藻類和浮游動物', plantEater: true, fact: '住在海葵的觸手之間。身上的黏液讓牠不會被海葵螫傷，海葵也保護牠不被其他魚吃掉。' },
  { id: 'dolphin', n: '海豚', where: '世界各地的海洋', breathe: 'air', eat: '魚和魷魚', fact: '用頭頂的噴氣孔浮出水面呼吸空氣；會發出聲音，再聽回聲來找到魚。' },
  { id: 'shark', n: '大白鯊', where: '溫帶和熱帶的海洋', breathe: 'water', eat: '魚、海豹和海獅', fact: '嘴裡有好幾排鋒利的牙齒，掉了會再長出來；嗅覺很靈敏，能聞到很遠的地方的氣味。' },
  { id: 'seal', n: '斑海豹', where: '寒冷的海岸', breathe: 'air', eat: '魚和魷魚', fact: '皮膚下有厚厚的脂肪，在冰冷的海水中也能保暖；潛水時鼻孔會關起來。' },
  { id: 'humpback', n: '座頭鯨', where: '世界各地的海洋，會長途遷徙', breathe: 'air', eat: '磷蝦和小魚', fact: '嘴裡沒有牙齒，而是像梳子一樣的鯨鬚，一大口吞進海水後，把磷蝦和小魚濾出來吃。' },
  { id: 'jelly', n: '水母', where: '從海面到深海都有', breathe: 'water', eat: '浮游動物和小魚', fact: '身體大部分是水，沒有骨頭；觸手上有刺細胞，可以麻痺碰到的小動物。' },
  { id: 'urchin', n: '海膽', where: '岩石海岸和海底', breathe: 'water', eat: '海藻', plantEater: true, fact: '全身長滿尖刺保護自己；用許多細細的管足慢慢移動，啃食岩石上的海藻。' },
  { id: 'orca', n: '虎鯨', where: '世界各地的海洋，寒冷海域最多', breathe: 'air', eat: '魚、海豹，甚至其他鯨', fact: '會成群合作打獵；背部黑、腹部白，從上往下或從下往上看都不容易被發現。' },
  { id: 'penguin', n: '企鵝', where: '南半球的海岸和海洋', breathe: 'air', eat: '魚、磷蝦和魷魚', fact: '翅膀像船槳一樣，可以在水裡快速「飛行」；羽毛很密而且防水，可以保暖。' },
  { id: 'puffer', n: '河豚', where: '溫暖的海洋和珊瑚礁', breathe: 'water', eat: '貝類和海膽等小動物', fact: '遇到危險時會吸很多水，把身體脹成一顆球，讓捕食者吞不下去。' },
  { id: 'crab', n: '紫紋濱蟹', where: '岩石海岸，常躲在石頭下', breathe: 'water', eat: '藻類和小動物的殘骸', fact: '身體有硬殼保護，兩隻大螯可以夾東西、抵抗敵人；退潮時躲在潮濕的石頭下面。' },
  { id: 'seahorse', n: '海馬', where: '海草床和珊瑚礁', breathe: 'water', eat: '很小的蝦子和浮游動物', fact: '用捲捲的尾巴纏住海草，不會被水沖走；由海馬爸爸用肚子上的育兒袋孵寶寶。' },
  { id: 'turtle', n: '海龜', where: '溫暖的海洋，台灣也看得到綠蠵龜', breathe: 'air', eat: '綠蠵龜長大後主要吃海草和海藻', plantEater: true, fact: '用肺呼吸，要浮出水面換氣；四肢像槳一樣，很會游泳，母海龜會上岸到沙灘產卵。' },
  { id: 'ray', n: '魟魚', where: '溫暖的淺海沙地', breathe: 'water', eat: '貝類、螃蟹和蠕蟲', fact: '身體扁扁的，可以把自己埋在沙子裡躲起來；有些魟魚的尾巴上有毒刺。' },
  { id: 'squid', n: '魷魚', where: '從淺海到深海', breathe: 'water', eat: '魚和蝦子', fact: '遇到危險時會噴出墨汁，趁捕食者看不清楚時逃走；還能很快改變身體的顏色。' }
];
const O = Object.fromEntries(ORGS.map(o => [o.id, o]));

/* ---------- 狀態 ---------- */
const fresh = () => ({
  v: 1, name: getName(), stage: 0, maxStage: 0, badges: [],
  brain: [], idea: '',
  seen: [], mark: {}, sel: null, knownText: '', knownId: null, newText: '', newId: null, listenAns: null, listenId: null,
  step: 1, aNeeds: [], aNeedsDone: false, allEat: null, eaters: [], eatDone: false,
  breathQ1: null, breathQ2: null, airSort: {}, oxyDone: false,
  pNeeds: [], pNeedsDone: false, pFood: null, chartDone: false,
  concepts: [false, false], vocab: [], favId: null, favWhy: '', hope: '', log: [], doneAll: false
});
let S = load();
  if (!S.name) S.name = getName();
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.v === 1) return Object.assign(fresh(), v); } catch (e) { } return fresh(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function log(t) { if (!S.log.includes(t)) { S.log.push(t); save(); } }

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

const STAGES = [
  { t: '筆記本封面', s: '封面' },
  { t: '第一個想法', s: '第一個想法' },
  { t: '生物之旅', s: '生物之旅' },
  { t: '生物需要什麼？', s: '生物需要什麼？' },
  { t: '回顧', s: '回顧' }
];
const CONCEPTS = ['數以百萬種的海洋生物，包含有動物、植物和藻類族群。', '所有生物都有為了生存所必須滿足的需求。'];
const VOCAB = ['生物', '類植物生物'];
/* 生物需求：a=動物 p=類植物生物；y 必須、n 不需要、o 都可以 */
const NEEDS = [
  { k: 'food', t: '食物（吃其他生物）', a: 'y', p: 'n' },
  { k: 'water', t: '水', a: 'y', p: 'y' },
  { k: 'shelter', t: '庇護所', a: 'y', p: 'o' },
  { k: 'safe', t: '不被獵食', a: 'y', p: 'y' },
  { k: 'temp', t: '適宜的溫度', a: 'y', p: 'y' },
  { k: 'press', t: '適宜的壓力', a: 'y', p: 'o' },
  { k: 'oxy', t: '氧氣', a: 'y', p: 'o' },
  { k: 'sun', t: '陽光', a: 'n', p: 'y' },
  { k: 'co2', t: '二氧化碳', a: 'n', p: 'y' },
  { k: 'nutri', t: '營養素（維生素和礦物質）', a: 'n', p: 'y' }
];
const N = Object.fromEntries(NEEDS.map(x => [x.k, x]));

function go(i) { if (i > S.maxStage) return; S.stage = i; save(); render(); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); }
function complete(i) { if (!S.badges.includes(i)) S.badges.push(i); S.maxStage = Math.max(S.maxStage, Math.min(i + 1, STAGES.length - 1)); save(); renderChrome(); }
const nextBtn = (label = '前往下一站') => `<div class="row"><button class="btn" id="next">${label} →</button></div>`;
function bindNext(i) { const b = $('#next'); if (b) b.onclick = () => go(i + 1); }

function renderChrome() {
  $('#who').textContent = S.name ? `調查員：${S.name}` : '';
  $('#track').innerHTML = STAGES.map((st, i) => `<button class="st ${S.badges.includes(i) ? 'done' : ''} ${S.stage === i ? 'cur' : ''}" data-go="${i}" ${i > S.maxStage ? 'disabled' : ''}><span class="n">${i === 0 ? '封' : i}</span>${st.s}</button>`).join('');
  $$('#track [data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
  $('#wall').innerHTML = `<h3>概念牆</h3>${CONCEPTS.map((c, i) => `<div class="concept ${S.concepts[i] ? 'got' : ''}">${S.concepts[i] ? esc(c) : `關鍵概念 ${i + 1}：還沒發現`}</div>`).join('')}`;
  $('#vocab').innerHTML = VOCAB.map(v => `<span class="${S.vocab.includes(v) ? 'got' : ''}">${v}</span>`).join('');
  $('#badges').innerHTML = STAGES.slice(1).map((st, k) => `<span class="badge ${S.badges.includes(k + 1) ? 'got' : ''}" title="${st.t}">${k + 1}</span>`).join('');
}
function render() { renderChrome(); AI.setContext({ unit: '2.1 介紹海洋生物', stage: STAGES[S.stage].t }); const el = $('#stage'); el.innerHTML = ''; [stCover, stIdea, stTour, stNeeds, stReview][S.stage](el); }

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
function addVocab(v, def, then) {
  if (S.vocab.includes(v)) { then && then(); return; } S.vocab.push(v); save(); renderChrome();
  overlay(`<h3 class="q">新的科學詞彙：<span style="color:var(--sea)">${v}</span></h3><p>${def}</p><div class="row"><button class="btn" data-close>記住了</button></div>`, then);
}
function timer(el, secs, done) {
  let s = secs, t = null; const C = 163.4;
  el.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--rule)" stroke-width="6"/><circle class="arc" cx="32" cy="32" r="26" fill="none" stroke="var(--sea)" stroke-width="6" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 32 32)" stroke-linecap="round"/><text class="sec" x="32" y="38" text-anchor="middle" font-size="16" fill="var(--ink)">${s}</text></svg>`;
  return () => { if (t) return; t = setInterval(() => { s--; $('.sec', el).textContent = s; $('.arc', el).setAttribute('stroke-dashoffset', C * (1 - s / secs)); if (s <= 0) { clearInterval(t); done && done(); } }, 1000); };
}

/* ===== 0 封面 ===== */
function stCover(el) {
  el.innerHTML = `<div class="stack">
  <div class="cover">
    <div class="stack" style="gap:8px"><span class="muted" style="font-size:14px;letter-spacing:.06em">海洋科學序列教材 G3–G5 初階海洋素養｜第 2.1 節</span><h2>介紹海洋生物</h2>
      <p>海洋中有什麼生物？不同的生物需要什麼才能生存？接下來，你要像海洋科學家一樣思考和行動，認識不同類型的海洋生物和牠們的棲息地。</p></div>
    <div class="panel stack" style="gap:10px"><b>今天的調查路線</b>
      <div class="plan">
        <span>1</span><span>寫下第一個想法</span>
        <span>2</span><span>生物之旅：調查海洋中的生物</span>
        <span>3</span><span>討論生物生存的要素</span>
        <span>4</span><span>回顧</span>
      </div></div>
  </div>
  <div class="row" style="justify-content:center;gap:6px">${['clownfish', 'turtle', 'jelly', 'orca', 'urchin', 'kelp'].map(k => `<div style="width:92px">${art(k, O[k] ? O[k].n : '海藻')}</div>`).join('')}</div>
  ${guide(`<span id="hiName">${S.name ? esc(S.name) + '，' : ''}</span>歡迎回來！科學家會在<b>調查筆記本</b>記錄調查時的想法、問題和結果，還會畫圖表。<span id="hiAsk">${S.name ? '確認筆記本封面上的名字，就可以開始調查了！' : '先在封面寫上你的名字吧！'}</span>`)}
  <div class="panel stack" style="gap:10px">
    <label for="nm"><b>調查筆記本　姓名</b></label>
    <input type="text" id="nm" maxlength="20" placeholder="例如：王小海" value="${esc(S.name)}">
    <div class="row"><button class="btn" id="open">打開筆記本，開始調查 →</button><span class="muted" id="nmh"></span></div>
  </div></div>`;
  $('#open').onclick = () => { const v = $('#nm').value.trim(); if (!v) { $('#nmh').textContent = '請先寫上你的名字。'; $('#nm').focus(); return; } S.name = v; setName(v); complete(0); go(1); };
  $('#nm').oninput = e => { const v = e.target.value.trim(); $('#hiName').textContent = v ? v + '，' : ''; };
  $('#nm').onkeydown = e => { if (e.key === 'Enter') $('#open').click(); };
}

/* ===== 1 第一個想法 ===== */
function stIdea(el) {
  el.innerHTML = `${head('第一個想法', 'p.112–114 寫下第一個想法 1–8')}
  <div class="stack">
  <div class="panel stack" style="gap:10px">
    <p class="q">暖身：有哪些種類的生物可能生活在海洋中？</p>
    <div class="timer"><div id="t30" style="width:64px;height:64px"></div><div class="stack" style="gap:6px"><span class="muted" style="font-size:15px">先安靜想 30 秒，再把想到的生物一個一個加進來，越多越好！</span><div class="row"><button class="btn sec" id="think">開始想 30 秒</button></div></div></div>
    <div class="row" style="gap:8px;flex-wrap:nowrap"><input type="text" id="bi" maxlength="12" placeholder="輸入一種生物，按「加入」"><button class="btn sec" id="badd" style="flex:0 0 auto">加入</button></div>
    <div class="listbox" id="blist"></div>
  </div>
  ${guide('現在寫下你的第一個想法。它可以幫你知道自己對海洋生物了解多少，<b>這不是考試，不會打分數</b>。這個單元裡你會學到更多，最後會再回答一次同樣的問題。')}
  <div class="panel stack" style="gap:10px">
    <p class="q">不同地區的海洋生物有何不同？為什麼？</p>
    <ul style="margin:0;padding-left:1.2em" class="muted">
      <li>一個區域的海洋生物，和另一個區域的海洋生物有什麼不同？</li>
      <li>海底深處的生物，和靠近海洋表面的生物有什麼不同？為什麼會不同？</li>
      <li>你能想到哪種生物只能生活在某一個海洋區域，而不能生活在另一個區域嗎？</li></ul>
    <label for="idea" class="muted" style="font-size:15px">至少寫一到兩句以上，盡量寫出細節，也可以舉你熟悉的海洋動物當例子。</label>
    <textarea id="idea" placeholder="我覺得……，因為……">${esc(S.idea)}</textarea>
    <div class="row"><button class="btn" id="saveIdea">寫好了，放進筆記本</button><span class="muted" id="cnt"></span></div>
  </div><div id="after"></div></div>`;
  const start = timer($('#t30'), 30, () => { $('#bi').focus(); });
  $('#think').onclick = () => { $('#think').disabled = true; start(); };
  const paintList = () => { $('#blist').innerHTML = S.brain.length ? S.brain.map((b, i) => `<span>${esc(b)} <button class="btn-plain" style="padding:0 6px;border:none" data-rm="${i}" aria-label="移除${esc(b)}">×</button></span>`).join('') + `<span style="background:none" class="muted">共 ${S.brain.length} 種</span>` : '<span style="background:none" class="muted">還沒有加入生物</span>'; $$('[data-rm]').forEach(b => b.onclick = () => { S.brain.splice(+b.dataset.rm, 1); save(); paintList(); }); };
  const add = () => { const v = $('#bi').value.trim(); if (!v) return; if (!S.brain.includes(v)) S.brain.push(v); save(); $('#bi').value = ''; $('#bi').focus(); paintList(); };
  $('#badd').onclick = add; $('#bi').onkeydown = e => { if (e.key === 'Enter') add(); };
  paintList();
  const ta = $('#idea'), cnt = () => $('#cnt').textContent = `已寫 ${ta.value.trim().length} 字`;
  ta.oninput = () => { S.idea = ta.value; save(); cnt(); }; cnt();
  $('#saveIdea').onclick = () => {
    if (ta.value.trim().length < 10) { $('#cnt').textContent = '再多寫一點，至少寫一到兩句。'; return; }
    S.idea = ta.value.trim(); log(`暖身想到 ${S.brain.length} 種海洋生物`); log('寫下了第一個想法'); complete(1);
    $('#after').innerHTML = `<div class="stack"><div class="fb ok">已經放進筆記本了！</div>${nextBtn()}</div>`; bindNext(1);
  };
  if (S.badges.includes(1)) { $('#after').innerHTML = nextBtn(); bindNext(1); }
}

/* ===== 2 生物之旅 ===== */
function stTour(el) {
  const enough = () => S.seen.length >= 6 && Object.values(S.mark).includes('k') && Object.values(S.mark).includes('n');
  el.innerHTML = `${head('生物之旅', 'p.114–116 研究海洋中的生物 1–6')}
  <div class="stack">
  ${guide('<b>生物</b>是指有生命的物體，例如植物、動物、藻類和細菌。有些生物小到要用顯微鏡才看得到。<br>今天要研究的問題是：<b>哪些生物生存在海洋中？</b>下面這 16 張生物適應圖卡，只是海洋中的少數生物，海洋裡其實有超過百萬種生物！')}
  <div class="panel stack" style="gap:10px">
    <div class="row" style="justify-content:space-between"><b>點開圖卡觀察。至少找出一種你<span style="color:var(--ok)">認識</span>的生物，和一種你<span style="color:var(--coral)">不認識</span>的生物。</b><span class="muted" id="seenN"></span></div>
    <div class="gallery" id="gal"></div>
  </div>
  <div id="det"></div>
  <div id="share"></div></div>`;
  const paintGal = () => {
    $('#gal').innerHTML = ORGS.map(o => `<button class="org ${S.seen.includes(o.id) ? 'seen' : ''}" data-o="${o.id}">${S.mark[o.id] ? `<span class="tag ${S.mark[o.id]}">${S.mark[o.id] === 'k' ? '認識' : '新認識'}</span>` : ''}${art(o.id, o.n)}<span>${o.n}</span></button>`).join('');
    $('#seenN').textContent = `已觀察 ${S.seen.length} / 16`;
    $$('[data-o]').forEach(b => b.onclick = () => { S.sel = b.dataset.o; if (!S.seen.includes(S.sel)) S.seen.push(S.sel); save(); paintGal(); paintDet(); if (!$('#kt')) paintShare(); $('#det').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); });
  };
  const paintDet = () => {
    const o = O[S.sel]; if (!o) { $('#det').innerHTML = ''; return; }
    $('#det').innerHTML = `<div class="panel detail">${art(o.id, o.n)}<div class="stack" style="gap:8px;min-width:0">
      <h3 class="q">${o.n}</h3>
      <div class="kv"><span class="muted">住在哪裡</span><span>${o.where}</span><span class="muted">吃什麼</span><span>${o.eat}</span></div>
      <div class="fb info"><b>適應：</b>${o.fact}</div>
      <div class="row"><button class="choice ${S.mark[o.id] === 'k' ? 'on' : ''}" data-mk="k">我認識牠</button><button class="choice ${S.mark[o.id] === 'n' ? 'on' : ''}" data-mk="n">我不認識／我很好奇</button></div></div></div>`;
    $$('[data-mk]').forEach(b => b.onclick = () => { S.mark[o.id] = S.mark[o.id] === b.dataset.mk ? undefined : b.dataset.mk; if (!S.mark[o.id]) delete S.mark[o.id]; save(); paintGal(); paintDet(); paintShare(); });
  };
  const paintShare = () => {
    if (!enough()) { $('#share').innerHTML = `<div class="fb info">${S.seen.length < 6 ? `再觀察 ${6 - S.seen.length} 張圖卡。` : ''}${!Object.values(S.mark).includes('k') ? '標記一種你認識的生物。' : ''}${!Object.values(S.mark).includes('n') ? '標記一種你不認識的生物。' : ''}</div>`; return; }
    const known = ORGS.filter(o => S.mark[o.id] === 'k'), news = ORGS.filter(o => S.mark[o.id] === 'n');
    if (!known.find(o => o.id === S.knownId)) S.knownId = known[0].id;
    if (!news.find(o => o.id === S.newId)) S.newId = news[0].id;
    if (!S.listenId || S.listenId === S.knownId) { S.listenId = shuffle(ORGS.filter(o => o.id !== S.knownId && o.id !== S.newId))[0].id; S.listenAns = null; }
    save();
    const L = O[S.listenId];
    const opts = S.listenOpts && S.listenOpts[0] === L.id ? S.listenOpts : [L.id, ...shuffle(ORGS.filter(o => o.id !== L.id).map(o => o.id)).slice(0, 2)];
    S.listenOpts = opts; save();
    const optOrder = S.listenOrder && S.listenOrder.length === 3 && S.listenOrder.every(x => opts.includes(x)) ? S.listenOrder : (S.listenOrder = shuffle(opts));
    $('#share').innerHTML = `<div class="stack">
      ${guide('接下來練習<b>分享與聆聽</b>。科學家會互相分享、仔細聆聽，再說出聽到的重點。我們輪流扮演夥伴 #1 和夥伴 #2。')}
      <div class="panel stack" style="gap:10px"><span class="ref" style="align-self:flex-start">第一個問題｜你是夥伴 #1：分享</span>
        <p class="q">你已經認識的一種生物是什麼？請分享你所知道、關於這個生物的所有知識。</p>
        <div class="row" style="gap:6px">${known.map(o => `<button class="chip ${o.id === S.knownId ? 'on' : ''}" data-kn="${o.id}">${o.n}</button>`).join('')}</div>
        <textarea id="kt" style="min-height:100px" placeholder="我知道${O[S.knownId].n}……">${esc(S.knownText)}</textarea></div>
      <div class="panel stack" style="gap:10px"><span class="ref" style="align-self:flex-start">第二個問題｜你是夥伴 #1：分享</span>
        <p class="q">哪一個生物是你不認識的，或是有疑問的？那個生物看起來像什麼？你對牠有什麼好奇？</p>
        <div class="row" style="gap:6px">${news.map(o => `<button class="chip ${o.id === S.newId ? 'on' : ''}" data-nw="${o.id}">${o.n}</button>`).join('')}</div>
        <textarea id="nt" style="min-height:100px" placeholder="${O[S.newId].n}看起來像……，我好奇……">${esc(S.newText)}</textarea></div>
      <div class="panel stack" style="gap:10px"><span class="ref" style="align-self:flex-start">換你當夥伴 #2：聆聽並總結</span>
        ${guide(`我來分享一種生物，你仔細「聽」：<br>「這種生物住在${L.where}，牠吃${L.eat}。${L.fact}」`)}
        <p class="q">海博士說的是哪一種生物？</p>
        <div class="row">${optOrder.map(id => `<button class="choice ${S.listenAns === id ? (id === L.id ? 'right' : 'wrong') : ''}" data-ls="${id}">${O[id].n}</button>`).join('')}</div>
        <div id="lfb"></div></div>
      <div class="row"><button class="btn" id="tourDone">完成生物之旅</button><span class="muted" id="th"></span></div>
      <div id="after2"></div></div>`;
    $$('[data-kn]').forEach(b => b.onclick = () => { S.knownId = b.dataset.kn; save(); paintShare(); });
    $$('[data-nw]').forEach(b => b.onclick = () => { S.newId = b.dataset.nw; save(); paintShare(); });
    $('#kt').oninput = e => { S.knownText = e.target.value; save(); };
    $('#nt').oninput = e => { S.newText = e.target.value; save(); };
    const lfb = () => { if (!S.listenAns) return; $('#lfb').innerHTML = S.listenAns === L.id ? `<div class="fb ok">答對了，就是<b>${L.n}</b>！你仔細聽到了重點。</div>` : `<div class="fb no">再聽一次：注意牠住在哪裡、吃什麼，還有牠特別的本領。</div>`; };
    $$('[data-ls]').forEach(b => b.onclick = () => { S.listenAns = b.dataset.ls; save(); $$('[data-ls]').forEach(x => x.className = 'choice' + (x === b ? (x.dataset.ls === L.id ? ' right' : ' wrong') : '')); lfb(); });
    lfb();
    $('#tourDone').onclick = () => {
      const miss = [];
      if (S.knownText.trim().length < 5) miss.push('寫下你認識的生物');
      if (S.newText.trim().length < 5) miss.push('寫下你好奇的生物');
      if (S.listenAns !== L.id) miss.push('答對聆聽題');
      if (miss.length) { $('#th').textContent = '還差：' + miss.join('、'); return; }
      $('#th').textContent = ''; complete(2);
      log(`生物之旅：觀察了 ${S.seen.length} 種生物；認識的生物：${O[S.knownId].n}；好奇的生物：${O[S.newId].n}`);
      $('#after2').innerHTML = `<div class="stack"><div class="fb ok">生物之旅完成！你觀察了 ${S.seen.length} 種海洋生物。牠們長得都不一樣，但都需要一些東西才能活下去。下一站，我們來找出那是什麼。</div>${nextBtn()}</div>`; bindNext(2);
    };
    if (S.badges.includes(2)) { $('#after2').innerHTML = nextBtn(); bindNext(2); }
  };
  paintGal(); paintDet(); paintShare();
  if (!S.vocab.includes('生物')) addVocab('生物', '生物是指有生命的物體，例如植物、動物、藻類和細菌。有些生物很小，要用顯微鏡才看得到，例如微小的藻類和細菌。');
}

/* ===== 3 生物需要什麼？ ===== */
function needChart() {
  const aList = NEEDS.filter(x => x.a !== 'n' && (S.chartDone ? x.a === 'y' : (x.k === 'oxy' ? S.oxyDone : S.aNeeds.includes(x.k))));
  const pList = NEEDS.filter(x => x.p !== 'n' && (S.chartDone ? x.p === 'y' : S.pNeeds.includes(x.k)));
  const label = x => x.k === 'food' && S.eatDone ? '食物（其他生物：動物、類植物生物）' : x.t;
  const ul = L => L.map(x => `<li>${label(x)}</li>`).join('') || '<li class="muted" style="list-style:none">（還沒寫）</li>';
  return `<div class="need-chart"><h4>生物需求</h4><div class="need-cols"><div><h5>動物</h5><ul>${ul(aList)}</ul></div><div><h5>類植物生物</h5><ul>${ul(pList)}</ul></div></div></div>`;
}
function needPicker(col, picked, onCheck) {
  return `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${NEEDS.map(x => `<button class="choice ${picked.includes(x.k) ? 'on' : ''}" data-nd="${x.k}" style="text-align:left">${picked.includes(x.k) ? '✓ ' : ''}${x.t}</button>`).join('')}</div>`;
}
function stNeeds(el) {
  const steps = ['動物的需求', '動物的食物', '動物需要氧氣', '類植物生物', '類植物生物的食物', '完成圖表'];
  const can = [true, S.aNeedsDone, S.eatDone, S.oxyDone, S.pNeedsDone, S.pFood === 'make'];
  if (!can[S.step - 1]) S.step = 1;
  el.innerHTML = `${head('生物需要什麼？', 'p.116–122 討論生物的生存需求 1–10')}
  <div class="stack">
  ${guide('在這一站的最後，我們要回答：<b>海洋生物必須靠什麼生存？</b>我們會一起完成右邊的《生物需求》圖表，先從動物開始討論。')}
  <div class="steps">${steps.map((t, i) => `<button class="tab ${S.step === i + 1 ? 'on' : ''}" data-sp="${i + 1}" ${can[i] ? '' : 'disabled'}>${i + 1}　${t}</button>`).join('')}</div>
  <div class="split"><div class="stack" id="sp" style="min-width:0"></div><div id="chart">${needChart()}</div></div>
  <div id="after3"></div></div>`;
  $$('[data-sp]').forEach(b => b.onclick = () => { S.step = +b.dataset.sp; save(); render(); });
  const refresh = () => { $('#chart').innerHTML = needChart(); };
  const toStep = n => { S.step = n; save(); render(); };
  const sp = $('#sp');
  [s1, s2, s3, s4, s5, s6][S.step - 1]();

  function s1() {
    sp.innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">海洋動物為了生存的需求是什麼？</p>
      <p class="muted">選出所有你覺得海洋動物需要的東西。</p>${needPicker('a', S.aNeeds)}
      <div class="row"><button class="btn sec" id="ck">寫進圖表</button></div><div id="fb"></div></div>`;
    $$('[data-nd]').forEach(b => b.onclick = () => { const k = b.dataset.nd; S.aNeeds = S.aNeeds.includes(k) ? S.aNeeds.filter(x => x !== k) : [...S.aNeeds, k]; save(); s1(); });
    $('#ck').onclick = () => {
      const miss = ['food', 'water'].filter(k => !S.aNeeds.includes(k)), wrong = S.aNeeds.filter(k => N[k].a === 'n');
      if (miss.length) { $('#fb').innerHTML = `<div class="fb no">想一想：你每天一定要吃和喝什麼？海洋動物也一樣喔。</div>`; return; }
      let msg = '';
      if (wrong.includes('sun')) msg += '動物不能直接用陽光製造食物喔。';
      if (wrong.includes('co2')) msg += '二氧化碳是類植物生物製造食物用的，動物呼吸時反而會把它排出來。';
      if (wrong.includes('nutri')) msg += '動物從食物中得到養分，所以這一項我們先寫在「食物」裡。';
      S.aNeeds = S.aNeeds.filter(k => N[k].a !== 'n'); S.aNeedsDone = true; save(); refresh();
      $('#fb').innerHTML = `${msg ? `<div class="fb info">${msg}</div>` : ''}<div class="fb ok">寫進圖表了！<b>食物</b>和<b>水</b>是動物最基本的需求。</div><div class="row"><button class="btn" id="go2">下一步：動物的食物 →</button></div>`;
      $('#go2').onclick = () => toStep(2);
    };
    if (S.aNeedsDone) { $('#fb').innerHTML = `<div class="row"><button class="btn" id="go2">下一步：動物的食物 →</button></div>`; $('#go2').onclick = () => toStep(2); }
  }
  function s2() {
    const cand = ['urchin', 'turtle', 'clownfish', 'shark', 'orca', 'seal'];
    sp.innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">你認為所有海洋動物都會吃其他動物嗎？</p>
      <div class="row"><button class="choice ${S.allEat === 'yes' ? 'wrong' : ''}" data-ae="yes">會，全部都吃動物</button><button class="choice ${S.allEat === 'no' ? 'right' : ''}" data-ae="no">不會</button></div><div id="fb1"></div></div>
      <div class="panel stack" style="gap:10px" id="who" ${S.allEat === 'no' ? '' : 'hidden'}><p class="q">哪些動物會吃海藻或其他藻類？（可以複選）</p>
      <p class="muted" style="font-size:15px">忘記了？可以回生物之旅看看圖卡上「吃什麼」。</p>
      <div class="gallery">${cand.map(k => `<button class="org ${S.eaters.includes(k) ? 'seen' : ''}" data-et="${k}">${S.eaters.includes(k) ? '<span class="tag k">✓</span>' : ''}${art(k, O[k].n)}<span>${O[k].n}</span></button>`).join('')}</div>
      <div class="row"><button class="btn sec" id="ck2">檢查</button></div><div id="fb2"></div></div>`;
    $$('[data-ae]').forEach(b => b.onclick = () => { S.allEat = b.dataset.ae; save(); s2(); });
    if (S.allEat === 'yes') $('#fb1').innerHTML = `<div class="fb no">真的嗎？回想一下生物之旅：海膽啃食的是什麼？</div>`;
    if (S.allEat === 'no') $('#fb1').innerHTML = `<div class="fb ok">沒錯！有些海洋動物會吃海藻或其他藻類。</div>`;
    $$('[data-et]').forEach(b => b.onclick = () => { const k = b.dataset.et; S.eaters = S.eaters.includes(k) ? S.eaters.filter(x => x !== k) : [...S.eaters, k]; save(); s2(); });
    const ck = $('#ck2'); if (ck) ck.onclick = () => {
      const right = cand.filter(k => O[k].plantEater), ok = right.every(k => S.eaters.includes(k)) && S.eaters.every(k => right.includes(k));
      if (!ok) { $('#fb2').innerHTML = `<div class="fb no">還不太對。${S.eaters.some(k => !O[k].plantEater) ? '有一些動物其實是吃其他動物的。' : '還有動物會吃藻類，再找找看。'}</div>`; return; }
      S.eatDone = true; save(); refresh(); log('動物的食物：有些動物吃其他動物，有些吃類植物生物（海膽、海龜、小丑魚）');
      $('#fb2').innerHTML = `<div class="fb ok">答對了！海膽、海龜和小丑魚都會吃藻類。所以圖表上的「食物」要寫成：<b>其他生物（動物、類植物生物）</b>。</div><div class="row"><button class="btn" id="go3">下一步：動物需要氧氣 →</button></div>`;
      $('#go3').onclick = () => toStep(3);
    };
    if (S.eatDone) { $('#fb2').innerHTML = `<div class="fb ok">「食物」已經寫成：其他生物（動物、類植物生物）。</div><div class="row"><button class="btn" id="go3">下一步：動物需要氧氣 →</button></div>`; $('#go3').onclick = () => toStep(3); }
  }
  function s3() {
    const air = ['dolphin', 'humpback', 'seal', 'orca', 'penguin', 'turtle'], water = ['shark', 'clownfish', 'puffer', 'seahorse', 'squid', 'crab'];
    const items = S.sortOrder && S.sortOrder.length === 12 ? S.sortOrder : (S.sortOrder = shuffle([...air, ...water]));
    sp.innerHTML = `<div class="panel stack" style="gap:12px;align-items:flex-start">
      <p class="q">跟著做：深深吸一口氣，再吐出來。</p>
      <div class="row" style="gap:18px"><div class="breath" id="br">準備</div><button class="btn sec" id="bb">開始呼吸</button></div>
      <div id="bq"></div></div><div id="ox"></div>`;
    $('#bb').onclick = () => {
      const br = $('#br'); $('#bb').disabled = true; let n = 0;
      const cyc = () => { if (n >= 2) { br.textContent = '完成'; $('#bb').disabled = false; q1(); return; } br.classList.add('in'); br.textContent = '吸氣'; setTimeout(() => { br.classList.remove('in'); br.textContent = '吐氣'; setTimeout(() => { n++; cyc(); }, reduceMotion() ? 400 : 3000); }, reduceMotion() ? 400 : 3000); };
      cyc();
    };
    const q1 = () => {
      $('#bq').innerHTML = `<p class="q">我們剛剛在做什麼？為什麼要這樣做？</p>
        <div class="row">${[['eat', '吃東西'], ['breath', '呼吸，為了得到氧氣'], ['drink', '喝水']].map(([k, t]) => `<button class="choice ${S.breathQ1 === k ? (k === 'breath' ? 'right' : 'wrong') : ''}" data-b1="${k}">${t}</button>`).join('')}</div><div id="b1fb"></div>`;
      $$('[data-b1]').forEach(b => b.onclick = () => { S.breathQ1 = b.dataset.b1; save(); q1(); });
      if (S.breathQ1 === 'breath') { $('#b1fb').innerHTML = `<div class="fb ok">對！我們呼吸是為了得到<b>氧氣</b>。所有動物都需要氧氣，才能從吃下的食物中獲得能量。有些海洋動物和我們一樣，從空氣中吸氧氣；其他的則從<b>水中</b>獲取氧氣。</div>`; gill(); }
      else if (S.breathQ1) $('#b1fb').innerHTML = `<div class="fb no">再想想：剛剛我們的嘴巴和鼻子吸進了什麼？</div>`;
    };
    const gill = () => {
      $('#ox').innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">魚怎麼從水中得到氧氣？</p>
        <svg viewBox="0 0 320 150" style="width:100%;max-width:460px" role="img" aria-label="海水從魚嘴流進來，經過魚鰓後從鰓蓋流出去">
          <path d="M40 75 Q80 30 170 34 Q230 38 256 70 L300 40 L292 75 L300 110 L256 82 Q228 114 170 116 Q80 120 40 75Z" fill="#a9c7d8" stroke="var(--ink)" stroke-width="2"/>
          <path d="M120 46 Q132 75 120 106" fill="none" stroke="var(--ink)" stroke-width="2"/>
          ${[54, 64, 74, 84, 94].map(y => `<path d="M104 ${y} q8 4 0 8" fill="none" stroke="#c0392b" stroke-width="3"/>`).join('')}
          <circle cx="74" cy="64" r="6" fill="#fff" stroke="var(--ink)"/><circle cx="74" cy="64" r="3" fill="var(--ink)"/>
          <path class="flow" d="M2 80 L52 80 Q86 82 104 76" stroke="var(--sea)" stroke-width="4" fill="none" marker-end="url(#ah)"/>
          <path class="flow" d="M124 92 Q140 120 176 136" stroke="var(--sea)" stroke-width="4" fill="none" marker-end="url(#ah)"/>
          <defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--sea)"/></marker></defs>
          <text x="6" y="70" font-size="13" fill="var(--ink)">海水從嘴巴流進來</text><text x="96" y="40" font-size="13" fill="#c0392b">鰓</text><text x="180" y="140" font-size="13" fill="var(--ink)">再從鰓蓋流出去</text>
        </svg>
        <p>海水裡也有氧氣。海水從魚的嘴巴進來，流過<b>鰓</b>時，鰓會把水中的氧氣吸進身體，再從鰓蓋流出去。</p></div>
        <div class="panel stack" style="gap:10px"><p class="q">這些動物從哪裡獲取氧氣？</p>
        <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${items.map(k => { const v = S.airSort[k], a = air.includes(k) ? 'air' : 'water'; return `<div class="mini ${v ? (v === a ? 'right' : 'wrong') : ''}" data-as="${k}">${art(k, O[k].n)}<b style="flex:1">${O[k].n}</b><button class="chip ${v === 'air' ? 'on' : ''}" data-v="air">空氣</button><button class="chip ${v === 'water' ? 'on' : ''}" data-v="water">水中</button></div>`; }).join('')}</div><div id="oxfb"></div></div>`;
      $$('[data-as]').forEach(c => $$('[data-v]', c).forEach(b => b.onclick = () => { S.airSort[c.dataset.as] = b.dataset.v; save(); gill(); }));
      const done = items.every(k => S.airSort[k] === (air.includes(k) ? 'air' : 'water'));
      const wrongN = items.filter(k => S.airSort[k] && S.airSort[k] !== (air.includes(k) ? 'air' : 'water')).length;
      if (done) {
        if (!S.oxyDone) { S.oxyDone = true; save(); log('動物需要氧氣：海豚、鯨、海豹、企鵝、海龜從空氣；魚、魷魚、螃蟹從水中'); }
        refresh();
        $('#oxfb').innerHTML = `<div class="fb ok">全部分對了！海豚、鯨、海豹、企鵝和海龜要浮出水面呼吸空氣；魚、鯊魚、魷魚和螃蟹用鰓從水中獲取氧氣。大多數海洋動物都是從水中取得氧氣的。<b>氧氣</b>已經寫進圖表。</div><div class="row"><button class="btn" id="go4">下一步：類植物生物 →</button></div>`;
        $('#go4').onclick = () => toStep(4);
      } else if (wrongN) $('#oxfb').innerHTML = `<div class="fb no">有 ${wrongN} 個放錯了。提示：用肺呼吸的動物，必須浮出水面換氣。</div>`;
    };
    if (S.breathQ1) q1();
  }
  function s4() {
    sp.innerHTML = `<div class="panel stack" style="gap:10px">
      <p class="q">海洋裡的「類植物生物」</p>
      <div class="detail">${art('kelp', '海藻')}<p>海洋中有很多看起來很像植物的生物，但它們其實不是植物，叫做<b>類植物生物</b>。它們可以<b>自己製造食物</b>。其中一部分是<b>藻類</b>，另一部分是<b>細菌</b>。比較大的藻類叫做<b>海藻</b>，有些海藻可以長到像樹一樣高！</p></div>
      <div class="detail">${art('plankton', '浮游藻類')}<p>有些藻類小到只能用顯微鏡才看得到。真正的植物也會長在海中，例如海草，但數量並不多。</p></div></div>
      <div class="panel stack" style="gap:10px"><p class="q">類植物生物為了生存，需要什麼？</p><p class="muted">選出所有你覺得類植物生物需要的東西。</p>${needPicker('p', S.pNeeds)}
      <div class="row"><button class="btn sec" id="ck4">寫進圖表</button></div><div id="fb4"></div></div>`;
    if (!S.vocab.includes('類植物生物')) addVocab('類植物生物', '看起來像植物、可以自己製造食物，但不是植物的生物，例如海藻和其他藻類，還有一些細菌。');
    $$('[data-nd]').forEach(b => b.onclick = () => { const k = b.dataset.nd; S.pNeeds = S.pNeeds.includes(k) ? S.pNeeds.filter(x => x !== k) : [...S.pNeeds, k]; save(); s4(); });
    $('#ck4').onclick = () => {
      if (S.pNeeds.includes('food')) { $('#fb4').innerHTML = `<div class="fb no">類植物生物不吃其他生物喔！它們可以自己製造食物。把「食物」拿掉再試一次。</div>`; return; }
      const miss = ['sun', 'water'].filter(k => !S.pNeeds.includes(k));
      if (miss.length) { $('#fb4').innerHTML = `<div class="fb no">還少了很重要的東西。想想看：陸地上的植物要放在哪裡、還要澆什麼？</div>`; return; }
      S.pNeedsDone = true; save(); refresh();
      const notes = [];
      if (S.pNeeds.includes('oxy')) notes.push('藻類其實也會用到氧氣，不過這一節我們先記住：它們製造食物需要二氧化碳。');
      if (!S.pNeeds.includes('co2') || !S.pNeeds.includes('nutri')) notes.push('還有一兩項，下一步會一起補上。');
      $('#fb4').innerHTML = `<div class="fb ok">寫進圖表了！</div>${notes.length ? `<div class="fb info">${notes.join('')}</div>` : ''}<div class="row"><button class="btn" id="go5">下一步：類植物生物的食物 →</button></div>`;
      $('#go5').onclick = () => toStep(5);
    };
    if (S.pNeedsDone) { $('#fb4').innerHTML = `<div class="row"><button class="btn" id="go5">下一步：類植物生物的食物 →</button></div>`; $('#go5').onclick = () => toStep(5); }
  }
  function s5() {
    const OPT = [['eat', '吃其他小生物'], ['make', '用陽光的能量，把水和二氧化碳變成食物'], ['soil', '從海底的泥土吸收現成的食物']];
    sp.innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">類植物生物怎麼得到食物？</p>
      <div class="stack" style="gap:8px">${OPT.map(([k, t]) => `<button class="choice ${S.pFood === k ? (k === 'make' ? 'right' : 'wrong') : ''}" data-pf="${k}" style="text-align:left">${t}</button>`).join('')}</div><div id="fb5"></div></div>`;
    $$('[data-pf]').forEach(b => b.onclick = () => { S.pFood = b.dataset.pf; save(); s5(); });
    if (S.pFood === 'make') {
      ['sun', 'co2', 'nutri'].forEach(k => { if (!S.pNeeds.includes(k)) S.pNeeds.push(k); }); save(); refresh(); log('類植物生物用陽光的能量，把水和二氧化碳變成食物');
      $('#fb5').innerHTML = `<div class="fb ok">沒錯！類植物生物用<b>陽光</b>的能量，把<b>水</b>和<b>二氧化碳</b>變成食物。二氧化碳是一種在空氣中、同時也混在海水中的氣體。<br>它們也需要<b>營養素</b>（維生素和礦物質）幫助成長；礦物質是岩石和土壤微小的一部分，會從河流、海灘和海底火山進入海洋。這些都已經補進圖表了。</div><div class="row"><button class="btn" id="go6">下一步：完成圖表 →</button></div>`;
      $('#go6').onclick = () => toStep(6);
    } else if (S.pFood) $('#fb5').innerHTML = `<div class="fb no">${S.pFood === 'eat' ? '那是動物的方法喔。' : '海底沒有現成的食物可以吸。'}想想陸地上的植物，需要曬什麼？</div>`;
  }
  function s6() {
    const missA = NEEDS.filter(x => x.a === 'y' && !S.aNeeds.includes(x.k) && !(x.k === 'oxy' && S.oxyDone));
    sp.innerHTML = `<div class="panel stack" style="gap:10px"><p class="q">完成《生物需求》圖表</p>
      <p>生物還有一些需求，平常比較少注意到：</p>
      <ul style="margin:0;padding-left:1.2em">
        <li><b>庇護所</b>：讓生物不會太熱或太冷，保護自己不被其他生物獵食，也能躲避強風和海浪。</li>
        <li><b>不被獵食</b>：被吃掉就無法生存了。</li>
        <li><b>適宜的溫度</b>和<b>適宜的壓力</b>：每種生物能適應的範圍都不一樣，所以不同地方住著不同的生物。</li></ul>
      ${missA.length ? `<div class="fb info">你一開始沒有選到：${missA.map(x => x.t).join('、')}。按下面的按鈕會補進圖表。</div>` : ''}
      <div class="row"><button class="btn" id="fin">補齊圖表，完成這一站</button></div><div id="fb6"></div></div>`;
    $('#fin').onclick = () => {
      S.chartDone = true; save(); refresh(); log('完成《生物需求》圖表');
      unlockConcept(0, () => unlockConcept(1, () => { complete(3); $('#fb6').innerHTML = `<div class="fb ok">圖表完成了！不管是動物還是類植物生物，<b>所有生物都有為了生存所必須滿足的需求</b>。</div>`; $('#after3').innerHTML = nextBtn(); bindNext(3); }));
    };
    if (S.chartDone && S.badges.includes(3)) { $('#fb6').innerHTML = `<div class="fb ok">圖表已經完成。</div>`; $('#after3').innerHTML = nextBtn(); bindNext(3); }
  }
}

/* ===== 4 回顧 ===== */
function stReview(el) {
  el.innerHTML = `${head('回顧', 'p.122–123 介紹關鍵概念、回顧課程的提示')}
  <div class="stack">
  ${guide('看看右邊的概念牆，今天我們貼上了兩個關鍵概念。接下來的課程，我們會繼續用它們來討論海洋生物住在哪裡、怎麼適應環境。')}
  <div class="panel stack" style="gap:10px"><p class="q">這一節觀察的生物中，哪一種最讓你感興趣？為什麼？</p>
    <div class="gallery">${ORGS.map(o => `<button class="org ${S.favId === o.id ? 'seen' : ''}" data-fv="${o.id}">${S.favId === o.id ? '<span class="tag n">最愛</span>' : ''}${art(o.id, o.n)}<span>${o.n}</span></button>`).join('')}</div>
    <textarea id="fw" style="min-height:90px" placeholder="我最感興趣的是……，因為……">${esc(S.favWhy)}</textarea></div>
  <div class="panel stack" style="gap:10px"><p class="q">你希望在這個單元學到哪些海洋知識？</p>
    <p class="muted" style="font-size:15px">盡可能具體，例如想知道哪一種動物、哪一個地方的海洋。</p>
    <textarea id="hp" style="min-height:90px" placeholder="我想知道……">${esc(S.hope)}</textarea></div>
  <div class="panel stack" style="gap:8px"><b>我的第一個想法</b><div class="fb info" style="white-space:pre-wrap">${esc(S.idea || '（還沒寫）')}</div><p class="muted" style="font-size:14px">學到更多之後，你可以在第 2.4、2.6、2.8、2.10 節補充註解，第 2.11 節會寫下修正的想法。</p></div>
  <div class="row"><button class="btn" id="finish">完成第 2.1 節</button><span class="muted" id="fh"></span></div><div id="end"></div></div>`;
  $$('[data-fv]').forEach(b => b.onclick = () => { S.favId = b.dataset.fv; save(); $$('[data-fv]').forEach(x => { x.classList.toggle('seen', x === b); const t = $('.tag', x); if (t) t.remove(); }); b.insertAdjacentHTML('afterbegin', '<span class="tag n">最愛</span>'); });
  $('#fw').oninput = e => { S.favWhy = e.target.value; save(); };
  $('#hp').oninput = e => { S.hope = e.target.value; save(); };
  $('#finish').onclick = () => {
    if (!S.favId || S.favWhy.trim().length < 4) { $('#fh').textContent = '先選一種生物，並寫下為什麼。'; return; }
    $('#fh').textContent = ''; S.doneAll = true; complete(4); log(`最感興趣的生物：${O[S.favId].n}`); endScreen();
  };
  if (S.doneAll) endScreen();
  function endScreen() {
    $('#end').innerHTML = `<div class="panel stack" style="gap:12px;border-color:var(--ok)">
      <h3 class="q" style="color:var(--ok)">恭喜 ${esc(S.name)}，完成第 2.1 節「介紹海洋生物」！</h3>
      <p>你觀察了 ${S.seen.length} 種海洋生物，完成了《生物需求》圖表，並在概念牆貼上 ${S.concepts.filter(Boolean).length} 個關鍵概念。下一節「比較棲息地」，我們會調查生物住在海洋的哪些地方。</p>
      ${NB.endButtons()}</div>`;
    $('#nb2').onclick = openNotebook; $('#copyNb').onclick = copyNotebook;
  }
}

/* ---------- 筆記本 ---------- */
function notebookText() {
  const n = id => O[id] ? O[id].n : '—';
  return [`【介紹海洋生物 調查筆記本】調查員：${S.name}`,
    `一、暖身想到的海洋生物（${S.brain.length} 種）：${S.brain.join('、') || '—'}`,
    `二、第一個想法：${S.idea || '—'}`,
    `三、生物之旅：觀察 ${S.seen.length} 種；認識的生物：${n(S.knownId)}——${S.knownText || '—'}`,
    `四、好奇的生物：${n(S.newId)}——${S.newText || '—'}`,
    `五、生物需求（動物）：${NEEDS.filter(x => S.chartDone ? x.a === 'y' : S.aNeeds.includes(x.k)).map(x => x.t).join('、') || '—'}`,
    `六、生物需求（類植物生物）：${NEEDS.filter(x => S.chartDone ? x.p === 'y' : S.pNeeds.includes(x.k)).map(x => x.t).join('、') || '—'}`,
    `七、最感興趣的生物：${n(S.favId)}——${S.favWhy || '—'}`,
    `八、希望學到：${S.hope || '—'}`,
    `概念牆：${CONCEPTS.filter((_, i) => S.concepts[i]).join(' ') || '—'}`].join('\n');
}
function copyNotebook() { NB.copy(notebookText(), $('#cpm')); }
function openNotebook() {
  const { sec, text, card } = NB;
  const org = (id, label, body) => O[id] ? `<div class="nb-org">${art(id, O[id].n)}<div style="min-width:0"><span class="nb-lab">${label}</span><b>${O[id].n}</b>${body}</div></div>` : '';
  const html = `
    ${sec('我的第一個想法', `${S.brain.length ? `<p class="nb-lab">暖身想到的海洋生物（${S.brain.length} 種）</p><div class="nb-chips">${S.brain.map(b => `<span>${esc(b)}</span>`).join('')}</div>` : ''}${S.idea ? card('不同地區的海洋生物有何不同？為什麼？', text(S.idea)) : ''}` , '完成第 1 站後會出現')}
    ${sec('生物之旅', S.seen.length ? `<p class="nb-text">觀察了 <b>${S.seen.length}</b> / 16 種海洋生物。</p><div class="nb-grid">${org(S.knownId, '我認識的生物', text(S.knownText, '還沒寫'))}${org(S.newId, '我好奇的生物', text(S.newText, '還沒寫'))}</div>` : '', '完成第 2 站後會出現')}
    ${sec('生物需求圖表', S.aNeedsDone || S.pNeedsDone ? needChart() : '', '完成第 3 站後會出現')}
    ${sec('最讓我感興趣的生物', S.favId ? org(S.favId, '最感興趣', text(S.favWhy, '還沒寫理由')) : '', '完成第 4 站後會出現')}
    ${sec('我希望學到的海洋知識', text(S.hope, '完成第 4 站後會出現'))}
    ${sec('我學到的關鍵概念', S.concepts.some(Boolean) ? `<div class="nb-concepts">${CONCEPTS.map((c, i) => S.concepts[i] ? `<div class="concept got">${esc(c)}</div>` : '').join('')}</div>` : '', '完成第 3 站後會出現')}`;
  NB.open(`介紹海洋生物｜${S.name || '調查員'}`, `<span>徽章 <b>${S.badges.filter(b => b > 0).length}</b>/4</span><span>關鍵概念 <b>${S.concepts.filter(Boolean).length}</b>/2</span>`, html, notebookText);
}

/* ---------- 啟動 ---------- */
function start() {
  $('#brandTitle').textContent = '介紹海洋生物'; $('#brandSub').textContent = '調查筆記本｜第 2.1 節';
  if (!S.name) S.name = getName();
  $('#nbBtn').onclick = openNotebook;
  $('#reset').onclick = () => {
    overlay(`<h3 class="q">要重新開始嗎？</h3><p><b>只清除這個單元</b>：這一節的筆記本內容、徽章和概念會清除，名字和其他單元保留。</p><p><b>換下一位同學</b>：清除這台電腦上所有單元的進度和名字。</p><div class="row"><button class="btn" id="yes">只清除這個單元</button><button class="btn sec" id="allYes">換下一位同學</button><button class="btn-plain" data-close>取消</button></div>`);
    $('#yes').onclick = () => { S = fresh(); save(); $('.ov').remove(); render(); };
    $('#allYes').onclick = () => { $('.ov').remove(); confirmClearAll(); };
  };
  if (S.stage > S.maxStage) S.stage = S.maxStage;
  render();
}

return { start, stop: () => {}, progress: () => ({ done: S.badges.filter(b => b > 0).length, total: STAGES.length - 1 }) };
})();
