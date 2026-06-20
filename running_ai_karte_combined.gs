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
/**
 * Running AI Karte - Dashboard
 */

function initializeDashboard_(ss) {
  const sheet = getOrCreateSheet_(ss, 'Dashboard');
  sheet.getRange('A1:L200').breakApart();
  sheet.clear();

  sheet.getRange('A1:L1').merge().setValue('Running AI Karte')
    .setBackground('#674ea7').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange('A2:C2').merge().setValue('Action / 操作')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A3:C3').merge().setValue('Select action / 操作を選択')
    .setBackground('#fff2cc').setFontWeight('bold');
  const actions = [
    'Select action / 操作を選択',
    '1. Refresh actuals / 実績反映',
    '2. Generate AI prompt / AIプロンプト生成',
    '3. Import AI response / AI回答を取り込む'
  ];
  const actionRule = SpreadsheetApp.newDataValidation().requireValueInList(actions, true).build();
  sheet.getRange('A3:C3').setDataValidation(actionRule);

  sheet.getRange('A4:L4').merge().setValue('Ready / 準備完了')
    .setBackground('#fce5cd').setFontColor('#666666').setWrap(true);

  sheet.getRange('A6:L6').merge().setValue('Current condition / 今の主観コンディション')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A7').setValue('Feeling / 感覚');
  sheet.getRange('B7:L7').merge().setValue('Example / 例: Legs feel heavy, but motivation is good. / 脚は少し重いが、モチベーションは高い。').setBackground('#fff2cc').setWrap(true);
  sheet.getRange('A8').setValue('Body / 身体');
  sheet.getRange('B8:L8').merge().setValue('Example / 例: Slight calf tightness, no pain. / ふくらはぎに少し張りがあるが痛みはない。').setBackground('#fff2cc').setWrap(true);
  sheet.getRange('A9').setValue('Question / 相談');
  sheet.getRange('B9:L9').merge().setValue('Example / 例: Should I do a long run this weekend? / 今週末にロング走をしてよいか？').setBackground('#fff2cc').setWrap(true);

  sheet.getRange('A11:L11').merge().setValue('AI prompt / AI相談プロンプト')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A12:L12').merge().setValue('Generate a prompt from A3. / A3からAIプロンプトを生成してください。')
    .setBackground('#f3f3f3').setWrap(false).setVerticalAlignment('top');
  sheet.getRange('A13:L13').merge().setValue('Copy A12 and paste it into Gemini, ChatGPT, Claude, or another LLM. / A12をコピーしてGemini、ChatGPT、Claudeなどへ貼り付け')
    .setBackground('#eeeeee').setFontColor('#666666').setWrap(true);

  sheet.getRange('A15:L15').merge().setValue('Double tap A16 and paste the full AI response inside the cell / A16をダブルタップし、セル内にAI回答全文を貼り付け')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A16:L16').merge().setBackground('#fff2cc').setWrap(false).setVerticalAlignment('top');
  sheet.getRange('A17:L17').merge().setValue('Paste AI response into A16. It will be imported and cleared automatically. / AI回答をA16へ貼り付けると自動で取り込み、クリアします。')
    .setBackground('#eeeeee').setFontColor('#666666').setWrap(true);

  sheet.getRange('A19:L19').merge().setValue('Maintenance / メンテ')
    .setBackground('#f3f3f3').setFontWeight('bold');
  sheet.getRange('A20:C20').merge().setValue('Select maintenance / メンテ操作を選択')
    .setBackground('#eeeeee').setFontWeight('bold');
  const maintenanceActions = [
    'Select maintenance / メンテ操作を選択',
    'Show Strava setup / Strava設定を表示',
    'Create Strava auth URL / Strava認証URL作成',
    'Exchange Strava code / Strava認証コード交換',
    'Fetch Strava activities / Stravaログ取得',
    'Sync Strava to Training_Plan / Strava実績反映',
    'Repair menu / メニュー修復'
  ];
  sheet.getRange('A20:C20').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(maintenanceActions, true).build()
  );
  sheet.getRange('A21:L21').merge().setValue('Maintenance actions are optional. / メンテ操作は必要時のみ使います。')
    .setBackground('#f3f3f3').setFontColor('#666666').setWrap(true);

  sheet.getRange('A23:L23').merge().setValue('Planned review / 予定レビュー（今日〜14日、最大15行）')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A24:L24').merge().setValue('Manual edits in B:E are marked automatically. / B:Eの手修正は自動で更新対象になります。')
    .setBackground('#f3f3f3').setFontColor('#666666').setWrap(true);
  sheet.getRange('A25:L25').setValues([['Date', 'Type', 'Planned Workout', 'Target Pace', 'Plan km', 'AI Copy', 'AI Type', 'AI Workout', 'AI Target Pace', 'AI Plan km', 'AI Reason', 'Update']])
    .setBackground('#674ea7').setFontColor('white').setFontWeight('bold');

  sheet.getRange('A42:C42').merge().setValue('Update / 更新操作')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A43:C43').merge().setValue('Select update / 更新を選択')
    .setBackground('#fff2cc').setFontWeight('bold');
  const updateActions = [
    'Select update / 更新を選択',
    '4. Apply selected rows / 選択行を反映'
  ];
  sheet.getRange('A43:C43').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(updateActions, true).build()
  );

  sheet.getRange('A45:F45').merge().setValue('Upcoming races / events / 今後のレース・予定')
    .setBackground('#cfe2f3').setFontWeight('bold');
  sheet.getRange('A46:F46').setValues([['Date', 'Type', 'Event Name', 'Goal / Constraint', 'Plan km', 'Priority']])
    .setBackground('#674ea7').setFontColor('white').setFontWeight('bold');

  sheet.setFrozenRows(4);
  for (let row = 1; row <= 200; row++) {
    sheet.setRowHeight(row, 21);
  }
  sheet.setRowHeight(4, 60);
  sheet.setRowHeight(12, 60);
  sheet.setRowHeight(16, 60);
  sheet.setColumnWidth(1, 92);
  sheet.setColumnWidth(2, 92);
  sheet.setColumnWidth(3, 210);
  sheet.setColumnWidth(4, 96);
  sheet.setColumnWidth(5, 72);
  sheet.setColumnWidth(6, 76);
  sheet.setColumnWidth(7, 86);
  sheet.setColumnWidth(8, 190);
  sheet.setColumnWidth(9, 96);
  sheet.setColumnWidth(10, 72);
  sheet.setColumnWidth(11, 220);
  sheet.setColumnWidth(12, 82);
}

function updateDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName('Dashboard');
  const tp = ss.getSheetByName('Training_Plan');
  const ec = ss.getSheetByName('Event_Calendar');
  if (!db || !tp || !ec) throw new Error('Required sheets are missing. Run initializeRunningAiKarte(). / 必要なシートがありません。initializeRunningAiKarte() を実行してください。');

  maintainTrainingPlanWindow();
  db.getRange('A26:L40').clearContent().clearDataValidations().removeCheckboxes();
  db.getRange('A26:L40').setBackground(null);
  db.getRange('A47:F54').clearContent();
  db.getRange('A47:F54').setBackground(null);

  const today = getTodayTokyo_();
  const rows = tp.getDataRange().getValues().slice(1).filter(r => r[0]);
  const aiMap = getLatestPlanUpdateMap_();
  const schedule = [];

  rows.forEach(r => {
    const diff = dateDiffDays_(r[0], today);
    if (diff === null) return;
    const date = formatDate_(r[0]);
    const ai = aiMap[date] || {};
    const hasAi = hasConcreteAiSuggestion_([ai.type, ai.workout, ai.targetPace, ai.planKm]);
    if (diff >= 0 && (diff <= 14 || (diff <= 30 && hasAi))) {
      schedule.push([
        date,
        r[2] || 'TBD',
        r[3] || '',
        r[4] || '',
        r[5] || '',
        false,
        ai.type || '',
        ai.workout || '',
        ai.targetPace || '',
        ai.planKm || '',
        ai.reason || '',
        false
      ]);
    }
  });

  schedule.sort((a, b) => dateDiffDays_(a[0], b[0]));

  if (schedule.length) {
    const output = schedule.slice(0, 15);
    db.getRange(26, 1, output.length, 12).setValues(output);
    db.getRange(26, 1, output.length, 12).setBackgrounds(
      output.map(row => Array(12).fill(getDateHighlightColor_(row[0])))
    );
    const typeRule = SpreadsheetApp.newDataValidation().requireValueInList([
      'Rest', 'Recovery', 'Jog', 'Long Run', 'Workout', 'Race', 'Other', 'TBD'
    ], true).build();
    db.getRange(26, 2, output.length, 1).setDataValidation(typeRule);
    db.getRange(26, 6, output.length, 1).insertCheckboxes();
    db.getRange(26, 12, output.length, 1).insertCheckboxes();
  }

  const eventRows = ec.getDataRange().getValues().slice(1).filter(r => r[0]);
  const events = eventRows.map(r => {
    const date = formatDate_(r[0]);
    return [date, r[1] || '-', r[2] || '-', r[3] || '-', r[4] || '', r[5] || '-'];
  }).filter(r => {
    const diff = dateDiffDays_(r[0], today);
    return diff !== null && diff >= 0 && diff <= 180;
  }).sort((a, b) => dateDiffDays_(a[0], b[0]));

  if (events.length) db.getRange(47, 1, Math.min(events.length, 8), 6).setValues(events.slice(0, 8));
}

function getLatestPlanUpdateMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const log = ss.getSheetByName('LLM_Response_Log');
  if (!log || log.getLastRow() < 2) return {};

  const raw = log.getRange(log.getLastRow(), 9).getDisplayValue();
  const parsed = extractKarteJson_(raw);
  const updates = (parsed && parsed.plan_updates) || (parsed && parsed.karte && parsed.karte.plan_updates) || [];
  const map = {};

  updates.forEach(item => {
    const date = formatDate_(item.date || item.Date || '');
    if (!date) return;
    map[date] = {
      type: item.type || item.Type || '',
      workout: item.workout || item.menu || item.planned_workout || item['Planned Workout'] || '',
      targetPace: item.target_pace || item.targetPace || item.pace || item['Target Pace'] || '',
      planKm: item.plan_km || item.dist || item.distance_km || item.km || item['Plan km'] || '',
      reason: item.reason || item.caution || item.note || item.notes || ''
    };
  });

  return map;
}

function getDashboardCondition_() {
  const db = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  if (!db) return '';
  return [
    'Feeling: ' + db.getRange('B7').getDisplayValue(),
    'Body: ' + db.getRange('B8').getDisplayValue(),
    'Question: ' + db.getRange('B9').getDisplayValue()
  ].join('\n');
}
/**
 * Running AI Karte - Training Plan helpers
 */

function normalizeTrainingPlanDates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Training_Plan');
  if (!sheet) throw new Error('Training_Plan sheet is missing. / Training_Planシートがありません。');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const range = sheet.getRange(2, 1, lastRow - 1, 2);
  const values = range.getValues();
  values.forEach(row => {
    if (row[0]) {
      row[0] = formatDate_(row[0]);
      row[1] = row[1] || getWeekday_(row[0]);
    }
  });
  range.setValues(values);
}

function sortTrainingPlan() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Training_Plan');
  if (!sheet || sheet.getLastRow() < 3) return;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).sort({column: 1, ascending: true});
}

function maintainTrainingPlanWindow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Training_Plan');
  if (!sheet) throw new Error('Training_Plan sheet is missing. / Training_Planシートがありません。');

  const window = getTrainingWindow_();
  const lastRow = sheet.getLastRow();
  const existingByDate = {};

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    for (let i = values.length - 1; i >= 0; i--) {
      const date = parseDate_(values[i][0]);
      const rowNumber = i + 2;
      if (!date || date < window.start || date > window.end) {
        sheet.deleteRow(rowNumber);
      } else {
        existingByDate[formatDate_(date)] = true;
      }
    }
  }

  const rows = [];
  for (let d = new Date(window.start); d <= window.end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate_(d);
    if (!existingByDate[dateStr]) {
      rows.push([dateStr, getWeekday_(d), 'TBD', '', '', '', '', '', '', '', '', '']);
    }
  }

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  }

  const typeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    'Rest', 'Recovery', 'Jog', 'Long Run', 'Workout', 'Race', 'Other', 'TBD'
  ], true).build();
  sheet.getRange('C2:C1000').setDataValidation(typeRule);

  sortTrainingPlan();
  applyTrainingPlanHighlights_();
}

function applyTrainingPlanHighlights_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Training_Plan');
  if (!sheet || sheet.getLastRow() < 2) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const backgrounds = dates.map(date => Array(lastCol).fill(getDateHighlightColor_(date)));
  sheet.getRange(2, 1, backgrounds.length, lastCol).setBackgrounds(backgrounds);
}
/**
 * Running AI Karte - Prompt generation
 */

