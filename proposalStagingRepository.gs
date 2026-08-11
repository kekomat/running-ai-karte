/** Running AI Karte v0.3.0 - Proposal_Staging repository and lifecycle. */

const PROPOSAL_STAGING_V030 = Object.freeze({
  HEADERS: Object.freeze([
    'Proposal ID', 'Consultation ID', 'Revision', 'Source Snapshot ID', 'Submitted At',
    'Date', 'Workout Type', 'Workout', 'Plan km', 'Duration min', 'Target Pace',
    'Reason', 'Warning', 'Status', 'Status Updated At', 'Status Detail', 'Applied At'
  ]),
  COLUMNS: Object.freeze({
    PROPOSAL_ID: 1,
    CONSULTATION_ID: 2,
    REVISION: 3,
    SOURCE_SNAPSHOT_ID: 4,
    SUBMITTED_AT: 5,
    DATE: 6,
    WORKOUT_TYPE: 7,
    WORKOUT: 8,
    PLAN_KM: 9,
    DURATION_MIN: 10,
    TARGET_PACE: 11,
    REASON: 12,
    WARNING: 13,
    STATUS: 14,
    STATUS_UPDATED_AT: 15,
    STATUS_DETAIL: 16,
    APPLIED_AT: 17
  }),
  STATUS: Object.freeze({
    SUBMITTED: 'SUBMITTED',
    LOADED: 'LOADED',
    APPLIED: 'APPLIED',
    SUPERSEDED: 'SUPERSEDED',
    INVALID: 'INVALID',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED'
  }),
  ACTIVE_STATUSES: Object.freeze(['SUBMITTED', 'LOADED'])
});

function ensureProposalStagingSheetV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.PROPOSAL_STAGING);
  let needsFormatting = false;
  if (!sheet) {
    sheet = ss.insertSheet(DASHBOARD_V030.SHEETS.PROPOSAL_STAGING);
    needsFormatting = true;
  }

  const headers = PROPOSAL_STAGING_V030.HEADERS;
  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (current.join('\u0000') !== headers.join('\u0000')) {
    if (sheet.getLastRow() > 1 && current.some(Boolean)) {
      throw new Error('Proposal_Stagingのヘッダーがv0.3.0仕様と一致しません。');
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    needsFormatting = true;
  }

  if (needsFormatting) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground(DASHBOARD_V030.COLORS.AI)
      .setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
    sheet.getRange('E:E').setNumberFormat('yyyy/MM/dd HH:mm:ss');
    sheet.getRange('F:F').setNumberFormat('yyyy/MM/dd');
    sheet.getRange('O:O').setNumberFormat('yyyy/MM/dd HH:mm:ss');
    sheet.getRange('Q:Q').setNumberFormat('yyyy/MM/dd HH:mm:ss');
  }
  return sheet;
}

/**
 * Public recording entrypoint used after explicit user approval.
 * Request: {sourceSnapshotId, consultationId?, items:[{date,type,workout,planKm,
 * durationMin,targetPace,reason,warning}]}
 */
