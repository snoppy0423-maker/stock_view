# 即時股價追蹤

這是一個可部署到 Render 的股價追蹤網頁。

## 功能

- 固定追蹤預設 13 檔股票與 ETF
- 可在網頁輸入新增股票，逗號 `,` 可一次新增多檔
- 新增股票會接在預設 13 檔後面
- 台股與美股資料來源皆為 Google 財經 Beta 主報價區塊
- 不支援港股
- 已移除 10 秒 / 20 秒自動更新
- 保留「立即更新」按鈕
- 股票卡片只顯示股票代碼，不顯示 1、2、3 編號
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

新增的股票會存在目前瀏覽器的 localStorage，重新開同一個瀏覽器會保留；如果要讓新股票變成所有人打開都固定看到，之後可以請我直接加進預設清單。

## 關於行情時間

這版固定讀取 Google 財經 Beta 版頁面，並只解析主報價區塊。後端快取已移除，避免網頁吃到舊的內嵌走勢資料或相關資產價格。

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
