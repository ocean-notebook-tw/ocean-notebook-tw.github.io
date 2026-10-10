
/* ===== 網站：單元選單與網址導覽 ===== */
const UNITS = { u11: UNIT11, u21: UNIT21 };
const CATALOG = [
  { t: '第一單元', n: '海洋是怎樣的地方', ls: [['1.1', '海洋星球', 'u11'], ['1.2', '模擬洋流'], ['1.3', '海水分層'], ['1.4', '認識洋流'], ['1.5', '海床'], ['1.6', '光、壓力、溫度和鹽度'], ['1.7', '水下滑翔機'], ['1.8', '生存空間']] },
  { t: '第二單元', n: '海洋生物面面觀', ls: [['2.1', '介紹海洋生物', 'u21'], ['2.2', '比較棲息地'], ['2.3', '利用證據保護棲息地'], ['2.4', '觀察浮游生物'], ['2.5', '運動的適應'], ['2.6', '攝食的適應'], ['2.7', '大洋食物網'], ['2.8', '河口食物網'], ['2.9', '小小旅行家'], ['2.10', '棲息地的關聯'], ['2.11', '調查海洋生物的工具']] },
  { t: '第三單元', n: '人類與海洋的相互關聯', ls: [['3.1', '人類與海洋的相互關聯'], ['3.2', '關聯的證據'], ['3.3', '調查過漁'], ['3.4', '調查污染'], ['3.5', '探索解決的方案'], ['3.6', '溝通問題與解決問題']] }
];
const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function showHome() {
  $('#brandTitle').textContent = '海洋科學調查筆記本'; $('#brandSub').textContent = '海洋科學序列教材 G3–G5 初階海洋素養';
  $('#home').hidden = false; $('#unitView').hidden = true; $('#homeBtn').hidden = true; $$('.unit-only').forEach(b => b.hidden = true); $$('.home-only').forEach(b => b.hidden = false);
  const nm = getName(); $('#who').textContent = nm ? `調查員：${nm}` : '';
  $('#home').innerHTML = `
    <div class="hero">
      <div class="stack" style="gap:10px"><span class="muted" style="font-size:14px;letter-spacing:.06em">國家海洋研究院｜海洋科學序列教材（OSS）G3–G5 初階海洋素養</span>
        <h2>海洋科學調查筆記本</h2>
        <p>跟著海博士，像海洋科學家一樣觀察、收集證據、用證據解釋海洋。每一節都對照教師手冊的教學流程設計，學生可以自己一站一站完成。</p></div>
    </div>
    <div class="units">${CATALOG.map(u => `<section class="ucol"><span class="sub">${u.t}</span><h3>${u.n}</h3>
      ${u.ls.map(([no, t, k]) => { if (!k) return `<div class="lesson"><span class="no">${no}</span><span>${t}</span><span class="soon">製作中</span></div>`;
        const p = UNITS[k].progress(); const done = p.done >= p.total;
        return `<button class="lesson open" data-u="${k}"><span class="no">${no}</span><span>${t}</span><span class="pg ${done ? 'done' : ''}">${done ? '完成' : p.done ? `${p.done}/${p.total} 站` : '開始'}</span></button>`; }).join('')}</section>`).join('')}</div>`;
  $$('[data-u]').forEach(b => b.onclick = () => { location.hash = b.dataset.u; });
}
let current = null;
function route() {
  const h = (location.hash || '').replace('#', '');
  $$('.ov').forEach(o => o.remove());
  if (current && current.stop) current.stop();
  if (UNITS[h]) {
    current = UNITS[h]; $('#home').hidden = true; $('#unitView').hidden = false; $('#homeBtn').hidden = false; $$('.unit-only').forEach(b => b.hidden = false); $$('.home-only').forEach(b => b.hidden = true);
    current.start(); AI.showChat(true);
  } else { current = null; AI.showChat(false); AI.setContext(null); showHome(); }
  window.scrollTo(0, 0);
}
$('#homeBtn').onclick = () => { location.hash = 'home'; };
$('#resetAll').onclick = confirmClearAll;
window.addEventListener('hashchange', route);
route();
