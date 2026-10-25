# v0.3.3 Dev検証記録

- 対象: Running AI Karte v0.3.3 Dev（.clasp.jsonのparentIdとDrive metadataを照合）。Stableへの配信は未実施。
- 配信前: Devの既存GAS 9ファイルとmanifestがローカルに完全一致。
- ローカル: migration専用モックテスト11件成功。旧publication smoke testは旧src構成の欠落により実行不可（前回確認）。
- 配信: clasp push（強制オプションなし）成功。migrationV033.gsを含む11ファイル。acceptanceTests.gsは配信・Git双方で除外。
- 配信後: リモートを別フォルダーへ取得し、GAS 10ファイルの内容がローカルに一致。
- 事前検査: clasp run previewMigrationV033 はGoogle側のstorage NOT_FOUNDエラー。関数の検査結果は未取得であり、PASS扱いにしない。
- 修正版migrateToV033はユーザー提供ログ（14:16:13開始、14:16:16完了）で正常終了を確認。処理内の書式・Validation・Contract版保存の検証を通過。正常終了後の再実行は2026/09/23 18:26:30、8.222秒、完了（ユーザー提供の実行履歴）で確認。独立したシート読み戻し・変更対象外セルの前後比較は未実施。
- Devは運用していないためバックアップなしで進めてよい旨、ユーザー承認済み。

## 再開手順

移行の初回成功・成功後の再実行を確認済み。今回の改修単位をGitで確定し、Training_Plan ValidationとLLM Instructionsの実行時組み込みを次段階とする。独立したシート読み戻し・対象外セルの前後比較は未実施であり、全面的な実機受入完了とは扱わない。

## 実機検証で判明した定数名の修正

ユーザーによるpreviewMigrationV033は正常終了。migrateToV033はrow=2の読み戻し検証で失敗。Apps Scriptの正しい定数DATE_IS_VALID_DATEをSheets APIのDATE_IS_VALIDと混同していたため修正。テストのAPIモックも修正し、修正前の失敗を再現、修正後14件成功。初回失敗では書式・入力規則は適用済みの可能性があるが、Contract版の保存処理には未到達。修正版の初回成功ログは上記のとおり。正常終了後の再実行確認も上記のユーザー提供履歴で完了。

## 2026-09-23 再開時のローカル確認

- develop/v0.3.3、ローカル追跡参照origin/develop/v0.3.3より1コミット先（fetchは未実施）。
- Contract文書・migrationV033.gs・専用テスト・本記録は未コミット。
- 専用モックテスト14件を再実行し成功。
- acceptanceTests.gsのGit除外を確認。配信先設定のIDは前回と同じ。

## Training_Plan Validation 第2段階

日付・数値7列の移行処理とpreviewを新設。ローカル専用テスト27件成功。既存の移行基盤テスト14件も維持。全production GASの結合構文チェックも成功。Devへの配信前に既存ソースを取得しようとしたが、claspの認証がinvalid_grant / invalid_raptで失効しており、配信・実機検証は未実施。再認証後にリモートとの比較、通常push、previewTrainingPlanValidationV033、applyTrainingPlanValidationV033の順で再開する。

Drive Connectorの読み取りではDevシート名とTraining_PlanのA:Sヘッダ、先頭7データ行の既存B/K/O/Q入力規則を確認。Event_Calendar A2:A3のyyyy/MM/dd・DATE_IS_VALID・strict=trueも確認した。Training_Plan全行の事前検査は未実施。

## 2026-10-25 開発ブランチ保存前の確認

- 2026-09-23の「未コミット」は当時の状態。Contract文書・移行基盤・専用テストは、その後のコミット `b4551e4` に保存済み。
- 今回の保存対象は、Training_Plan Validation本体・専用テストと、Contract文書・本検証記録の4ファイル。
- 保存前に移行基盤テスト14件、Training_Plan Validationテスト27件を再実行し、合計41件成功。production GAS 11ファイルの結合構文チェックも成功。
- 上記はローカルのモックテスト・構文確認。Training_Plan Validation第2段階のDev配信・実機検証は未実施であり、正式リリース可能との判定ではない。
- GitHubの開発ブランチへの保存とGASへの配信は別操作。今回はmainへの統合、Release・タグ作成、GASへの配信は行わない。