function recordProposalStaging(request) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const input = request || {};
    const items = Array.isArray(input.items) ? input.items : [];
    if (!items.length) throw new Error('記録する日付別提案がありません。');
    if (isDashboardV030Blank_(input.sourceSnapshotId)) {
      throw new Error('Source Snapshot IDが必要です。');
    }

    const sheet = ensureProposalStagingSheetV030_();
    const existing = readProposalStagingRowsV030_(sheet);
    const consultationId = normalizeConsultationIdV030_(input.consultationId) ||
      createTrackedIdV030_('CNS');
    const revision = nextConsultationRevisionV030_(existing, consultationId);
    const now = new Date();
    const seenDates = {};

    items.forEach(function(item) {
      const key = dashboardDateKeyV030_(item && item.date);
      if (key && seenDates[key]) throw new Error('同じ記録要求に同一日付が複数あります: ' + key);
      if (key) seenDates[key] = true;
    });

    const targetDates = Object.keys(seenDates);
    existing.forEach(function(entry) {
      const row = entry.values;
      const status = String(row[PROPOSAL_STAGING_V030.COLUMNS.STATUS - 1] || '').trim();
      const key = dashboardDateKeyV030_(row[PROPOSAL_STAGING_V030.COLUMNS.DATE - 1]);
      if (targetDates.indexOf(key) >= 0 && PROPOSAL_STAGING_V030.ACTIVE_STATUSES.indexOf(status) >= 0) {
        updateProposalStatusV030_(sheet, entry.rowNumber,
          PROPOSAL_STAGING_V030.STATUS.SUPERSEDED, now,
          '同日付の新しい承認済み提案に置換');
      }
    });

    const output = items.map(function(item) {
      item = item || {};
      return [
        createTrackedIdV030_('PRP'),
        consultationId,
        revision,
        String(input.sourceSnapshotId).trim(),
        now,
        normalizeDashboardDateV030_(item.date) || String(item.date || '').trim(),
        String(item.type || item.workoutType || '').trim(),
        String(item.workout || '').trim(),
        isDashboardV030Blank_(item.planKm) ? '' : item.planKm,
        isDashboardV030Blank_(item.durationMin) ? '' : item.durationMin,
        String(item.targetPace || '').trim(),
        String(item.reason || '').trim(),
        String(item.warning || '').trim(),
        PROPOSAL_STAGING_V030.STATUS.SUBMITTED,
        now,
        '',
        ''
      ];
    });

    const startRow = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(startRow, 1, output.length, PROPOSAL_STAGING_V030.HEADERS.length)
      .setValues(output);
    SpreadsheetApp.flush();
    return {
      consultationId: consultationId,
      revision: revision,
      proposalIds: output.map(function(row) { return row[0]; }),
      recordedCount: output.length,
      dashboardUrl: getDashboardUrlV030_()
    };
  } finally {
    lock.releaseLock();
  }
}

/** No-argument smoke test for the empty-sheet deployment flow. */
function runProposalStagingSmokeTestV030() {
  const snapshotRange = SpreadsheetApp.getActiveSpreadsheet()
    .getRangeByName('LLM_BRIEF_SNAPSHOT_ID');
  if (!snapshotRange || !String(snapshotRange.getDisplayValue() || '').trim()) buildLlmBrief();

  const snapshotId = String(getDashboardV030NamedRange_('LLM_BRIEF_SNAPSHOT_ID')
    .getDisplayValue() || '').trim();
  const today = dashboardTodayV030_();
  const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return recordProposalStaging({
    sourceSnapshotId: snapshotId,
    items: [{
      date: targetDate,
      type: 'Jog',
      workout: '[TEST] Easy jog',
      planKm: 5,
      durationMin: 35,
      targetPace: 'Easy',
      reason: '[TEST] Proposal_Staging lifecycle smoke test'
    }]
  });
}

