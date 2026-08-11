/** Running AI Karte v0.3.0 - Training_Plan repository and Dashboard projections. */

function updateTrainingPlanFromDashboardV030_(items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet) throw new Error('Training_Planシートが存在しません。');

  const lastRow = sheet.getLastRow();
  const values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 5).getValues() : [];
  const rowsByDate = {};
  values.forEach(function(row, index) {
    const key = dashboardDateKeyV030_(row[0]);
    if (!key) return;
    if (!rowsByDate[key]) rowsByDate[key] = [];
    rowsByDate[key].push(index + 2);
  });

  const result = {successCount: 0, failCount: 0, succeededDashboardRows: [], errors: []};

  items.forEach(function(item) {
    const key = dashboardDateKeyV030_(item.date);
    if (!key) return addTrainingPlanApplyErrorV030_(result, 'Row ' + item.dashboardRow + ': 日付が不正です');

    const matches = rowsByDate[key] || [];
    if (!matches.length) return addTrainingPlanApplyErrorV030_(result, key + ': Training_Planに対象日がありません');
    if (matches.length > 1) return addTrainingPlanApplyErrorV030_(result, key + ': Training_Planに同一日付が複数あります');

    let proposal = null;
    if (item.proposalId) {
      try {
        proposal = validateProposalForApplyV030_(item.proposalId, key);
      } catch (error) {
        return addTrainingPlanApplyErrorV030_(result, key + ': ' + error.message);
      }
    }

    const targetRow = matches[0];
    const before = sheet.getRange(targetRow, 2, 1, 4).getValues();
    try {
      sheet.getRange(targetRow, 2, 1, 4).setValues([[
        isDashboardV030Blank_(item.type) ? 'TBD' : item.type,
        item.workout || '',
        item.targetPace || '',
        normalizeOptionalNumberV030_(item.planKm, 'Plan km')
      ]]);
      if (proposal) markProposalAppliedV030_(proposal.rowNumber);
      result.successCount++;
      result.succeededDashboardRows.push(item.dashboardRow);
    } catch (error) {
      sheet.getRange(targetRow, 2, 1, 4).setValues(before);
      addTrainingPlanApplyErrorV030_(result, key + ': ' + error.message);
    }
  });

  if (result.successCount && typeof applyTrainingPlanHighlights_ === 'function') {
    applyTrainingPlanHighlights_();
  }
  return result;
}

function addTrainingPlanApplyErrorV030_(result, message) {
  result.failCount++;
  result.errors.push(message);
}

/**
 * Return A:M rows for Dashboard rows 13:34.
 * Day 0..14: all Training_Plan dates. Later: dates with an active proposal,
 * up to the v0.3.2 six-calendar-month proposal boundary.
 */
function loadDashboardReviewRowsV030_(proposalsByDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet) throw new Error('Training_Planシートが存在しません。');

  const today = dashboardTodayV030_();
  const lastRow = sheet.getLastRow();
  const values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 5).getValues() : [];
  const seen = {};
  const output = [];

  values.forEach(function(row) {
    const date = normalizeDashboardDateV030_(row[0]);
    if (!date) return;
    const key = dashboardDateKeyV030_(date);
    if (seen[key]) throw new Error('Training_Planに同一日付が複数あります: ' + key);
    seen[key] = true;

    const diff = dashboardDateDiffV030_(date, today);
    const ai = proposalsByDate[key] || null;
    if (diff < 0) return;
    if (diff >= 15 && !ai) return;

    output.push([
      date,
      false,
      isDashboardV030Blank_(row[1]) ? 'TBD' : row[1],
      row[2] || '',
      row[3] || '',
      isDashboardV030Blank_(row[4]) ? '' : row[4],
      false,
      ai ? ai.type : '',
      ai ? ai.workout : '',
      ai ? ai.targetPace : '',
      ai && !isDashboardV030Blank_(ai.planKm) ? ai.planKm : '',
      ai ? [ai.reason, ai.warning].filter(Boolean).join(' / ') : '',
      ai ? ai.proposalId : ''
    ]);
  });

  output.sort(function(a, b) { return a[0].getTime() - b[0].getTime(); });
  return output.slice(0, DASHBOARD_V030.REVIEW.ROW_COUNT);
}

