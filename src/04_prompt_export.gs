/**
 * Running AI Karte - Prompt generation
 */

function generateLLMPrompt() {
  updateDashboard();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tp = ss.getSheetByName('Training_Plan');
  const ec = ss.getSheetByName('Event_Calendar');
  const exportSheet = ss.getSheetByName('LLM_Export');
  const db = ss.getSheetByName('Dashboard');
  if (!tp || !ec || !exportSheet || !db) throw new Error('Required sheets are missing. Run initializeRunningAiKarte(). / 必要なシートがありません。initializeRunningAiKarte() を実行してください。');

  const today = getTodayTokyo_();
  const trainingRows = tp.getDataRange().getValues().slice(1).filter(r => r[0]);
  let past14 = [];
  let next14 = [];
  let total7 = 0;
  let total14 = 0;
  let runDays14 = 0;
  let highLoad = [];

  trainingRows.forEach(r => {
    const dateStr = formatDate_(r[0]);
    const diff = dateDiffDays_(dateStr, today);
    if (diff === null) return;
    const day = r[1] || getWeekday_(dateStr);
    const type = r[2] || '-';
    const plan = r[3] || '-';
    const target = r[4] || '-';
    const planKm = toNumber_(r[5]);
    const actualKm = toNumber_(r[6]);
    const durationMin = toNumber_(r[7]);
    const avgHr = r[8] || '-';
    const fatigue = r[9] || '-';
    const notes = r[10] || '-';
    const ai = r[11] || '-';

    if (diff >= -14 && diff < 0) {
      total14 += actualKm;
      if (diff >= -7) total7 += actualKm;
      if (actualKm > 0) runDays14++;
      past14.push(`${dateStr}(${day}): ${type} / actual ${actualKm || '-'}km / ${durationMin || '-'}min / avg HR ${avgHr} / fatigue ${fatigue} / notes: ${notes} / AI: ${ai}`);
      const hrNum = Number(avgHr) || 0;
      if (actualKm >= 15 || hrNum >= 145 || String(type).match(/Long Run|Workout|Race/i)) {
        highLoad.push(`${dateStr}(${day}): ${type} / ${actualKm || '-'}km / avg HR ${avgHr}`);
      }
    }

    if (diff >= 0 && diff <= 13) {
      next14.push(`${dateStr}(${day}): ${type} / plan: ${plan} / target: ${target} / ${planKm || '-'}km / notes: ${notes}`);
    }
  });

  const eventRows = ec.getDataRange().getValues().slice(1).filter(r => r[0]);
  const upcomingEvents = eventRows.map(r => {
    const d = formatDate_(r[0]);
    return { date: d, diff: dateDiffDays_(d, today), row: r };
  }).filter(x => x.diff !== null && x.diff >= 0 && x.diff <= 180)
    .sort((a, b) => a.diff - b.diff)
    .map(x => `${x.date}(${getWeekday_(x.date)}): ${x.row[1] || '-'} / ${x.row[2] || '-'} / ${x.row[3] || '-'} / plan ${x.row[4] || '-'}km / priority ${x.row[5] || '-'} / ${x.row[6] || '-'}`);

  const stravaSheet = ss.getSheetByName('Strava_Activities');
  const stravaLinked = (typeof isStravaLinked_ === 'function') ? isStravaLinked_() : false;
  const stravaStatus = stravaLinked
    ? 'Connected. Recent Strava activities may be reflected in Training_Plan. / 連携済み。直近のStravaログがTraining_Planに反映されている可能性があります。'
    : 'Not connected. Use manual Training_Plan inputs and subjective condition. / 未連携。手入力のTraining_Planと主観コンディションを使ってください。';

  const prompt = [
    '# Running AI Karte: Training consultation',
    '',
    'Concept: Run freely, get stronger.',
    '',
    'This sheet combines training plans, actual runs, race goals, and subjective condition so that AI can support human-in-the-loop training decisions.',
    '',
    '## Strava status',
    stravaStatus,
    '',
    '## Recent summary',
    `Past 7 days total distance: ${Math.round(total7 * 100) / 100} km`,
    `Past 14 days total distance: ${Math.round(total14 * 100) / 100} km`,
    `Past 14 days running days: ${runDays14}`,
    `Past 14 days high-load candidates: ${highLoad.length}`,
    '',
    '## Past 14 days',
    past14.length ? past14.join('\n') : 'No past 14-day actuals recorded.',
    '',
    '## High-load candidates',
    highLoad.length ? highLoad.join('\n') : 'No clear high-load candidates.',
    '',
    '## Next 14 days plan',
    next14.length ? next14.join('\n') : 'No next 14-day plan recorded. Please propose a safe plan based on current condition and goals.',
    '',
    '## Upcoming races / events / constraints',
    upcomingEvents.length ? upcomingEvents.join('\n') : 'No upcoming races or constraints recorded.',
    '',
    '## Current subjective condition',
    getDashboardCondition_(),
    '',
    '## Please answer',
    '1. Overall assessment of recent training',
    '2. Fatigue and overtraining risk',
    '3. Recommended next workout',
    '4. Suggestions toward upcoming races',
    '5. Topics to discuss with a coach',
    '',
    '## Return JSON at the end',
    'At the end, output only the following JSON in a code block. Do not update the training plan automatically.',
    'Use an empty plan_updates array if you do not recommend specific plan changes.',
    '```json',
    '{',
    '  "karte": {',
    '    "consultation_date": "YYYY/MM/DD",',
    '    "summary": "Overall summary",',
    '    "fatigue_score": 3,',
    '    "fatigue_label": "low/normal/moderate/high",',
    '    "advice": "Recommended next workout",',
    '    "coach_topics": "Topics to discuss with a coach",',
    '    "karte_memo": "Memo to keep"',
    '  },',
    '  "plan_updates": [',
    '    {',
    '      "date": "YYYY/MM/DD",',
    '      "type": "Rest/Recovery/Jog/Long Run/Workout/Race/Other/TBD",',
    '      "workout": "Suggested planned workout",',
    '      "target_pace": "Suggested target pace",',
    '      "plan_km": 0,',
    '      "reason": "Short reason or caution"',
    '    }',
    '  ]',
    '}',
    '```'
  ].join('\n');
  const copyPrompt = prompt.replace(/\s+/g, ' ').trim();

  exportSheet.appendRow([new Date(), prompt]);

  db.getRange('A12:L12').breakApart();
  db.getRange('A12:L12').merge().setValue(copyPrompt)
    .setBackground('#fff2cc').setWrap(false).setVerticalAlignment('top');
  db.getRange('A13:L13').merge().setValue('Copy A12 and paste it into Gemini, ChatGPT, Claude, or another LLM. / A12をコピーしてGemini、ChatGPT、Claudeなどへ貼り付け')
    .setBackground('#eeeeee').setFontColor('#666666').setWrap(true);
  db.setRowHeight(12, 60);
  db.setRowHeight(13, 21);
  safeUiAlert_('AI prompt generated in Dashboard A12. Copy A12 and paste it into your LLM.\n\nAI相談プロンプトをDashboard A12に生成しました。A12をコピーしてLLMへ貼り付けてください。');
}