function validateAndLoadProposalsV030_() {
  const sheet = ensureProposalStagingSheetV030_();
  const entries = readProposalStagingRowsV030_(sheet);
  const idCounts = {};
  entries.forEach(function(entry) {
    const id = String(entry.values[0] || '').trim();
    if (id) idCounts[id] = (idCounts[id] || 0) + 1;
  });

  const context = buildProposalValidationContextV030_();
  const candidates = [];
  const warnings = [];
  const now = new Date();
  let revalidatedCount = 0;
  let invalidCount = 0;

  entries.forEach(function(entry) {
    const row = entry.values;
    const status = String(row[PROPOSAL_STAGING_V030.COLUMNS.STATUS - 1] || '').trim();
    const revalidating = status === PROPOSAL_STAGING_V030.STATUS.INVALID &&
      isRevalidatableProposalV032_(row);
    if (PROPOSAL_STAGING_V030.ACTIVE_STATUSES.indexOf(status) < 0 && !revalidating) return;

    const errors = validateProposalRowV030_(row, idCounts, context);
    if (errors.length) {
      updateProposalStatusV030_(sheet, entry.rowNumber,
        PROPOSAL_STAGING_V030.STATUS.INVALID, now, errors.join(' / '));
      invalidCount++;
      return;
    }

    const warning = buildProposalWarningV030_(row, context);
    sheet.getRange(entry.rowNumber, PROPOSAL_STAGING_V030.COLUMNS.WARNING).setValue(warning);
    if (status === PROPOSAL_STAGING_V030.STATUS.SUBMITTED || revalidating) {
      updateProposalStatusV030_(sheet, entry.rowNumber,
        PROPOSAL_STAGING_V030.STATUS.LOADED, now, warning ? '警告付きでDashboard取込' : 'Dashboard取込済み');
      if (revalidating) revalidatedCount++;
    }
    if (warning) warnings.push(dashboardDateKeyV030_(row[5]) + ': ' + warning);
    candidates.push({rowNumber: entry.rowNumber, values: row, warning: warning});
  });

  const newestByDate = {};
  candidates.forEach(function(candidate) {
    const key = dashboardDateKeyV030_(candidate.values[5]);
    const current = newestByDate[key];
    if (!current || proposalSubmittedTimeV030_(candidate.values) >= proposalSubmittedTimeV030_(current.values)) {
      if (current) {
        updateProposalStatusV030_(sheet, current.rowNumber,
          PROPOSAL_STAGING_V030.STATUS.SUPERSEDED, now, '同日付の新しい未反映提案を優先');
      }
      newestByDate[key] = candidate;
    } else {
      updateProposalStatusV030_(sheet, candidate.rowNumber,
        PROPOSAL_STAGING_V030.STATUS.SUPERSEDED, now, '同日付の新しい未反映提案を優先');
    }
  });

  const proposalsByDate = {};
  Object.keys(newestByDate).forEach(function(key) {
    const candidate = newestByDate[key];
    const row = candidate.values;
    proposalsByDate[key] = {
      proposalId: String(row[0]),
      consultationId: String(row[1]),
      revision: Number(row[2]),
      sourceSnapshotId: String(row[3]),
      type: String(row[6] || ''),
      workout: String(row[7] || ''),
      planKm: isDashboardV030Blank_(row[8]) ? '' : Number(row[8]),
      durationMin: isDashboardV030Blank_(row[9]) ? '' : Number(row[9]),
      targetPace: String(row[10] || ''),
      reason: String(row[11] || ''),
      warning: candidate.warning
    };
  });

  SpreadsheetApp.flush();
  return {
    proposalsByDate: proposalsByDate,
    loadedCount: Object.keys(proposalsByDate).length,
    warnings: warnings,
    revalidatedCount: revalidatedCount,
    invalidCount: invalidCount
  };
}

function isRevalidatableProposalV032_(row) {
  const detail = String(row[PROPOSAL_STAGING_V030.COLUMNS.STATUS_DETAIL - 1] || '').trim();
  if (!detail) return false;
  const allowed = ['Training_Plan対象日なしまたは重複', '対象期間外'];
  return detail.split(' / ').every(function(reason) { return allowed.indexOf(reason) >= 0; });
}

function validateProposalForApplyV030_(proposalId, expectedDateKey) {
  const sheet = ensureProposalStagingSheetV030_();
  const matches = readProposalStagingRowsV030_(sheet).filter(function(entry) {
    return String(entry.values[0] || '').trim() === proposalId;
  });
  if (matches.length !== 1) throw new Error('Proposal IDが一意に特定できません: ' + proposalId);

  const entry = matches[0];
  const row = entry.values;
  if (String(row[13] || '').trim() !== PROPOSAL_STAGING_V030.STATUS.LOADED) {
    throw new Error('Proposal StatusがLOADEDではありません: ' + proposalId);
  }
  if (dashboardDateKeyV030_(row[5]) !== expectedDateKey) {
    throw new Error('Proposalの日付がDashboard行と一致しません: ' + proposalId);
  }

  const counts = {}; counts[proposalId] = 1;
  const errors = validateProposalRowV030_(row, counts, buildProposalValidationContextV030_());
  if (errors.length) throw new Error(errors.join(' / '));
  return {rowNumber: entry.rowNumber, values: row};
}

function markProposalAppliedV030_(rowNumber) {
  const sheet = ensureProposalStagingSheetV030_();
  const current = String(sheet.getRange(rowNumber, PROPOSAL_STAGING_V030.COLUMNS.STATUS).getValue() || '');
  if (current !== PROPOSAL_STAGING_V030.STATUS.LOADED) {
    throw new Error('Proposal Statusが変更されています。Refresh後に再実行してください。');
  }
  const now = new Date();
  updateProposalStatusV030_(sheet, rowNumber, PROPOSAL_STAGING_V030.STATUS.APPLIED, now, 'Training_Plan反映済み');
  sheet.getRange(rowNumber, PROPOSAL_STAGING_V030.COLUMNS.APPLIED_AT).setValue(now);
}

