const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

const splitFiles = [
  'src/01_setup.gs',
  'src/02_dashboard.gs',
  'src/03_training_plan.gs',
  'src/04_prompt_export.gs',
  'src/05_response_log.gs',
  'src/99_utils.gs',
  'optional-strava/strava_auth.gs',
  'optional-strava/strava_fetch.gs',
  'optional-strava/strava_setup.gs',
  'optional-strava/strava_sync.gs'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function assertJsonEqual(actual, expected) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
}

function formatDateLikeGas(date, pattern) {
  const pad = value => String(value).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return pattern
    .replace('yyyy', y)
    .replace('MM', m)
    .replace('dd', d)
    .replace('HH', hh)
    .replace('mm', mm)
    .replace('ss', ss);
}

function loadGasRuntime(files) {
  const sandbox = {
    console,
    Logger: { log: () => {} },
    CalendarApp: {
      getCalendarById: () => ({
        getEvents: () => []
      })
    },
    Utilities: {
      formatDate: (date, _timezone, pattern) => formatDateLikeGas(date, pattern)
    }
  };

  vm.createContext(sandbox);
  files.forEach(file => {
    vm.runInContext(read(file), sandbox, { filename: file });
  });
  return sandbox;
}

function testCombinedMatchesSplitFiles() {
  const expected = splitFiles.map(read).join('');
  const actual = read('running_ai_karte_combined.gs');
  assert.strictEqual(actual, expected, 'running_ai_karte_combined.gs must match split source files');
}

function testUtilities() {
  const gas = loadGasRuntime(['src/99_utils.gs']);

  assert.strictEqual(gas.formatDate_('2026-06-14'), '2026/06/14');
  assert.strictEqual(gas.formatDate_(new Date(2026, 5, 14)), '2026/06/14');
  assert.strictEqual(gas.getWeekday_('2026/06/14'), 'Sun');
  assert.strictEqual(gas.dateDiffDays_('2026/06/20', '2026/06/14'), 6);
  assert.strictEqual(gas.dateDiffDays_('invalid', '2026/06/14'), null);
  assertJsonEqual(
    {
      start: gas.formatDate_(gas.getTrainingWindow_().start),
      end: gas.formatDate_(gas.getTrainingWindow_().end)
    },
    {
      start: gas.formatDate_(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
      end: gas.formatDate_(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0))
    }
  );
  assert.strictEqual(gas.toNumber_('1,234.5'), 1234.5);
  assert.strictEqual(gas.toNumber_(''), 0);
  assert.strictEqual(gas.calculatePace_(1500, 5), '5:00/km');
  assert.strictEqual(gas.calculatePace_(0, 5), '');
}

function testResponseJsonExtraction() {
  const gas = loadGasRuntime(['src/99_utils.gs', 'src/05_response_log.gs']);
  const fenced = [
    'Here is the response.',
    '```json',
    '{"karte":{"summary":"ok","fatigue_score":3}}',
    '```'
  ].join('\n');

  assertJsonEqual(gas.extractKarteJson_(fenced), {
    karte: { summary: 'ok', fatigue_score: 3 }
  });
  assertJsonEqual(gas.extractKarteJson_('prefix {"karte":{"advice":"rest"}} suffix'), {
    karte: { advice: 'rest' }
  });
  assert.strictEqual(gas.extractKarteJson_('no json here'), null);
  assert.strictEqual(gas.extractKarteJson_('{"karte":'), null);
}

function testStravaCodeExtraction() {
  const gas = loadGasRuntime([
    'src/99_utils.gs',
    'optional-strava/strava_setup.gs',
    'optional-strava/strava_auth.gs'
  ]);

  assert.strictEqual(gas.extractStravaCode_('abc123'), 'abc123');
  assert.strictEqual(
    gas.extractStravaCode_('http://localhost/?state=&code=abc%20123&scope=read'),
    'abc 123'
  );
  assert.strictEqual(gas.extractStravaCode_(''), '');
}

function testNoPlaceholderLicense() {
  assert.ok(!read('LICENSE').includes('TBD'), 'LICENSE must not contain TBD');
  assert.ok(!read('README.md').includes('License\n\nTBD'), 'README must not contain placeholder license');
}

const tests = [
  testCombinedMatchesSplitFiles,
  testUtilities,
  testResponseJsonExtraction,
  testStravaCodeExtraction,
  testNoPlaceholderLicense
];

tests.forEach(test => {
  test();
  console.log(`ok - ${test.name}`);
});
