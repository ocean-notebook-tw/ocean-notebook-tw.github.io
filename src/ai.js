/* ===== 海博士 AI：回饋區塊、問海博士對話框、與 API 溝通 ===== */
/* 設定在網站根目錄的 ai-config.js（window.AI_CONFIG），不需要重新建置就能修改。 */
const AI = (() => {
  const escA = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => escA(s).replace(/\n/g, '<br>');
  const AVATAR = `<svg viewBox="0 0 64 64" width="40" height="40" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="var(--sea)"/><path d="M6 40 Q16 34 24 40 T42 40 T58 40 L58 50 Q32 66 6 50Z" fill="var(--sea-soft)" opacity=".9"/><circle cx="32" cy="28" r="15" fill="#f6d7b8"/><path d="M17 26 Q32 6 47 26 Q40 18 32 18 Q24 18 17 26Z" fill="#33261c"/><rect x="19" y="23" width="26" height="11" rx="5.5" fill="#bfe6f7" stroke="#14324a" stroke-width="2"/><line x1="32" y1="23" x2="32" y2="34" stroke="#14324a" stroke-width="2"/><path d="M27 38 Q32 41 37 38" stroke="#7a3b2a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

  /* 給 AI 的角色說明，會一起送到 API（你們的後端可以直接使用，也可以忽略改用自己的） */
  const SYSTEM = [
    '你是「海博士」，是一位親切的海洋科學家，正在陪國小三到五年級的學生使用《海洋科學序列教材 G3–G5 初階海洋素養》學習。',
    '請用台灣常用的繁體中文、簡單的句子回答，每次 2 到 4 句，不要使用艱深的專有名詞；需要用到時，先用生活中的例子解釋。',
    'mode 為 feedback 時：先具體肯定學生說對或想得好的地方，再用一個問題引導他想得更多。不要打分數，不要直接給出完整的標準答案，不要說「錯」。依照 guide 裡的教師手冊說明與 expected（預期想法）引導。',
    'mode 為 question 或 chat 時：學生在發問，請直接用孩子聽得懂的方式回答，可以附一個生活中的例子，最後鼓勵他繼續觀察或找證據。',
    '只討論海洋與科學學習相關的話題；遇到無關或不適合兒童的內容，溫和地把話題帶回海洋。不要詢問或記錄學生的個人資料。',
    '多使用教材的論證句型，例如「你有什麼證據呢？」「你為什麼這麼想呢？」「我們如何確定？」'
  ].join('\n');

  const cfg = () => Object.assign({
    endpoint: '', method: 'POST', headers: { 'Content-Type': 'application/json' }, timeoutMs: 20000,
    buildBody: r => r,
    readReply: d => typeof d === 'string' ? d : (d && (d.reply || d.answer || d.text || d.message || d.content || (d.choices && d.choices[0] && (d.choices[0].message ? d.choices[0].message.content : d.choices[0].text)))) || ''
  }, window.AI_CONFIG || {});
  const online = () => !!cfg().endpoint;

  /* ---------- 離線時：依教材問答資料給提示 ---------- */
  function local(qa, req) {
    const ans = String(req.student_answer || '') + ' ' + String(req.question_from_student || '');
    if (!qa) return '海博士現在沒辦法連線。先看看右邊的概念牆，或把你的問題記在筆記本裡，之後的課程會一起找答案！';
    if (req.mode !== 'feedback') {
      const hit = (qa.faq || []).find(f => f.words.some(w => ans.includes(w)));
      return hit ? hit.a : (qa.fallback || '這是一個很棒的問題！先把它記在筆記本裡，接下來的課程會一起調查。');
    }
    const kws = qa.keywords || [];
    const hits = kws.filter(k => k.words.some(w => ans.includes(w)));
    if (qa.fallbackHit && hits.length) return qa.fallbackHit;
    if (qa.fallbackMiss && !hits.length) return qa.fallbackMiss;
    const miss = kws.filter(k => !hits.includes(k) && k.hint);
    const parts = [];
    parts.push(hits.length ? `你提到了「${hits.map(k => k.name).join('」「')}」，想得很仔細！` : '謝謝你寫下自己的想法！');
    if (miss.length) parts.push('再想一想：' + miss[Math.floor(Math.random() * miss.length)].hint);
    else if (qa.follow) parts.push(qa.follow);
    return parts.join('');
  }

  /* ---------- 呼叫 API ---------- */
  async function ask(req, qa, fb) {
    const off = () => (fb && fb(req)) || local(qa, req);
    const c = cfg();
    if (!c.endpoint) return { text: off(), offline: true };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), c.timeoutMs);
    try {
      const res = await fetch(c.endpoint, { method: c.method, headers: c.headers, body: JSON.stringify(c.buildBody(req)), signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const type = res.headers.get('content-type') || '';
      const data = type.includes('json') ? await res.json() : await res.text();
      const text = String(c.readReply(data) || '').trim();
      if (!text) throw new Error('empty reply');
      return { text, offline: false };
    } catch (e) {
      console.warn('[海博士 AI] 連線失敗，改用離線提示：', e);
      return { text: off(), offline: true, failed: true };
    } finally { clearTimeout(t); }
  }
  function request(o, qa, answer, history) {
    return {
      mode: o.mode || (qa && qa.mode) || 'feedback',
      unit: (qa && qa.unit) || o.unit || '', stage: (qa && qa.stage) || o.stage || '', slot: o.id || '',
      question: (qa && qa.question) || o.question || '',
      student_answer: answer,
      student_data: o.extra ? o.extra() : {},
      history: history.map(m => ({ role: m.r === 's' ? 'user' : 'assistant', content: m.t })),
      guide: qa ? { manual: qa.manual, expected: qa.expected || [], concepts: qa.concepts || [], notes: qa.notes || '' } : {},
      grade: 'G3-G5', language: 'zh-TW',
      instructions: SYSTEM
    };
  }

  /* ---------- 回饋區塊 ---------- */
  function slot(host, o) {
    const qa = (window.QA || {})[o.qaId || o.id];
    const store = o.store; const rec = store[o.id] || (store[o.id] = { thread: [] });
    const box = document.createElement('div'); box.className = 'ai-box'; host.appendChild(box);
    let busy = false;
    const paint = () => {
      box.innerHTML = `<div class="ai-head">${AVATAR}<b>海博士的回饋</b><span class="ai-tag">${online() ? 'AI' : '提示'}</span></div>
        ${o.ask ? `<label class="q ai-q" for="${o.id}-in">${escA(o.label || (qa && qa.question) || '')}</label>
          <textarea id="${o.id}-in" class="ai-in" style="min-height:90px" placeholder="${escA(o.placeholder || '我覺得……，因為……')}">${escA(rec.answer || '')}</textarea>` : ''}
        <div class="ai-thread">${rec.thread.map(m => `<div class="msg ${m.r}">${m.r === 'd' ? AVATAR : ''}<div class="bub">${fmt(m.t)}</div></div>`).join('')}${busy ? `<div class="msg d">${AVATAR}<div class="bub"><span class="dots"><i></i><i></i><i></i></span></div></div>` : ''}</div>
        ${rec.thread.length ? `<div class="row ai-more"><input type="text" id="${o.id}-more" placeholder="我還想問海博士……" maxlength="200"><button class="btn sec" data-more ${busy ? 'disabled' : ''}>送出</button></div>`
          : `<div class="row"><button class="btn sec" data-go ${busy ? 'disabled' : ''}>${escA(o.button || '請海博士看看我的想法')}</button><span class="muted ai-msg" style="font-size:14px"></span></div>`}
        <p class="ai-note">海博士會給你建議和問題，不會打分數。</p>`;
      const ta = $('.ai-in', box); if (ta) ta.oninput = () => { rec.answer = ta.value; o.onSave && o.onSave(); };
      const go = $('[data-go]', box); if (go) go.onclick = () => {
        const a = (o.ask ? (ta.value || '') : (o.getAnswer ? o.getAnswer() : '')).trim();
        if (a.length < (o.minLen || 4)) { $('.ai-msg', box).textContent = o.ask ? '先寫下你的想法，再請海博士看看。' : '先在上面寫下你的想法喔。'; return; }
        send(a, a);
      };
      const more = $('[data-more]', box); if (more) {
        const inp = $(`#${o.id}-more`, box);
        more.onclick = () => { const v = inp.value.trim(); if (v) send(v, rec.answer || (o.getAnswer ? o.getAnswer() : '')); };
        inp.onkeydown = e => { if (e.key === 'Enter') more.click(); };
      }
    };
    async function send(text, answer) {
      if (busy) return; busy = true;
      const history = rec.thread.slice();
      rec.thread.push({ r: 's', t: text }); if (!rec.answer || !o.ask) rec.answer = answer; paint();
      const req = request(o, qa, answer, history); if (history.length) { req.mode = 'chat'; req.question_from_student = text; }
      const r = await ask(req, qa, req.mode === 'chat' ? null : o.fallback);
      busy = false; rec.thread.push({ r: 'd', t: r.text }); o.onSave && o.onSave(); paint();
      o.onReply && o.onReply(r);
    }
    paint();
    if (o.auto && !rec.thread.length) { const a = (o.getAnswer ? o.getAnswer() : '').trim(); if (a.length >= (o.minLen || 4)) send(a, a); }
    return { reset: () => { rec.thread = []; rec.answer = ''; o.onSave && o.onSave(); paint(); } };
  }

  /* ---------- 全站「問海博士」對話框 ---------- */
  let ctx = { unit: '', stage: '' }; const chat = [];
  function setContext(c) { ctx = c || { unit: '', stage: '' }; const p = $('#aiCtx'); if (p) p.textContent = ctx.unit ? `${ctx.unit}｜${ctx.stage}` : ''; }
  function mountChat() {
    if ($('#aiFab')) return;
    document.body.insertAdjacentHTML('beforeend', `<button class="ai-fab" id="aiFab" hidden aria-label="問海博士">${AVATAR}<span>問海博士</span></button>
      <section class="ai-panel" id="aiPanel" hidden aria-label="問海博士對話框">
        <div class="ai-ph">${AVATAR}<div style="min-width:0"><b>問海博士</b><div class="muted" id="aiCtx" style="font-size:12px"></div></div><button class="btn-plain" id="aiClose" aria-label="關閉">關閉</button></div>
        <div class="ai-thread" id="aiThread"></div>
        <div class="row ai-more" style="padding:10px 12px"><input type="text" id="aiInput" maxlength="200" placeholder="關於海洋，你想問什麼？"><button class="btn sec" id="aiSend">送出</button></div>
      </section>`);
    const paint = (busy) => {
      $('#aiThread').innerHTML = (chat.length ? '' : `<div class="msg d">${AVATAR}<div class="bub">嗨！我是海博士。關於這一站的內容，或任何海洋的問題，都可以問我。</div></div>`)
        + chat.map(m => `<div class="msg ${m.r}">${m.r === 'd' ? AVATAR : ''}<div class="bub">${fmt(m.t)}</div></div>`).join('')
        + (busy ? `<div class="msg d">${AVATAR}<div class="bub"><span class="dots"><i></i><i></i><i></i></span></div></div>` : '');
      const th = $('#aiThread'); th.scrollTop = th.scrollHeight;
    };
    $('#aiFab').onclick = () => { $('#aiPanel').hidden = false; $('#aiFab').hidden = true; paint(); $('#aiInput').focus(); };
    $('#aiClose').onclick = () => { $('#aiPanel').hidden = true; $('#aiFab').hidden = false; };
    const send = async () => {
      const v = $('#aiInput').value.trim(); if (!v) return; $('#aiInput').value = '';
      const history = chat.slice(); chat.push({ r: 's', t: v }); paint(true);
      const qaAll = Object.values(window.QA || {}).filter(q => !ctx.unit || q.unit === ctx.unit);
      const qa = qaAll.find(q => q.mode === 'question') || qaAll[0];
      const req = { mode: 'chat', unit: ctx.unit, stage: ctx.stage, slot: 'chat', question: v, question_from_student: v, student_answer: '', student_data: {},
        history: history.map(m => ({ role: m.r === 's' ? 'user' : 'assistant', content: m.t })),
        guide: { notes: '學生從「問海博士」對話框發問。', concepts: [...new Set(qaAll.flatMap(q => q.concepts || []))] }, grade: 'G3-G5', language: 'zh-TW', instructions: SYSTEM };
      const r = await ask(req, qa && { ...qa, mode: 'question' });
      chat.push({ r: 'd', t: r.text }); paint();
    };
    $('#aiSend').onclick = send; $('#aiInput').onkeydown = e => { if (e.key === 'Enter') send(); };
  }
  function showChat(on) { mountChat(); $('#aiFab').hidden = !on || !$('#aiPanel').hidden; if (!on) $('#aiPanel').hidden = true; }

  return { slot, ask, online, setContext, showChat };
})();
