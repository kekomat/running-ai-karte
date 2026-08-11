# Getting Started / はじめに

This guide explains how to deploy and start using Running AI Karte v0.3.2.

このガイドでは、Running AI Karte v0.3.2をGoogleスプレッドシートとApps Scriptへ導入し、利用を開始する手順を説明します。

## Release status / リリース状況

v0.3.2 is a Public Preview release. Specifications and sheet structures may change during the v0.x development phase.

v0.3.2はパブリックプレビュー版です。v0.xの開発期間中は、仕様やシート構成が変更される場合があります。

v0.3.2 uses a flat, multi-file Apps Script structure deployed with clasp. The legacy single-file installer, old `src/` structure, and optional Strava integration are not included.

v0.3.2は、複数のApps Scriptファイルをclaspでデプロイする構成です。旧1ファイル版、旧`src/`構成、任意のStrava連携は含まれません。

## Prerequisites / 前提条件

Before installation, prepare the following:

導入前に、以下を準備してください。

* Google account / Googleアカウント
* New or dedicated Google Spreadsheet / 新規または専用のGoogleスプレッドシート
* Node.js
* [`@google/clasp`](https://github.com/google/clasp)
* Local copy of this repository / このリポジトリのローカルコピー

Install clasp if it is not already installed.

claspをインストールしていない場合は、次を実行します。

```bash
npm install -g @google/clasp
```

Sign in to Google through clasp.

claspからGoogleアカウントへログインします。

```bash
clasp login
```

## Create the Apps Script project / Apps Scriptプロジェクトを作成する

1. Create a new Google Spreadsheet.
2. Open **Extensions > Apps Script**.
3. Open **Project Settings** in the Apps Script editor.
4. Copy the Script ID.
5. Return to the local repository directory.

手順は以下のとおりです。

1. 新しいGoogleスプレッドシートを作成します。
2. **拡張機能 > Apps Script**を開きます。
3. Apps Scriptエディタの**プロジェクトの設定**を開きます。
4. スクリプトIDをコピーします。
5. ローカルのリポジトリへ戻ります。

## Configure clasp / claspを設定する

Create a `.clasp.json` file in the repository root using the copied Script ID.

リポジトリ直下に`.clasp.json`を作成し、コピーしたスクリプトIDを設定します。

```json
{
  "scriptId": "YOUR_SCRIPT_ID"
}
```

Replace `YOUR_SCRIPT_ID` with the actual Script ID.

`YOUR_SCRIPT_ID`は、実際のスクリプトIDへ置き換えてください。

Do not commit `.clasp.json` because it contains a project-specific identifier.

`.clasp.json`にはプロジェクト固有のIDが含まれるため、Gitへコミットしないでください。

## Deploy the source files / ソースファイルをデプロイする

Check which files clasp will send.

claspの送信対象を確認します。

```bash
clasp status
```

Deploy the source files to Apps Script.

Apps Scriptへソースファイルを送信します。

```bash
clasp push
```

After the push completes, confirm that the v0.3.2 Apps Script files and `appsscript.json` appear in the Apps Script editor.

送信完了後、v0.3.2の各Apps Scriptファイルと`appsscript.json`がApps Scriptエディタに表示されていることを確認します。

## Initialize v0.3.2 / v0.3.2を初期設定する

In the Apps Script editor, select and run:

Apps Scriptエディタで、次の関数を選択して実行します。

```javascript
installRunningAiKarteV032()
```

Review the permissions requested by Google and approve the permissions required for the spreadsheet operation.

Googleから権限の確認を求められた場合は、内容を確認し、スプレッドシートの操作に必要な権限を承認します。

After the function finishes, return to the spreadsheet and confirm that the v0.3.2 sheets and columns have been created or updated.

処理完了後、スプレッドシートへ戻り、v0.3.2で必要なシートと列が作成または更新されていることを確認します。

`installRunningAiKarteV032()` sets up the v0.3.2 sheet structure and schema. It does not automatically convert v0.1.x data into the v0.3.2 format.

`installRunningAiKarteV032()`は、v0.3.2のシート構成とスキーマをセットアップする関数です。v0.1.xのデータをv0.3.2形式へ自動変換する機能ではありません。

## Basic workflow / 基本的な使い方

### 1. Update the training context / トレーニング情報を更新する

Enter or review the following information in the spreadsheet:

スプレッドシートで、以下の情報を入力または確認します。

* Training plan / 練習予定
* Actual training results / 練習実績
* Race and event information / レース・イベント情報
* Subjective condition and notes / 主観コンディション・メモ

### 2. Generate `LLM_BRIEF`

Generate or refresh `LLM_BRIEF` to prepare the context used for consultation with an LLM.

LLMへ相談するためのコンテキストとして、`LLM_BRIEF`を生成または更新します。

Before sharing it externally, review the contents for personal, health-related, or other sensitive information.

外部のLLMサービスへ共有する前に、個人情報、健康情報、その他の機密情報が含まれていないか確認してください。

### 3. Review AI proposals / AI提案を確認する

Import AI-generated proposals into `Proposal_Staging`.

AIが作成した提案は、`Proposal_Staging`へ取り込みます。

Review the proposed dates, workout details, and notes before applying anything to `Training_Plan`.

`Training_Plan`へ反映する前に、提案された日付、練習内容、メモを確認します。

Running AI Karte follows a Human-in-the-loop workflow: AI proposes changes, but the runner decides what to apply.

Running AI KarteはHuman-in-the-loopを基本としています。AIが変更を提案し、実際に反映する内容はランナーが判断します。

### 4. Apply selected proposals / 選択した提案を反映する

Select only the proposals you want to adopt, then apply them through the Dashboard review workflow.

採用する提案だけを選択し、Dashboardのレビューフローから反映します。

After applying the proposals, check the affected rows in `Training_Plan`.

反映後は、`Training_Plan`の対象行を確認してください。

### 5. Record actual results from a conversation / 会話から実績を記録する

When recording multiple days of actual results from an LLM conversation, validate the batch before applying it.

LLMとの会話から複数日の実績を記録する場合は、反映前にバッチを検証します。

The v0.3.2 Actual Report Gateway checks for conflicts and consistency errors. If a conflict is found, the batch is stopped without partially applying its records.

v0.3.2のActual Report Gatewayは、競合や整合性エラーを検証します。競合が見つかった場合は、一部だけを書き込まず、バッチ全体を停止します。

After applying a valid batch, review both `Training_Plan` and `Actual_Update_Log`.

正常なバッチを反映した後は、`Training_Plan`と`Actual_Update_Log`の両方を確認してください。

## Run acceptance tests / 受け入れテストを実行する

v0.3.2 includes acceptance tests for its main processing and data-protection behavior.

v0.3.2には、主要処理とデータ保護動作を確認する受け入れテストが含まれています。

See [`TESTING.md`](../TESTING.md) for the current test procedure.

現在のテスト手順は、[`TESTING.md`](../TESTING.md)を参照してください。

Run tests only in a spreadsheet where test data can be safely created or changed.

テストは、テストデータを安全に作成・変更できるスプレッドシートで実施してください。

## Updating the deployment / デプロイを更新する

After pulling a newer version of the source code, check the clasp target and push the updated files.

新しいソースコードを取得した後は、claspの対象を確認してから更新版を送信します。

```bash
clasp status
clasp push
```

If the release notes specify a setup or schema update, follow the instructions for that version before continuing normal use.

リリースノートにセットアップまたはスキーマ更新の指示がある場合は、通常利用を再開する前に、そのバージョンの手順を実行してください。

## Legacy versions / 旧バージョンについて

The following v0.1.x installation methods do not apply to v0.3.2:

以下のv0.1.x向け導入方法は、v0.3.2には適用されません。

* Copying `running_ai_karte_combined.gs`
* Copying files from the old `src/` directory
* Running `initializeRunningAiKarte()`
* Installing files from `optional-strava/`
* Using the legacy `LLM_Export` workflow

Old versions remain available through the Git history, but they are not recommended for new installations.

旧バージョンはGit履歴から参照できますが、新規導入には推奨しません。

## Troubleshooting / トラブルシューティング

### `clasp push` does not send the expected files

Run:

```bash
clasp status
```

Review `.claspignore` and confirm that `.clasp.json` points to the intended Apps Script project.

`.claspignore`の内容と、`.clasp.json`が意図したApps Scriptプロジェクトを指していることを確認してください。

### The setup function is not displayed

Confirm that `migration.gs` was included in the clasp deployment, then reload the Apps Script editor.

`migration.gs`がclaspの送信対象に含まれていることを確認し、Apps Scriptエディタを再読み込みしてください。

### A batch update is rejected

Review the validation result and check for existing values, stale snapshots, duplicate update IDs, or other consistency conflicts. Do not bypass the validation by manually forcing a partial batch update.

検証結果を確認し、既存値、古いスナップショット、重複した更新ID、その他の整合性競合がないか確認してください。
