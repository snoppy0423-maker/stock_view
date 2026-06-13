# 即時股價追蹤

這是一個可部署到 Render 的股價追蹤網頁。

## 功能

- 台股與美股資料來源皆為 Google 財經
- 不支援港股
- 固定顯示 13 檔預設股票
- 可繼續新增其他台股或美股
- 可拖曳卡片調整順序
- 可用上下按鈕調整順序
- 可設定每 30 秒或每 1 分鐘自動更新
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

## 關於儲存

之前清單隔天消失，是因為 Render 免費環境的本機檔案可能在休眠、重啟或重新部署後被還原。

這一版已把主要清單做成內建固定清單，所以就算沒有設定 GitHub Token，打開網頁也一定會顯示上面的 13 檔。

如果你希望「後續自行新增的股票」也跨裝置並永久保存，可以在 Render 設定 GitHub 儲存。

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

## 可選：啟用後續新增股票的永久儲存

到 Render 的 Environment 設定以下環境變數：

```text
GITHUB_TOKEN=你的 GitHub fine-grained token
WATCHLIST_GITHUB_REPO=snoppy0423-maker/stock_view
WATCHLIST_GITHUB_BRANCH=main
WATCHLIST_GITHUB_PATH=data/watchlist.json
```

`GITHUB_TOKEN` 需要有這個 repo 的 `Contents: Read and write` 權限。沒有設定也可以使用，只是後續自行新增的股票可能會因 Render 重啟而消失；固定 13 檔不會消失。

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
