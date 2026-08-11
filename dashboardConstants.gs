/**
 * Running AI Karte v0.3.2 - Dashboard constants, named ranges and shared helpers.
 */
const DASHBOARD_V030 = Object.freeze({
  VERSION: '0.3.2',
  TIMEZONE: 'Asia/Tokyo',
  SHEETS: Object.freeze({
    DASHBOARD: 'Dashboard',
    TRAINING_PLAN: 'Training_Plan',
    EVENT_CALENDAR: 'Event_Calendar',
    PROPOSAL_STAGING: 'Proposal_Staging',
    LLM_RESPONSE_LOG: 'LLM_Response_Log',
    ACTUAL_UPDATE_LOG: 'Actual_Update_Log'
  }),
  STATUS: Object.freeze({
    NORMAL: '正常',
    WARNING: '警告',
    ERROR: 'エラー'
  }),
  REVIEW: Object.freeze({
    FIRST_ROW: 13,
    LAST_ROW: 34,
    ROW_COUNT: 22,
    FIRST_COLUMN: 1,
    COLUMN_COUNT: 13,
    COLUMNS: Object.freeze({
      DATE: 1,
      APPLY: 2,
      TYPE: 3,
      WORKOUT: 4,
      TARGET_PACE: 5,
      PLAN_KM: 6,
      AI_COPY: 7,
      AI_TYPE: 8,
      AI_WORKOUT: 9,
      AI_TARGET_PACE: 10,
      AI_PLAN_KM: 11,
      AI_REASON: 12,
      PROPOSAL_ID: 13
    })
  }),
  ACTION_CELLS: Object.freeze({
    REFRESH: 'B2',
    APPLY: 'B11',
    BULK_AI_COPY: 'G11'
  }),
  NAMED_RANGES: Object.freeze({
    DASH_ACTION_REFRESH: 'B2',
    DASH_REFRESH_RESULT: 'C2:E2',
    DASH_TRAINING_GOAL: 'C3',
    DASH_POLICY_CONSTRAINTS: 'C4',
    DASH_RECENT_TRAINING: 'C5',
    DASH_UPCOMING_EVENTS: 'C6',
    DASH_TODAY_PLAN: 'C7',
    DASH_TOMORROW_PLAN: 'C8',
    DASH_NEXT_KEY_WORKOUT: 'C9',
    DASH_TODAYS_NOTE: 'C10',
    DASH_ACTION_APPLY: 'B11',
    DASH_APPLY_RESULT: 'C11:E11',
    DASH_ACTION_BULK_AI_COPY: 'G11',
    DASH_REVIEW_RANGE: 'A13:M34',
    DASH_APPLY_FLAGS: 'B13:B34',
    DASH_AI_COPY_FLAGS: 'G13:G34',
    DASH_PROPOSAL_IDS: 'M13:M34'
  }),
  PLAN_TYPES: Object.freeze([
    'Rest', 'Recovery', 'Jog', 'Long Run', 'Workout', 'Race', 'Other', 'TBD'
  ]),
  COLORS: Object.freeze({
    PLAN: '#674EA7',
    AI: '#2F5C97'
  }),
  LAYOUT: Object.freeze({
    TITLE_ROW_HEIGHT: 32,
    SUMMARY_ROW_HEIGHT: 30,
    REVIEW_HEADER_ROW_HEIGHT: 32,
    REVIEW_ROW_HEIGHT: 30,
    COLUMN_WIDTHS: Object.freeze([
      81, 60, 82, 170, 110, 90, 72, 80, 220, 120, 90, 220
    ])
  }),
  HORIZON_DAYS: 30,
  PROPOSAL_HORIZON_MONTHS: 6
});

