/**
 * Running AI Karte - AI response log
 */

function saveAIResponseLog() {
  importAIResponse();
}

function importAIResponse() {
  importAIResponse_(true);
}

function importAIResponse_(showAlert) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName('Dashboard');
  const log = ss.getSheetByName('LLM_Response_Log');
  if (!db || !log) throw new Error('Required sheets are missing. Run initializeRunningAiKarte(). / 必要なシートがありません。initializeRunningAiKarte() を実行してください。');

  const raw = db.getRange('A16').getDisplayValue().trim();
  if (!raw) {
    if (showAlert !== false) {
      safeUiAlert_('Paste an AI response inside Dashboard A16 first.\n\n先にDashboard A16セル内へAI回答を貼り付けてください。');
    }
    return;
  }

  const parsed = extractKarteJson_(raw);
  const karte = parsed && parsed.karte ? parsed.karte : {};
  log.appendRow([
    new Date(),
    karte.consultation_date || formatDate_(new Date()),
    karte.summary || '',
    karte.fatigue_score || '',
    karte.fatigue_label || '',
    karte.advice || '',
    karte.coach_topics || '',
    karte.karte_memo || '',
    raw
  ]);

  db.getRange('A16:L16').breakApart();
  db.getRange('A16:L16').merge().clearContent().setWrap(false).setVerticalAlignment('top');
  db.getRange('A17:L17').merge().setValue('Imported. A16 was cleared. / 取り込みました。A16をクリアしました。')
    .setBackground('#d9ead3').setFontColor('#38761d').setWrap(true);
  db.setRowHeight(16, 60);
  updateDashboard();
  if (showAlert !== false) {
    safeUiAlert_('AI response imported to LLM_Response_Log. A16 was cleared. Training_Plan was not changed.\n\nAI回答をLLM_Response_Logへ取り込み、A16をクリアしました。Training_Planは変更していません。');
  }
}

function extractKarteJson_(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (e) {
    Logger.log('JSON parse skipped: ' + e.message);
    return null;
  }
}
