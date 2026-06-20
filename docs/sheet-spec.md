# Running AI Karte - Sheet Specification

Running AI Karte は、市民ランナー向けの Google Sheets ベース AI ランニングカルテです。

設計方針は次の通りです。

- 初回GitHub公開版は v0.1.0 とする
- 手入力だけで使えることを最優先にする
- Strava API 連携は同梱するが、任意の Advanced 機能として扱う
- CSV インポートは対象外とする
- AI は提案役とし、Training_Plan の正本を自動で書き換えない
- Google Sheets を軽量 DB 兼 UI として使う

---

## Sheets

| Sheet | Required | Role |
|---|---:|---|
| Dashboard | Yes | 日常操作、主観入力、AIプロンプト、AI回答貼り付け |
| Training_Plan | Yes | 練習予定・実績の正本 |
| Event_Calendar | Yes | レース・イベント予定 |
| LLM_Export | Yes | AIに渡すプロンプトの保管 |
| LLM_Response_Log | Yes | AI回答の履歴 |
| Strava_Setup | Optional | Strava API設定 |
| Strava_Activities | Optional | Stravaから取得したRunログ |

---

## Training_Plan

Training_Plan は正本です。AI提案やStrava実績はここに集約しますが、AIが自動で予定を書き換えることは v0.1.0 では行いません。

Training_Plan は現在月の前後1ヶ月だけを保持します。たとえば 2026/06/14 時点では 2026/05/01 から 2026/07/31 までを保持し、2026/07/01 になった時点では 2026/06/01 から 2026/08/31 までに更新します。範囲外の古い行は削除されます。過去の実績はStrava側に残る前提です。

| Col | Header | Required | Source | Description |
|---:|---|---:|---|---|
| A | Date | Yes | Manual / Setup | 日付。yyyy/MM/dd 推奨 |
| B | Day | Auto | GAS | 曜日 |
| C | Type | Optional | Manual | Rest, Recovery, Jog, Long Run, Workout, Race, Other, TBD |
| D | Planned Workout | Optional | Manual | 予定メニュー |
| E | Target Pace | Optional | Manual | 例: 5:00/km, E pace |
| F | Planned Distance km | Optional | Manual | 予定距離 |
| G | Actual Distance km | Optional | Manual / Strava | 実績距離 |
| H | Actual Duration min | Optional | Manual / Strava | 実績時間 |
| I | Avg HR | Optional | Manual / Strava | 平均心拍 |
| J | Fatigue | Optional | Manual | 主観疲労 1〜5 |
| K | Notes | Optional | Manual / Strava | 睡眠、痛み、天候、Strava URLなど |
| L | AI Comment | Optional | Manual / AI | AIコメント、振り返り、判定 |

### Type values

推奨値は以下です。運用上は自由入力でも構いません。

- Rest
- Recovery
- Jog
- Long Run
- Workout
- Race
- Other
- TBD

### Fatigue values

| Value | Meaning |
|---:|---|
| 1 | とても軽い |
| 2 | 軽い |
| 3 | 普通 |
| 4 | 重い |
| 5 | かなり重い |

### Date highlights

Training_Plan と Dashboard のスケジュール表示では、日付に応じて背景色を付けます。

| Date type | Color |
|---|---|
| Today | `#fff2cc` |
| Sunday / Japanese holiday | `#fce5cd` |
| Saturday | `#c9daf8` |
| Weekday | no background |

Today が土日祝日と重なる場合は Today の色を優先します。日本の祝日は Google Calendar の `ja.japanese#holiday@group.v.calendar.google.com` を参照します。

---

## Dashboard

Dashboard は「見る・入力する・AIに渡す・AI回答を保存する」だけに絞ります。

| Range | Purpose |
|---|---|
| A1:L1 | Title |
| A2:C3 | 日常操作 |
| A4:L4 | 操作ステータス |
| A6:L9 | 今の主観コンディション入力 |
| A11:L13 | AIプロンプトコピー欄。A12には1行圧縮プロンプトを出力 |
| A15:L17 | AI回答貼り付け欄。A16を読み取り、自動取り込み後にクリア |
| A19:L21 | メンテ操作 |
| A23:L40 | 予定レビュー。今日〜14日、最大15行 |
| A42:C43 | 予定レビューの更新操作 |
| A45:F54 | レース・イベント予定 |