const CORE_SHEETS_V030 = Object.freeze({
  DASHBOARD_TITLE: 'Dashboard\nダッシュボード',
  DASHBOARD_VERSION_LABEL: 'v0.3.2',
  DASHBOARD_LABELS: Object.freeze([
    'Reload\n予定再読込',
    'Training Goal\nトレーニング目標',
    'Policy\n方針・制約',
    'Recent Training\n直近のトレーニング',
    'Upcoming Events\n今後の主な予定',
    "Today's Plan\n今日の予定",
    "Tomorrow's Plan\n明日の予定",
    'Next Workout\n次回ポイント練',
    "Today's Note\n今日のひとこと",
    'Apply to Training Plan\n選択した予定を確定反映'
  ]),
  DASHBOARD_REVIEW_HEADERS: Object.freeze([
    'Date\n日付', 'Apply\n反映', 'Type\n種別', 'Planned Workout\n予定メニュー',
    'Target Pace\n設定ペース', 'Plan km\n計画距離 km', 'AI案取込',
    'AI Type\nAI種別', 'AI Workout\nAIメニュー', 'AI Target Pace\nAI設定ペース',
    'AI Plan km\nAI計画距離 km', 'AI Reason\nAI理由', 'Proposal ID'
  ]),
  TRAINING_PLAN_HEADERS: Object.freeze([
    'Date\n日付', 'Type\n種別', 'Planned Workout\n予定メニュー',
    'Target Pace\n設定ペース', 'Plan km\n予定距離 km', 'AI Comment\nAIコメント',
    'Workout Result / Notes\n練習結果／メモ', 'Actual km\n実績距離 km',
    'Duration min\n時間（分）', 'Avg HR\n平均心拍', 'Actual Source\n実績ソース',
    'Activity Count\nアクティビティ数', 'Main Activity ID\nメインActivity ID',
    'Max HR\n最大心拍', 'Analysis Mode\n分析モード'
  ]),
  EVENT_CALENDAR_HEADERS: Object.freeze([
    'Date\n日付', 'Type\n種別', 'Event / Schedule\nイベント／予定',
    'Goal / Constraint\n目標／制約', 'Distance km\n距離 km',
    'Priority / Notes\n優先度／メモ', 'Event ID', 'Status', 'Updated At', 'Updated By'
  ]),
  LLM_RESPONSE_LOG_HEADERS: Object.freeze([
    'Consultation ID', 'Revision', 'Source LLM', 'Source Snapshot ID', 'Recorded At',
    'Consultation Summary', 'Assessment / Advice', 'Coach Topics', 'Status'
  ])
});

const SCHEMA_VERSION = '0.3.2';

const TP_COLS = Object.freeze({
  DATE: 1,
  TYPE: 2,
  WORKOUT: 3,
  TARGET_PACE: 4,
  PLAN_KM: 5,
  AI_COMMENT: 6,
  RESULT_NOTES: 7,
  ACTUAL_KM: 8,
  DURATION_MIN: 9,
  AVG_HR: 10,
  ACTUAL_SOURCE: 11,
  ACTIVITY_COUNT: 12,
  MAIN_ACTIVITY_ID: 13,
  MAX_HR: 14,
  ANALYSIS_MODE: 15,
  AI_ACTUAL_COMMENT: 16,
  ACTUAL_STATUS: 17,
  ACTUAL_UPDATED_AT: 18,
  ACTUAL_UPDATE_ID: 19
});

const EXPECTED_TP_HEADERS_A_O = CORE_SHEETS_V030.TRAINING_PLAN_HEADERS;
const EXPECTED_TP_HEADERS_P_S = Object.freeze([
  'AI Actual Comment\nAI実績所見',
  'Actual Status\n実績状態',
  'Actual Updated At\n実績更新日時',
  'Actual Update ID\n実績更新ID'
]);

const ACTUAL_SOURCES = Object.freeze({
  STRAVA: 'Strava',
  MANUAL: 'Manual',
  LLM_USER_REPORT: 'LLM_USER_REPORT'
});

const ACTUAL_STATUSES = Object.freeze({
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  REST: 'REST',
  SKIPPED: 'SKIPPED'
});

const PROPERTY_KEYS = Object.freeze({
  ACTUAL_REVIEWED_THROUGH: 'ACTUAL_REVIEWED_THROUGH',
  SCHEMA_VERSION: 'SCHEMA_VERSION'
});

