# Testing

This project is a Google Apps Script project, so full end-to-end testing requires a Google Sheet. Before publishing a release, run the local smoke test and then do a short manual Apps Script check.

## Local Smoke Test

Run:

```sh
node tests/publication_smoke_test.js
```

This checks:

- `running_ai_karte_combined.gs` matches the split source files
- utility date, number, and pace helpers
- AI response JSON extraction
- Strava callback/code extraction
- license placeholder removal

## Manual Google Sheets Check

1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste `running_ai_karte_combined.gs`.
4. Run `initializeRunningAiKarte()`.
5. Confirm these sheets are created:
   - `Dashboard`
   - `Training_Plan`
   - `Event_Calendar`
   - `LLM_Export`
   - `LLM_Response_Log`
   - `Strava_Setup`
   - `Strava_Activities`
6. Confirm `LLM_Export`, `Strava_Setup`, and `Strava_Activities` are hidden after initialization.
7. Reload the Google Sheet.
8. Confirm `Dashboard` A3:C3 shows the `Action / 操作` dropdown.
9. Confirm `Training_Plan` covers the previous month, current month, and next month only.
10. Confirm today is highlighted, Saturday is blue, and Sunday/Japanese holidays are orange.
11. Fill in `Dashboard` B7, B8, and B9.
12. Select `2. Generate AI prompt / AIプロンプト生成` from `Dashboard` A3:C3.
13. Confirm a compressed prompt appears in `Dashboard` A12 and a readable multi-line prompt appears in `LLM_Export`.
14. Paste an AI response containing the requested JSON inside `Dashboard` A16.
15. Confirm the response is imported automatically, or select `3. Import AI response / AI回答を取り込む` from `Dashboard` A3:C3.
16. Confirm a row is appended to `LLM_Response_Log`.
17. Confirm `Dashboard` A16 is cleared after importing.
18. Confirm `Dashboard` A23 shows the planned review title and A25:L25 shows the review headers.
19. If the AI response includes `plan_updates`, confirm matching AI suggestions appear in columns G:K.
20. Check `AI Copy` in column F for a row with an AI suggestion and confirm columns G:J are copied into B:E.
21. Edit any value in columns B:E and confirm column L is checked automatically.
22. Select `4. Apply selected rows / 選択行を反映` from `Dashboard` A43:C43.
23. Confirm checked rows are reflected in `Training_Plan` columns C:F.

If the Dashboard dropdown does not work, run the same functions directly from the Apps Script editor:

- `generateLLMPrompt()`
- `importAIResponse()`

## Optional Strava Check

Only run this with your own Strava API application.

1. Select `Show Strava setup / Strava設定を表示` from `Dashboard` A20:C20.
2. Enter `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`.
3. Select `Create Strava auth URL / Strava認証URL作成` from `Dashboard` A20:C20.
4. Open the generated URL and authorize.
5. Paste the callback URL or code into `STRAVA_CALLBACK_URL_OR_CODE`.
6. Select `Exchange Strava code / Strava認証コード交換` from `Dashboard` A20:C20.
7. Confirm `STRAVA_CLIENT_SECRET` and `STRAVA_CALLBACK_URL_OR_CODE` are cleared from the sheet.
8. Select `Fetch Strava activities / Stravaログ取得` from `Dashboard` A20:C20.
9. Select `Sync Strava to Training_Plan / Strava実績反映` from `Dashboard` A20:C20.
10. Confirm actual distance, duration, average heart rate, and notes are reflected in `Training_Plan`.

If the Dashboard dropdown does not work, run the Strava functions directly from the Apps Script editor.