function generateLLMPrompt() {
  updateDashboard();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tp = ss.getSheetByName('Training_Plan');
  const ec = ss.getSheetByName('Event_Calendar');
  const exportSheet = ss.getSheetByName('LLM_Export');
  const db = ss.getSheetByName('Dashboard');
  if (!tp || !ec || !exportSheet || !db) throw new Error('Required sheets are missing. Run initializeRunningAiKarte(). / 必要なシートがありません。initializeRunningAiKarte() を実行してください。');

  const today = getTodayTokyo_();
  const trainingRows = tp.getDataRange().getValues().slice(1).filter(r => r[0]);
  let past14 = [];
  let next14 = [];
  let total7 = 0;
  let total14 = 0;
  let runDays14 = 0;
  let highLoad = [];

  trainingRows.forEach(r => {
    const dateStr = formatDate_(r[0]);
    const diff = dateDiffDays_(dateStr, today);
    if (diff === null) return;
    const day = r[1] || getWeekday_(dateStr);
    const type = r[2] || '-';
    const plan = r[3] || '-';
    const target = r[4] || '-';
    const planKm = toNumber_(r[5]);
    const actualKm = toNumber_(r[6]);
    const durationMin = toNumber_(r[7]);
    const avgHr = r[8] || '-';
    const fatigue = r[9] || '-';
    const notes = r[10] || '-';
    const ai = r[11] || '-';

    if (diff >= -14 && diff < 0) {
      total14 += actualKm;
      if (diff >= -7) total7 += actualKm;
      if (actualKm > 0) runDays14++;
      past14.push(`${dateStr}(${day}): ${type} / actual ${actualKm || '-'}km / ${durationMin || '-'}min / avg HR ${avgHr} / fatigue ${fatigue} / notes: ${notes} / AI: ${ai}`);
      const hrNum = Number(avgHr) || 0;
      if (actualKm >= 15 || hrNum >= 145 || String(type).match(/Long Run|Workout|Race/i)) {
        highLoad.push(`${dateStr}(${day}): ${type} / ${actualKm || '-'}km / avg HR ${avgHr}`);
      }
    }

    if (diff >= 0 && diff <= 13) {
      next14.push(`${dateStr}(${day}): ${type} / plan: ${plan} / target: ${target} / ${planKm || '-'}km / notes: ${notes}`);
    }
  });

  const eventRows = ec.getDataRange().getValues().slice(1).filter(r => r[0]);
  const upcomingEvents = eventRows.map(r => {
    const d = formatDate_(r[0]);
    return { date: d, diff: dateDiffDays_(d, today), row: r };
  }).filter(x => x.diff !== null && x.diff >= 0 && x.diff <= 180)
    .sort((a, b) => a.diff - b.diff)
    .map(x => `${x.date}(${getWeekday_(x.date)}): ${x.row[1] || '-'} / ${x.row[2] || '-'} / ${x.row[3] || '-'} / plan ${x.row[4] || '-'}km / priority ${x.row[5] || '-'} / ${x.row[6] || '-'}`);

  const stravaSheet = ss.getSheetByName('Strava_Activities');
  const stravaLinked = (typeof isStravaLinked_ === 'function') ? isStravaLinked_() : false;
  const stravaStatus = stravaLinked
    ? 'Connected. Recent Strava activities may be reflected in Training_Plan. / 連携済み。直近のStravaログがTraining_Planに反映されている可能性があります。'
    : 'Not connected. Use manual Training_Plan inputs and subjective condition. / 未連携。手入力のTraining_Planと主観コンディションを使ってください。';

  const prompt = [
    '# Running AI Karte: Training consultation',
    '',
    'Concept: Run freely, get stronger.',
    '',
    'This sheet combines training plans, actual runs, race goals, and subjective condition so that AI can support human-in-the-loop training decisions.',
    '',
    '## Strava status',
    stravaStatus,
    '',
    '## Recent summary',
    `Past 7 days total distance: ${Math.round(total7 * 100) / 100} km`,
    `Past 14 days total distance: ${Math.round(total14 * 100) / 100} km`,
    `Past 14 days running days: ${runDays14}`,
    `Past 14 days high-load candidates: ${highLoad.length}`,
    '',
    '## Past 14 days',
    past14.length ? past14.join('\n') : 'No past 14-day actuals recorded.',
    '',
    '## High-load candidates',
    highLoad.length ? highLoad.join('\n') : 'No clear high-load candidates.',
    '',
    '## Next 14 days plan',
    next14.length ? next14.join('\n') : 'No next 14-day plan recorded. Please propose a safe plan based on current condition and goals.',
    '',
    '## Upcoming races / events / constraints',
    upcomingEvents.length ? upcomingEvents.join('\n') : 'No upcoming races or constraints recorded.',
    '',
    '## Current subjective condition',
    getDashboardCondition_(),
    '',
    '## Please answer',
    '1. Overall assessment of recent training',
    '2. Fatigue and overtraining risk',
    '3. Recommended next workout',
    '4. Suggestions toward upcoming races',
    '5. Topics to discuss with a coach',
    '',
    '## Return JSON at the end',
    'At the end, output only the following JSON in a code block. Do not update the training plan automatically.',
    'Use an empty plan_updates array if you do not recommend specific plan changes.',
    '```json',
    '{',
    '  "karte": {',
    '    "consultation_date": "YYYY/MM/DD",',
    '    "summary": "Overall summary",',
    '    "fatigue_score": 3,',
    '    "fatigue_label": "low/normal/moderate/high",',
    '    "advice": "Recommended next workout",',
    '    "coach_topics": "Topics to discuss with a coach",',
    '    "karte_memo": "Memo to keep"',
    '  },',
    '  "plan_updates": [',
    '    {',
    '      "date": "YYYY/MM/DD",',
    '      "type": "Rest/Recovery/Jog/Long Run/Workout/Race/Other/TBD",',
    '      "workout": "Suggested planned workout",',
    '      "target_pace": "Suggested target pace",',
    '      "plan_km": 0,',
    '      "reason": "Short reason or caution"',
    '    }',
    '  ]',
    '}',
    '```'
  ].join('\n');
  const copyPrompt = prompt.replace(/\s+/g, ' ').trim();

  exportSheet.appendRow([new Date(), prompt]);

  db.getRange('A12:L12').breakApart();
  db.getRange('A12:L12').merge().setValue(copyPrompt)
    .setBackground('#fff2cc').setWrap(false).setVerticalAlignment('top');
  db.getRange('A13:L13').merge().setValue('Copy A12 and paste it into Gemini, ChatGPT, Claude, or another LLM. / A12をコピーしてGemini、ChatGPT、Claudeなどへ貼り付け')
    .setBackground('#eeeeee').setFontColor('#666666').setWrap(true);
  db.setRowHeight(12, 60);
  db.setRowHeight(13, 21);
  safeUiAlert_('AI prompt generated in Dashboard A12. Copy A12 and paste it into your LLM.\n\nAI相談プロンプトをDashboard A12に生成しました。A12をコピーしてLLMへ貼り付けてください。');
}
/**
 * Running AI Karte - AI response log
 */

