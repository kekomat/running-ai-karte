# Getting Started / はじめに

## Install Option A: single-file / 1ファイル導入

This is the easiest path for the first GitHub release.

初回公開版では、この方法が一番簡単です。

1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Copy the content of `running_ai_karte_combined.gs` into the Apps Script editor.
4. Run `initializeRunningAiKarte()`.
5. Approve permissions when Google asks.
6. Open the `Dashboard` sheet.

1. 新しいGoogleスプレッドシートを作成します。
2. **拡張機能 > Apps Script** を開きます。
3. `running_ai_karte_combined.gs` の中身をApps Scriptエディタへ貼り付けます。
4. `initializeRunningAiKarte()` を実行します。
5. Googleの権限承認を行います。
6. `Dashboard` シートを開きます。

## Install Option B: split files / 分割ファイル導入

Copy the following files from `src/` into the Apps Script project.

- `01_setup.gs`
- `02_dashboard.gs`
- `03_training_plan.gs`
- `04_prompt_export.gs`
- `05_response_log.gs`
- `99_utils.gs`

Run:

```javascript
initializeRunningAiKarte()
```

Approve permissions when Google asks.

## Use Manual Mode / 手入力で使う

1. Open the `Dashboard` sheet.
2. Fill in current condition.
3. Edit `Training_Plan` manually.
4. Add important races and events to `Event_Calendar`.
5. Run `Running AI Karte > 2. Generate AI prompt`.
6. Copy the compressed prompt from Dashboard A12 to an LLM.
7. Paste the response inside Dashboard A16. It is imported automatically.
8. If needed, run `Running AI Karte > 3. Import AI response`.
9. Review planned updates on Dashboard. Use `AI Copy`, or edit B:E manually.
10. Use Dashboard A43:C43 to apply selected rows to `Training_Plan`.

1. `Dashboard` を開きます。
2. 今の主観コンディションを入力します。
3. `Training_Plan` を手入力で編集します。
4. `Event_Calendar` に重要なレースやイベント予定を入力します。
5. `Running AI Karte > 2. Generate AI prompt` を実行します。
6. Dashboard A12 の1行圧縮プロンプトをLLMへコピーします。
7. AI回答をDashboard A16セル内へ貼り付けます。自動で取り込まれます。
8. 必要な場合は `Running AI Karte > 3. Import AI response` を実行します。
9. Dashboardの予定レビューで、`AI Copy` を使うかB:Eを手修正します。
10. Dashboard A43:C43から選択行を `Training_Plan` へ反映します。

## Optional: Strava Mode / 任意のStrava連携

Add the files from `optional-strava/`, then follow `docs/strava-integration.md`.

`optional-strava/` のファイルを追加するか、結合版 `running_ai_karte_combined.gs` を使っている場合は、そのまま `docs/strava-integration.md` に進んでください。
