/** v0.3.3 Contract Foundation. Explicit opt-in; never called by v0.3.2 install. */
const CONTRACT_V033 = Object.freeze({
  VERSION: '0.3.3', PROPERTY: 'AI_KARTE_CONTRACT_VERSION', DATE_FORMAT: 'yyyy/MM/dd'
});

/** Read-only readiness report. Text dates require explicit correction before migration. */
function previewMigrationV033() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getDocumentProperties();
  return preflightMigrationV033_(ss, props);
}

function migrateToV033() {
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('V033_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (!lock.tryLock(10000)) throw new Error('V033_LOCK_TIMEOUT');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const props = PropertiesService.getDocumentProperties();
    const report = preflightMigrationV033_(ss, props);
    const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
    const range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1);
    range.setNumberFormat(CONTRACT_V033.DATE_FORMAT);
    range.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireDate().setAllowInvalid(false).build());
    SpreadsheetApp.flush();
    preflightMigrationV033_(ss, props);
    const formats = range.getNumberFormats();
    range.getDataValidations().forEach(function(row, index) {
      const rule = row[0];
      if (formats[index][0] !== CONTRACT_V033.DATE_FORMAT || !rule ||
          rule.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.DATE_IS_VALID_DATE ||
          rule.getAllowInvalid()) throw new Error('V033_VERIFICATION_FAILED: row=' + (index + 2));
    });
    props.setProperty(CONTRACT_V033.PROPERTY, CONTRACT_V033.VERSION);
    if (props.getProperty(CONTRACT_V033.PROPERTY) !== CONTRACT_V033.VERSION) {
      throw new Error('V033_VERSION_VERIFICATION_FAILED');
    }
    return report;
  } finally {
    lock.releaseLock();
  }
}

function preflightMigrationV033_(ss, props) {
  if (!ss || !props) throw new Error('V033_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (props.getProperty(PROPERTY_KEYS.SCHEMA_VERSION) !== '0.3.2') {
    throw new Error('V033_REQUIRES_V032');
  }
  const version = props.getProperty(CONTRACT_V033.PROPERTY);
  if (version && version !== CONTRACT_V033.VERSION) throw new Error('V033_VERSION_CONFLICT');
  const tp = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
  if (!tp || tp.getMaxColumns() < TP_COLS.ACTUAL_UPDATE_ID || !sheet ||
      sheet.getMaxColumns() < CORE_SHEETS_V030.EVENT_CALENDAR_HEADERS.length ||
      sheet.getMaxRows() < 2) throw new Error('V033_GRID_CONFLICT');
  assertHeadersV032_(tp, 1, EXPECTED_TP_HEADERS_A_O.concat(EXPECTED_TP_HEADERS_P_S),
    'V033_HEADER_CONFLICT');
  assertHeadersV032_(sheet, 1, CORE_SHEETS_V030.EVENT_CALENDAR_HEADERS, 'V033_HEADER_CONFLICT');
  const timezone = ss.getSpreadsheetTimeZone();
  if (!timezone) throw new Error('V033_TIMEZONE_MISSING');
  if (sheet.getLastRow() >= 2) {
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10);
    const formulas = range.getFormulas();
    range.getValues().forEach(function(row, index) {
      const used = row.some(function(value) { return value !== ''; }) ||
        formulas[index].some(function(value) { return value !== ''; });
      if (formulas[index][0] || (used &&
          (!(row[0] instanceof Date) || isNaN(row[0].getTime())))) {
        throw new Error('V033_EVENT_DATE_CONFLICT: row=' + (index + 2));
      }
    });
  }
  return {contractVersion: CONTRACT_V033.VERSION, schemaVersion: '0.3.2',
    spreadsheetId: ss.getId(), timezone: timezone,
    dateRange: 'Event_Calendar!A2:A' + sheet.getMaxRows()};
}
