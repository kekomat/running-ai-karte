/**
 * Running AI Karte - Setup
 */

function onOpen() {
  setupRunningAiKarteMenu();
}

function onInstall(e) {
  onOpen(e);
}

function setupRunningAiKarteMenu() {
  try {
    addRunningAiKarteMenuWithCreateMenu_();
    updateMenuStatus_('Menu ready. If you do not see it, reload the spreadsheet.\nメニューを準備しました。表示されない場合はスプレッドシートを再読み込みしてください。');
  } catch (e) {
    Logger.log('createMenu failed, trying addMenu fallback: ' + e.message);
    try {
      addRunningAiKarteMenuWithAddMenu_();
      updateMenuStatus_('Menu ready by fallback. If you do not see it, reload the spreadsheet.\nフォールバック方式でメニューを準備しました。表示されない場合はスプレッドシートを再読み込みしてください。');
    } catch (fallbackError) {
      Logger.log('Menu setup failed: ' + fallbackError.message);
      updateMenuStatus_('Menu setup failed. Run functions directly from Apps Script.\nメニュー作成に失敗しました。Apps Scriptから関数を直接実行してください。');
    }
  }
}

function addRunningAiKarteMenuWithCreateMenu_() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui
    .createMenu('Running AI Karte')
    .addItem('0. Initialize sheets / シート初期化', 'initializeRunningAiKarte')
    .addSeparator()
    .addItem('1. Refresh actuals / 実績反映', 'refreshActuals')
    .addItem('2. Generate AI prompt / AIプロンプト生成', 'generateLLMPrompt')
    .addItem('3. Import AI response / AI回答を取り込む', 'importAIResponse');

  if (typeof showStravaSetup === 'function') {
    menu
      .addSeparator()
      .addSubMenu(
        ui.createMenu('Optional Strava')
        .addItem('Show setup / 設定を表示', 'showStravaSetup')
        .addItem('Create auth URL / 認証URL作成', 'createStravaAuthUrl')
        .addItem('Exchange code / 認証コード交換', 'exchangeStravaAuthorizationCodeFromSheet')
        .addItem('Fetch activities / Stravaログ取得', 'fetchStravaActivities')
        .addItem('Sync to Training_Plan / 実績反映', 'syncStravaToTrainingPlan')
      );
  }

  menu.addToUi();
}

function addRunningAiKarteMenuWithAddMenu_() {
  const entries = [
    {name: '0. Initialize sheets / シート初期化', functionName: 'initializeRunningAiKarte'},
    null,
    {name: '1. Refresh actuals / 実績反映', functionName: 'refreshActuals'},
    {name: '2. Generate AI prompt / AIプロンプト生成', functionName: 'generateLLMPrompt'},
    {name: '3. Import AI response / AI回答を取り込む', functionName: 'importAIResponse'},
    null,
    {name: 'Strava: Show setup / 設定を表示', functionName: 'showStravaSetup'},
    {name: 'Strava: Create auth URL / 認証URL作成', functionName: 'createStravaAuthUrl'},
    {name: 'Strava: Exchange code / 認証コード交換', functionName: 'exchangeStravaAuthorizationCodeFromSheet'},
    {name: 'Strava: Fetch activities / ログ取得', functionName: 'fetchStravaActivities'},
    {name: 'Strava: Sync to Training_Plan / 実績反映', functionName: 'syncStravaToTrainingPlan'}
  ];
  SpreadsheetApp.getActiveSpreadsheet().addMenu('Running AI Karte', entries);
}

function updateMenuStatus_(message) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
    if (!sheet) return;
    sheet.getRange('A4:L4').merge()
      .setValue(message + '\nLast checked / 最終確認: ' + Utilities.formatDate(new Date(), RAK_TIMEZONE, 'yyyy/MM/dd HH:mm:ss'))
      .setBackground('#fce5cd')
      .setFontColor('#666666')
      .setWrap(true);
    sheet.setRowHeight(4, 60);
  } catch (e) {
    Logger.log('Menu status update skipped: ' + e.message);
  }
}