function saveAIResponseLog() {
  importAIResponse();
}

function importAIResponse() {
  importAIResponse_(true);
}

function importAIResponse_(showAlert) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName('Dashboard');
  const log = ss.getSheetByName('LLM_Response_Log');
  if (!db || !log) throw new Error('Required sheets are missing. Run initializeRunningAiKarte(). / 必要なシートがありません。initializeRunningAiKarte() を実行してください。');

  const raw = db.getRange('A16').getDisplayValue().trim();
  if (!raw) {
    if (showAlert !== false) {
      safeUiAlert_('Paste an AI response inside Dashboard A16 first.\n\n先にDashboard A16セル内へAI回答を貼り付けてください。');
    }
    return;
  }

  const parsed = extractKarteJson_(raw);
  const karte = parsed && parsed.karte ? parsed.karte : {};
  log.appendRow([
    new Date(),
    karte.consultation_date || formatDate_(new Date()),
    karte.summary || '',
    karte.fatigue_score || '',
    karte.fatigue_label || '',
    karte.advice || '',
    karte.coach_topics || '',
    karte.karte_memo || '',
    raw
  ]);

  db.getRange('A16:L16').breakApart();
  db.getRange('A16:L16').merge().clearContent().setWrap(false).setVerticalAlignment('top');
  db.getRange('A17:L17').merge().setValue('Imported. A16 was cleared. / 取り込みました。A16をクリアしました。')
    .setBackground('#d9ead3').setFontColor('#38761d').setWrap(true);
  db.setRowHeight(16, 60);
  updateDashboard();
  if (showAlert !== false) {
    safeUiAlert_('AI response imported to LLM_Response_Log. A16 was cleared. Training_Plan was not changed.\n\nAI回答をLLM_Response_Logへ取り込み、A16をクリアしました。Training_Planは変更していません。');
  }
}

function extractKarteJson_(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (e) {
    Logger.log('JSON parse skipped: ' + e.message);
    return null;
  }
}
/**
 * Running AI Karte - Utilities
 */

const RAK_TIMEZONE = 'Asia/Tokyo';
let rakHolidayCache_ = null;

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#674ea7')
    .setFontColor('white')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function safeUiAlert_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

function getTodayTokyo_() {
  return parseDate_(Utilities.formatDate(new Date(), RAK_TIMEZONE, 'yyyy/MM/dd'));
}

function getTrainingWindow_() {
  const today = getTodayTokyo_();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return { start: start, end: end };
}

function formatDate_(dateValue) {
  if (!dateValue) return '';
  const d = parseDate_(dateValue);
  if (!d) return '';
  return Utilities.formatDate(d, RAK_TIMEZONE, 'yyyy/MM/dd');
}

