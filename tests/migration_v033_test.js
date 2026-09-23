const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
function fixture(options = {}) {
  let writes = 0, releases = 0, rule, format;
  const props = {SCHEMA_VERSION: options.schema || '0.3.2'};
  const values = options.values || [[new Date('2026-09-12T00:00:00+09:00'), 'Race']];
  const range = {
    getValues: () => values,
    getFormulas: () => values.map(() => [options.formula || '', '']),
    setNumberFormat: x => { writes++; format = x; },
    setDataValidation: x => { writes++; rule = x; },
    getNumberFormats: () => [[format], [format]],
    getDataValidations: () => [[options.badRead ? null : rule], [rule]]
  };
  const sheet = {getMaxColumns: () => 19, getMaxRows: () => 3,
    getLastRow: () => values.length + 1, getRange: () => range};
  const ss = {getSheetByName: () => sheet, getSpreadsheetTimeZone: () => 'Asia/Tokyo', getId: () => 'dev'};
  const context = {Date, console,
    DASHBOARD_V030: {SHEETS: {TRAINING_PLAN: 'Training_Plan', EVENT_CALENDAR: 'Event_Calendar'}},
    PROPERTY_KEYS: {SCHEMA_VERSION: 'SCHEMA_VERSION'}, TP_COLS: {ACTUAL_UPDATE_ID: 19},
    CORE_SHEETS_V030: {EVENT_CALENDAR_HEADERS: new Array(10)},
    EXPECTED_TP_HEADERS_A_O: [], EXPECTED_TP_HEADERS_P_S: [],
    assertHeadersV032_: () => {if (options.header) throw Error('HEADER_CONFLICT');},
    LockService: {getDocumentLock: () => ({tryLock: () => !options.lock, releaseLock: () => releases++})},
    PropertiesService: {getDocumentProperties: () => ({getProperty: k => props[k] || null,
      setProperty: (k,v) => {writes++; props[k] = v;}})},
    SpreadsheetApp: {getActiveSpreadsheet: () => ss, flush: () => {},
      DataValidationCriteria: {DATE_IS_VALID_DATE: 'DATE_IS_VALID_DATE'},
      newDataValidation: () => ({requireDate() {return this;}, setAllowInvalid() {return this;},
        build: () => ({getCriteriaType: () => options.criteria || 'DATE_IS_VALID_DATE', getAllowInvalid: () => !!options.allowInvalid})})}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'migrationV033.gs'), 'utf8'), context);
  return {context, props, writes: () => writes, releases: () => releases};
}
let cases = 0;
const good = fixture();
good.context.previewMigrationV033(); assert.equal(good.writes(), 0); cases++;
good.context.migrateToV033(); good.context.migrateToV033();
assert.equal(good.props.SCHEMA_VERSION, '0.3.2');
assert.equal(good.props.AI_KARTE_CONTRACT_VERSION, '0.3.3');
assert.equal(good.releases(), 2); cases++;
for (const options of [{values:[['2026/09/12','Race']]}, {values:[['','Race']]},
  {values:[[new Date(NaN),'Race']]}, {formula:'=TODAY()'}, {header:true}, {schema:'0.3.4'}, {lock:true}]) {
  const f = fixture(options);
  assert.throws(() => f.context.migrateToV033()); assert.equal(f.writes(), 0); cases++;
}
for (const options of [{criteria:'DATE_IS_VALID'}, {criteria:'DATE_BETWEEN'}, {allowInvalid:true}]) {
  const f = fixture(options);
  assert.throws(() => f.context.migrateToV033());
  assert.equal(f.props.AI_KARTE_CONTRACT_VERSION, undefined); cases++;
}
const blank = fixture({values:[['','']]}); blank.context.migrateToV033(); cases++;
const bad = fixture({badRead:true}); assert.throws(() => bad.context.migrateToV033());
assert.equal(bad.props.AI_KARTE_CONTRACT_VERSION, undefined); assert.equal(bad.releases(), 1); cases++;
console.log(`${cases} migration foundation cases passed (mock Apps Script; live validation still required).`);
