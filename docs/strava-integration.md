# Strava Integration / Strava連携

Strava integration is optional. Manual Mode works without it.

Strava連携は任意です。Manual ModeはStravaなしで動作します。

## Purpose / 目的

Running AI Karte uses Strava as a common activity data hub. This avoids CSV handling and makes it possible to work with many GPS watches that can sync to Strava.

Running AI Karteでは、Stravaを共通のアクティビティデータハブとして使います。CSV処理の複雑さを避けつつ、Stravaへ同期できる多くのGPSウォッチと連携できます。

## Setup flow / 設定手順

1. Create a Strava API application.
2. Add `optional-strava/` files to Apps Script.
3. Run `showStravaSetup()`.
4. Enter `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`.
5. Run `createStravaAuthUrl()`.
6. Open the generated URL.
7. Authorize access.
8. Paste the callback URL or `code` into `STRAVA_CALLBACK_URL_OR_CODE`.
9. Run `exchangeStravaAuthorizationCodeFromSheet()`.
10. Run `fetchStravaActivities()`.
11. Run `syncStravaToTrainingPlan()`.

1. Strava APIアプリケーションを作成します。
2. Apps Scriptに `optional-strava/` のファイルを追加します。
3. `showStravaSetup()` を実行します。
4. `STRAVA_CLIENT_ID` と `STRAVA_CLIENT_SECRET` を入力します。
5. `createStravaAuthUrl()` を実行します。
6. 生成されたURLを開きます。
7. Stravaアクセスを許可します。
8. コールバックURL全体、または `code` を `STRAVA_CALLBACK_URL_OR_CODE` に貼り付けます。
9. `exchangeStravaAuthorizationCodeFromSheet()` を実行します。
10. `fetchStravaActivities()` を実行します。
11. `syncStravaToTrainingPlan()` を実行します。

## Data handling / データの扱い

- `STRAVA_CLIENT_SECRET` is cleared from the sheet after token exchange.
- Client ID, Client Secret, and Refresh Token are stored in Apps Script Properties.
- `Strava_Activities` stores fetched activity details.
- `Training_Plan` receives only daily actuals: distance, duration, average heart rate, and URL notes.

- `STRAVA_CLIENT_SECRET` はトークン交換後にシート上から削除されます。
- Client ID、Client Secret、Refresh TokenはApps Script Propertiesへ保存されます。
- `Strava_Activities` には取得したアクティビティ詳細が保存されます。
- `Training_Plan` には日次実績として距離、時間、平均心拍、URLメモが反映されます。

## Privacy notes / プライバシー注意点

- Strava authorization uses the `read,activity:read_all` scope.
- `Strava_Activities` can include activity titles, dates, times, heart rate, cadence, elevation, URLs, and Raw JSON.
- Treat copied sheets, screenshots, and exported prompts as private unless you have reviewed them.
- To disconnect, revoke access from Strava and delete stored credentials from Apps Script Properties.

- Strava認可では `read,activity:read_all` スコープを使います。
- `Strava_Activities` には、アクティビティ名、日付、時刻、心拍、ケイデンス、獲得標高、URL、Raw JSONが含まれる場合があります。
- コピーしたシート、スクリーンショット、生成プロンプトは、内容確認前は非公開情報として扱ってください。
- 連携解除する場合は、Strava側でアクセスを取り消し、Apps Script Propertiesに保存された認証情報を削除してください。

## Sync behavior / 同期動作

Strava sync updates only dates inside the current Training_Plan window: previous month, current month, and next month.

If a Training_Plan row exists for the activity date, actuals are updated in that row. Window dates are prepared automatically before sync.

Strava同期は、現在のTraining_Plan範囲内だけを更新します。範囲は「前月・当月・翌月」です。

Training_Planに同じ日付の行がある場合は、その行の実績欄を更新します。同期前に範囲内の日付行は自動で用意されます。
