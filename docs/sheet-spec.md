# Running AI Karte - Sheet Specification v0.3.2

Running AI Karte is a Google Sheets-based AI training record for recreational runners.

Running AI Karteは、市民ランナー向けのGoogle SheetsベースAIランニングカルテです。

## Release status / リリース状況

v0.3.2 is a Public Preview release. Sheet structures and processing rules may change during the v0.x development phase.

v0.3.2はパブリックプレビュー版です。v0.xの開発期間中は、シート構成や処理ルールが変更される場合があります。

This document describes the sheet schema created or maintained by:

本書は、次の関数が作成・維持するシート構成を説明します。

```javascript
installRunningAiKarteV032()
```

`installRunningAiKarteV030()` remains as a compatibility alias and calls the v0.3.2 installer.

`installRunningAiKarteV030()`は互換用のエイリアスとして残されており、v0.3.2のインストーラーを呼び出します。

## Design principles / 設計原則

* `Training_Plan` is the authoritative schedule and actual-training timeline.
* `Event_Calendar` is the authoritative source for confirmed goals, races, important events, and constraints.
* `Proposal_Staging` is the authoritative staging area for approved but unapplied future AI proposals.
* AI does not directly update future plan fields in `Training_Plan`.
* Future AI proposals are reviewed and selectively applied through `Dashboard`.
* Past actual results may be written only through the approved Actual Report Gateway.
* The user may directly edit permitted plan and actual fields.
* The current context can be reconstructed from the spreadsheet without relying only on LLM memory.
* The basic workflow works without Strava.
* User-facing headers use English and Japanese on separate lines.

日本語での設計原則は以下のとおりです。

* `Training_Plan`を、採用済み予定と実績を管理する時間軸の正本とします。
* `Event_Calendar`を、確認済みの目標、レース、重要予定、制約の正本とします。
* `Proposal_Staging`を、承認済みだが未反映の未来AI提案を保持する正本とします。
* AIは`Training_Plan`の未来の計画欄を直接更新しません。
* AI提案は`Dashboard`で人が確認し、選択した内容だけを反映します。
* 過去実績は、ユーザー承認済みPayloadをActual Report Gatewayが検証した場合だけ記録できます。
* ユーザーは、許可された計画欄と実績欄を直接編集できます。
* LLMのMemoryだけに依存せず、シート内の正本から現在の文脈を復旧できます。
* Stravaを使用しなくても基本運用が成立します。
* ユーザー向け見出しは英語／日本語の2行表記とします。

## Sheets / シート一覧

v0.3.2 uses the following six sheets.

v0.3.2では、次の6シートを使用します。

| Sheet               | Required | Role                              |
| ------------------- | -------: | --------------------------------- |
| `Dashboard`         |      Yes | 状態確認、Today's Note入力、AI提案レビュー、選択反映 |
| `Training_Plan`     |      Yes | 1日1行の採用済み予定、実績、AI所見の正本            |
| `Event_Calendar`    |      Yes | 目標、レース、重要予定、制約の正本                 |
| `Proposal_Staging`  |      Yes | 承認済み未来提案の受付、検証、状態管理               |
| `LLM_Response_Log`  |      Yes | 承認済み相談結果、所見、改訂履歴                  |
| `Actual_Update_Log` |      Yes | 会話経由実績更新の監査ログ                     |

`LLM_BRIEF` is a named range stored in a hidden management cell on `Dashboard`. It is not a separate sheet.

`LLM_BRIEF`は`Dashboard`の非表示管理セルに保存されるNamed Rangeであり、独立したシートではありません。

## Source-of-truth boundaries / 正本と更新境界

| Information                                            | Authoritative destination | Update path                                       |
| ------------------------------------------------------ | ------------------------- | ------------------------------------------------- |
| Adopted future schedule / 採用済み予定                       | `Training_Plan`           | User direct edit or Dashboard Apply               |
| Confirmed goal, race, event, constraint / 確認済み目標・予定・制約 | `Event_Calendar`          | User edit or approved write                       |
| Future AI proposal / 未来のAI提案                           | `Proposal_Staging`        | Approved proposal recording                       |
| Past actual result / 過去実績                              | `Training_Plan`           | Manual, compatible sync, or Actual Report Gateway |
| Consultation summary and assessment / 相談要約・所見          | `LLM_Response_Log`        | Approved write                                    |
| Actual-update audit trail / 実績更新監査                     | `Actual_Update_Log`       | Actual Report Gateway                             |
| Current LLM context / 現在のLLMコンテキスト                     | `LLM_BRIEF`               | `buildLlmBrief()`                                 |