function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const s = String(value).trim().replace(/-/g, '/');
  const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function getWeekday_(dateValue) {
  const d = parseDate_(dateValue);
  if (!d) return '';
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

function dateDiffDays_(a, b) {
  const da = parseDate_(a);
  const db = parseDate_(b);
  if (!da || !db) return null;
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

function isSameDate_(a, b) {
  const da = parseDate_(a);
  const db = parseDate_(b);
  return !!(da && db && da.getTime() === db.getTime());
}

function isJapaneseHoliday_(dateValue) {
  const d = parseDate_(dateValue);
  if (!d) return false;

  if (!rakHolidayCache_) {
    rakHolidayCache_ = new Set();
    try {
      const cal = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
      if (!cal) return false;

      const today = getTodayTokyo_();
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() + 1, 11, 31);
      cal.getEvents(start, end).forEach(event => {
        rakHolidayCache_.add(Utilities.formatDate(event.getStartTime(), RAK_TIMEZONE, 'yyyy/MM/dd'));
      });
    } catch (e) {
      Logger.log('Holiday lookup skipped: ' + e.message);
      rakHolidayCache_.add('ERROR');
      return false;
    }
  }

  return rakHolidayCache_.has(formatDate_(d));
}

function getDateHighlightColor_(dateValue) {
  const d = parseDate_(dateValue);
  if (!d) return null;
  if (isSameDate_(d, getTodayTokyo_())) return '#fff2cc';
  if (isJapaneseHoliday_(d) || d.getDay() === 0) return '#fce5cd';
  if (d.getDay() === 6) return '#c9daf8';
  return null;
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function calculatePace_(timeSec, distKm) {
  if (!timeSec || !distKm) return '';
  const paceSec = timeSec / distKm;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return min + ':' + ('0' + sec).slice(-2) + '/km';
}

function readTable_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}
/**
 * Running AI Karte - Optional Strava OAuth
 */

function createStravaAuthUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = ss.getSheetByName('Strava_Setup');
  if (!setupSheet) throw new Error('Strava_Setup sheet is missing. Run showStravaSetup(). / Strava_Setupシートがありません。showStravaSetup() を実行してください。');

  const settings = getStravaSetupValues_(setupSheet);
  const clientId = settings.STRAVA_CLIENT_ID;
  if (!clientId) {
    safeUiAlert_('Enter STRAVA_CLIENT_ID in Strava_Setup first.\n\n先にStrava_SetupへSTRAVA_CLIENT_IDを入力してください。');
    return;
  }

  const redirectUri = 'http://localhost';
  const scope = 'read,activity:read_all';
  const url = 'https://www.strava.com/oauth/authorize'
    + '?client_id=' + encodeURIComponent(clientId)
    + '&response_type=code'
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&approval_prompt=force'
    + '&scope=' + encodeURIComponent(scope);

  setStravaSetupValue_(setupSheet, 'STRAVA_AUTH_URL', url);
  safeUiAlert_('Strava auth URL created. Open STRAVA_AUTH_URL, authorize, then paste the callback URL or code into STRAVA_CALLBACK_URL_OR_CODE.\n\nStrava認証URLを作成しました。STRAVA_AUTH_URLを開いて許可し、表示されたURL全体またはcodeをSTRAVA_CALLBACK_URL_OR_CODEへ貼り付けてください。');
}

function exchangeStravaAuthorizationCodeFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = ss.getSheetByName('Strava_Setup');
  if (!setupSheet) throw new Error('Strava_Setup sheet is missing. Run showStravaSetup(). / Strava_Setupシートがありません。showStravaSetup() を実行してください。');

  const settings = getStravaSetupValues_(setupSheet);
  const clientId = settings.STRAVA_CLIENT_ID;
  const clientSecret = settings.STRAVA_CLIENT_SECRET;
  const code = extractStravaCode_(settings.STRAVA_CALLBACK_URL_OR_CODE);

  if (!clientId || !clientSecret || !code) {
    safeUiAlert_('Enter STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_CALLBACK_URL_OR_CODE first.\n\n先にSTRAVA_CLIENT_ID、STRAVA_CLIENT_SECRET、STRAVA_CALLBACK_URL_OR_CODEを入力してください。');
    return;
  }

  const response = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post',
    payload: {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code'
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error('Strava token exchange failed / Stravaトークン交換に失敗しました: ' + status + ' ' + body);

  const data = JSON.parse(body);
  if (!data.refresh_token) throw new Error('No refresh_token returned / refresh_tokenが返りませんでした: ' + body);

  PropertiesService.getScriptProperties().setProperties({
    STRAVA_CLIENT_ID: clientId,
    STRAVA_CLIENT_SECRET: clientSecret,
    STRAVA_REFRESH_TOKEN: data.refresh_token
  });

  setStravaSetupValue_(setupSheet, 'STRAVA_REFRESH_TOKEN', 'saved');
  setStravaSetupValue_(setupSheet, 'STRAVA_SCOPE', data.scope || '');
  setStravaSetupValue_(setupSheet, 'STRAVA_CLIENT_SECRET', '');
  setStravaSetupValue_(setupSheet, 'STRAVA_CALLBACK_URL_OR_CODE', '');
  safeUiAlert_('Strava connection completed. Client secret and refresh token are stored in Script Properties.\n\nStrava連携が完了しました。Client SecretとRefresh TokenはScript Propertiesへ保存されました。');
}

