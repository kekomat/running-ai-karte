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