## Training_Plan

`Training_Plan` is the authoritative daily timeline. Each date must have at most one row.

`Training_Plan`は日付単位の正本です。同じ日付の行は1行だけでなければなりません。

### Columns / 列定義

| Col | Group         | Header                            | Role                      |
| --: | ------------- | --------------------------------- | ------------------------- |
|   A | PLAN          | Date / 日付                         | 1日1行の日付                   |
|   B | PLAN          | Type / 種別                         | 正規Workout Type            |
|   C | PLAN          | Planned Workout / 予定メニュー          | 採用済みの練習内容                 |
|   D | PLAN          | Target Pace / 設定ペース               | ペース、強度、時間設定               |
|   E | PLAN          | Plan km / 予定距離 km                 | 計画距離                      |
|   F | AI REVIEW     | AI Comment / AIコメント               | 計画に対するAIの見立て、確認事項         |
|   G | ACTUAL        | Workout Result / Notes / 練習結果／メモ  | 完遂状況、余裕度、痛み、主観メモ          |
|   H | ACTUAL        | Actual km / 実績距離 km               | 実績距離                      |
|   I | ACTUAL        | Duration min / 時間（分）              | 実績時間                      |
|   J | ACTUAL        | Avg HR / 平均心拍                     | 平均心拍                      |
|   K | INTERNAL      | Actual Source / 実績ソース             | 実績の取得元                    |
|   L | INTERNAL      | Activity Count / アクティビティ数         | 同日のActivity数              |
|   M | INTERNAL      | Main Activity ID / メインActivity ID | 主要Activityの識別子            |
|   N | INTERNAL      | Max HR / 最大心拍                     | 最大心拍                      |
|   O | INTERNAL      | Analysis Mode / 分析モード             | DailyまたはDetail            |
|   P | ACTUAL REVIEW | AI Actual Comment / AI実績所見        | 実施後のAI評価                  |
|   Q | INTERNAL      | Actual Status / 実績状態              | 実施状態                      |
|   R | INTERNAL      | Actual Updated At / 実績更新日時        | 実績またはメタデータの最終更新日時         |
|   S | INTERNAL      | Actual Update ID / 実績更新ID         | `Actual_Update_Log`との関連ID |

K〜OおよびQ〜Sは内部管理列として通常非表示にします。P列はユーザーが確認できる表示列です。

### Workout Type

Allowed values are:

使用できる正規値は以下です。

* `Rest`
* `Recovery`
* `Jog`
* `Long Run`
* `Workout`
* `Race`
* `Other`
* `TBD`

Aliases such as `Easy`, `Tempo`, `Interval`, and `Off` must not be used as Workout Type values. Put those details in Planned Workout or Target Pace.

`Easy`、`Tempo`、`Interval`、`Off`などの同義語はTypeへ入力しません。具体的な内容はPlanned WorkoutまたはTarget Paceへ記載します。

### Actual Source

| Value             | Meaning                                |
| ----------------- | -------------------------------------- |
| `Manual`          | ユーザーが手入力した実績                           |
| `Strava`          | 互換性のあるStrava同期処理が登録した実績                |
| `LLM_USER_REPORT` | 承認済みの会話報告をActual Report Gatewayが登録した実績 |

`Actual Source = Strava`は実績メタデータとしてサポートされますが、v0.3.2のコアシート構成にStrava専用シートは含まれません。

### Actual Status

| Value       | Meaning           |
| ----------- | ----------------- |
| `COMPLETED` | 練習を実施した           |
| `PARTIAL`   | 計画の一部を実施した        |
| `REST`      | 予定どおり、または意図的に休養した |
| `SKIPPED`   | 予定していた練習を実施しなかった  |

### Analysis Mode

| Value    | Meaning          |
| -------- | ---------------- |
| `Daily`  | 日次の要約データを使用      |
| `Detail` | 詳細Activityデータを使用 |

