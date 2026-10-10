const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NAME_KEY = 'oss-student-name';
function getName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
function clearAllProgress() {
  try { Object.keys(localStorage).filter(k => k.startsWith('ocean-') || k === NAME_KEY).forEach(k => localStorage.removeItem(k)); } catch (e) { }
  location.hash = 'home'; location.reload();
}
function confirmClearAll() {
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><h3 class="q">要換下一位同學嗎？</h3>
    <p>會清除<b>這台電腦上所有單元</b>的進度、徽章、筆記本內容，以及調查員的名字，讓下一位同學從頭開始。</p>
    <p class="muted" style="font-size:14px">還沒交給老師的話，請先打開「我的筆記本」，按「複製我的筆記本」。</p>
    <div class="row"><button class="btn" data-yes>清除全部，換下一位同學</button><button class="btn-plain" data-no>取消</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('[data-no]').onclick = () => ov.remove();
  ov.querySelector('[data-yes]').onclick = clearAllProgress;
  ov.querySelector('[data-no]').focus();
}
function setName(v) { try { localStorage.setItem(NAME_KEY, v); } catch (e) { } }
