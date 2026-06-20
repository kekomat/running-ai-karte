# Test Results

## 2026-06-14 Public Release Candidate Check

Environment:

- Google Sheets
- Google Apps Script
- Chrome
- User-owned Google account
- User-owned Strava account

### Local Checks

- `running_ai_karte_combined.gs` matches split source files: PASS
- Apps Script source syntax check via Node.js parser: PASS
- Publication smoke test: PASS
- Secret pattern scan: PASS, no secrets detected

### Manual Mode

- `initializeRunningAiKarte()` created the expected sheets: PASS
- `generateLLMPrompt()` generated a compressed prompt in `Dashboard` A12 and a readable prompt in `LLM_Export`: PASS
- AI response pasted inside `Dashboard` A16 and imported: PASS
- `saveAIResponseLog()` appended a row to `LLM_Response_Log`: PASS

### Optional Strava Mode

- `showStravaSetup()` displayed Strava setup sheets: PASS
- Strava OAuth setup completed with user-owned Strava API credentials: PASS
- `fetchStravaActivities()` completed: PASS
- Run activities fetched: 185
- `syncStravaToTrainingPlan()` reflected Strava actuals in `Training_Plan`: PASS

### Known Note

- The Google Sheets custom menu did not appear reliably during the first manual test. The release candidate was updated so initialization now attempts to create the menu immediately and installs an open trigger for later spreadsheet opens. Direct Apps Script function execution remains documented as a fallback:
  - `generateLLMPrompt()`
  - `importAIResponse()`
  - `refreshActuals()`
  - `showStravaSetup()`
  - `createStravaAuthUrl()`
  - `exchangeStravaAuthorizationCodeFromSheet()`
  - `fetchStravaActivities()`
  - `syncStravaToTrainingPlan()`

This is not blocking for the core release. The primary beginner-friendly control path is now the `Dashboard` A3:C3 action dropdown, so the top custom menu is no longer required for normal use.
