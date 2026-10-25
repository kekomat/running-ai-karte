/** Opt-in Training_Plan date/numeric validation. Does not rewrite cell values. */
const TP_VALIDATION_V033 = Object.freeze({
  PROPERTY: 'AI_KARTE_TP_VALIDATION_VERSION', VERSION: '0.3.3-date-numeric-1',
  // ROW-relative INDIRECT avoids per-cell rebasing of custom formula criteria.
  COUNT_FORMULA: '=OR(ISBLANK(INDIRECT("RC",FALSE)),IFERROR(AND(ISNUMBER(INDIRECT("RC",FALSE)),INDIRECT("RC",FALSE)>=0,MOD(INDIRECT("RC",FALSE),1)=0),FALSE))'
});

function previewTrainingPlanValidationV033() {
  const report = preflightTrainingPlanValidationV033_(SpreadsheetApp.getActiveSpreadsheet(),
    PropertiesService.getDocumentProperties());
  console.log(JSON.stringify(report));
  return report;
}

function applyTrainingPlanValidationV033() {
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('TP_V033_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (!lock.tryLock(10000)) throw new Error('TP_V033_LOCK_TIMEOUT');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const props = PropertiesService.getDocumentProperties();
    const report = preflightTrainingPlanValidationV033_(ss, props);
    if (!report.ready) throw new Error('TP_V033_PREFLIGHT_FAILED: ' + JSON.stringify(report));
    const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
    const rules = trainingPlanRulesV033_();
    rules.forEach(function(item) {
      const range = sheet.getRange(2, item.column, sheet.getMaxRows() - 1, 1);
      range.setDataValidation(item.rule);
      if (item.column === TP_COLS.DATE) range.setNumberFormat('yyyy/MM/dd');
    });
    SpreadsheetApp.flush();
    verifyTrainingPlanValidationRulesV033_(sheet, rules);
    const after = preflightTrainingPlanValidationV033_(ss, props);
    if (!after.ready) throw new Error('TP_V033_POSTFLIGHT_FAILED: ' + JSON.stringify(after));
    props.setProperty(TP_VALIDATION_V033.PROPERTY, TP_VALIDATION_V033.VERSION);
    if (props.getProperty(TP_VALIDATION_V033.PROPERTY) !== TP_VALIDATION_V033.VERSION) {
      throw new Error('TP_V033_VERSION_VERIFICATION_FAILED');
    }
    after.applied = true;
    console.log(JSON.stringify(after));
    return after;
  } finally {
    lock.releaseLock();
  }
}

function preflightTrainingPlanValidationV033_(ss, props) {
  if (!ss || !props) throw new Error('TP_V033_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (props.getProperty(PROPERTY_KEYS.SCHEMA_VERSION) !== '0.3.2' ||
      props.getProperty(CONTRACT_V033.PROPERTY) !== CONTRACT_V033.VERSION) {
    throw new Error('TP_V033_REQUIRES_CONTRACT_FOUNDATION');
  }
  const version = props.getProperty(TP_VALIDATION_V033.PROPERTY);
  if (version && version !== TP_VALIDATION_V033.VERSION) throw new Error('TP_V033_VERSION_CONFLICT');
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet || sheet.getMaxColumns() < TP_COLS.ACTUAL_UPDATE_ID || sheet.getMaxRows() < 2) {
    throw new Error('TP_V033_GRID_CONFLICT');
  }
  assertHeadersV032_(sheet, 1, EXPECTED_TP_HEADERS_A_O.concat(EXPECTED_TP_HEADERS_P_S),
    'TP_V033_HEADER_CONFLICT');
  const timezone = ss.getSpreadsheetTimeZone();
  if (!timezone) throw new Error('TP_V033_TIMEZONE_MISSING');
  const count = Math.max(0, sheet.getLastRow() - 1);
  const range = count ? sheet.getRange(2, 1, count, TP_COLS.ACTUAL_UPDATE_ID) : null;
  const result = inspectTrainingPlanValuesV033_(range ? range.getValues() : [],
    range ? range.getFormulas() : [], timezone);
  result.spreadsheetId = ss.getId();
  result.timezone = timezone;
  result.rangeEndRow = sheet.getMaxRows();
  result.validationVersion = TP_VALIDATION_V033.VERSION;
  return result;
}