const ACTUAL_UPDATE_LOG_HEADERS = Object.freeze([
  'Actual Update ID', 'Consultation ID', 'Confirmation ID', 'Source Snapshot ID',
  'Payload Hash', 'Plan Date', 'Expected Row Hash', 'Before JSON', 'After JSON',
  'Result', 'Error Code', 'Approved At', 'Applied At', 'Applied By'
]);

/** Create or repair the v0.3.2 Dashboard named ranges. */
function ensureDashboardV030NamedRanges_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (!sheet) throw new Error('Dashboardシートが存在しません。');

  Object.keys(DASHBOARD_V030.NAMED_RANGES).forEach(function(name) {
    ss.setNamedRange(name, sheet.getRange(DASHBOARD_V030.NAMED_RANGES[name]));
  });
}

/**
 * Install or repair Running AI Karte v0.3.2.
 * Supports both an empty spreadsheet and an existing compatible workbook.
 */
function installRunningAiKarteV032() {
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('INSTALL_DOCUMENT_CONTEXT_UNAVAILABLE');
  lock.waitLock(10000);
  try {
    const result = ensureRunningAiKarteCoreSheetsV030_();
    migrateToV032WithLockHeld_();
    ensureProposalStagingSheetV030_();
    ensureDashboardV030NamedRanges_();
    ensureLlmBriefNamedRangesV030_();
    formatDashboardReviewV030_();
    const triggerResult = ensureDashboardEditTriggerV030_();

    const pendingChanges = getDashboardV030NamedRange_('DASH_APPLY_FLAGS').getValues().flat()
      .some(isDashboardV030Checked_);
    if (!pendingChanges) {
      ensureTrainingPlanCoverageV032_();
      const proposalResult = validateAndLoadProposalsV030_();
      const dashboard = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
      writeDashboardReviewRowsV030_(dashboard,
        loadDashboardReviewRowsV030_(proposalResult.proposalsByDate));
      refreshDashboardSummaryV030_(dashboard);
      buildLlmBrief();
      setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.NORMAL,
        'v0.3.2初期化完了 / 編集時トリガー' + (triggerResult.created ? '登録済み' : '確認済み'));
    }
    SpreadsheetApp.flush();
    return {
      version: DASHBOARD_V030.VERSION,
      createdSheets: result.createdSheets,
      seededTrainingPlanRows: result.seededTrainingPlanRows,
      editTriggerCreated: triggerResult.created,
      dashboardUrl: getDashboardUrlV030_()
    };
  } finally {
    lock.releaseLock();
  }
}

/** Backward-compatible installer alias. */
function installRunningAiKarteV030() {
  return installRunningAiKarteV032();
}

