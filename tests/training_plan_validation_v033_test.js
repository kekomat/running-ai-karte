const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = process.env.KARTE_TEST_ROOT || path.resolve(__dirname, '..');
const source = process.env.KARTE_TP_SOURCE || path.join(root, 'trainingPlanValidationV033.gs');
function fixture(options = {}) {
  let writes = 0, releases = 0;
  const props = {SCHEMA_VERSION:'0.3.2', AI_KARTE_CONTRACT_VERSION:'0.3.3', ...options.props};
  const formats = {}, rules = {};
  const context = {Date, console: {log: () => {}},
    Utilities: {formatDate: (date, tz) => new Intl.DateTimeFormat('en-CA', {
      timeZone:tz, year:'numeric', month:'2-digit', day:'2-digit'}).format(date)},
    LockService: {getDocumentLock: () => options.noLock ? null : {
      tryLock: () => !options.busy, releaseLock: () => releases++}},
    PropertiesService: {getDocumentProperties: () => ({
      getProperty: k => props[k] ?? null, setProperty: (k,v) => {writes++; if (!options.propertyFailure) props[k]=v;}})},
    SpreadsheetApp: {flush: () => {}, newDataValidation: () => {
      let type, args, allow;
      const b = {setAllowInvalid(v) {allow=v; return b;}, build() {
        return {getCriteriaType: () => type, getCriteriaValues: () => args, getAllowInvalid: () => allow};}};
      for (const [method, criterion] of Object.entries({requireDate:'DATE_IS_VALID_DATE',
        requireNumberGreaterThanOrEqualTo:'NUMBER_GREATER_THAN_OR_EQUAL_TO',
        requireNumberGreaterThan:'NUMBER_GREATER_THAN',requireFormulaSatisfied:'CUSTOM_FORMULA'})) {
        b[method]=(...values) => {type=criterion; args=values; return b;};
      } return b;
    }}
  };
  vm.createContext(context);
  for (const file of ['dashboardConstants.gs','migration.gs','migrationV033.gs']) {
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  }
  vm.runInContext(fs.readFileSync(source,'utf8'),context);
  const headers = vm.runInContext('EXPECTED_TP_HEADERS_A_O.concat(EXPECTED_TP_HEADERS_P_S)',context);
  const row = new Array(19).fill(''); row[0]=new Date('2026-09-23T00:00:00+09:00'); row[1]='TBD';
  const rows = options.rows || [row];
  const formulas = options.formulas || rows.map(() => new Array(19).fill(''));
  const sheet = {
    getName: () => 'Training_Plan', getMaxRows: () => rows.length+2, getMaxColumns: () => 26,
    getLastRow: () => rows.length+1,
    getRange(r,c,h,w) {return {
      getDisplayValues: () => [options.header ? ['wrong'] : headers],
      getValues: () => rows.map(x=>x.slice(c-1,c-1+w)),
      getFormulas: () => formulas.map(x=>x.slice(c-1,c-1+w)),
      setDataValidation: rule => {writes++; rules[c]=rule;},
      setNumberFormat: format => {writes++; formats[c]=format;},
      getNumberFormats: () => Array.from({length:h},()=>[formats[c]]),
      getDataValidations: () => Array.from({length:h},()=>[options.badRead ? null : rules[c]])
    };}
  };
  context.SpreadsheetApp.getActiveSpreadsheet=()=>({getSheetByName: () => sheet,
    getSpreadsheetTimeZone: () => 'Asia/Tokyo', getId: () => 'test-dev'});
  return {context,props,rows,formulas,rules,formats,writes:()=>writes,releases:()=>releases};
}
let cases=0;
function test(name, fn) {fn(); cases++; console.log('PASS '+name);}
function sample(changes={}) {
  const row=new Array(19).fill(''); row[0]=new Date('2026-09-23T00:00:00+09:00'); row[1]='TBD';
  Object.entries(changes).forEach(([k,v])=>row[Number(k)]=v); return row;
}
test('preview is read only',()=>{const f=fixture(); assert(f.context.previewTrainingPlanValidationV033().ready);assert.equal(f.writes(),0);});
test('apply and rerun preserve values and schema; only seven columns get rules',()=>{
  const f=fixture({rows:[sample({4:0,7:12.34,8:60.5,9:140.5,11:2,13:180})]});
  const before=JSON.stringify(f.rows);
  assert(f.context.applyTrainingPlanValidationV033().applied);f.context.applyTrainingPlanValidationV033();
  assert.equal(JSON.stringify(f.rows),before);assert.equal(f.props.SCHEMA_VERSION,'0.3.2');
  assert.equal(f.props.AI_KARTE_TP_VALIDATION_VERSION,'0.3.3-date-numeric-1');assert.equal(f.releases(),2);
  assert.deepEqual(Object.keys(f.rules),['1','5','8','9','10','12','14']);assert.deepEqual(Object.keys(f.formats),['1']);
  assert.equal(f.rules[1].getCriteriaType(),'DATE_IS_VALID_DATE');
  assert.equal(f.rules[5].getCriteriaType(),'NUMBER_GREATER_THAN_OR_EQUAL_TO');
  assert.equal(f.rules[10].getCriteriaType(),'NUMBER_GREATER_THAN');
  assert.equal(f.rules[12].getCriteriaType(),'CUSTOM_FORMULA');
});
for (const [label,rows] of [
  ['text date',[sample({0:'2026/09/23'})]], ['missing date',[sample({0:''})]],
  ['invalid date',[sample({0:new Date(NaN)})]], ['duplicate day',[sample(),sample({0:new Date('2026-09-23T12:00:00+09:00')})]],
  ['negative distance',[sample({4:-1})]], ['text distance',[sample({7:'12'})]],
  ['boolean duration',[sample({8:false})]], ['infinite duration',[sample({8:Infinity})]],
  ['zero HR',[sample({9:0})]], ['negative max HR',[sample({13:-1})]],
  ['fractional count',[sample({11:1.5})]], ['text count',[sample({11:'2'})]],
  ['max below avg',[sample({9:170,13:160})]]]) {
  test(label+' blocks before mutation',()=>{const f=fixture({rows}); assert(!f.context.previewTrainingPlanValidationV033().ready);
    assert.throws(()=>f.context.applyTrainingPlanValidationV033(),/PREFLIGHT/);assert.equal(f.writes(),0);assert.equal(f.releases(),1);});
}
test('date formula blocks',()=>{const formulas=[new Array(19).fill('')];formulas[0][0]='=TODAY()';
  const f=fixture({formulas});assert.throws(()=>f.context.applyTrainingPlanValidationV033());assert.equal(f.writes(),0);});
