/* =========================================================
   海博士 AI 設定
   只要修改這個檔案並上傳到 GitHub，網站就會使用新的設定，
   不需要重新執行 build.py。

   ⚠ 不要把 API 金鑰（key、token）寫在這裡！
     這個檔案任何人都看得到。金鑰請放在你們的後端伺服器，
     網站只把問題送到後端的網址。
   ========================================================= */
window.AI_CONFIG = {
  // 你們 AI API 的網址。留空 = 「提示模式」：不連 AI，改用教師手冊整理的提示回覆。
  endpoint: '',

  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  timeoutMs: 20000, // 超過 20 秒沒回應，就改用提示回覆

  // 把網站送出的資料（格式見 docs/AI-API.md）轉成你們 API 需要的格式。
  // 預設：整包原樣送出。
  // 例：你們的 API 只收 { "message": "..." } →
  //   buildBody: (req) => ({ message: req.instructions + '\n\n題目：' + req.question + '\n學生回答：' + req.student_answer }),
  buildBody: (req) => req,

  // 從你們 API 的回應取出海博士要說的話。
  // 預設會自動找 reply / answer / text / message / content 欄位。
  // 例：回應是 { "data": { "output": "..." } } →
  //   readReply: (data) => data.data.output,
  readReply: (data) => typeof data === 'string' ? data : (data.reply || data.answer || data.text || data.message || data.content || '')
};
