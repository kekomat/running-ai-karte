# AIカルテ v0.3.3 Contract Foundation

本書は [sheet-spec.md](sheet-spec.md) のv0.3.2仕様に対する追加Contractです。列追加、既存Gatewayの権限拡張、RDJ Adapterの実装は含みません。

## Event_Calendar Date

| 項目 | Contract |
| --- | --- |
| 対象 | A列、A2から現在のグリッド最終行まで |
| Logical Type | DATE（イベントの暦日） |
| Physical Type | Google Sheets native date、Apps Script読み取り時は有効なDate |
| Format | yyyy/MM/dd |
| Validation | Sheets API: DATE_IS_VALID / Apps Script: DATE_IS_VALID_DATE、無効入力を拒否 |
| Nullable | 行全体が未使用の場合のみ空欄可 |
| Timezone | Spreadsheet timezoneを正本とする。運用基準はAsia/Tokyo。移行で変更しない |
| Human Write | 可 |
| LLM Write | 承認されたdomain writeのみ。日付文字列をTEXTとして保存しない |

書式だけでは型を保証しません。書き込み後は型・日付・書式・Validationを読み戻します。APIの入力規則だけで空欄、数式、書き込み権限を保証できるとは扱いません。使用行の日付は必須、数式日付は不可。同日複数イベントは可です。新しい行をグリッド外へ追加した場合は移行を再実行します。

## Training_Plan Column Contract

以下は仕様の定義です。今回のmigrationはTraining_Planの値・書式・Validationを変更しません。空欄は未取得を意味し、0とは区別します。A/Bは使用行で必須、他列は未取得・未設定なら空欄可です。数値は有限値、IDは文字列として扱います。

| 列 | Logical / Physical Type | Validation・意味 | Write Authority |
| --- | --- | --- | --- |
| A Date | DATE / native date | 1日1行、一意、yyyy/MM/dd、シートTZ | カレンダー管理処理。通常の人・LLM編集不可 |
| B Type | ENUM / string | Rest, Recovery, Jog, Long Run, Workout, Race, Other, TBD | 人の編集／Dashboard Apply |
| C Planned Workout | TEXT / string | 採用済みメニュー | 人の編集／Dashboard Apply |
| D Target Pace | TEXT / string | ペース・強度・時間、数値日付に変換しない | 人の編集／Dashboard Apply |
| E Plan km | DECIMAL / number | 0以上、km | 人の編集／Dashboard Apply |
| F AI Comment | TEXT / string | 計画の評価、Factではない | 人の編集。LLMは提案経路のみ、直接更新不可 |
| G Result / Notes | TEXT / string | 主観・ユーザー報告、出典を明示 | 人／承認済みGatewayの空欄登録 |
| H Actual km | DECIMAL / number | 0以上、km、推定を実績にしない | Manual編集／既存同期／承認済みGateway |
| I Duration min | DECIMAL / number | 0以上、分、移動・経過時間の区別を確認 | Manual編集／既存同期／承認済みGateway |
| J Avg HR | DECIMAL / number | 0より大、bpm、未取得は空欄 | Manual編集／既存同期／承認済みGateway |
| K Actual Source | ENUM / string | Strava, Manual, LLM_USER_REPORT | 既存の実績登録処理が割当、LLM直接編集不可 |
| L Activity Count | INTEGER / number | 0以上、同日件数 | 同期処理のみ |
| M Main Activity ID | ID / string | 元Activity識別子、丸め禁止 | 同期処理のみ |
| N Max HR | DECIMAL / number | 0より大、bpm、平均があれば平均以上 | 同期処理のみ |
| O Analysis Mode | ENUM / string | Daily, Detail。RDJのanalysis_modeと別概念 | システム／同期処理のみ |
| P AI Actual Comment | TEXT / string | AI解釈、根拠と限界を明示 | 人／承認済みGatewayの空欄登録 |
| Q Actual Status | ENUM / string | COMPLETED, PARTIAL, REST, SKIPPED | Gateway／同期処理のみ |
| R Actual Updated At | TIMESTAMP / native date | yyyy/MM/dd HH:mm:ss | Gateway／同期処理のみ |
| S Actual Update ID | ID / string | 空欄でなければ一意、Actual_Update_Logと対応 | Gateway／同期処理のみ |