### Update boundaries / 更新境界

| Target                                 | User                      | AI / LLM                     |
| -------------------------------------- | ------------------------- | ---------------------------- |
| Future plan B:F                        | 直接編集可                     | 直接更新不可。`Proposal_Staging`へ記録 |
| Workout Result / Notes G               | 直接編集可                     | 承認済みPayloadをGateway経由で空欄へ記録可 |
| Manual actuals H:J                     | SourceがManualまたは空欄の場合に編集可 | 通常登録で既存値を上書きしない              |
| Strava actuals H:O                     | 原則直接編集しない                 | 客観値を変更しない                    |
| AI Actual Comment P                    | 直接編集可                     | 承認済みPayloadをGateway経由で空欄へ記録可 |
| Actual metadata Q:S                    | 通常編集しない                   | Gatewayまたは同期処理だけが更新          |
| Date A, headers, validation, structure | 通常編集しない                   | 更新不可                         |

Strava実績が存在する場合、距離、時間、心拍などの客観値は保護されます。G列またはP列が空欄の場合に限り、承認済みの主観情報を追記できます。

複数日の会話経由実績はAll-or-Nothingで処理します。1件でも競合がある場合は、バッチ全体を更新しません。

### Date coverage / 日付保持範囲

v0.3.2 uses the following date boundaries.

| Name           | Definition              |
| -------------- | ----------------------- |
| Active Start   | 現在月の月初から2か月前の月初         |
| Proposal Start | `LLM_BRIEF`のSnapshot生成日 |
| Proposal End   | Snapshot生成日から6暦月後       |

`Reload / 予定再読込`では、Proposal検証より前に、Active StartからProposal Endまでの日付行を不足なく確保します。

新しく作成される日付行の初期値は以下です。

* `Type = TBD`
* `Analysis Mode = Daily`
* その他の計画・実績欄は空欄

既存計画、手入力、実績、書式、データ検証は上書きしません。日付の重複が見つかった場合は自動修復せず、処理を停止します。

## Dashboard

`Dashboard` is a compact human-in-the-loop workspace for both desktop and mobile use.

`Dashboard`は、PCとスマートフォンで共通利用するHuman-in-the-loopの作業台です。

### Upper section / 上部

| Row | Label                                          | Action or content |
| --: | ---------------------------------------------- | ----------------- |
|   1 | Dashboard / ダッシュボード                            | タイトルとバージョン        |
|   2 | Reload / 予定再読込                                 | B2で実行、D2:E2に結果    |
|   3 | Training Goal / トレーニング目標                       | C3:E3             |
|   4 | Policy / 方針・制約                                 | C4:E4             |
|   5 | Recent Training / 直近のトレーニング                    | C5:E5             |
|   6 | Upcoming Events / 今後の主な予定                      | C6:E6             |
|   7 | Today's Plan / 今日の予定                           | C7:E7             |
|   8 | Tomorrow's Plan / 明日の予定                        | C8:E8             |
|   9 | Next Workout / 次回ポイント練                         | C9:E9             |
|  10 | Today's Note / 今日のひとこと                         | C10:E10、ユーザー入力    |
|  11 | Apply to Training Plan / 選択した予定を確定反映           | B11で実行、D11:E11に結果 |
|  11 | Select all visible AI proposals / 表示中のAI案を一括取込 | G11で実行            |

The upper content ranges are merged where appropriate, but B2, B11, and G11 remain independent action checkboxes.

上部の内容欄は必要に応じて結合されますが、B2、B11、G11は独立した実行チェックボックスです。

### Review area / 予定レビュー

* Row 12: column headers
* Rows 13–34: review rows
* Maximum: 22 displayed dates
* Range: `A13:M34`
* Rows after 34 are hidden
* No frozen rows or columns