function ensureRunningAiKarteCoreSheetsV030_() {
  const createdSheets = [];
  const dashboardResult = ensureDashboardSheetV030_();
  if (dashboardResult.created) createdSheets.push(DASHBOARD_V030.SHEETS.DASHBOARD);

  const trainingResult = ensureTabularSheetV030_(
    DASHBOARD_V030.SHEETS.TRAINING_PLAN,
    CORE_SHEETS_V030.TRAINING_PLAN_HEADERS
  );
  if (trainingResult.created) createdSheets.push(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  formatTrainingPlanSheetV030_(trainingResult.sheet, trainingResult.created);
  const seededTrainingPlanRows = seedTrainingPlanV030_(trainingResult.sheet);

  const eventResult = ensureTabularSheetV030_(
    DASHBOARD_V030.SHEETS.EVENT_CALENDAR,
    CORE_SHEETS_V030.EVENT_CALENDAR_HEADERS
  );
  if (eventResult.created) createdSheets.push(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
  formatEventCalendarSheetV030_(eventResult.sheet);

  const logResult = ensureTabularSheetV030_(
    DASHBOARD_V030.SHEETS.LLM_RESPONSE_LOG,
    CORE_SHEETS_V030.LLM_RESPONSE_LOG_HEADERS
  );
  if (logResult.created) createdSheets.push(DASHBOARD_V030.SHEETS.LLM_RESPONSE_LOG);
  formatLlmResponseLogSheetV030_(logResult.sheet);

  removeBlankDefaultSheetsV030_();
  return {createdSheets: createdSheets, seededTrainingPlanRows: seededTrainingPlanRows};
}

function ensureDashboardSheetV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  const created = !sheet;
  if (!sheet) sheet = ss.insertSheet(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (sheet.getMaxRows() < 34) sheet.insertRowsAfter(sheet.getMaxRows(), 34 - sheet.getMaxRows());
  if (sheet.getMaxColumns() < 15) sheet.insertColumnsAfter(sheet.getMaxColumns(), 15 - sheet.getMaxColumns());

  const currentTitle = String(sheet.getRange('A1').getDisplayValue() || '').trim();
  if (currentTitle && currentTitle !== CORE_SHEETS_V030.DASHBOARD_TITLE) {
    throw new Error('Dashboard!A1がv0.3.0仕様と一致しません。既存内容を保護するため初期化を中断しました。');
  }

  const newLayoutExists = String(sheet.getRange('C1').getDisplayValue() || '').trim() ===
    CORE_SHEETS_V030.DASHBOARD_VERSION_LABEL;
  const upperState = {
    refreshChecked: sheet.getRange(newLayoutExists ? 'B2' : 'C2').getValue(),
    refreshResult: sheet.getRange(newLayoutExists ? 'C2' : 'D2').getValue(),
    trainingGoal: sheet.getRange('C3').getValue(),
    policyConstraints: sheet.getRange('C4').getValue(),
    recentTraining: sheet.getRange('C5').getValue(),
    upcomingEvents: sheet.getRange('C6').getValue(),
    todayPlan: sheet.getRange('C7').getValue(),
    tomorrowPlan: sheet.getRange('C8').getValue(),
    nextKeyWorkout: sheet.getRange('C9').getValue(),
    todaysNote: sheet.getRange('C10').getValue(),
    applyChecked: sheet.getRange(newLayoutExists ? 'B11' : 'C11').getValue(),
    applyResult: sheet.getRange(newLayoutExists ? 'C11' : 'D11').getValue(),
    bulkChecked: newLayoutExists ? sheet.getRange('G11').getValue() : false
  };

  sheet.getRange('A1:G11').breakApart().clearContent().clearDataValidations().clearFormat();
  sheet.getRange('A1').setValue(CORE_SHEETS_V030.DASHBOARD_TITLE);
  sheet.getRange('C1').setValue(CORE_SHEETS_V030.DASHBOARD_VERSION_LABEL);
  sheet.getRange(2, 1, 10, 1).setValues(
    CORE_SHEETS_V030.DASHBOARD_LABELS.map(function(label) { return [label]; })
  );
  sheet.getRange('C2').setValue(upperState.refreshResult);
  sheet.getRange('C3:C10').setValues([
    [upperState.trainingGoal],
    [upperState.policyConstraints],
    [upperState.recentTraining],
    [upperState.upcomingEvents],
    [upperState.todayPlan],
    [upperState.tomorrowPlan],
    [upperState.nextKeyWorkout],
    [upperState.todaysNote]
  ]);
  sheet.getRange('C11').setValue(upperState.applyResult);
  sheet.getRange(12, 1, 1, CORE_SHEETS_V030.DASHBOARD_REVIEW_HEADERS.length)
    .setValues([CORE_SHEETS_V030.DASHBOARD_REVIEW_HEADERS]);
  sheet.getRange('B2').insertCheckboxes().setValue(isDashboardV030Checked_(upperState.refreshChecked));
  sheet.getRange('B11').insertCheckboxes().setValue(isDashboardV030Checked_(upperState.applyChecked));
  sheet.getRange('F11').setValue('Select all visible AI proposals\n表示中のAI案を一括取込');
  sheet.getRange('G11').insertCheckboxes().setValue(isDashboardV030Checked_(upperState.bulkChecked));
  sheet.getRange('A1:B1').merge();
  sheet.getRange('C1:E1').merge();
  sheet.getRange('C2:E2').merge();
  for (let row = 3; row <= 10; row++) sheet.getRange(row, 1, 1, 2).merge();
  for (let row = 3; row <= 10; row++) sheet.getRange(row, 3, 1, 3).merge();
  sheet.getRange('C11:E11').merge();
  if (created) {
    sheet.getRange('B2').setValue(false);
    sheet.getRange('B11').setValue(false);
    sheet.getRange('G11').setValue(false);
    sheet.getRange('A13:M34').clearContent();
  }

  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  sheet.getRange('A1:E11').setBorder(
    true, true, true, true, true, true, '#D1D1D1', SpreadsheetApp.BorderStyle.SOLID
  );
  sheet.getRange('F11:G11').setBorder(
    true, true, true, true, true, true, '#D1D1D1', SpreadsheetApp.BorderStyle.SOLID
  );
  sheet.getRange('A1:E1').setBackground(DASHBOARD_V030.COLORS.PLAN).setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('A1').setHorizontalAlignment('left');
  sheet.getRange('C1').setHorizontalAlignment('right');
  sheet.getRange('A2:A11').setBackground('#F2EFF9').setFontColor('#2D2D38')
    .setFontWeight('bold').setFontSize(9).setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('B2:G11').setFontColor('#262626').setFontSize(9)
    .setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('B2').setBackground('#CEE0F2').setHorizontalAlignment('center');
  sheet.getRange('B11').setBackground('#D8EAD3').setHorizontalAlignment('center');
  sheet.getRange('F11').setBackground('#CFE2F3').setFontWeight('bold');
  sheet.getRange('G11').setBackground('#CFE2F3').setHorizontalAlignment('center');
  sheet.getRange('C2:E2').setBackground('#FFFFFF')
    .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('C3:E9').setBackground('#FFFFFF');
  sheet.getRange('C10:E10').setBackground('#FFF4D1');
  sheet.getRange('C11:E11').setBackground('#FFFFFF')
    .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true);
  DASHBOARD_V030.LAYOUT.COLUMN_WIDTHS.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
  sheet.setRowHeight(1, DASHBOARD_V030.LAYOUT.TITLE_ROW_HEIGHT);
  for (let row = 2; row <= 11; row++) {
    sheet.setRowHeight(row, DASHBOARD_V030.LAYOUT.SUMMARY_ROW_HEIGHT);
  }
  sheet.setRowHeight(12, DASHBOARD_V030.LAYOUT.REVIEW_HEADER_ROW_HEIGHT);
  for (let row = 13; row <= 34; row++) {
    sheet.setRowHeight(row, DASHBOARD_V030.LAYOUT.REVIEW_ROW_HEIGHT);
  }
  sheet.showRows(1, Math.min(34, sheet.getMaxRows()));
  if (sheet.getMaxRows() > 34) sheet.hideRows(35, sheet.getMaxRows() - 34);
  return {sheet: sheet, created: created};
}

function ensureTabularSheetV030_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  const created = !sheet;
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  const matches = current.join('\u0000') === headers.join('\u0000');
  if (!matches && current.some(Boolean)) {
    throw new Error(name + 'のヘッダーがv0.3.0仕様と一致しません。既存内容を保護するため初期化を中断しました。');
  }
  if (!matches) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return {sheet: sheet, created: created};
}