現行Gatewayの入力上限・範囲（距離0–300 km、時間0–1440分、平均心拍20–260 bpm）も引き続き適用します。

Stravaの客観値は保護します。Manual／LLM_USER_REPORTの既存実績は通常登録で上書きしません。F列の提案反映は現行Apply（B:E）の対象外であり、本段階では新しい書き込み経路を追加しません。

## LLM Operating Instructions

1. 最新のLLM_BRIEF、対象行、Snapshot、列ヘッダを読み、対象日が一意か確認します。将来計画・実績・イベントの経路を区別します。
2. RDJ読み取りは外部のConsumer v1.4を参照します。AIカルテへコピー実装しません。質問に必要なEvidenceだけを取得し、保存済みD2の方式・版・鮮度・品質を確認します。Evidence不足を推測値で埋めません。
3. RDJ Fact、User Context、AI Interpretationを分離します。意図や体調の説明をRDJが証明した事実として記述しません。
4. Actual Sourceは実績の由来を表し、LLMという書き手の表示欄ではありません。現行GatewayのLLM_USER_REPORTは承認済み会話報告に限定します。RDJ Factをこの経路で自動転記して出典を付け替えません。対応する同期経路がなければ、反映案と未対応理由を提示します。
5. 書き込み前に対象日・列・変更前後・出典・書き込み先を提示し、承認を得ます。承認済み実績はvalidateActualReportBatch() → applyActualReportBatch()を利用し、Confirmation ID・行hash・payload hashを維持します。監査はActual_Update_Logを利用し、Actor列を追加しません。
6. 将来計画はProposal_Staging → 人の確認 → Dashboard Applyを維持します。Training_Planへの直接LLM更新は行いません。
7. EventはEvent IDで特定し、native dateとして記録します。曖昧な日付は確認します。削除はCANCELLEDで扱います。
8. 書き込み後は対象セル・監査結果を読み戻して報告します。競合・対象不明・型不一致では停止し、未成功を成功と扱いません。

## Migration手順と互換性

- Devシートのバックアップ後、previewMigrationV033()で読み取り検査します。v0.3.2導入済み、A:S／Eventヘッダ一致、使用Event行のnative dateを要求します。文字列日付・数式・日付欠落は行番号付きで停止し、自動変換しません。
- migrateToV033()はDocument Lock取得後に再検査し、Event A列の書式とValidationのみ適用、flushと読み戻し検証後にAI_KARTE_CONTRACT_VERSION=0.3.3を保存します。再実行可能です。
- SCHEMA_VERSIONは0.3.2のまま保持します。既存migrateToV032()とinstall処理の互換性を保つため、Contract版は独立したDocument Propertyで管理します。これはv0.3.3全機能の移行完了を意味しません。
- Sheets操作はトランザクションではありません。途中失敗時には書式だけ変更済みの場合があります。版の印だけで成功判定せず再検査・再実行してください。既存の印も正常性を保証しません。
- 本段階ではDevへの配信・移行検証のみ行い、Stableへの配信・移行とLLM_BRIEFの書き換えは行いません。Training_Plan ValidationとInstructionsの実行時組み込みは次段階です。

## 検証

ローカル: `node tests/migration_v033_test.js`。Dev Apps Scriptではpreview、初回migration、再実行を行い、A列の型・書式・無効日付拒否とB:J／Training_Plan／既存schema propertyの不変を確認します。文字列日付・欠落・数式・ヘッダ不一致はバックアップのコピーで試し、変更前に停止することを確認します。