| Col | Header                   | Role                     |
| --: | ------------------------ | ------------------------ |
|   A | Date / 日付                | `Training_Plan`の反映先日付    |
|   B | Apply / 反映               | 反映対象の選択                  |
|   C | Type / 種別                | 現行または編集後のType            |
|   D | Planned Workout / 予定メニュー | 現行または編集後のメニュー            |
|   E | Target Pace / 設定ペース      | 現行または編集後の設定              |
|   F | Plan km / 計画距離 km        | 現行または編集後の距離              |
|   G | AI案取込                    | AI案をC:Fへコピー              |
|   H | AI Type / AI種別           | AI提案のType                |
|   I | AI Workout / AIメニュー      | AI提案のメニュー                |
|   J | AI Target Pace / AI設定ペース | AI提案の設定                  |
|   K | AI Plan km / AI計画距離 km   | AI提案の距離                  |
|   L | AI Reason / AI理由         | 理由、注意、警告                 |
|   M | Proposal ID              | `Proposal_Staging`との関連ID |

M列は内部管理列として通常非表示にします。

### AI Copy / AI案取込

When G is checked:

G列をチェックすると、同じ行で次を実行します。

* H → C
* I → D
* J → E
* K → F
* B → `TRUE`
* G → `FALSE`

This operation only prepares an editable draft on `Dashboard`. It does not update `Training_Plan` or change the Proposal status.

この操作は`Dashboard`内に編集案を作るだけです。`Training_Plan`の更新やProposal Statusの変更は行いません。

If the user edits C:F directly, B is automatically set to `TRUE`. The Proposal ID in M is retained.

ユーザーがC:Fを直接編集した場合も、Bが自動的に`TRUE`になります。M列のProposal IDは保持されます。

### Apply to Training Plan / 確定反映

When B11 is checked:

B11をチェックすると、次を実行します。

1. B列が`TRUE`の行を抽出します。
2. A列の日付で`Training_Plan`の対象行を検索します。
3. M列にProposal IDがある場合は、そのProposalが一意で`LOADED`状態であることを再検証します。
4. C:Fを`Training_Plan`のB:Eへ反映します。
5. AI提案に紐づく成功行だけを`APPLIED`へ更新します。
6. 成功行のBを`FALSE`へ戻します。
7. D11:E11へ成功件数、失敗件数、処理結果を表示します。

対象日なし、日付重複、不正日付、Proposal ID不一致、Proposal Status不一致の場合は、その行をエラーとします。新しい日付行をApply処理中に追加することはありません。

## Dashboard named ranges

| Named Range                | Range     |
| -------------------------- | --------- |
| `DASH_ACTION_REFRESH`      | `B2`      |
| `DASH_REFRESH_RESULT`      | `D2`      |
| `DASH_TRAINING_GOAL`       | `C3`      |
| `DASH_POLICY_CONSTRAINTS`  | `C4`      |
| `DASH_RECENT_TRAINING`     | `C5`      |
| `DASH_UPCOMING_EVENTS`     | `C6`      |
| `DASH_TODAY_PLAN`          | `C7`      |
| `DASH_TOMORROW_PLAN`       | `C8`      |
| `DASH_NEXT_KEY_WORKOUT`    | `C9`      |
| `DASH_TODAYS_NOTE`         | `C10`     |
| `DASH_ACTION_APPLY`        | `B11`     |
| `DASH_APPLY_RESULT`        | `D11`     |
| `DASH_ACTION_BULK_AI_COPY` | `G11`     |
| `DASH_REVIEW_RANGE`        | `A13:M34` |
| `DASH_APPLY_FLAGS`         | `B13:B34` |
| `DASH_AI_COPY_FLAGS`       | `G13:G34` |
| `DASH_PROPOSAL_IDS`        | `M13:M34` |

## Event_Calendar

`Event_Calendar` stores confirmed long-term goals, important dates, races, workouts, and constraints.

`Event_Calendar`は、確認済みの長期目標、重要日、レース、重要練習、制約を管理します。

### Columns / 列定義

| Col | Header                     | Required | Role                   |
| --: | -------------------------- | -------: | ---------------------- |
|   A | Date / 日付                  |      Yes | イベント日                  |
|   B | Type / 種別                  |      Yes | イベント種別                 |
|   C | Event / Schedule / イベント／予定 |      Yes | 名称                     |
|   D | Goal / Constraint / 目標／制約  |       No | 目標、設定、計画への影響           |
|   E | Distance km / 距離 km        |       No | レースまたは確定Workoutの距離     |
|   F | Priority / Notes / 優先度／メモ  |       No | 優先度、補足                 |
|   G | Event ID                   | Internal | 行番号に依存しない一意キー          |
|   H | Status                     | Internal | `ACTIVE`または`CANCELLED` |
|   I | Updated At                 | Internal | 最終更新日時                 |
|   J | Updated By                 | Internal | 更新主体                   |