/** Explicit rejection entrypoint. Unselected Dashboard rows are never rejected automatically. */
function rejectProposalStaging(proposalId, detail) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const entry = validateProposalForApplyV030_(String(proposalId || '').trim(),
      dashboardDateKeyV030_(findProposalDateByIdV030_(proposalId)));
    updateProposalStatusV030_(ensureProposalStagingSheetV030_(), entry.rowNumber,
      PROPOSAL_STAGING_V030.STATUS.REJECTED, new Date(), String(detail || 'ユーザーが明示的に棄却'));
    return {proposalId: proposalId, status: PROPOSAL_STAGING_V030.STATUS.REJECTED};
  } finally {
    lock.releaseLock();
  }
}

function validateProposalRowV030_(row, idCounts, context) {
  const errors = [];
  const proposalId = String(row[0] || '').trim();
  const consultationId = String(row[1] || '').trim();
  const revision = Number(row[2]);
  const snapshotId = String(row[3] || '').trim();
  const submittedAt = row[4];
  const dateKey = dashboardDateKeyV030_(row[5]);
  const type = String(row[6] || '').trim();
  const workout = String(row[7] || '').trim();

  if (!proposalId || !/^PRP-/.test(proposalId)) errors.push('Proposal ID不正');
  if (proposalId && idCounts[proposalId] !== 1) errors.push('Proposal ID重複');
  if (!consultationId || !/^CNS-/.test(consultationId)) errors.push('Consultation ID不正');
  if (!Number.isInteger(revision) || revision < 1) errors.push('Revision不正');
  if (!snapshotId || !/^SNP-/.test(snapshotId)) errors.push('Source Snapshot ID不正');
  if (!(submittedAt instanceof Date) || isNaN(submittedAt.getTime())) errors.push('Submitted At不正');
  if (!dateKey) errors.push('Date不正');
  if (dateKey && (!context.trainingRowsByDate[dateKey] || context.trainingRowsByDate[dateKey].length !== 1)) {
    errors.push('Training_Plan対象日なしまたは重複');
  }
  if (dateKey && (dateKey < context.proposalStart || dateKey > context.proposalEnd)) {
    errors.push('対象期間外');
  }
  if (DASHBOARD_V030.PLAN_TYPES.indexOf(type) < 0) errors.push('Workout Type不正');
  if (type !== 'Rest' && !workout) errors.push('Workout欠落');
  validateProposalNumberV030_(row[8], 'Plan km', 0, 100, errors);
  validateProposalNumberV030_(row[9], 'Duration min', 0, 1440, errors);
  return errors;
}

function validateProposalNumberV030_(value, label, min, max, errors) {
  if (isDashboardV030Blank_(value)) return;
  const number = Number(value);
  if (!isFinite(number) || number < min || number > max) errors.push(label + '不正');
}

function buildProposalValidationContextV030_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const training = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!training) throw new Error('Training_Planシートが存在しません。');
  const trainingRows = training.getLastRow() >= 2
    ? training.getRange(2, 1, training.getLastRow() - 1, 5).getValues() : [];
  const trainingRowsByDate = {};
  trainingRows.forEach(function(row) {
    const key = dashboardDateKeyV030_(row[0]);
    if (!key) return;
    if (!trainingRowsByDate[key]) trainingRowsByDate[key] = [];
    trainingRowsByDate[key].push(row);
  });

  const events = ss.getSheetByName(DASHBOARD_V030.SHEETS.EVENT_CALENDAR);
  const eventRows = events && events.getLastRow() >= 2
    ? events.getRange(2, 1, events.getLastRow() - 1, Math.min(events.getLastColumn(), 10)).getValues() : [];
  const eventsByDate = {};
  eventRows.forEach(function(row) {
    const key = dashboardDateKeyV030_(row[0]);
    if (!key || String(row[7] || 'ACTIVE').toUpperCase() === 'CANCELLED') return;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(row);
  });

  const snapshotRange = ss.getRangeByName('LLM_BRIEF_SNAPSHOT_ID');
  const today = dashboardTodayV030_();
  return {
    today: today,
    proposalStart: isoDateV032_(today),
    proposalEnd: isoDateV032_(addCalendarMonthsClampedV032_(today,
      DASHBOARD_V030.PROPOSAL_HORIZON_MONTHS)),
    trainingRowsByDate: trainingRowsByDate,
    eventsByDate: eventsByDate,
    latestSnapshotId: snapshotRange ? String(snapshotRange.getDisplayValue() || '').trim() : ''
  };
}

