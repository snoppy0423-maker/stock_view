# 即時股價追蹤

這是一個可部署到 Render 的股價追蹤網頁。

## 功能

- 台股與美股資料來源皆為 Google 財經
- 不支援港股
- 固定顯示 13 檔預設股票
- 可繼續新增其他台股或美股
- 新增股票會記在目前瀏覽器，也會嘗試同步到伺服器
- 可拖曳卡片調整順序
- 可用上下按鈕調整順序
- 可設定每 10 秒或每 20 秒自動更新
- 可依照目前排列順序匯出 Excel

## 固定顯示清單

固定清單會自動顯示在網頁上，不需要另外儲存：

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

固定清單不能刪除。後續新增的股票會接在固定清單後面。

## 關於資料時間

網頁每 10 秒或 20 秒重新向 Google 財經抓資料，但 Google 財經對不同股票、ETF、台股、美股提供的行情時間可能不同。有些標的會比較接近即時，有些會是短延遲或前一次成交時間，所以會看到有些已更新、有些看起來比較舊。

這不是自動更新按鈕失效，而是資料來源本身給出的最新時間不同。

## 關於新增股票記憶

這版修正了「伺服器固定清單覆蓋本機新增清單」的問題。現在載入時會合併：

```text
固定 13 檔 + 伺服器清單 + 目前瀏覽器記住的新增清單
```

所以即使 Render 沒有成功永久儲存，你在同一台電腦、同一個瀏覽器新增的股票也不會被固定清單洗掉。

如果你希望新增股票跨電腦、跨瀏覽器永久同步，需要在 Render 設定 GitHub 儲存。

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

## 可選：啟用後續新增股票的跨裝置永久儲存

到 Render 的 Environment 設定以下環境變數：

```text
GITHUB_TOKEN=你的 GitHub fine-grained token
WATCHLIST_GITHUB_REPO=snoppy0423-maker/stock_view
WATCHLIST_GITHUB_BRANCH=main
WATCHLIST_GITHUB_PATH=data/watchlist.json
```

`GITHUB_TOKEN` 需要有這個 repo 的 `Contents: Read and write` 權限。沒有設定也可以使用，只是後續自行新增的股票主要會記在目前瀏覽器；固定 13 檔不會消失。

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