G〜Jは内部管理列として通常非表示にします。

### Event Type

* `Workout`
* `Race`
* `Constraint`
* `TBD`

日常的なJogやRestは原則として`Training_Plan`で管理します。長期計画へ影響する休養、故障、移動、通院、時間制限などは`Constraint`として登録できます。

### Update rules / 更新ルール

* ユーザーは直接編集できます。
* LLM経由の更新は、内容と書込先を提示してユーザー承認を得た後だけ実行します。
* 新規イベントにはEvent IDを発番します。
* 既存イベントはEvent IDで特定して更新します。
* 削除は行削除ではなく`Status = CANCELLED`とします。
* 対象が曖昧な場合や推測情報しかない場合は更新しません。

## Proposal_Staging

`Proposal_Staging` stores approved future AI proposals before they are applied to `Training_Plan`.

`Proposal_Staging`は、ユーザーが記録を承認した未来のAI提案を、`Training_Plan`へ反映する前に保持します。

Past actual results must not be stored here. One row represents one date and one workout.

過去実績は格納しません。1日・1メニューを1行として記録します。

### Columns / 列定義

| Col | Header             | Role                        |
| --: | ------------------ | --------------------------- |
|   A | Proposal ID        | 提案行の一意キー                    |
|   B | Consultation ID    | 相談の系譜を束ねるID                 |
|   C | Revision           | 同じ相談内の改訂番号                  |
|   D | Source Snapshot ID | 参照した`LLM_BRIEF`のSnapshot ID |
|   E | Submitted At       | 記録日時                        |
|   F | Date               | 対象日                         |
|   G | Workout Type       | 正規Workout Type              |
|   H | Workout            | メニュー内容                      |
|   I | Plan km            | 計画距離                        |
|   J | Duration min       | 計画時間                        |
|   K | Target Pace        | 設定ペース・強度                    |
|   L | Reason             | 提案理由                        |
|   M | Warning            | 注意・再確認事項                    |
|   N | Status             | 提案状態                        |
|   O | Status Updated At  | 状態更新日時                      |
|   P | Status Detail      | エラー、棄却、状態変更の詳細              |
|   Q | Applied At         | `Training_Plan`への反映日時       |

Proposal ID、Consultation ID、Revision、日時、StatusはAIカルテ側で採番・更新します。LLMが自由生成する項目ではありません。

### Status

| Status       | Meaning                  |
| ------------ | ------------------------ |
| `SUBMITTED`  | ユーザー承認後に記録済み             |
| `LOADED`     | 検証を通過しDashboardへ取込済み     |
| `APPLIED`    | `Training_Plan`へ反映済み     |
| `SUPERSEDED` | 同じ日付の新しい提案に置換済み          |
| `INVALID`    | 必須項目、日付、型などが反映不能         |
| `REJECTED`   | ユーザーが明示的に棄却              |
| `EXPIRED`    | Active Startより前に残った未反映提案 |

`SELECTED`は永続Statusとして使用しません。Dashboardのチェックボックスは一時的なUI状態です。

### Main transitions / 主な状態遷移

| Current                | Next         | Condition                |
| ---------------------- | ------------ | ------------------------ |
| `SUBMITTED`            | `LOADED`     | 構造検証を通過しDashboardへ取り込まれた |
| `SUBMITTED`            | `INVALID`    | 必須項目、日付、型などが反映不能         |
| `SUBMITTED`            | `SUPERSEDED` | 同じ日付の新しい提案が記録された         |
| `LOADED`               | `APPLIED`    | Dashboardから正常に反映された      |
| `LOADED`               | `REJECTED`   | ユーザーが明示的に棄却した            |
| `LOADED`               | `SUPERSEDED` | 反映前に同じ日付の新版が記録された        |
| `LOADED`               | `INVALID`    | 再検証で反映不能になった             |
| `SUBMITTED` / `LOADED` | `EXPIRED`    | 対象日がActive Startより前になった  |