function buildProposalWarningV030_(row, context) {
  const warnings = String(row[12] || '').split(' / ').filter(function(value) {
    return value && value.indexOf('[SYSTEM]') !== 0;
  });
  const key = dashboardDateKeyV030_(row[5]);
  const sourceSnapshot = String(row[3] || '').trim();
  if (context.latestSnapshotId && sourceSnapshot !== context.latestSnapshotId) {
    warnings.push('[SYSTEM] Snapshotが最新ではありません');
  }
  const events = context.eventsByDate[key] || [];
  if (events.length) {
    warnings.push('[SYSTEM] Event_Calendar確認: ' + events.map(function(event) {
      return [event[1], event[2]].filter(Boolean).join(' ');
    }).join(', '));
  }
  const plan = (context.trainingRowsByDate[key] || [])[0];
  const currentKm = plan && !isDashboardV030Blank_(plan[4]) ? Number(plan[4]) : null;
  const proposedKm = !isDashboardV030Blank_(row[8]) ? Number(row[8]) : null;
  if (currentKm !== null && proposedKm !== null && isFinite(currentKm) && isFinite(proposedKm) &&
      Math.abs(currentKm - proposedKm) >= Math.max(5, currentKm * 0.5)) {
    warnings.push('[SYSTEM] 既存計画との距離差が大きい');
  }
  return warnings.filter(function(value, index, all) { return all.indexOf(value) === index; }).join(' / ');
}

function readProposalStagingRowsV030_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, PROPOSAL_STAGING_V030.HEADERS.length)
    .getValues().map(function(values, index) { return {rowNumber: index + 2, values: values}; });
}

function updateProposalStatusV030_(sheet, rowNumber, status, updatedAt, detail) {
  sheet.getRange(rowNumber, PROPOSAL_STAGING_V030.COLUMNS.STATUS, 1, 3).setValues([[
    status, updatedAt || new Date(), detail || ''
  ]]);
}

function nextConsultationRevisionV030_(entries, consultationId) {
  return entries.reduce(function(max, entry) {
    if (String(entry.values[1]) !== consultationId) return max;
    const revision = Number(entry.values[2]);
    return Number.isInteger(revision) ? Math.max(max, revision) : max;
  }, 0) + 1;
}

function normalizeConsultationIdV030_(value) {
  const id = String(value || '').trim();
  if (!id) return '';
  if (!/^CNS-[A-Za-z0-9-]+$/.test(id)) throw new Error('Consultation IDの形式が不正です。');
  return id;
}

function createTrackedIdV030_(prefix) {
  const stamp = Utilities.formatDate(new Date(), DASHBOARD_V030.TIMEZONE, 'yyyyMMdd-HHmmss');
  const suffix = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  return prefix + '-' + stamp + '-' + suffix;
}

function proposalSubmittedTimeV030_(row) {
  return row[4] instanceof Date && !isNaN(row[4].getTime()) ? row[4].getTime() : 0;
}

function findProposalDateByIdV030_(proposalId) {
  const matches = readProposalStagingRowsV030_(ensureProposalStagingSheetV030_()).filter(function(entry) {
    return String(entry.values[0] || '').trim() === String(proposalId || '').trim();
  });
  if (matches.length !== 1) throw new Error('Proposal IDが一意に特定できません。');
  return matches[0].values[5];
}

function getPendingProposalsV030_() {
  const sheet = ensureProposalStagingSheetV030_();
  return readProposalStagingRowsV030_(sheet).filter(function(entry) {
    return PROPOSAL_STAGING_V030.ACTIVE_STATUSES.indexOf(String(entry.values[13])) >= 0;
  }).map(function(entry) {
    return {
      proposalId: entry.values[0],
      consultationId: entry.values[1],
      revision: entry.values[2],
      sourceSnapshotId: entry.values[3],
      date: dashboardDateKeyV030_(entry.values[5]),
      type: entry.values[6],
      workout: entry.values[7],
      planKm: entry.values[8],
      durationMin: entry.values[9],
      targetPace: entry.values[10],
      reason: entry.values[11],
      warning: entry.values[12],
      status: entry.values[13]
    };
  });
}
