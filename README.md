# Running AI Karte

Running AI Karte is a Google Sheets-based AI training dashboard for citizen runners.

ランニングAIカルテは、市民ランナー向けの Google Sheets ベース AI トレーニングダッシュボードです。練習予定、レース目標、主観コンディション、直近のランニングログをまとめ、ChatGPT / Gemini / Claude など任意のLLMへ相談するためのプロンプトを生成します。

Strava連携は任意です。まず手入力だけで使い始められます。

## Concept / コンセプト

- Manual-first: usable without Strava
- Strava optional: advanced users can sync actual running logs
- Google Sheets as a lightweight UI and database
- Human-in-the-loop: AI suggests, the runner decides
- No CSV import path: CSV handling is intentionally out of scope for the first public release

- 手入力ファースト: Stravaなしで利用可能
- Strava連携は任意: 必要な人だけ実績ログを同期
- Google Sheetsを軽量UI兼データベースとして利用
- Human-in-the-loop: AIは提案役、最終判断はランナー
- CSVインポートは初回公開版では対象外

## Release Policy / リリース方針

The first GitHub release is `v0.1.0`.

This release includes both Manual Mode and Optional Strava Mode. There is no separate manual-only GitHub release. The old internal draft labels, such as `v0.1 Manual Mode` and `v0.3 Strava Connected Mode`, are consolidated into the public `v0.1.0` release.

初回GitHub Releaseは `v0.1.0` とします。

この `v0.1.0` には、手入力で使うManual Modeと、任意のStrava連携機能の両方を含めます。手入力版だけを別リリースにはしません。内部ドラフト上の `v0.1 Manual Mode` / `v0.3 Strava Connected Mode` は、公開版では `v0.1.0` に統合します。

## Features / 主な機能

- Dashboard for subjective condition, prompt generation, and AI response logging
- Training_Plan sheet for planned workouts and actual results
- Rolling Training_Plan window: previous month, current month, and next month
- Event_Calendar for races and events
- LLM_Export sheet for generated prompts
- LLM_Response_Log sheet for keeping AI responses
- Optional Strava OAuth, activity fetch, and actuals sync

- 主観コンディション入力、プロンプト生成、AI回答保存用Dashboard
- 練習予定と実績を管理するTraining_Plan
- Training_Planは前月・当月・翌月の3ヶ月分を保持
- レースやイベント予定を管理するEvent_Calendar
- 生成プロンプトを保存するLLM_Export
- AI回答履歴を保存するLLM_Response_Log
- 任意のStrava OAuth、アクティビティ取得、実績同期

## Repository Structure / 構成

```text
src/                     Core Apps Script files
optional-strava/          Optional Strava integration files
docs/                     Setup and sheet specifications
examples/                 Example prompts
running_ai_karte_combined.gs
                         Single-file version for easy copy/paste
```

## Quick Start / クイックスタート

### Option A: single-file install / 1ファイルで導入

1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Copy `running_ai_karte_combined.gs` into the Apps Script editor.
4. Run `initializeRunningAiKarte()`.
5. Approve Google permissions.
6. Open the `Dashboard` sheet.

1. 新しいGoogleスプレッドシートを作成します。
2. **拡張機能 > Apps Script** を開きます。
3. `running_ai_karte_combined.gs` の中身をApps Scriptエディタへ貼り付けます。
4. `initializeRunningAiKarte()` を実行します。
5. Googleの権限承認を行います。
6. `Dashboard` シートを開き、A3:C3の `Action / 操作` プルダウンから操作します。

### Option B: split-file install / 分割ファイルで導入

Copy these files from `src/` into the Apps Script project:

- `01_setup.gs`
- `02_dashboard.gs`
- `03_training_plan.gs`
- `04_prompt_export.gs`
- `05_response_log.gs`
- `99_utils.gs`

Then run `initializeRunningAiKarte()`.

### If the top custom menu does not appear / 上部カスタムメニューが出ない場合

The primary beginner-friendly controls are in `Dashboard` A3:C3. Optional setup and maintenance controls are in `Dashboard` A20:C20. The top custom menu is optional. If the top menu does not appear, use the Dashboard dropdowns.

初心者向けの主な操作場所は `Dashboard` A3:C3 です。任意設定とメンテ操作は `Dashboard` A20:C20 です。上部カスタムメニューは補助的な導線です。上部メニューが表示されない場合は、Dashboard上のプルダウンを使ってください。

If the Dashboard dropdown also does not work, run the functions directly from the Apps Script editor:

Dashboardのプルダウンも動かない場合は、Apps Scriptエディタから下記の関数を直接実行してください。

- `refreshActuals()`
- `generateLLMPrompt()`
- `importAIResponse()`
- `showStravaSetup()`
- `createStravaAuthUrl()`
- `exchangeStravaAuthorizationCodeFromSheet()`
- `fetchStravaActivities()`
- `syncStravaToTrainingPlan()`

## Basic Workflow / 基本ワークフロー

1. Fill in subjective condition on `Dashboard`.
2. Edit planned workouts in `Training_Plan`.
3. Add races and events to `Event_Calendar`.
4. Select `2. Generate AI prompt / AIプロンプト生成` from `Dashboard` A3:C3.
5. Copy the compressed prompt from `Dashboard` A12 to your preferred LLM.
6. Paste the AI response inside `Dashboard` A16. It is imported automatically.
7. If needed, select `3. Import AI response / AI回答を取り込む` from `Dashboard` A3:C3.
8. Review AI suggestions in the planned review table. Use `AI Copy`, or edit columns B:E manually.
9. Select `4. Apply selected rows / 選択行を反映` from `Dashboard` A43:C43 to update checked rows in `Training_Plan`.