function seedTrainingPlanV030_(sheet) {
  if (sheet.getLastRow() >= 2) return 0;
  const today = dashboardTodayV030_();
  const rows = [];
  for (let offset = 0; offset <= DASHBOARD_V030.HORIZON_DAYS; offset++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    rows.push([date, 'TBD', '', '', '', '', '', '', '', '', '', '', '', '', 'Daily']);
  }
  sheet.getRange(2, 1, rows.length, CORE_SHEETS_V030.TRAINING_PLAN_HEADERS.length).setValues(rows);
  return rows.length;
}

function formatTrainingPlanSheetV030_(sheet, created) {
  const width = CORE_SHEETS_V030.TRAINING_PLAN_HEADERS.length;
  sheet.getRange(1, 1, 1, 5).setBackground(DASHBOARD_V030.COLORS.PLAN);
  sheet.getRange(1, 6, 1, 1).setBackground(DASHBOARD_V030.COLORS.AI);
  sheet.getRange(1, 7, 1, 4).setBackground('#38761D');
  sheet.getRange(1, 11, 1, 5).setBackground('#666666');
  sheet.getRange(1, 1, 1, width).setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);
  sheet.getRange('A:A').setNumberFormat('yyyy/MM/dd');
  sheet.getRange(2, 2, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(DASHBOARD_V030.PLAN_TYPES, true)
      .setAllowInvalid(false).build()
  );
  sheet.getRange(2, 11, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Strava', 'Manual', 'LLM_USER_REPORT'], true)
      .setAllowInvalid(false).build()
  );
  sheet.getRange(2, 15, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Daily', 'Detail'], true)
      .setAllowInvalid(false).build()
  );
  sheet.setColumnWidth(1, 105);
  sheet.setColumnWidth(2, 105);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 145);
  sheet.setColumnWidth(5, 105);
  sheet.setColumnWidth(6, 280);
  sheet.setColumnWidth(7, 280);
  sheet.hideColumns(11, 5);
  if (created) {
    const range = sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 10);
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$A2=TODAY()').setBackground('#FFF2CC').setRanges([range]).build();
    sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([rule]));
  }
}