function repairRunningAiKarteMenu() {
  setupRunningAiKarteMenu();
  safeUiAlert_('Menu repair completed. Please reload the Google Sheet and check the top menu bar.\n\nメニュー修復を実行しました。Googleスプレッドシートを再読み込みして、上部メニューバーを確認してください。');
}

function installRunningAiKarteOpenTrigger_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ScriptApp.getProjectTriggers().forEach(trigger => {
      if (trigger.getHandlerFunction() === 'setupRunningAiKarteMenu') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    ScriptApp.newTrigger('setupRunningAiKarteMenu').forSpreadsheet(ss).onOpen().create();
  } catch (e) {
    Logger.log('Open trigger setup skipped: ' + e.message);
  }
}

function installDashboardActionTrigger_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ScriptApp.getProjectTriggers().forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onDashboardActionEdit' || trigger.getHandlerFunction() === 'onDashboardEdit') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    ScriptApp.newTrigger('onDashboardEdit').forSpreadsheet(ss).onEdit().create();
  } catch (e) {
    Logger.log('Dashboard action trigger setup skipped: ' + e.message);
  }
}

function onDashboardEdit(e) {
  onDashboardAIResponsePasteEdit(e);
  onDashboardActionEdit(e);
  onDashboardMaintenanceEdit(e);
  onDashboardReviewUpdateEdit(e);
  onDashboardReviewEdit(e);
}

function onDashboardAIResponsePasteEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== 'Dashboard') return;
  if (range.getRow() !== 16) return;

  const raw = sheet.getRange('A16').getDisplayValue().trim();
  if (!raw) return;
  importAIResponse_(false);
}

function onDashboardReviewUpdateEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== 'Dashboard') return;
  if (range.getRow() !== 43 || range.getColumn() > 3) return;

  const action = String(e.value || '').trim();
  if (!action || action === 'Select update / 更新を選択') return;

  setDashboardActionStatus_('Running update: ' + action + '\n更新処理中: ' + action);
  try {
    if (action === '4. Apply selected rows / 選択行を反映') {
      applyDashboardScheduleEdits();
    }
    setDashboardActionStatus_('Done: ' + action + '\n完了: ' + action);
  } catch (err) {
    setDashboardActionStatus_('Error: ' + err.message + '\nエラー: ' + err.message);
    throw err;
  } finally {
    sheet.getRange('A43').setValue('Select update / 更新を選択');
  }
}

function onDashboardReviewEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== 'Dashboard') return;

  const row = range.getRow();
  const col = range.getColumn();
  if (row < 26 || row > 40) return;

  if (col === 6) {
    const isChecked = String(e.value || '').toUpperCase() === 'TRUE';
    if (!isChecked) return;

    const aiValues = sheet.getRange(row, 7, 1, 4).getValues()[0];
    if (!hasConcreteAiSuggestion_(aiValues)) {
      sheet.getRange(row, 6).setValue(false);
      sheet.getRange(row, 12).setValue(false);
      setDashboardActionStatus_('No concrete AI suggestion on this row.\nこの行にはコピーできる具体的なAI提案がありません。');
      return;
    }

    sheet.getRange(row, 2, 1, 4).setValues([[aiValues[0], aiValues[1], aiValues[2], aiValues[3]]]);
    sheet.getRange(row, 6).setValue(false);
    markDashboardReviewRowForUpdate_(sheet, row);
    setDashboardActionStatus_('Copied AI suggestion to the editable plan row.\nAI提案を編集可能な予定行へコピーしました。');
    return;
  }

  if (col >= 2 && col <= 5) {
    markDashboardReviewRowForUpdate_(sheet, row);
  } else if (col === 12) {
    const isChecked = String(e.value || '').toUpperCase() === 'TRUE';
    const fallbackColor = getDateHighlightColor_(sheet.getRange(row, 1).getValue());
    sheet.getRange(row, 1, 1, 12).setBackground(isChecked ? '#fff2cc' : fallbackColor);
  }
}

function hasConcreteAiSuggestion_(aiValues) {
  const text = String(aiValues[1] || '').trim();
  return !!text && text !== '-' && !/no suggestion|現状維持|提案なし/i.test(text);
}