function getStravaAccessToken_() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('STRAVA_CLIENT_ID');
  const clientSecret = props.getProperty('STRAVA_CLIENT_SECRET');
  const refreshToken = props.getProperty('STRAVA_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Strava credentials are missing. / Strava認証情報が不足しています。');

  const response = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post',
    payload: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error('Strava token refresh failed / Stravaトークン更新に失敗しました: ' + status + ' ' + body);

  const data = JSON.parse(body);
  if (data.refresh_token) props.setProperty('STRAVA_REFRESH_TOKEN', data.refresh_token);
  return data.access_token;
}

function extractStravaCode_(callbackOrCode) {
  if (!callbackOrCode) return '';
  const s = String(callbackOrCode).trim();
  const m = s.match(/[?&]code=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : s;
}
/**
 * Running AI Karte - Optional Strava fetch
 */

function fetchStravaActivities() {
  const accessToken = getStravaAccessToken_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Strava_Activities') || getOrCreateSheet_(ss, 'Strava_Activities');

  setHeader_(sheet, [
    'Fetched At', 'Activity ID', 'Date', 'Start Time', 'Title', 'Type', 'Distance km',
    'Duration min', 'Avg Pace', 'Avg HR', 'Max HR', 'Elevation Gain', 'Avg Cadence', 'Strava URL', 'Raw JSON'
  ]);

  const afterUnix = getStravaFetchAfterUnix_(sheet);
  let url = 'https://www.strava.com/api/v3/athlete/activities?per_page=200';
  if (afterUnix) url += '&after=' + afterUnix;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error('Strava fetch failed / Stravaログ取得に失敗しました: ' + status + ' ' + body);

  const activities = JSON.parse(body);
  const existingIds = getExistingActivityIds_(sheet);
  let added = 0;

  activities.reverse().forEach(activity => {
    if (activity.type !== 'Run') return;
    const activityId = String(activity.id);
    if (existingIds.has(activityId)) return;

    const start = new Date(activity.start_date);
    const distanceKm = activity.distance / 1000;
    sheet.appendRow([
      new Date(),
      "'" + activityId,
      Utilities.formatDate(start, RAK_TIMEZONE, 'yyyy/MM/dd'),
      Utilities.formatDate(start, RAK_TIMEZONE, 'HH:mm:ss'),
      activity.name || '',
      activity.type || '',
      Number(distanceKm.toFixed(2)),
      Number((activity.moving_time / 60).toFixed(2)),
      calculatePace_(activity.moving_time, distanceKm),
      activity.has_heartrate ? activity.average_heartrate : '',
      activity.has_heartrate ? activity.max_heartrate : '',
      activity.total_elevation_gain || '',
      activity.average_cadence || '',
      'https://www.strava.com/activities/' + activityId,
      JSON.stringify(activity)
    ]);
    added++;
  });

  safeUiAlert_('Strava fetch completed. Added ' + added + ' Run activities.\n\nStravaログ取得が完了しました。Runアクティビティを ' + added + ' 件追加しました。');
}

function getStravaFetchAfterUnix_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const dates = sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues().flat();
  let latestDate = null;
  dates.forEach(v => {
    const d = parseDate_(v);
    if (!d) return;
    if (!latestDate || d > latestDate) latestDate = d;
  });

  if (!latestDate) return null;
  latestDate.setDate(latestDate.getDate() - 7);
  return Math.floor(latestDate.getTime() / 1000);
}

function getExistingActivityIds_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  const ids = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues().flat().map(v => String(v).replace(/^'/, '').trim());
  return new Set(ids.filter(Boolean));
}
/**
 * Running AI Karte - Optional Strava setup
 */

function showStravaSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setup = getOrCreateSheet_(ss, 'Strava_Setup');
  const activities = getOrCreateSheet_(ss, 'Strava_Activities');

  setHeader_(setup, ['Key', 'Value', 'Description']);
  if (setup.getLastRow() <= 1) {
    setup.getRange(2, 1, 6, 3).setValues([
      ['STRAVA_CLIENT_ID', '', 'Strava API Client ID'],
      ['STRAVA_CLIENT_SECRET', '', 'Strava API Client Secret. Cleared after token exchange. / トークン交換後にシートから削除されます。'],
      ['STRAVA_AUTH_URL', '', 'Generated by createStravaAuthUrl(). / createStravaAuthUrl()で生成されます。'],
      ['STRAVA_CALLBACK_URL_OR_CODE', '', 'Paste the full callback URL or code after authorization. / 認可後のURL全体またはcodeを貼り付けます。'],
      ['STRAVA_REFRESH_TOKEN', '', 'Stored in Script Properties after token exchange. / トークン交換後にScript Propertiesへ保存されます。'],
      ['STRAVA_SCOPE', '', 'Granted OAuth scope. / 許可されたOAuthスコープです。']
    ]);
  }

  setHeader_(activities, [
    'Fetched At', 'Activity ID', 'Date', 'Start Time', 'Title', 'Type', 'Distance km',
    'Duration min', 'Avg Pace', 'Avg HR', 'Max HR', 'Elevation Gain', 'Avg Cadence', 'Strava URL', 'Raw JSON'
  ]);

  setup.showSheet();
  activities.showSheet();
  ss.setActiveSheet(setup);
}

