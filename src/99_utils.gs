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
