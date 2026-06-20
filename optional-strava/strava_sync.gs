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
