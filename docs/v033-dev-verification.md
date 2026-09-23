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
