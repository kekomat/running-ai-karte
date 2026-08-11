# Running AI Karte

Running AI Karte（ランニングAIカルテ）は、市民ランナー向けの Google Sheets ベース AI トレーニングダッシュボードです。

練習予定、レース目標、主観コンディション、実績を Google Sheets に集約し、ChatGPT、Gemini、Claude などの LLM との相談に使うコンテキストを生成します。AIの提案はそのまま確定せず、ランナーが内容を確認してから反映する Human-in-the-loop を基本設計としています。

## Release status / リリース状況

* **v0.3.2 — Current / Public Preview**
  現在の推奨版です。`LLM_BRIEF`、AI提案のステージング、複数日実績の一括記録、競合検証、監査ログを備えています。
* **v0.1.x — Legacy**
  初期構成です。新規利用には推奨しません。旧コードはGit履歴から参照できます。
* **v0.x — Preview phase**
  開発中のため、仕様やデータ構造が予告なく変更される場合があります。
* **v1.0.0 and later — Planned stable releases**
  互換性とデータ移行方針を正式にサポートする安定版として計画しています。

## Concept / コンセプト

* Google Sheetsを軽量なUI兼データストアとして使う
* LLMとの会話を、計画・実績・主観情報につなげる
* AIは提案し、ランナーが確認・選択して反映する
* 実績の競合や二重更新を検出し、不整合な書き込みを防ぐ
* 利用者自身のGoogle環境内でデータを管理する

## Main features / 主な機能

* **`LLM_BRIEF`生成**
  直近の計画・実績・主観コンディションなど、LLM相談に必要な情報を整理します。
* **AI提案のステージング**
  AIが生成した提案を`Proposal_Staging`で受け取り、内容を確認してから`Training_Plan`へ反映します。
* **複数日実績の一括記録**
  `validateActualReportBatch()`と`applyActualReportBatch()`により、会話で整理した複数日の実績を検証・適用します。
* **All-or-Nothing検証**
  競合や整合性エラーを検出した場合は、バッチ全体の適用を停止します。
* **既存データの保護**
  保護対象の客観実績値に対する意図しない上書き、古いスナップショット、重複更新などを検出します。
* **監査ログ**
  `Actual_Update_Log`に更新結果や更新前後の情報を記録し、実績更新を追跡可能にします。
* **Dashboardレビュー**
  提案や実績をスプレッドシート上で確認し、明示的な操作で反映します。
* **受け入れテスト**
  v0.3.2の主要なデータ処理と安全性を確認するテストを同梱しています。

## Data migration policy / データ移行方針

v0.xの開発期間中は、旧バージョンとの下位互換性および自動データ移行を保証しません。

* v0.1.xの既存データをv0.3.2へ自動変換する機能は提供していません。
* 必要な過去データは、内容を確認したうえで利用者が手動で移してください。
* `installRunningAiKarteV032()`はv0.3.2のシート構成とスキーマをセットアップするための関数であり、v0.1.xのデータを変換する移行ツールではありません。
* 正式な互換性・移行ポリシーはv1.0.0以降で導入する予定です。

## Repository structure / リポジトリ構成

v0.3.2は、claspでデプロイするフラットな複数ファイル構成です。

```text
acceptanceTests.gs                Acceptance tests
actualReportGateway.gs            Actual Report Gateway
dashboardConstants.gs             Dashboard constants
dashboardReview.gs                Dashboard review UI
llmBrief.gs                       LLM_BRIEF generation
migration.gs                      v0.3.2 setup and schema migration
onDashboardEdit.gs                Dashboard edit event routing
proposalStagingRepository.gs      Proposal_Staging access
trainingPlanRepository.gs         Training_Plan data access
trainingPlanV032.gs               v0.3.2 Training_Plan behavior
appsscript.json                    Apps Script manifest
.claspignore                      clasp deployment exclusions
```

Strava連携コードはv0.3.2の公開版には含まれません。

## Installation for developers / 開発者向け導入

### Prerequisites / 前提条件

* Node.js
* [`@google/clasp`](https://github.com/google/clasp)
* 対象となるGoogleスプレッドシートとApps Scriptプロジェクト

### Deploy / デプロイ

1. リポジトリをクローンします。
2. `.clasp.json`に対象Apps Scriptプロジェクトの`scriptId`を設定します。
3. Apps Scriptへコードを送信します。

```bash
clasp push
```

4. Apps Scriptエディタから`installRunningAiKarteV032()`を実行します。
5. 必要なGoogle権限を承認し、作成・更新されたシートを確認します。

`.clasp.json`にはプロジェクト固有のIDが含まれるため、リポジトリへコミットしないでください。

## Basic workflow / 基本ワークフロー

1. `Dashboard`で主観コンディションや相談内容を更新します。
2. `LLM_BRIEF`を生成し、任意のLLMへ共有します。
3. AIから得た提案を`Proposal_Staging`へ取り込みます。
4. Dashboardで提案内容を確認し、採用する項目を選択します。
5. 選択した提案を`Training_Plan`へ反映します。
6. 会話から実績を記録する場合は、適用前にバッチ検証を行い、競合がないことを確認してから反映します。

## Privacy / プライバシー

Running AI Karteのデータは、利用者自身のGoogleスプレッドシートとApps Scriptプロジェクト内に保存されます。このリポジトリはホスト型バックエンドを提供せず、利用者のトレーニングデータを収集しません。

生成したコンテキストには、トレーニング実績、体調メモ、レース目標、生活上の制約などが含まれる場合があります。外部のLLMサービスへ共有する際は、そのサービスの利用規約とプライバシーポリシーを確認してください。スクリーンショット、ログ、コピーしたシートを公開する前にも、個人情報や健康関連情報が含まれていないか確認してください。

## Safety / 安全上の注意

このプロジェクトは医療助言ではなく、専門コーチ、医師、理学療法士などの代替でもありません。AIの出力は誤ることがあり、負荷が高すぎたり、現在の状態に適さない可能性があります。痛み、怪我、疾患、医学的な不安がある場合は、資格を持つ専門家へ相談してください。

AIは提案し、最終判断はランナー自身が行います。

## License / ライセンス

MIT License. See [`LICENSE`](LICENSE).