1. `Dashboard` に今の主観コンディションを入力します。
2. `Training_Plan` に練習予定を入力・編集します。
3. `Event_Calendar` にレースやイベント予定を入力します。
4. `Dashboard` A3:C3 の操作プルダウンから `2. Generate AI prompt / AIプロンプト生成` を選びます。
5. `Dashboard` A12 の1行圧縮プロンプトを任意のLLMへコピーします。
6. AI回答を `Dashboard` A16 セル内に貼り付けます。自動で取り込まれ、A16はクリアされます。
7. 必要な場合は `Dashboard` A3:C3 の操作プルダウンから `3. Import AI response / AI回答を取り込む` を選びます。
8. 予定レビューでAI提案を確認し、`AI Copy` を使うか、B:Eを手修正します。
9. `Dashboard` A43:C43 の更新プルダウンから `4. Apply selected rows / 選択行を反映` を選び、チェックされた行だけ `Training_Plan` へ反映します。

## Optional Strava Mode / 任意のStrava連携

Manual Mode works without Strava. Strava integration is for users who want to fetch running activities and sync daily actuals into `Training_Plan`.

手入力だけで利用できます。Strava連携は、Runアクティビティを取得し、日次実績を `Training_Plan` に反映したいユーザー向けの任意機能です。

To enable it:

1. Add files from `optional-strava/` to the Apps Script project, or use `running_ai_karte_combined.gs`.
2. Select `Show Strava setup / Strava設定を表示` from `Dashboard` A20:C20.
3. Enter your Strava Client ID and Client Secret in `Strava_Setup`.
4. Select `Create Strava auth URL / Strava認証URL作成` from `Dashboard` A20:C20.
5. Open the generated URL and authorize.
6. Paste the callback URL or code into `STRAVA_CALLBACK_URL_OR_CODE`.
7. Select `Exchange Strava code / Strava認証コード交換` from `Dashboard` A20:C20.
8. Select `Fetch Strava activities / Stravaログ取得` from `Dashboard` A20:C20.
9. Select `Sync Strava to Training_Plan / Strava実績反映` from `Dashboard` A20:C20.

More details: [`docs/strava-integration.md`](docs/strava-integration.md)

## Privacy / プライバシー

Running AI Karte stores data in your own Google Sheet and Apps Script project. This repository does not provide a server and does not collect your data.

ランニングAIカルテのデータは、利用者自身のGoogleスプレッドシートとApps Scriptプロジェクト内に保存されます。このリポジトリはサーバーを提供せず、利用者データを収集しません。

Important notes:

- Generated prompts may contain personal training logs, health-related notes, subjective condition, race goals, and life constraints.
- Calendar access may be requested to highlight Japanese holidays in `Training_Plan` and `Dashboard`.
- When you paste prompts into an LLM service, that service's own privacy policy applies.
- Optional Strava Mode stores Client ID, Client Secret, and Refresh Token in Apps Script Properties.
- `Strava_Activities` can store fetched activity details and Raw JSON from Strava.
- Do not publish screenshots, copied sheets, logs, or exported prompts without checking for private information.

注意点:

- 生成プロンプトには、練習ログ、体調メモ、主観コンディション、レース目標、生活上の制約が含まれる場合があります。
- `Training_Plan` と `Dashboard` の祝日ハイライトのため、Googleカレンダー権限が求められる場合があります。
- LLMサービスへプロンプトを貼り付ける場合、そのサービス側のプライバシーポリシーが適用されます。
- 任意のStrava連携では、Client ID、Client Secret、Refresh TokenをApps Script Propertiesに保存します。
- `Strava_Activities` にはStravaから取得した詳細情報とRaw JSONが保存される場合があります。
- スクリーンショット、コピーしたシート、ログ、生成プロンプトを公開する前に、個人情報が含まれていないか確認してください。

## Safety / 安全上の注意

This project is not medical advice and is not a replacement for a qualified coach, physician, physical therapist, or other professional. AI output can be wrong, too aggressive, or unsuitable for your condition. If you have pain, injury, illness, or medical concerns, consult a qualified professional.

このツールは医療助言ではなく、専門コーチ、医師、理学療法士などの代替でもありません。AIの出力は誤ることがあり、負荷が高すぎたり、現在の体調に合わない可能性があります。痛み、怪我、疾患、医学的な不安がある場合は、専門家へ相談してください。

The core design is human-in-the-loop: AI suggests, the runner decides.

本プロジェクトの基本設計はHuman-in-the-loopです。AIは提案し、最終判断はランナー自身が行います。

## Documentation / ドキュメント

- [`docs/getting-started.md`](docs/getting-started.md)
- [`docs/sheet-spec.md`](docs/sheet-spec.md)
- [`docs/strava-integration.md`](docs/strava-integration.md)
- [`TESTING.md`](TESTING.md)
- [`TEST_RESULTS.md`](TEST_RESULTS.md)

## Future Candidates / 今後の改善候補

- Separate display for AI suggestions beyond the first 14 days
- Training_Plan_Archive before rolling-window rows are removed
- Automatic Type update from `TBD` when actual results are available

- 14日を超えるAI提案の別表示
- 月替わりでTraining_Planの範囲外行を削除する前の自動アーカイブ
- 実績値がある場合にTraining_PlanのTypeを `TBD` から自動更新

## License / ライセンス

MIT License. See [`LICENSE`](LICENSE).