`APPLIED`、`SUPERSEDED`、`REJECTED`、`EXPIRED`は終端状態です。`INVALID`は原則として終端ですが、過去バージョンの環境要因エラーとして再検証可能な行だけ復旧対象になります。

### Validation / 検証

The following errors make a proposal `INVALID`.

以下は`INVALID`となる主な条件です。

* Proposal IDまたはConsultation IDの形式不正
* Proposal IDの重複
* Revisionの欠落または不正
* Source Snapshot IDの欠落または不正
* Submitted AtまたはDateの不正
* `Training_Plan`の対象日が存在しない、または重複している
* Proposal StartからProposal Endまでの範囲外
* Workout Typeが正規値ではない
* `Rest`以外でWorkoutが空欄
* Plan kmが0〜100の範囲外
* Duration minが0〜1440の範囲外

古いSnapshot、`Event_Calendar`との競合、既存計画との大きな差異は警告として扱います。警告付き提案は`LOADED`を維持し、人が採用可否を判断します。

同じ日付の新しい承認済み提案を記録すると、既存の未反映`SUBMITTED`または`LOADED`は`SUPERSEDED`になります。既存行は削除せず、履歴として保持します。

## LLM_Response_Log

`LLM_Response_Log` stores approved consultation summaries and assessments.

`LLM_Response_Log`は、ユーザーが記録を承認した相談要約と所見を保持します。

| Col | Header               | Role                    |
| --: | -------------------- | ----------------------- |
|   A | Consultation ID      | 相談の一意ID                 |
|   B | Revision             | 同じ相談内の改訂番号              |
|   C | Source LLM           | ChatGPT、Gemini、Claudeなど |
|   D | Source Snapshot ID   | 参照した`LLM_BRIEF`         |
|   E | Recorded At          | 記録日時                    |
|   F | Consultation Summary | 相談内容の要約                 |
|   G | Assessment / Advice  | 評価、助言                   |
|   H | Coach Topics         | コーチへ確認する論点              |
|   I | Status               | `ACTIVE`または`SUPERSEDED` |

相談内容の改訂時は既存履歴を削除せず、RevisionとStatusで追跡します。

## Actual_Update_Log

`Actual_Update_Log` is the audit log for actual results written through the Actual Report Gateway.

`Actual_Update_Log`は、Actual Report Gateway経由で行われた実績更新の監査ログです。

| Col | Header             | Role                          |
| --: | ------------------ | ----------------------------- |
|   A | Actual Update ID   | バッチ内の日付別更新ID                  |
|   B | Consultation ID    | 相談の系譜                         |
|   C | Confirmation ID    | ユーザー承認ID                      |
|   D | Source Snapshot ID | 参照した`LLM_BRIEF`               |
|   E | Payload Hash       | 承認PayloadのHash                |
|   F | Plan Date          | 対象日                           |
|   G | Expected Row Hash  | 承認時の対象行Hash                   |
|   H | Before JSON        | 更新前の値                         |
|   I | After JSON         | 更新後の値                         |
|   J | Result             | `APPLIED`、`CONFLICT`、`FAILED` |
|   K | Error Code         | 競合または失敗理由                     |
|   L | Approved At        | 承認日時                          |
|   M | Applied At         | 適用日時                          |
|   N | Applied By         | 実行主体                          |

会話全文や秘密情報は保存しません。

Actual Report Gateway uses:

```javascript
validateActualReportBatch(payload)
applyActualReportBatch(payload)
```

Validation checks the schema, spreadsheet timezone, date uniqueness, Source Snapshot ID, Expected Row Hash, existing actuals, and Strava conflicts.

適用時はDocument Lockを取得し、承認済みPayloadと対象行を再検証します。承認後にPayloadまたは対象行が変化した場合は適用せず、再プレビューと再承認を要求します。

## LLM_BRIEF and management named ranges

`LLM_BRIEF` is generated by:

```javascript
buildLlmBrief()
```

The function does not call an LLM API. It reconstructs the current consultation context from the spreadsheet.

この関数はLLM APIを呼び出しません。スプレッドシート内の正本から、相談に必要な現在のコンテキストを再構成します。