function markDashboardReviewRowForUpdate_(sheet, row) {
  sheet.getRange(row, 12).setValue(true);
  sheet.getRange(row, 1, 1, 12).setBackground('#fff2cc');
}

function onDashboardActionEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== 'Dashboard' || range.getRow() !== 3 || range.getColumn() > 3) return;

  const action = String(e.value || '').trim();
  if (!action || action === 'Select action / 操作を選択') return;

  setDashboardActionStatus_('Running action: ' + action + '\n処理中: ' + action);

  try {
    if (action === '1. Refresh actuals / 実績反映') {
      refreshActuals();
    } else if (action === '2. Generate AI prompt / AIプロンプト生成') {
      generateLLMPrompt();
    } else if (action === '3. Import AI response / AI回答を取り込む') {
      importAIResponse();
    }

    setDashboardActionStatus_('Done: ' + action + '\n完了: ' + action);
  } catch (err) {
    setDashboardActionStatus_('Error: ' + err.message + '\nエラー: ' + err.message);
    throw err;
  } finally {
    sheet.getRange('A3').setValue('Select action / 操作を選択');
  }
}

function onDashboardMaintenanceEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== 'Dashboard' || range.getRow() !== 20 || range.getColumn() > 3) return;

  const action = String(e.value || '').trim();
  if (!action || action === 'Select maintenance / メンテ操作を選択') return;

  setDashboardActionStatus_('Running maintenance: ' + action + '\nメンテ処理中: ' + action);

  try {
    if (action === 'Show Strava setup / Strava設定を表示') {
      showStravaSetup();
    } else if (action === 'Create Strava auth URL / Strava認証URL作成') {
      createStravaAuthUrl();
    } else if (action === 'Exchange Strava code / Strava認証コード交換') {
      exchangeStravaAuthorizationCodeFromSheet();
    } else if (action === 'Fetch Strava activities / Stravaログ取得') {
      fetchStravaActivities();
    } else if (action === 'Sync Strava to Training_Plan / Strava実績反映') {
      syncStravaToTrainingPlan();
    } else if (action === 'Repair menu / メニュー修復') {
      repairRunningAiKarteMenu();
    }

    setDashboardActionStatus_('Done: ' + action + '\n完了: ' + action);
  } catch (err) {
    setDashboardActionStatus_('Error: ' + err.message + '\nエラー: ' + err.message);
    throw err;
  } finally {
    sheet.getRange('A20').setValue('Select maintenance / メンテ操作を選択');
  }
}

function refreshActuals() {
  let stravaMessage = 'Strava not connected. Dashboard refreshed from existing sheet data.\nStrava未連携のため、既存シートデータでDashboardを更新しました。';
  if (typeof isStravaLinked_ === 'function' && isStravaLinked_()) {
    fetchStravaActivities();
    syncStravaToTrainingPlan();
    stravaMessage = 'Strava activities fetched and synced. Dashboard refreshed.\nStravaログを取得・同期し、Dashboardを更新しました。';
  } else {
    updateDashboard();
  }
  setDashboardActionStatus_(stravaMessage);
}

function applyDashboardScheduleEdits() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName('Dashboard');
  const tp = ss.getSheetByName('Training_Plan');
  if (!db || !tp) throw new Error('Required sheets are missing. / 必要なシートがありません。');

  const dashboardRows = db.getRange('A26:L40').getValues().filter(row => row[0] && row[11] === true);
  if (!dashboardRows.length) {
    safeUiAlert_('No selected review rows found. Check Update in column L first.\n\n反映対象の予定レビュー行がありません。先にL列のUpdateをONにしてください。');
    return;
  }

  const lastRow = tp.getLastRow();
  if (lastRow < 2) {
    safeUiAlert_('Training_Plan has no date rows.\n\nTraining_Planに日付行がありません。');
    return;
  }

  const planDates = tp.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowByDate = {};
  planDates.forEach((date, index) => {
    if (date) rowByDate[formatDate_(date)] = index + 2;
  });

  let updated = 0;
  dashboardRows.forEach(row => {
    const targetRow = rowByDate[formatDate_(row[0])];
    if (!targetRow) return;
    tp.getRange(targetRow, 3, 1, 4).setValues([[row[1], row[2], row[3], row[4]]]);
    updated++;
  });

  applyTrainingPlanHighlights_();
  updateDashboard();
  setDashboardActionStatus_('Done: Apply selected rows. Updated ' + updated + ' rows.\n完了: 選択行を反映。' + updated + '行を更新しました。');
}

