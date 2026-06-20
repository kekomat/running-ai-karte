# Changelog

## v0.1.0 - Initial Public Release

This is the first GitHub release of Running AI Karte.

Although earlier internal drafts used labels such as `v0.1 Manual Mode` and `v0.3 Strava Connected Mode`, the first public release is consolidated as `v0.1.0`.

### Included

- Manual-first Google Sheets workflow
- Dashboard for subjective condition, prompt generation, and AI response logging
- Training_Plan, Event_Calendar, LLM_Export, and LLM_Response_Log sheets
- Optional Strava OAuth setup
- Optional Strava activity fetch
- Optional sync from Strava activities to Training_Plan actuals
- Single-file Apps Script version: `running_ai_karte_combined.gs`
- Split Apps Script files under `src/` and `optional-strava/`

### Not Included

- CSV import
- Automatic AI overwrite of Training_Plan
- Hosted backend service
- Medical, coaching, or race performance guarantees

### Future Candidates

- Separate display for AI suggestions beyond the first 14 days
- Training_Plan_Archive before rolling-window rows are removed
- Automatic Type update from `TBD` when actual results are available