The following named ranges are stored in hidden Dashboard cells.

| Named Range               | Cell | Role                   |
| ------------------------- | ---- | ---------------------- |
| `LLM_BRIEF`               | `O1` | LLMへ渡す最新ブリーフ本文         |
| `LLM_BRIEF_SNAPSHOT_ID`   | `O2` | 正本データから生成したSnapshot ID |
| `LLM_BRIEF_GENERATED_AT`  | `O3` | 生成日時                   |
| `DASHBOARD_URL`           | `O4` | Dashboardへの直接リンク       |
| `ACTUAL_REVIEWED_THROUGH` | `O5` | 連続して実績確認が完了した最終日       |

Column O is hidden.

O列は非表示です。

`LLM_BRIEF` contains:

* Current Dashboard summary
* Last 14 days of training context
* Adopted future plan context
* Unreported-actual review candidates
* Active Event Calendar context
* Pending proposals
* Proposal Start and Proposal End
* Canonical Workout Type values
* Actual Status and Actual Source rules
* Source-of-truth and write boundaries
* Actual Report Gateway approval rules
* Dashboard URL and the return workflow

The Snapshot ID uses the `SNP-` prefix and is generated from a hash of the current authoritative context.

## Actual Reviewed Through

`ACTUAL_REVIEWED_THROUGH` represents the last date through which actual-result review has been completed without skipping an unresolved date.

未解決日を飛び越えてポインタを進めることはできません。

| Purpose           | Rule                               |
| ----------------- | ---------------------------------- |
| Training analysis | 直近14日                              |
| Unreported review | `ACTUAL_REVIEWED_THROUGH`の翌日から昨日まで |
| First review      | 昨日までの直近14日                         |
| Detailed output   | 古い日から最大31日                         |
| More than 31 days | 残件数、残期間、最古未解決日を通知                  |
| Today             | 実施済みと明示された場合だけ候補                   |

## Core workflow / 基本データフロー

### Future AI proposal / 未来提案

1. `buildLlmBrief()` generates the current Snapshot.
2. The runner consults an LLM.
3. The LLM presents the proposed write contents.
4. The runner explicitly approves the recording.
5. The proposal is written to `Proposal_Staging` as `SUBMITTED`.
6. `Reload / 予定再読込` validates it and changes it to `LOADED`.
7. The runner uses AI Copy or edits C:F on `Dashboard`.
8. The runner selects the rows to apply.
9. `Apply to Training Plan` updates `Training_Plan`.
10. Successfully linked proposals become `APPLIED`.

### Past actual report / 過去実績

1. The runner reports completed training.
2. The LLM presents every date, status, distance, duration, heart rate, Notes, AI Actual Comment, and destination.
3. The runner approves the exact Payload.
4. `validateActualReportBatch()` checks the entire batch.
5. `applyActualReportBatch()` revalidates and applies the batch.
6. `Training_Plan` is read back for verification.
7. `Actual_Update_Log` stores the audit result.

## Compatibility and migration / 互換性と移行

v0.3.2 preserves the existing `Training_Plan` columns A:O and adds columns P:S.

v0.3.2では、既存`Training_Plan`のA:Oを移動せず、P:Sを追加します。

The migration also:

* Creates or validates `Actual_Update_Log`
* Adds validation rules for Actual Source and Actual Status
* Creates `ACTUAL_REVIEWED_THROUGH` at `Dashboard!O5`
* Stores the schema version as `0.3.2`
* Stops if incompatible headers, duplicate IDs, invalid metadata, or conflicting existing data are found

The migration is designed to preserve compatible existing data. It does not automatically convert unrelated or structurally incompatible sheets.

## Legacy exclusions / 旧仕様からの除外

The following v0.1.x and v0.2.0 structures are not part of the v0.3.2 sheet schema:

以下の旧構成は、v0.3.2のシート仕様には含まれません。

* `LLM_Export`
* `LLM_Bridge`
* `Generated_Plan`
* `Strava_Setup`
* `Strava_Activities`
* Dashboard prompt-copy area
* Dashboard response-JSON paste area
* Dedicated Fatigue column

Historical files may remain in Git history, but new v0.3.2 workbooks must use the six-sheet structure defined in this document.