function formatEventCalendarSheetV030_(sheet) {
  const width = CORE_SHEETS_V030.EVENT_CALENDAR_HEADERS.length;
  sheet.getRange(1, 1, 1, width).setBackground('#B45F06').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  sheet.getRange('A:A').setNumberFormat('yyyy/MM/dd');
  sheet.getRange('I:I').setNumberFormat('yyyy/MM/dd HH:mm:ss');
  sheet.getRange(2, 2, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Workout', 'Race', 'Constraint', 'TBD'], true)
      .setAllowInvalid(false).build()
  );
  sheet.getRange(2, 8, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['ACTIVE', 'CANCELLED'], true)
      .setAllowInvalid(false).build()
  );
  sheet.setColumnWidth(1, 105);
  sheet.setColumnWidth(2, 105);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 280);
  sheet.setColumnWidth(5, 105);
  sheet.setColumnWidth(6, 220);
  sheet.hideColumns(7, 4);
}

function formatLlmResponseLogSheetV030_(sheet) {
  const width = CORE_SHEETS_V030.LLM_RESPONSE_LOG_HEADERS.length;
  sheet.getRange(1, 1, 1, width).setBackground(DASHBOARD_V030.COLORS.AI)
    .setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  sheet.getRange('E:E').setNumberFormat('yyyy/MM/dd HH:mm:ss');
  sheet.getRange(2, 9, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['ACTIVE', 'SUPERSEDED'], true)
      .setAllowInvalid(false).build()
  );
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 190);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 320);
  sheet.setColumnWidth(7, 360);
  sheet.setColumnWidth(8, 260);
}

function ensureDashboardEditTriggerV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const matches = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === 'onDashboardEdit' &&
      trigger.getEventType() === ScriptApp.EventType.ON_EDIT &&
      trigger.getTriggerSourceId() === ss.getId();
  });
  matches.slice(1).forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
  if (matches.length) return {created: false};
  ScriptApp.newTrigger('onDashboardEdit').forSpreadsheet(ss).onEdit().create();
  return {created: true};
}

function removeBlankDefaultSheetsV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['シート1', 'Sheet1'].forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet || ss.getSheets().length <= 1) return;
    const values = sheet.getDataRange().getDisplayValues();
    const blank = values.every(function(row) { return row.every(isDashboardV030Blank_); });
    if (blank) ss.deleteSheet(sheet);
  });
}

