# 即時股價追蹤

這是一個可部署到 Render 的股價追蹤網頁。

## 功能

- 支援台股，例如 `0056`、`2330`
- 支援美股，例如 `AAPL`、`VT`、`VOO`
- 台股與美股資料來源皆為 Google 財經
- 不支援港股
- 可拖曳卡片調整順序
- 可用上下按鈕調整順序
- 可設定每 30 秒或每 1 分鐘自動更新
- 可依照目前排列順序匯出 Excel
- 股票清單與排列順序可永久儲存到 GitHub repo

## 為什麼隔天清單會消失

上一版把清單寫在 Render 伺服器的 `data/watchlist.json`。Render 免費環境可能會休眠、重啟或重新部署，執行期間寫入的檔案可能被還原，所以隔天打開時清單會消失。

這一版新增 GitHub 永久儲存模式：清單會寫回你的 GitHub repo，所以 Render 重啟後也能重新讀回來。

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

## 啟用永久儲存

到 Render 的 Environment 設定以下環境變數：

```text
GITHUB_TOKEN=你的 GitHub fine-grained token
WATCHLIST_GITHUB_REPO=snoppy0423-maker/stock_view
WATCHLIST_GITHUB_BRANCH=main
WATCHLIST_GITHUB_PATH=data/watchlist.json
```

`GITHUB_TOKEN` 需要有這個 repo 的 Contents 讀寫權限。建議使用 GitHub fine-grained personal access token，只授權 `snoppy0423-maker/stock_view` 這個 repo，權限選 `Contents: Read and write`。

如果沒有設定 `GITHUB_TOKEN`，程式仍可使用，但會退回 Render 暫存檔案模式，隔天或重啟後仍可能消失。

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
