# 海博士 AI：API 串接說明

給負責 AI 後端的同學。網站（GitHub Pages）會把學生的回答送到你們的 API，再把 API 的回覆顯示成「海博士」說的話。

## 1. 網站端只要改一個檔案

repo 根目錄的 `ai-config.js`：

```js
window.AI_CONFIG = {
  endpoint: 'https://你們的網址/ask',   // 填這裡就啟用 AI
  buildBody: (req) => req,             // 需要時把請求轉成你們的格式
  readReply: (data) => data.reply      // 從回應取出文字
};
```

- `endpoint` 留空：網站使用「提示模式」，依教師手冊整理的關鍵字給提示，不連 AI。
- API 連不上、超過 20 秒、回傳錯誤：網站自動改用提示模式，demo 不會卡住。
- 修改後直接上傳 `ai-config.js` 到 GitHub 即可，不用重新執行 `build.py`。
- **不要把 API 金鑰寫進 `ai-config.js`**，這個檔案所有人都看得到。金鑰放在後端。

## 2. 網站送出的請求

`POST endpoint`，`Content-Type: application/json`：

```json
{
  "mode": "feedback",
  "unit": "1.1 海洋星球",
  "stage": "第一個想法",
  "slot": "u11-idea",
  "question": "在不同地方，海洋有什麼不同？",
  "student_answer": "海面比較溫暖，深海很暗很冷",
  "student_data": {},
  "history": [
    { "role": "user", "content": "……" },
    { "role": "assistant", "content": "……" }
  ],
  "guide": {
    "manual": "教師手冊 p.8–9 寫下最初的想法、嵌入式評量",
    "expected": ["水溫", "光照", "壓力", "鹽度", "水的流動（洋流）", "海床形狀"],
    "concepts": [],
    "notes": "這是單元開始前的先備知識寫作，不評分……"
  },
  "grade": "G3-G5",
  "language": "zh-TW",
  "instructions": "你是「海博士」……（建議的角色設定，完整內容見 src/ai.js 的 SYSTEM）"
}
```

| 欄位 | 說明 |
|---|---|
| `mode` | `feedback`：對學生的回答給回饋（引導，不給標準答案、不打分）<br>`question`：學生提問，請直接回答<br>`chat`：追問或「問海博士」對話框 |
| `slot` | 題目代號，對應 `src/content/qa-*.json` 的 key；`chat` 表示從對話框發問 |
| `question` | 這一題的題目 |
| `student_answer` | 學生寫的答案（不含姓名） |
| `question_from_student` | 追問或對話框時，學生剛輸入的那句話 |
| `student_data` | 額外資料，例如拋接次數 `tosses`、海洋比例 `ocean_pct`、路線長度 `ocean_km`、第一個想法 `first_idea` |
| `history` | 這一題之前的對話，格式同 OpenAI / Claude 的 messages |
| `guide` | 教師手冊整理的依據：頁碼、預期想法、關鍵概念、給 AI 的說明 |
| `instructions` | 建議的系統提示詞；後端可直接當 system prompt，也可改用自己的 |

## 3. 你們的 API 要回傳

最簡單：

```json
{ "reply": "海博士要對學生說的話" }
```

欄位名稱也可以是 `answer`、`text`、`message`、`content`，或 OpenAI 格式的 `choices[0].message.content`，網站會自動找。其他格式請改 `ai-config.js` 的 `readReply`。

建議回覆 2～4 句、繁體中文、國小三到五年級聽得懂。

## 4. 必須開啟 CORS

API 要允許網站網域呼叫，否則瀏覽器會擋下來（網站會改用提示模式，看起來像 AI 沒反應）：

```
Access-Control-Allow-Origin: https://ocean-notebook-tw.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

並且要能回應瀏覽器先送的 `OPTIONS` 預檢請求（回 204 或 200）。

## 5. 測試方式

1. 在 `ai-config.js` 填好 `endpoint` 並上傳。
2. 打開網站，進「海洋星球」→「第一個想法」，寫完按「寫好了」，再按「請海博士看看我的想法」。
3. 回饋區塊右上角顯示 **AI** 表示已設定 endpoint；顯示 **提示** 表示沒有設定。
4. 如果有設定卻看到提示模式的回答，按 F12 打開「Console」，會看到 `[海博士 AI] 連線失敗` 和原因（常見：CORS、網址錯誤、回傳格式不同）。

## 6. 目前的 AI 回饋點（1.1 海洋星球）

| slot | 位置 | 類型 |
|---|---|---|
| `u11-idea` | 第一個想法，按「寫好了」後 | 回饋學生的想法 |
| `u11-guess` | 多少海洋？記下猜測後 | 回饋猜測的理由（不透露答案） |
| `u11-evwhy` | 證據或感覺分類，答錯後按「問海博士為什麼」 | 針對該句解釋（`student_data` 有 `sentence`、`student_choice`、`correct`） |
| `u11-evown` | 證據分類全對後的「換你出題」 | 學生自寫一句話，AI 判斷是證據還是感覺 |
| `u11-boundary` | 地球儀探索任務 1，答對「找不到界線」後 | 學生寫證據，AI 回饋 |
| `u11-longest` | 地球儀探索任務 2，答對「海洋較長」後 | 學生寫想法，AI 回饋 |
| `u11-model` | 討論模型完成後 | 學生寫見過的模型，AI 回饋 |
| `u11-important` | 拋接地球儀完成後 | 為什麼 71% 是重要概念 |
| `u11-planet` | 海洋星球？寫理由後 | 回饋理由，提出另一種看法 |
| `u11-revise` | 回顧第一個想法 | 比較前後想法 |
| `u11-question` | 我還想知道 | 學生提問，AI 回答 |
| `chat` | 每個單元右下角「問海博士」 | 自由提問 |

新增題目：在 `src/content/qa-<節次>.json` 加一筆資料，並在單元程式中呼叫 `aiHere(容器, { id: '題目代號', ... })`。
