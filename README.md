# 即時股價追蹤

這是一個可部署到 Render 的股價追蹤網頁。

## 功能

- 預設追蹤 13 檔股票與 ETF
- 可輸入股票代碼新增到清單
- 可輸入股票代碼從清單刪除
- 新增或刪除多檔時，用逗號 `,` 分隔，例如 `AAPL, MSFT, 2330`
- 刪除時會判斷清單內是否存在指定股票，並顯示 5 秒提示
- 股票代碼可點擊，會開啟 Google 財經指定代碼頁面
- 台股與美股資料來源皆為 Google 財經 Beta 主報價區塊
- 保留「立即更新」按鈕
- 已移除自動更新
- 已移除卡片內的開盤、昨收、最高、最低欄位
- 可依照目前清單順序匯出 Excel

## 預設清單

```text
00662
00646
0050
006208
00692
0056
00878
00850
00713
VT
VOO
VTI
BND
```

新增與刪除會存在目前瀏覽器的 localStorage。重新開同一個瀏覽器會保留；如果要讓某些股票變成所有人打開都固定看到，之後可以直接加進預設清單。

## Render 部署

1. 將整個專案上傳到 GitHub repository
2. 到 Render 建立 Web Service
3. Build Command 填入：

```bash
npm install
```

4. Start Command 填入：

```bash
npm start
```

5. Instance Type 可以選 Free

## 本機執行

需要 Node.js 18 或更新版本。

```bash
npm start
```

啟動後開啟：

```text
http://localhost:8787/
```
