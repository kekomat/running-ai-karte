/** Running AI Karte v0.3.2 - self-contained LLM brief generation. */

const LLM_BRIEF_V030 = Object.freeze({
  STORAGE: Object.freeze({
    BRIEF: 'O1', SNAPSHOT_ID: 'O2', GENERATED_AT: 'O3', DASHBOARD_URL: 'O4',
    ACTUAL_REVIEWED_THROUGH: 'O5'
  }),
  NAMED_RANGES: Object.freeze({
    LLM_BRIEF: 'O1', LLM_BRIEF_SNAPSHOT_ID: 'O2', LLM_BRIEF_GENERATED_AT: 'O3',
    DASHBOARD_URL: 'O4', ACTUAL_REVIEWED_THROUGH: 'O5'
  })
});

function ensureLlmBriefNamedRangesV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (!dashboard) throw new Error('Dashboardシートが存在しません。');
  Object.keys(LLM_BRIEF_V030.NAMED_RANGES).forEach(function(name) {
    ss.setNamedRange(name, dashboard.getRange(LLM_BRIEF_V030.NAMED_RANGES[name]));
  });
  dashboard.hideColumns(15);
}

/** Generate the common LLM entrypoint without calling an LLM API. */
function buildLlmBrief() {
  ensureLlmBriefNamedRangesV030_();
  const coverage = ensureTrainingPlanCoverageV032_();
  const generatedAt = new Date();
  const dashboardUrl = getDashboardUrlV030_();
  const todayNote = getDashboardV030NamedRange_('DASH_TODAYS_NOTE').getDisplayValue().trim();
  const dashboardSummary = [
    briefLineV030_('Training Goal', 'DASH_TRAINING_GOAL'),
    briefLineV030_('Policy / Constraints', 'DASH_POLICY_CONSTRAINTS'),
    briefLineV030_('Recent Training', 'DASH_RECENT_TRAINING'),
    briefLineV030_('Upcoming Events', 'DASH_UPCOMING_EVENTS'),
    briefLineV030_('Today Plan', 'DASH_TODAY_PLAN'),
    briefLineV030_('Tomorrow Plan', 'DASH_TOMORROW_PLAN'),
    briefLineV030_('Next Key Workout', 'DASH_NEXT_KEY_WORKOUT'),
    '- Today Note: ' + (todayNote || '(none)')
  ];
  const trainingContext = renderTrainingPlanBriefV030_();
  const actualReviewContext = renderActualReviewContextV032_();
  const eventContext = renderEventCalendarBriefV030_();
  const proposalContext = renderPendingProposalsBriefV030_();
  const fingerprint = [dashboardSummary.join('\n'), trainingContext, actualReviewContext,
    eventContext, proposalContext, coverage.proposalStart, coverage.proposalEnd].join('\n---\n');
  const snapshotId = createLlmBriefSnapshotIdV030_(fingerprint);
  const sections = [
    '# Running AI Karte LLM_BRIEF', '',
    'Snapshot ID: ' + snapshotId,
    'Generated At: ' + Utilities.formatDate(generatedAt,
      SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE,
      'yyyy/MM/dd HH:mm:ss'),
    'Dashboard URL: ' + dashboardUrl, '',
    '## Source of truth and write boundaries',
    '- Training_Plan: adopted daily plan and actuals. LLM must not update future plan fields directly.',
    '- Event_Calendar: confirmed goals, races, important workouts and constraints.',
    '- Proposal_Staging: approved but unapplied future date-specific AI proposals.',
    '- Actual_Update_Log: audit trail for approved actual-report writes.',
    '- LLM_Response_Log: approved consultation summaries and assessments.',
    '- Dashboard: human review, adjustment and selective apply workspace.',
    '- Ask "AIカルテへ記録しますか？" before any write.',
    '- Never write inferred distance, duration or heart rate as a confirmed fact.', '',
    '## Proposal contract',
    '- Proposal window: ' + coverage.proposalStart + ' .. ' + coverage.proposalEnd + ' (inclusive).',
    '- Canonical Workout Type: ' + DASHBOARD_V030.PLAN_TYPES.join(' / '),
    '- Do not normalize aliases such as Easy, Tempo, Interval or Off into Workout Type.',
    '- Future proposals -> Proposal_Staging; Training_Plan changes only after Dashboard Apply.', '',
    '## Actual-report contract',
    '- Past dates, or today only when the user explicitly says the workout is complete.',
    '- Actual Status: ' + Object.keys(ACTUAL_STATUSES).map(function(key) {
      return ACTUAL_STATUSES[key];
    }).join(' / '),
    '- Actual Source is assigned by GAS: Strava / Manual / LLM_USER_REPORT.',
    '- Preview every date, status, distance, duration, HR, Notes, AI Actual Comment and target before approval.',
    '- validateActualReportBatch() creates Confirmation ID, Expected Row Hash and Payload Hash.',
    '- applyActualReportBatch() requires the exact approved payload and applies All-or-Nothing.',
    '- Strava objective values are protected; Manual and LLM_USER_REPORT rows conflict with normal registration.', '',
    '## Current Dashboard summary', dashboardSummary.join('\n'), '',
    '## Training context (last 14 days and adopted future plan)', trainingContext, '',
    '## Unreported actual review', actualReviewContext, '',
    '## Event_Calendar context', eventContext, '',
    '## Pending proposals', proposalContext, '',
    '## Recording routes',
    '- Assessment / consultation summary -> LLM_Response_Log',
    '- Confirmed goal / event / constraint -> Event_Calendar',
    '- Future date-specific plan proposal -> recordProposalStaging()',
    '- Approved past actuals -> validateActualReportBatch() then applyActualReportBatch()',
    '- After a successful future proposal write, provide the Dashboard URL and ask the user to Refresh Dashboard.'
  ];

  getDashboardV030NamedRange_('LLM_BRIEF').setValue(sections.join('\n'));
  getDashboardV030NamedRange_('LLM_BRIEF_SNAPSHOT_ID').setValue(snapshotId);
  getDashboardV030NamedRange_('LLM_BRIEF_GENERATED_AT')
    .setValue(generatedAt).setNumberFormat('yyyy/MM/dd HH:mm:ss');
  getDashboardV030NamedRange_('DASHBOARD_URL').setValue(dashboardUrl);
  return {snapshotId: snapshotId, generatedAt: generatedAt, dashboardUrl: dashboardUrl,
    proposalStart: coverage.proposalStart, proposalEnd: coverage.proposalEnd};
}

