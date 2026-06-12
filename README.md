# 即時股價追蹤

這是一個可部署到 Render 或 Vercel 的股價追蹤網頁。

## 功能

- 支援台股，例如 `0056`、`2330`
- 支援美股，例如 `AAPL`、`VT`、`VOO`
- 台股與美股資料來源皆為 Google 財經
- 不支援港股
- 可拖曳卡片調整順序
- 可用上下按鈕調整順序
- 可設定每 30 秒或每 1 分鐘自動更新
- 可依照目前排列順序匯出 Excel
- 股票清單與排列順序會存到伺服器，其他電腦開同一個網址也會看到同一份清單

## Render 部署

這個專案需要後端 API 抓取 Google 財經資料，也需要後端保存共用清單，因此不能只用 GitHub Pages。

1. 將整個專案上傳到 GitHub repository
2. 到 Render 建立 Web Service
3. 選擇你的 GitHub repository
4. Build Command 填入：

```bash
npm install
```

5. Start Command 填入：

```bash
npm start
```

6. Instance Type 可以選 Free

部署完成後，Render 會提供一個可以直接開啟的網址。

## 共用清單說明

Render 版本會把股票清單存到伺服器的 `data/watchlist.json`。同一個 Render 網址下，其他電腦或手機打開後會看到同一份清單與排序。

注意：Render 免費方案的檔案系統在重新部署或服務重啟後可能會回到初始狀態。如果你之後需要永久資料庫，可以再接 Supabase、Firebase 或其他資料庫。

## 本機執行

需要 Node.js 18 或更新版本。

```bash
npm start
```

啟動後開啟：

```text
http://localhost:8787/
```

## 注意

- Google 財經行情可能是短延遲資料，不保證為交易所認證即時行情。
- 這個專案適合追蹤行情與匯出清單，不建議作為下單系統的唯一資料來源。