function refreshDashboardSummaryV030_(dashboardSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  const eventSheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
  const today = dashboardTodayV030_();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const planRows = planSheet && planSheet.getLastRow() >= 2
    ? planSheet.getRange(2, 1, planSheet.getLastRow() - 1, Math.min(10, planSheet.getLastColumn())).getValues()
    : [];
  const eventRows = eventSheet && eventSheet.getLastRow() >= 2
    ? eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, Math.min(10, eventSheet.getLastColumn())).getValues()
    : [];

  const recent = planRows.filter(function(row) {
    const diff = dashboardDateDiffV030_(row[0], today);
    const hasActual = !isDashboardV030Blank_(row[6]) ||
      !isDashboardV030Blank_(row[7]) ||
      !isDashboardV030Blank_(row[8]) ||
      !isDashboardV030Blank_(row[9]);
    return diff !== null && diff <= 0 && diff >= -6 && hasActual;
  });
  const recentKm = recent.reduce(function(total, row) {
    const value = Number(row[7]);
    return total + (isFinite(value) ? value : 0);
  }, 0);
  const activeEvents = eventRows.filter(function(row) {
    const diff = dashboardDateDiffV030_(row[0], today);
    return diff !== null && diff >= 0 && String(row[7] || 'ACTIVE').toUpperCase() !== 'CANCELLED';
  }).sort(function(a, b) {
    return normalizeDashboardDateV030_(a[0]).getTime() - normalizeDashboardDateV030_(b[0]).getTime();
  });

  const todayRow = findPlanRowByDateV030_(planRows, today);
  const tomorrowRow = findPlanRowByDateV030_(planRows, tomorrow);
  const nextKey = planRows.filter(function(row) {
    const diff = dashboardDateDiffV030_(row[0], today);
    return diff !== null && diff >= 0 && ['Workout', 'Race', 'Long Run'].indexOf(String(row[1])) >= 0;
  }).sort(function(a, b) {
    return normalizeDashboardDateV030_(a[0]).getTime() - normalizeDashboardDateV030_(b[0]).getTime();
  })[0];
  const nextRace = activeEvents.filter(function(row) { return String(row[1]) === 'Race'; })[0];
  const constraints = activeEvents.filter(function(row) { return String(row[1]) === 'Constraint'; }).slice(0, 3);

  getDashboardV030NamedRange_('DASH_TRAINING_GOAL').setValue(
    nextRace ? formatEventV030_(nextRace) : 'Event_Calendarに次回Raceなし'
  );
  getDashboardV030NamedRange_('DASH_POLICY_CONSTRAINTS').setValue(
    constraints.length ? constraints.map(formatEventV030_).join(' / ') : '直近の制約なし'
  );
  getDashboardV030NamedRange_('DASH_RECENT_TRAINING').setValue(
    '直近7日: ' + recentKm.toFixed(1) + ' km / ' + recent.length + '日記録'
  );
  getDashboardV030NamedRange_('DASH_UPCOMING_EVENTS').setValue(
    activeEvents.length ? activeEvents.slice(0, 3).map(formatEventV030_).join(' / ') : '今後の登録イベントなし'
  );
  getDashboardV030NamedRange_('DASH_TODAY_PLAN').setValue(formatPlanV030_(todayRow));
  getDashboardV030NamedRange_('DASH_TOMORROW_PLAN').setValue(formatPlanV030_(tomorrowRow));
  getDashboardV030NamedRange_('DASH_NEXT_KEY_WORKOUT').setValue(formatPlanV030_(nextKey));
}

function findPlanRowByDateV030_(rows, date) {
  const key = dashboardDateKeyV030_(date);
  return rows.filter(function(row) { return dashboardDateKeyV030_(row[0]) === key; })[0] || null;
}

function formatPlanV030_(row) {
  if (!row) return '予定なし';
  return [dashboardDateKeyV030_(row[0]), row[1], row[2], row[3],
    isDashboardV030Blank_(row[4]) ? '' : row[4] + 'km'].filter(Boolean).join(' / ');
}

function formatEventV030_(row) {
  return [dashboardDateKeyV030_(row[0]), row[1], row[2], row[3]].filter(Boolean).join(' / ');
}

function normalizeOptionalNumberV030_(value, label) {
  if (isDashboardV030Blank_(value)) return '';
  const number = Number(value);
  if (!isFinite(number) || number < 0) throw new Error(label + 'が不正です');
  return number;
}