function setDashboardActionStatus_(message) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
    if (!sheet) return;
    sheet.getRange('A4:L4').merge()
      .setValue(message + '\nLast updated / 最終更新: ' + Utilities.formatDate(new Date(), RAK_TIMEZONE, 'yyyy/MM/dd HH:mm:ss'))
      .setBackground('#fce5cd')
      .setFontColor('#666666')
      .setWrap(true);
    sheet.setRowHeight(4, 60);
  } catch (e) {
    Logger.log('Dashboard action status update skipped: ' + e.message);
  }
}

function initializeRunningAiKarte() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const trainingHeaders = [
    'Date', 'Day', 'Type', 'Planned Workout', 'Target Pace', 'Planned Distance km',
    'Actual Distance km', 'Actual Duration min', 'Avg HR', 'Fatigue', 'Notes', 'AI Comment'
  ];
  const eventHeaders = ['Date', 'Type', 'Event Name', 'Goal / Constraint', 'Plan km', 'Priority', 'Notes'];
  const exportHeaders = ['Generated At', 'Prompt'];
  const logHeaders = ['Logged At', 'Consultation Date', 'Summary', 'Fatigue Score', 'Fatigue Label', 'Advice', 'Coach Topics', 'Karte Memo', 'Raw Response'];
  const stravaSetupHeaders = ['Key', 'Value', 'Description'];
  const stravaActivityHeaders = [
    'Fetched At', 'Activity ID', 'Date', 'Start Time', 'Title', 'Type', 'Distance km',
    'Duration min', 'Avg Pace', 'Avg HR', 'Max HR', 'Elevation Gain', 'Avg Cadence', 'Strava URL', 'Raw JSON'
  ];

  setHeader_(getOrCreateSheet_(ss, 'Training_Plan'), trainingHeaders);
  migrateRaceCalendarToEventCalendar_(ss);
  normalizeEventCalendarSchema_(ss);
  setHeader_(getOrCreateSheet_(ss, 'Event_Calendar'), eventHeaders);
  setHeader_(getOrCreateSheet_(ss, 'LLM_Export'), exportHeaders);
  setHeader_(getOrCreateSheet_(ss, 'LLM_Response_Log'), logHeaders);
  setHeader_(getOrCreateSheet_(ss, 'Strava_Setup'), stravaSetupHeaders);
  setHeader_(getOrCreateSheet_(ss, 'Strava_Activities'), stravaActivityHeaders);

  initializeDashboard_(ss);
  maintainTrainingPlanWindow();
  initializeEventCalendar_(ss);
  initializeStravaSetup_(ss);

  const exportSheet = ss.getSheetByName('LLM_Export');
  if (exportSheet) exportSheet.hideSheet();
  const stravaSetup = ss.getSheetByName('Strava_Setup');
  if (stravaSetup) stravaSetup.hideSheet();
  const stravaActivities = ss.getSheetByName('Strava_Activities');
  if (stravaActivities) stravaActivities.hideSheet();

  updateDashboard();
  protectDashboard_();
  setupRunningAiKarteMenu();
  installRunningAiKarteOpenTrigger_();
  installDashboardActionTrigger_();
  safeUiAlert_('Running AI Karte initialized. Start from the Dashboard action dropdown. Reload the Google Sheet if you want to use the top menu.\n\nランニングAIカルテの初期化が完了しました。Dashboardの操作プルダウンから始めてください。上部メニューを使う場合はGoogleスプレッドシートを再読み込みしてください。');
}

