/* ===== 調查筆記本（學習成果單）共用元件 ===== */
const NB = (() => {
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const empty = hint => `<p class="nb-empty">${hint}</p>`;
  /* 一個區塊：標題、內容；沒有內容時顯示「完成哪一站後會出現」 */
  const sec = (title, body, hint) => `<section class="nb-sec"><h4>${title}</h4>${body || empty(hint || '還沒有內容')}</section>`;
  const text = (s, hint) => s && String(s).trim() ? `<p class="nb-text">${e(s)}</p>` : empty(hint);
  const card = (label, body, cls = '') => `<div class="nb-card ${cls}"><span class="nb-lab">${label}</span>${body}</div>`;
  const bars = rows => {
    const max = Math.max(1, ...rows.map(r => r.v));
    return `<div class="nb-bars">${rows.map(r => `<span class="nb-bl">${r.t}</span><span class="nb-bt"><i style="width:${Math.max(2, r.v / max * 100)}%;background:${r.c}"></i></span><b>${r.v.toLocaleString('zh-TW')} ${r.u}</b>`).join('')}</div>`;
  };
  /* 和海博士的討論：依題目列出最後一輪的問答，其餘收合 */
  const talks = store => {
    const list = Object.entries(store || {}).filter(([, r]) => r.thread && r.thread.length);
    if (!list.length) return '';
    return list.map(([k, r]) => {
      const qa = (window.QA || {})[k] || (window.QA || {})[k.replace(/-\d+$/, '')] || {};
      return `<details class="nb-talk"><summary><span>${e(qa.stage || '海博士')}</span><span class="muted">${r.thread.length / 2 | 0} 則回覆</span></summary>
        <div class="ai-thread">${r.thread.map(m => `<div class="msg ${m.r}"><div class="bub">${e(m.t).replace(/\n/g, '<br>')}</div></div>`).join('')}</div></details>`;
    }).join('');
  };
  function open(title, sub, html, getText) {
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = `<div class="dlg nb" role="dialog" aria-modal="true" aria-label="${e(title)}">
      <header class="nb-head"><div style="min-width:0"><span class="muted" style="font-size:13px;letter-spacing:.05em">調查筆記本</span><h3 class="q">${e(title)}</h3></div><div class="nb-sub">${sub}</div></header>
      <div class="nb-body">${html}</div>
      <footer class="nb-foot"><button class="btn" data-copy>複製我的筆記本</button><button class="btn-plain" data-close>關上筆記本</button>
        <span class="muted nb-tip">複製後，貼到 Google Classroom 或 LINE 交給老師。</span></footer></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    $$('[data-close]', ov).forEach(b => b.onclick = close);
    ov.addEventListener('click', ev => { if (ev.target === ov) close(); });
    $('[data-copy]', ov).onclick = () => copy(getText(), $('.nb-tip', ov));
    $('[data-copy]', ov).focus();
  }
  function copy(t, msgEl) {
    const fallback = () => {
      const ov = document.createElement('div'); ov.className = 'ov';
      ov.innerHTML = `<div class="dlg"><h3 class="q">複製我的筆記本</h3><p class="muted">請全選下面的文字後複製，再貼到 Google Classroom 或 LINE 交給老師。</p><textarea style="min-height:260px">${e(t)}</textarea><div class="row"><button class="btn" data-close>關閉</button></div></div>`;
      document.body.appendChild(ov); $('[data-close]', ov).onclick = () => ov.remove(); const a = $('textarea', ov); a.focus(); a.select();
    };
    try { navigator.clipboard.writeText(t).then(() => { if (msgEl) { msgEl.textContent = '已複製！現在可以貼到 Google Classroom 或 LINE 交給老師。'; msgEl.style.color = 'var(--ok)'; } }, fallback); } catch (err) { fallback(); }
  }
  /* 完成畫面上的按鈕列 */
  const endButtons = () => `<div class="row"><button class="btn sec" id="nb2">打開我的筆記本</button><button class="btn-plain" id="copyNb">複製我的筆記本</button></div>
    <p class="muted" id="cpm" style="font-size:14px">複製後，貼到 Google Classroom 或 LINE 交給老師。</p>`;
  return { sec, text, card, bars, talks, open, copy, endButtons, esc: e };
})();