/** Collect cell locations and error codes only, never log personal cell contents. */
function inspectTrainingPlanValuesV033_(rows, formulas, timezone) {
  const issues = [], seen = Object.create(null);
  let issueCount = 0, usedRows = 0;
  function issue(row, column, code) {
    issueCount++;
    if (issues.length < 50) issues.push({row: row, column: column, code: code});
  }
  rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    if (!row.some(function(v) { return v !== ''; }) &&
        !formulas[index].some(function(v) { return v !== ''; })) return;
    usedRows++;
    const date = row[TP_COLS.DATE - 1];
    if (formulas[index][0] || !(date instanceof Date) || isNaN(date.getTime())) {
      issue(rowNumber, 'A', 'NATIVE_DATE_REQUIRED');
    } else {
      // Existing times of day are preserved; uniqueness is by spreadsheet-local day.
      const key = Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
      if (seen[key]) issue(rowNumber, 'A', 'DUPLICATE_DATE_WITH_ROW_' + seen[key]);
      else seen[key] = rowNumber;
    }
    [[TP_COLS.PLAN_KM, 'E', false], [TP_COLS.ACTUAL_KM, 'H', false],
      [TP_COLS.DURATION_MIN, 'I', false], [TP_COLS.AVG_HR, 'J', true],
      [TP_COLS.ACTIVITY_COUNT, 'L', false], [TP_COLS.MAX_HR, 'N', true]]
      .forEach(function(item) {
        const value = row[item[0] - 1];
        if (value === '') return;
        if (typeof value !== 'number' || !isFinite(value) ||
            (item[2] ? value <= 0 : value < 0) ||
            (item[0] === TP_COLS.ACTIVITY_COUNT && Math.floor(value) !== value)) {
          issue(rowNumber, item[1], 'INVALID_NUMBER');
        }
      });
    const avg = row[TP_COLS.AVG_HR - 1], max = row[TP_COLS.MAX_HR - 1];
    if (typeof avg === 'number' && typeof max === 'number' && max < avg) {
      issue(rowNumber, 'N', 'MAX_HR_BELOW_AVG_HR');
    }
  });
  return {ready: issueCount === 0, usedRows: usedRows, issueCount: issueCount, issues: issues};
}

function trainingPlanRulesV033_() {
  function build(method, args) {
    const builder = SpreadsheetApp.newDataValidation();
    return builder[method].apply(builder, args).setAllowInvalid(false).build();
  }
  return [
    {column: TP_COLS.DATE, rule: build('requireDate', [])},
    {column: TP_COLS.PLAN_KM, rule: build('requireNumberGreaterThanOrEqualTo', [0])},
    {column: TP_COLS.ACTUAL_KM, rule: build('requireNumberGreaterThanOrEqualTo', [0])},
    {column: TP_COLS.DURATION_MIN, rule: build('requireNumberGreaterThanOrEqualTo', [0])},
    {column: TP_COLS.AVG_HR, rule: build('requireNumberGreaterThan', [0])},
    {column: TP_COLS.ACTIVITY_COUNT, rule: build('requireFormulaSatisfied', [TP_VALIDATION_V033.COUNT_FORMULA])},
    {column: TP_COLS.MAX_HR, rule: build('requireNumberGreaterThan', [0])}
  ];
}

function verifyTrainingPlanValidationRulesV033_(sheet, rules) {
  rules.forEach(function(item) {
    const range = sheet.getRange(2, item.column, sheet.getMaxRows() - 1, 1);
    const formats = item.column === TP_COLS.DATE ? range.getNumberFormats() : null;
    range.getDataValidations().forEach(function(row, index) {
      const actual = row[0];
      if (!actual || actual.getAllowInvalid() ||
          actual.getCriteriaType() !== item.rule.getCriteriaType() ||
          JSON.stringify(actual.getCriteriaValues()) !== JSON.stringify(item.rule.getCriteriaValues()) ||
          (formats && formats[index][0] !== 'yyyy/MM/dd')) {
        throw new Error('TP_V033_VERIFICATION_FAILED: row=' + (index + 2) + ', column=' + item.column);
      }
    });
  });
}