function getDashboardV030NamedRange_(name) {
  const range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(name);
  if (!range) throw new Error('Named Rangeが存在しません: ' + name);
  return range;
}

function isDashboardV030Ready_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return !!(
    ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD) &&
    ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN) &&
    ss.getRangeByName('DASH_REVIEW_RANGE') &&
    ss.getRangeByName('DASH_ACTION_REFRESH') &&
    ss.getRangeByName('DASH_ACTION_APPLY')
  );
}

function formatDashboardReviewV030_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (!sheet) throw new Error('Dashboardシートが存在しません。');

  sheet.getRange(12, 1, 1, 6)
    .setBackground(DASHBOARD_V030.COLORS.PLAN)
    .setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sheet.getRange(12, 7, 1, 6)
    .setBackground(DASHBOARD_V030.COLORS.AI)
    .setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('A13:M34').setFontSize(9).setVerticalAlignment('middle');
  sheet.getRange('A13:A34').setHorizontalAlignment('center');

  const reviewRange = sheet.getRange('A13:M34');
  const applyRange = sheet.getRange('B13:B34');
  const planRange = sheet.getRange('C13:F34');
  const aiRange = sheet.getRange('H13:L34');
  const dateRange = sheet.getRange('A13:A34');
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(ISNUMBER($A13),INT($A13)=TODAY())')
      .setBackground('#FFF2CC').setBold(true).setRanges([reviewRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$B13=TRUE')
      .setBackground('#D9EAD3').setRanges([applyRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=COUNTA($H13:$K13)>0')
      .setBackground('#CFE2F3').setRanges([aiRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($A13<>"",$C13<>"",$C13<>"TBD")')
      .setBackground('#E2F0D9').setRanges([planRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($A13<>"",$C13="TBD")')
      .setBackground('#F2F2F2').setFontColor('#8C8C8C').setRanges([planRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(ISNUMBER($A13),WEEKDAY($A13,1)=1)')
      .setBackground('#FCE5CD').setRanges([dateRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(ISNUMBER($A13),WEEKDAY($A13,2)=6)')
      .setBackground('#C9DAF8').setRanges([dateRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('エラー').setBackground('#F4CCCC')
      .setRanges([sheet.getRange('C2:E2')]).build()
  ];
  sheet.setConditionalFormatRules(rules);
  sheet.hideColumns(DASHBOARD_V030.REVIEW.COLUMNS.PROPOSAL_ID, 3);
}

function isDashboardV030Checked_(value) {
  return value === true || String(value || '').toUpperCase() === 'TRUE';
}

function isDashboardV030Blank_(value) {
  return value === '' || value === null || value === undefined;
}

function rangesIntersectV030_(range, firstRow, lastRow, columns) {
  const rangeFirstRow = range.getRow();
  const rangeLastRow = rangeFirstRow + range.getNumRows() - 1;
  if (rangeLastRow < firstRow || rangeFirstRow > lastRow) return false;

  const firstColumn = range.getColumn();
  const lastColumn = firstColumn + range.getNumColumns() - 1;
  return columns.some(function(column) {
    return column >= firstColumn && column <= lastColumn;
  });
}

function dashboardTodayV030_() {
  const text = Utilities.formatDate(new Date(), DASHBOARD_V030.TIMEZONE, 'yyyy/MM/dd');
  return normalizeDashboardDateV030_(text);
}

function normalizeDashboardDateV030_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (isDashboardV030Blank_(value)) return null;
  const match = String(value).trim().replace(/-/g, '/').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])) return null;
  return date;
}

function dashboardDateKeyV030_(value) {
  const date = normalizeDashboardDateV030_(value);
  if (!date) return '';
  return Utilities.formatDate(date, DASHBOARD_V030.TIMEZONE, 'yyyy/MM/dd');
}

function dashboardDateDiffV030_(a, b) {
  const first = normalizeDashboardDateV030_(a);
  const second = normalizeDashboardDateV030_(b);
  if (!first || !second) return null;
  return Math.round((first.getTime() - second.getTime()) / 86400000);
}