### Dashboard input fields

| Cell | Field |
|---|---|
| A3:C3 | 日常操作 |
| B7:L7 | 今の感覚 |
| B8:L8 | 身体の状態 |
| B9:L9 | 相談したいこと |
| A16:L16 | AI回答貼り付け欄。取り込み後にクリア |
| A20:C20 | メンテ操作 |
| A43:C43 | 予定レビューの更新操作。選択行をTraining_Planへ反映 |
| B26:E40 | Dashboard上で編集できる予定欄。手修正するとL列UpdateがON |
| F26:F40 | AI提案コピー。G:Jの提案をB:Eへコピー |
| L26:L40 | 更新対象。ONの行だけA43:C43からTraining_Planへ反映 |

---

## Event_Calendar

Event_Calendar はレース・イベント予定を管理する専用シートです。Training_Plan 作成・更新時は、近いレースやイベントを考慮できる構造にします。

| Col | Header | Required | Description |
|---:|---|---:|---|
| A | Date | Yes | 日付 |
| B | Type | Optional | Race, Event, Other |
| C | Event Name | Yes | 大会名・イベント名 |
| D | Goal / Constraint | Optional | 目標、制約、注意点 |
| E | Plan km | Optional | レース距離・予定距離 |
| F | Priority | Optional | A, B, C, Other, TBD |
| G | Notes | Optional | 補足 |

---

## LLM_Export

| Col | Header | Description |
|---:|---|---|
| A | Generated At | 生成日時 |
| B | Prompt | AIに渡すプロンプト全文 |

---

## LLM_Response_Log

| Col | Header | Description |
|---:|---|---|
| A | Logged At | 保存日時 |
| B | Consultation Date | 相談日 |
| C | Summary | AI総評 |
| D | Fatigue Score | 疲労スコア |
| E | Fatigue Label | 疲労ラベル |
| F | Advice | 次回練習提案 |
| G | Coach Topics | コーチへの相談論点 |
| H | Karte Memo | カルテメモ |
| I | Raw Response | AI回答全文 |

---

## Strava_Setup

Strava連携は任意です。手入力だけでも利用できます。

| Key | Description |
|---|---|
| STRAVA_CLIENT_ID | Strava API Client ID |
| STRAVA_CLIENT_SECRET | Strava API Client Secret。交換後はシートから削除 |
| STRAVA_AUTH_URL | 認証URL。GASで生成 |
| STRAVA_CALLBACK_URL_OR_CODE | 許可後のURL全体または code |
| STRAVA_REFRESH_TOKEN | Script Properties 保存後は「saved」と表示 |
| STRAVA_SCOPE | 取得できた権限 |

---

## Strava_Activities

| Col | Header | Description |
|---:|---|---|
| A | Fetched At | 取得日時 |
| B | Activity ID | Strava Activity ID |
| C | Date | 日付 |
| D | Start Time | 開始時刻 |
| E | Title | タイトル |
| F | Type | Run |
| G | Distance km | 距離 |
| H | Duration min | 移動時間 |
| I | Avg Pace | 平均ペース |
| J | Avg HR | 平均心拍 |
| K | Max HR | 最大心拍 |
| L | Elevation Gain | 獲得標高 |
| M | Avg Cadence | 平均ケイデンス |
| N | Strava URL | URL |
| O | Raw JSON | 元データ |

---

## Sync rule: Strava to Training_Plan

任意のStrava連携では、Stravaログを Training_Plan の実績欄に反映します。

Training_Plan の現在月前後1ヶ月の範囲内にあるStravaログだけを反映します。

| Training_Plan | Rule |
|---|---|
| Actual Distance km | 同日のRun距離を合算 |
| Actual Duration min | 同日のRun時間を合算 |
| Avg HR | 距離加重平均。なければ空欄 |
| Notes | Strava URL。複数件の場合は件数と代表URL |

Training_Planに該当日がない場合は、新しい行を追加します。
