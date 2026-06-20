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
