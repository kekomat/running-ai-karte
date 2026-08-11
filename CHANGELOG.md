# Changelog

## v0.3.2 - Public Preview (2026-08-11)

Google SheetsとLLMの会話をつなぐワークフローを再設計し、AI提案のステージング、複数日実績の一括記録、競合検証、監査ログを追加しました。

### Added

* `LLM_BRIEF`による相談コンテキスト生成
* `Proposal_Staging`を介したAI提案の確認・選択・反映
* `validateActualReportBatch()`と`applyActualReportBatch()`による複数日実績の一括記録
* 競合または整合性エラーが1件でもある場合にバッチ全体を停止するAll-or-Nothing検証
* 書き込み途中で障害が発生した場合の補償復元処理
* 保護対象の客観実績値、スナップショット、更新ID、ハッシュによる競合検出
* `Training_Plan`の実績管理用メタデータ

  * `AI Actual Comment`
  * `Actual Status`
  * `Actual Source`
  * `Actual Updated At`
  * `Actual Update ID`
* `Actual_Update_Log`による実績更新の監査記録
* Dashboardからの再読込、提案レビュー、選択反映
* v0.3.2のセットアップ関数`installRunningAiKarteV032()`
* v0.3.2の主要処理を確認する受け入れテスト
* claspデプロイ用の`appsscript.json`と`.claspignore`

### Changed

* 正規ソースをリポジトリ直下の複数`.gs`ファイルへ変更
* `Training_Plan`、Dashboard、実績更新の責務をリポジトリ層・Gateway層・UI層へ分離
* AIの出力を直接確定せず、利用者が確認してから反映するHuman-in-the-loopを明確化
* v0.3.2を現在の推奨版とし、v0.1.xをLegacy扱いへ変更

### Removed

* `running_ai_karte_combined.gs`
* 旧`src/`構成
* 公開版からの`optional-strava/`およびStrava連携コード

### Compatibility

* v0.1.xからv0.3.2への自動データ移行はサポートしません。
* `installRunningAiKarteV032()`はv0.3.2のシート構成とスキーマをセットアップする関数であり、v0.1.xのデータを変換する移行ツールではありません。
* v0.xでは、仕様・スキーマが予告なく変更される場合があります。正式な互換性・移行ポリシーはv1.0.0以降で導入予定です。

## v0.1.0 - Initial Public Release

This is the first GitHub release of Running AI Karte.

Although earlier internal drafts used labels such as `v0.1 Manual Mode` and `v0.3 Strava Connected Mode`, the first public release is consolidated as `v0.1.0`.

### Included

* Manual-first Google Sheets workflow
* Dashboard for subjective condition, prompt generation, and AI response logging
* Training_Plan, Event_Calendar, LLM_Export, and LLM_Response_Log sheets
* Optional Strava OAuth setup
* Optional Strava activity fetch
* Optional sync from Strava activities to Training_Plan actuals
* Single-file Apps Script version: `running_ai_karte_combined.gs`
* Split Apps Script files under `src/` and `optional-strava/`

### Not Included

* CSV import
* Automatic AI overwrite of Training_Plan
* Hosted backend service
* Medical, coaching, or race performance guarantees

### Future Candidates

* Separate display for AI suggestions beyond the first 14 days
* Training_Plan_Archive before rolling-window rows are removed
* Automatic Type update from `TBD` when actual results are available