test('unused blank rows and zero count accepted',()=>{const f=fixture({rows:[sample({11:0}),new Array(19).fill('')]});assert(f.context.previewTrainingPlanValidationV033().ready);});
test('duplicate uses sheet timezone across UTC dates',()=>{const f=fixture({rows:[sample({0:new Date('2026-09-22T16:00:00Z')}),sample({0:new Date('2026-09-23T01:00:00Z')})]});assert(!f.context.previewTrainingPlanValidationV033().ready);});
for (const options of [{header:true},{props:{SCHEMA_VERSION:'0.3.4'}},{props:{AI_KARTE_CONTRACT_VERSION:null}},
  {props:{AI_KARTE_TP_VALIDATION_VERSION:'future'}},{busy:true},{noLock:true}]) {
  test('structural or lock conflict '+JSON.stringify(options),()=>{const f=fixture(options);assert.throws(()=>f.context.applyTrainingPlanValidationV033());assert.equal(f.writes(),0);});
}
test('readback failure does not mark migration complete',()=>{const f=fixture({badRead:true});
  assert.throws(()=>f.context.applyTrainingPlanValidationV033(),/VERIFICATION/);assert.equal(f.props.AI_KARTE_TP_VALIDATION_VERSION,undefined);assert.equal(f.releases(),1);});
test('property write failure is reported',()=>{const f=fixture({propertyFailure:true});assert.throws(()=>f.context.applyTrainingPlanValidationV033(),/VERSION_VERIFICATION/);});
test('issue report is bounded',()=>{const f=fixture({rows:Array.from({length:60},()=>sample({4:-1}))});const r=f.context.previewTrainingPlanValidationV033();assert(r.issueCount>50);assert.equal(r.issues.length,50);});
console.log(`${cases} Training_Plan validation tests passed (mock Apps Script).`);