function getStravaSetupValues_(setupSheet) {
  const values = setupSheet.getDataRange().getDisplayValues();
  const map = {};
  values.slice(1).forEach(row => {
    if (row[0]) map[String(row[0]).trim()] = row[1];
  });
  return map;
}

function setStravaSetupValue_(setupSheet, key, value) {
  const values = setupSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === key) {
      setupSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  setupSheet.appendRow([key, value, '']);
}

function isStravaLinked_() {
  const props = PropertiesService.getScriptProperties();
  return !!(props.getProperty('STRAVA_CLIENT_ID') && props.getProperty('STRAVA_CLIENT_SECRET') && props.getProperty('STRAVA_REFRESH_TOKEN'));
}
/**
 * Running AI Karte - Optional Strava sync to Training_Plan
 */

function syncStravaToTrainingPlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tp = ss.getSheetByName('Training_Plan');
  const sa = ss.getSheetByName('Strava_Activities');
  if (!tp || !sa) throw new Error('Training_Plan or Strava_Activities sheet is missing. / Training_PlanまたはStrava_Activitiesシートがありません。');

  maintainTrainingPlanWindow();
  const window = getTrainingWindow_();
  const activities = sa.getDataRange().getValues().slice(1).filter(r => r[1] && r[2]);
  const byDate = {};

  activities.forEach(r => {
    const date = formatDate_(r[2]);
    if (!date) return;
    const dateObj = parseDate_(date);
    if (!dateObj || dateObj < window.start || dateObj > window.end) return;
    const dist = toNumber_(r[6]);
    const duration = toNumber_(r[7]);
    const hr = toNumber_(r[9]);
    const url = r[13] || '';
    if (!byDate[date]) byDate[date] = { dist: 0, duration: 0, hrWeighted: 0, hrWeight: 0, count: 0, urls: [] };
    byDate[date].dist += dist;
    byDate[date].duration += duration;
    if (hr > 0 && dist > 0) {
      byDate[date].hrWeighted += hr * dist;
      byDate[date].hrWeight += dist;
    }
    byDate[date].count += 1;
    if (url) byDate[date].urls.push(url);
  });

  const lastRow = tp.getLastRow();
  const rows = lastRow >= 2 ? tp.getRange(2, 1, lastRow - 1, 12).getValues() : [];
  const dateToRowIndex = {};
  rows.forEach((r, i) => {
    const date = formatDate_(r[0]);
    if (date) dateToRowIndex[date] = i;
  });

  Object.keys(byDate).sort().forEach(date => {
    const summary = byDate[date];
    const avgHr = summary.hrWeight > 0 ? Math.round(summary.hrWeighted / summary.hrWeight) : '';
    const note = summary.count === 1
      ? 'Strava: ' + (summary.urls[0] || '')
      : 'Strava: ' + summary.count + ' activities; ' + (summary.urls[0] || '');

    if (dateToRowIndex[date] !== undefined) {
      const i = dateToRowIndex[date];
      rows[i][0] = date;
      rows[i][1] = rows[i][1] || getWeekday_(date);
      rows[i][2] = rows[i][2] || 'Jog';
      rows[i][6] = Number(summary.dist.toFixed(2));
      rows[i][7] = Number(summary.duration.toFixed(2));
      rows[i][8] = avgHr;
      rows[i][10] = mergeNotes_(rows[i][10], note);
    } else {
      rows.push([date, getWeekday_(date), 'Jog', '', '', '', Number(summary.dist.toFixed(2)), Number(summary.duration.toFixed(2)), avgHr, '', note, '']);
    }
  });

  if (rows.length) {
    tp.getRange(2, 1, rows.length, 12).setValues(rows);
    sortTrainingPlan();
    applyTrainingPlanHighlights_();
  }
  updateDashboard();
  safeUiAlert_('Strava actuals synced to Training_Plan.\n\nStrava実績をTraining_Planへ反映しました。');
}

function mergeNotes_(existing, addition) {
  const e = existing ? String(existing) : '';
  if (!e) return addition;
  if (e.indexOf(addition) >= 0) return e;
  if (e.indexOf('Strava:') >= 0) return e;
  return e + ' / ' + addition;
}
