/** Running AI Karte v0.3.2 - Training_Plan calendar coverage and review helpers. */

function ensureTrainingPlanCoverageV032_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet) throw new Error('Training_Planシートが存在しません。');
  const timezone = ss.getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE;
  const today = dashboardTodayV030_();
  const activeStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const proposalEnd = addCalendarMonthsClampedV032_(today, DASHBOARD_V030.PROPOSAL_HORIZON_MONTHS);
  const existingRows = sheet.getLastRow() >= 2
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(sheet.getLastColumn(), TP_COLS.ACTUAL_UPDATE_ID))
      .getValues() : [];
  const counts = {};
  existingRows.forEach(function(row, index) {
    const key = isoDateV032_(row[0], timezone);
    if (!key) throw new Error('TRAINING_PLAN_DATE_INVALID: row=' + (index + 2));
    counts[key] = (counts[key] || 0) + 1;
  });
  Object.keys(counts).forEach(function(key) {
    if (counts[key] !== 1) throw new Error('TRAINING_PLAN_DATE_DUPLICATE: ' + key);
  });

  const rows = [];
  for (let cursor = activeStart; cursor.getTime() <= proposalEnd.getTime();
      cursor = addCalendarDaysV032_(cursor, 1)) {
    const key = isoDateV032_(cursor, timezone);
    if (!counts[key]) {
      const row = new Array(TP_COLS.ACTUAL_UPDATE_ID).fill('');
      row[TP_COLS.DATE - 1] = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      row[TP_COLS.TYPE - 1] = 'TBD';
      row[TP_COLS.ANALYSIS_MODE - 1] = 'Daily';
      rows.push(row);
    }
  }
  if (rows.length) {
    const start = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(start, 1, rows.length, TP_COLS.ACTUAL_UPDATE_ID).setValues(rows);
    sheet.getRange(2, 1, sheet.getLastRow() - 1, TP_COLS.ACTUAL_UPDATE_ID)
      .sort({column: TP_COLS.DATE, ascending: true});
  }
  return {
    activeStart: isoDateV032_(activeStart, timezone),
    proposalStart: isoDateV032_(today, timezone),
    proposalEnd: isoDateV032_(proposalEnd, timezone),
    addedRows: rows.length
  };
}

function addCalendarMonthsClampedV032_(date, months) {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

function getActualReviewContextV032_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timezone = ss.getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE;
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  const pointerRange = ss.getRangeByName('ACTUAL_REVIEWED_THROUGH');
  const pointerText = pointerRange
    ? String(pointerRange.getDisplayValue() || '').trim().replace(/\//g, '-') : '';
  const today = dashboardTodayV030_();
  const yesterday = addCalendarDaysV032_(today, -1);
  const start = pointerText && isIsoDateTextV032_(pointerText)
    ? addCalendarDaysV032_(normalizeDashboardDateV030_(pointerText), 1)
    : addCalendarDaysV032_(yesterday, -13);
  const rows = sheet && sheet.getLastRow() >= 2
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, TP_COLS.ACTUAL_UPDATE_ID).getValues() : [];
  const candidates = rows.filter(function(row) {
    const date = normalizeDashboardDateV030_(row[TP_COLS.DATE - 1]);
    if (!date || date.getTime() < start.getTime() || date.getTime() > yesterday.getTime()) return false;
    const type = String(row[TP_COLS.TYPE - 1] || '').trim();
    if (type === 'Rest' || type === 'TBD') return false;
    return !isActualReviewDateResolvedV032_(row);
  }).sort(function(a, b) {
    return normalizeDashboardDateV030_(a[0]).getTime() - normalizeDashboardDateV030_(b[0]).getTime();
  });
  return {
    pointer: pointerText || '(not set)',
    reviewStart: isoDateV032_(start, timezone),
    reviewEnd: isoDateV032_(yesterday, timezone),
    candidates: candidates.slice(0, 31),
    totalCandidates: candidates.length,
    remainingCount: Math.max(candidates.length - 31, 0),
    oldestRemaining: candidates.length > 31 ? isoDateV032_(candidates[31][0], timezone) : '',
    newestRemaining: candidates.length > 31 ? isoDateV032_(candidates[candidates.length - 1][0], timezone) : ''
  };
}

function renderActualReviewContextV032_() {
  const context = getActualReviewContextV032_();
  const lines = [
    '- Actual Reviewed Through: ' + context.pointer,
    '- Review window: ' + context.reviewStart + ' .. ' + context.reviewEnd,
    '- Unreported candidates: ' + context.totalCandidates
  ];
  context.candidates.forEach(function(row) {
    lines.push('- ' + [isoDateV032_(row[0]), row[TP_COLS.TYPE - 1] || 'TBD',
      row[TP_COLS.WORKOUT - 1] || '',
      isDashboardV030Blank_(row[TP_COLS.PLAN_KM - 1]) ? '' :
        'plan ' + row[TP_COLS.PLAN_KM - 1] + 'km'].filter(Boolean).join(' | '));
  });
  if (context.remainingCount) {
    lines.push('- Remaining after first 31: ' + context.remainingCount +
      ' (' + context.oldestRemaining + ' .. ' + context.newestRemaining + ')');
  }
  return lines.join('\n');
}
