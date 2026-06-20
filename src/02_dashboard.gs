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