function createLlmBriefSnapshotIdV030_(fingerprint) {
  return 'SNP-' + sha256HexV032_(String(fingerprint || '')).slice(0, 16);
}

function briefLineV030_(label, namedRange) {
  return '- ' + label + ': ' +
    (getDashboardV030NamedRange_(namedRange).getDisplayValue().trim() || '(none)');
}

function renderTrainingPlanBriefV030_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet || sheet.getLastRow() < 2) return '(no rows)';
  const width = Math.min(sheet.getLastColumn(), TP_COLS.ACTUAL_UPDATE_ID);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  const today = dashboardTodayV030_();
  const selected = rows.filter(function(row) {
    const diff = dashboardDateDiffV030_(row[0], today);
    return diff !== null && diff >= -13 && diff <= 30;
  }).sort(function(a, b) {
    return normalizeDashboardDateV030_(a[0]).getTime() - normalizeDashboardDateV030_(b[0]).getTime();
  });
  if (!selected.length) return '(no rows in -13..+30 day window)';
  return selected.map(function(row) {
    return '- ' + [
      dashboardDateKeyV030_(row[TP_COLS.DATE - 1]),
      row[TP_COLS.TYPE - 1] || 'TBD', row[TP_COLS.WORKOUT - 1] || '',
      row[TP_COLS.TARGET_PACE - 1] || '',
      isDashboardV030Blank_(row[TP_COLS.PLAN_KM - 1]) ? '' :
        'plan ' + row[TP_COLS.PLAN_KM - 1] + 'km',
      row[TP_COLS.RESULT_NOTES - 1] || '',
      isDashboardV030Blank_(row[TP_COLS.ACTUAL_KM - 1]) ? '' :
        'actual ' + row[TP_COLS.ACTUAL_KM - 1] + 'km',
      isDashboardV030Blank_(row[TP_COLS.DURATION_MIN - 1]) ? '' :
        row[TP_COLS.DURATION_MIN - 1] + 'min',
      isDashboardV030Blank_(row[TP_COLS.AVG_HR - 1]) ? '' :
        'HR ' + row[TP_COLS.AVG_HR - 1],
      row[TP_COLS.ACTUAL_SOURCE - 1] ? 'source ' + row[TP_COLS.ACTUAL_SOURCE - 1] : '',
      row[TP_COLS.ACTUAL_STATUS - 1] ? 'status ' + row[TP_COLS.ACTUAL_STATUS - 1] : '',
      row[TP_COLS.AI_ACTUAL_COMMENT - 1] || ''
    ].filter(Boolean).join(' | ');
  }).join('\n');
}

function renderEventCalendarBriefV030_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
  if (!sheet || sheet.getLastRow() < 2) return '(no rows)';
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1,
    Math.min(sheet.getLastColumn(), 10)).getValues();
  const today = dashboardTodayV030_();
  const selected = rows.filter(function(row) {
    const diff = dashboardDateDiffV030_(row[0], today);
    return diff !== null && diff >= -7 &&
      String(row[7] || 'ACTIVE').toUpperCase() !== 'CANCELLED';
  }).sort(function(a, b) {
    return normalizeDashboardDateV030_(a[0]).getTime() - normalizeDashboardDateV030_(b[0]).getTime();
  });
  if (!selected.length) return '(no active rows)';
  return selected.slice(0, 30).map(function(row) {
    return '- ' + [dashboardDateKeyV030_(row[0]), row[1], row[2], row[3], row[4], row[5]]
      .filter(function(value) { return !isDashboardV030Blank_(value); }).join(' | ');
  }).join('\n');
}

function renderPendingProposalsBriefV030_() {
  const proposals = getPendingProposalsV030_();
  if (!proposals.length) return '(none)';
  return proposals.map(function(item) {
    return '- ' + [item.proposalId, item.date, item.type, item.workout,
      isDashboardV030Blank_(item.planKm) ? '' : item.planKm + 'km',
      item.targetPace, item.status, item.warning].filter(Boolean).join(' | ');
  }).join('\n');
}

function getDashboardUrlV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (!dashboard) throw new Error('Dashboardシートが存在しません。');
  return ss.getUrl() + '#gid=' + dashboard.getSheetId() + '&range=A1';
}
