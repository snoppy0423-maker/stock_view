# Stock Tracker

台股與美股即時股價追蹤網頁。

## 功能

- 台股資料來源：玩股網
- 美股資料來源：Google 財經
- 支援美股 ETF，例如 `VT`、`VOO`
- 固定追蹤清單
- 拖曳或使用上下按鈕自訂排列順序
- 每 30 秒或每 1 分鐘自動更新
- 依目前排列順序匯出 Excel

## 部署成可用網址

這個專案需要後端 API 代抓資料，因此不適合只用 GitHub Pages。建議部署到 Vercel。

1. 把整個專案上傳到 GitHub。
2. 到 Vercel 建立新專案。
3. 選擇這個 GitHub repository。
4. Framework Preset 選 `Other`。
5. 直接 Deploy。

部署完成後，Vercel 會提供一個網址，打開即可使用。

## 本機執行

需要 Node.js 18 以上。

```bash
npm start
```

啟動後開啟：

```text
http://localhost:8787/
```

## 注意

- 港股目前不支援。
- 台股休市時會顯示玩股網提供的最近交易日資料。
- 美股時間依 Google 財經頁面顯示，部分 ETF 會使用 Google 財經摘要行情。