function protectDashboard_() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
    if (!sheet) return;

    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(protection => {
      if (protection.getDescription() === 'Running AI Karte dashboard protection') {
        protection.remove();
      }
    });

    const protection = sheet.protect().setDescription('Running AI Karte dashboard protection');
    protection.setWarningOnly(false);
    protection.setUnprotectedRanges([
      sheet.getRange('A3:C3'),
      sheet.getRange('B7:L7'),
      sheet.getRange('B8:L8'),
      sheet.getRange('B9:L9'),
      sheet.getRange('A20:C20'),
      sheet.getRange('A16:L16'),
      sheet.getRange('B26:F40'),
      sheet.getRange('L26:L40'),
      sheet.getRange('A43:C43')
    ]);
  } catch (e) {
    Logger.log('Dashboard protection skipped: ' + e.message);
  }
}

function migrateRaceCalendarToEventCalendar_(ss) {
  const oldSheet = ss.getSheetByName('Race_Calendar');
  const newSheet = ss.getSheetByName('Event_Calendar');
  if (!oldSheet || newSheet) return;

  const target = ss.insertSheet('Event_Calendar');
  const oldValues = oldSheet.getDataRange().getValues();
  if (oldValues.length > 1) {
    const rows = oldValues.slice(1).filter(row => row[0]).map(row => {
      const date = row[0];
      return [
        date,
        row[2] || 'Race',
        row[1] || '',
        row[3] || '',
        '',
        row[4] || 'TBD',
        row[5] || ''
      ];
    });
    if (rows.length) target.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  oldSheet.hideSheet();
}

function normalizeEventCalendarSchema_(ss) {
  const sheet = ss.getSheetByName('Event_Calendar');
  if (!sheet || sheet.getLastRow() < 1) return;

  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0].map(String);
  const hasOldDayColumn = headers[1] === 'Day';
  if (!hasOldDayColumn) return;

  const lastRow = sheet.getLastRow();
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 7).getValues() : [];
  const migrated = rows.map(row => [
    row[0],
    row[2] || 'Race',
    row[3] || '',
    row[4] || '',
    '',
    row[5] || 'TBD',
    row[6] || ''
  ]);

  sheet.clear();
  if (migrated.length) {
    sheet.getRange(2, 1, migrated.length, 7).setValues(migrated);
  }
}

function initializeEventCalendar_(ss) {
  const sheet = ss.getSheetByName('Event_Calendar');
  if (!sheet) return;
  const typeRule = SpreadsheetApp.newDataValidation().requireValueInList(['Race', 'Event', 'Other'], true).build();
  const priorityRule = SpreadsheetApp.newDataValidation().requireValueInList(['A', 'B', 'C', 'Other', 'TBD'], true).build();
  sheet.getRange('B2:B1000').setDataValidation(typeRule);
  sheet.getRange('F2:F1000').setDataValidation(priorityRule);

  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 3, 7).setValues([
      ['2026/07/05', 'Race', '10K tune-up race', 'Finish strong, no injury', 10, 'TBD', 'Practice pacing'],
      ['2026/08/30', 'Race', 'Half Marathon', 'Target 1:40', 21.1, 'A', 'Main summer race'],
      ['2026/09/13', 'Event', 'Long run with club', 'Easy effort', '', 'C', 'Optional']
    ]);
  }
}

function initializeStravaSetup_(ss) {
  const sheet = ss.getSheetByName('Strava_Setup');
  if (!sheet || sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, 6, 3).setValues([
    ['STRAVA_CLIENT_ID', '', 'Strava API Client ID'],
    ['STRAVA_CLIENT_SECRET', '', 'Strava API Client Secret. Cleared after token exchange. / トークン交換後にシートから削除されます。'],
    ['STRAVA_AUTH_URL', '', 'Generated by createStravaAuthUrl(). / createStravaAuthUrl()で生成されます。'],
    ['STRAVA_CALLBACK_URL_OR_CODE', '', 'Paste the full callback URL or code after authorization. / 認可後のURL全体またはcodeを貼り付けます。'],
    ['STRAVA_REFRESH_TOKEN', '', 'Stored in Script Properties after token exchange. / トークン交換後にScript Propertiesへ保存されます。'],
    ['STRAVA_SCOPE', '', 'Granted OAuth scope. / 許可されたOAuthスコープです。']
  ]);
}
