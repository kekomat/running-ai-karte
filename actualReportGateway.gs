/** Running AI Karte v0.3.2 - approved actual-report validation and apply gateway. */

const ACTUAL_REPORT_SCHEMA_V032 = 'actual-report.v1';

function validateActualReportBatch(payload) {
  const result = validateActualReportBatchV032_(payload, {requireConfirmation: false});
  return {
    valid: true,
    payload: result.payload,
    confirmationId: result.payload.confirmation.confirmation_id,
    payloadHash: result.payload.confirmation.payload_hash,
    updateCount: result.operations.length,
    preview: result.operations.map(function(operation) {
      const update = operation.update;
      return {
        date: update.date,
        actualStatus: update.actual_status,
        actualKm: update.actual_km,
        durationMin: update.duration_min,
        avgHr: update.avg_hr,
        workoutResultNotes: update.workout_result_notes,
        aiActualComment: update.ai_actual_comment,
        writeTarget: 'Training_Plan!G:J,P:S',
        existingSource: operation.source || '(blank)'
      };
    })
  };
}

function applyActualReportBatch(payload) {
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('ACTUAL_GATEWAY_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (!lock.tryLock(10000)) throw new Error('ACTUAL_GATEWAY_LOCK_TIMEOUT');

  let validation;
  let replay;
  try {
    replay = inspectActualReplayV032_(payload);
    if (!replay) {
      validation = validateActualReportBatchV032_(payload, {requireConfirmation: true});
    }
  } catch (error) {
    writeActualConflictAuditV032_(payload, error);
    lock.releaseLock();
    throw error;
  }

  if (replay) {
    lock.releaseLock();
    return replay;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  const now = new Date();
  const writes = [];
  const auditRows = [];

  try {
    validation.operations.forEach(function(operation) {
      const actualUpdateId = createTrackedIdV030_('ACT');
      const beforeRow = operation.rowValues.slice();
      const afterRow = buildActualAfterRowV032_(beforeRow, operation.update,
        operation.source, now, actualUpdateId);
      writes.push({rowNumber: operation.rowNumber, beforeRow: beforeRow, afterRow: afterRow});
      writeActualRowFieldsV032_(sheet, operation.rowNumber, afterRow);
      auditRows.push(buildActualAuditRowV032_(
        validation.payload, operation.update, actualUpdateId,
        operation.expectedRowHash, beforeRow, afterRow, 'APPLIED', '', now
      ));
    });

    SpreadsheetApp.flush();
    writes.forEach(function(write) {
      const readback = sheet.getRange(write.rowNumber, 1, 1, TP_COLS.ACTUAL_UPDATE_ID)
        .getValues()[0];
      if (stableStringifyV032_(canonicalizeTrainingRowV032_(readback)) !==
          stableStringifyV032_(canonicalizeTrainingRowV032_(write.afterRow))) {
        throw new Error('ACTUAL_GATEWAY_READBACK_MISMATCH: row=' + write.rowNumber);
      }
    });

    appendActualAuditRowsV032_(auditRows);
    SpreadsheetApp.flush();
    let pointerWarning = '';
    try {
      advanceActualReviewedThroughV032_();
    } catch (pointerError) {
      pointerWarning = pointerError.message;
      console.error(pointerError);
    }
    return {
      applied: true,
      appliedCount: writes.length,
      confirmationId: validation.payload.confirmation.confirmation_id,
      payloadHash: validation.payload.confirmation.payload_hash,
      actualUpdateIds: auditRows.map(function(row) { return row[0]; }),
      pointerWarning: pointerWarning,
      dashboardUrl: getDashboardUrlV030_()
    };
  } catch (error) {
    writes.forEach(function(write) {
      writeActualRowFieldsV032_(sheet, write.rowNumber, write.beforeRow);
    });
    SpreadsheetApp.flush();
    const failedRows = validation.operations.map(function(operation, index) {
      const write = writes[index];
      return buildActualAuditRowV032_(
        validation.payload, operation.update,
        write ? String(write.afterRow[TP_COLS.ACTUAL_UPDATE_ID - 1] || '') : createTrackedIdV030_('ACT'),
        operation.expectedRowHash, operation.rowValues,
        write ? write.afterRow : operation.rowValues,
        'FAILED', actualGatewayErrorCodeV032_(error), now
      );
    });
    try { appendActualAuditRowsV032_(failedRows); } catch (auditError) { console.error(auditError); }
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function inspectActualReplayV032_(payload) {
  const input = payload || {};
  const confirmation = input.confirmation || {};
  const confirmationId = String(confirmation.confirmation_id || '');
  const payloadHash = String(confirmation.payload_hash || '');
  if (!confirmationId || !payloadHash) return null;

  if (payloadHash !== createPayloadHashV032_(input)) {
    throw new Error('ACTUAL_PAYLOAD_HASH_CONFLICT');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1,
    ACTUAL_UPDATE_LOG_HEADERS.length).getValues();
  const appliedRows = rows.filter(function(row) {
    return String(row[2] || '') === confirmationId && String(row[9] || '') === 'APPLIED';
  });
  if (!appliedRows.length) return null;

  if (appliedRows.some(function(row) { return String(row[4] || '') !== payloadHash; })) {
    throw new Error('ACTUAL_CONFIRMATION_REUSE_CONFLICT');
  }

  const timezone = ss.getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE;
  const expectedDates = (Array.isArray(input.updates) ? input.updates : [])
    .map(function(update) { return isoDateV032_(update && update.date, timezone); })
    .sort();
  const appliedDates = appliedRows
    .map(function(row) { return isoDateV032_(row[5], timezone); })
    .sort();
  if (!expectedDates.length || expectedDates.length !== appliedDates.length ||
      expectedDates.some(function(date, index) { return date !== appliedDates[index]; })) {
    throw new Error('ACTUAL_IDEMPOTENCY_AUDIT_MISMATCH');
  }

  return {
    applied: true,
    appliedCount: appliedRows.length,
    confirmationId: confirmationId,
    payloadHash: payloadHash,
    actualUpdateIds: appliedRows.map(function(row) { return String(row[0] || ''); }),
    pointerWarning: '',
    dashboardUrl: getDashboardUrlV030_(),
    idempotent: true
  };
}

function validateActualReportBatchV032_(payload, options) {
  const input = cloneJsonV032_(payload || {});
  const errors = [];
  if (input.schema_version !== ACTUAL_REPORT_SCHEMA_V032) errors.push('ACTUAL_SCHEMA_VERSION');
  if (!/^CNS-[A-Za-z0-9-]+$/.test(String(input.consultation_id || ''))) {
    errors.push('ACTUAL_CONSULTATION_ID');
  }
  if (!/^SNP-[A-Za-z0-9-]+$/.test(String(input.source_snapshot_id || ''))) {
    errors.push('ACTUAL_SOURCE_SNAPSHOT_ID');
  }
  if (!Array.isArray(input.updates) || !input.updates.length) errors.push('ACTUAL_UPDATES_EMPTY');
  if (Array.isArray(input.updates) && input.updates.length > 31) errors.push('ACTUAL_UPDATES_LIMIT');
  if (errors.length) throw new Error(errors.join(' / '));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timezone = ss.getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE;
  if (input.timezone !== timezone) throw new Error('ACTUAL_TIMEZONE_MISMATCH');
  const currentSnapshot = String(getDashboardV030NamedRange_('LLM_BRIEF_SNAPSHOT_ID')
    .getDisplayValue() || '').trim();
  if (!currentSnapshot || input.source_snapshot_id !== currentSnapshot) {
    throw new Error('ACTUAL_SOURCE_SNAPSHOT_CONFLICT');
  }

  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet || sheet.getLastColumn() < TP_COLS.ACTUAL_UPDATE_ID) {
    throw new Error('ACTUAL_SCHEMA_NOT_MIGRATED');
  }
  const allRows = sheet.getLastRow() >= 2
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, TP_COLS.ACTUAL_UPDATE_ID).getValues()
    : [];
  const rowsByDate = {};
  allRows.forEach(function(row, index) {
    const key = isoDateV032_(row[TP_COLS.DATE - 1], timezone);
    if (!key) return;
    if (!rowsByDate[key]) rowsByDate[key] = [];
    rowsByDate[key].push({rowNumber: index + 2, values: row});
  });

  const todayKey = isoDateV032_(new Date(), timezone);
  const seen = {};
  const operations = input.updates.map(function(rawUpdate, index) {
    const update = normalizeActualUpdateV032_(rawUpdate, index, timezone);
    if (seen[update.date]) throw new Error('ACTUAL_DUPLICATE_DATE: ' + update.date);
    seen[update.date] = true;
    if (update.date > todayKey || (update.date === todayKey && !update.performed_today)) {
      throw new Error('ACTUAL_DATE_NOT_ELIGIBLE: ' + update.date);
    }
    const matches = rowsByDate[update.date] || [];
    if (matches.length !== 1) throw new Error('ACTUAL_PLAN_DATE_NOT_UNIQUE: ' + update.date);
    const row = matches[0];
    const expectedRowHash = createExpectedRowHashV032_(row.values, timezone);
    if (rawUpdate.expected_row_hash && rawUpdate.expected_row_hash !== expectedRowHash) {
      throw new Error('ACTUAL_EXPECTED_ROW_HASH_CONFLICT: ' + update.date);
    }
    update.expected_row_hash = expectedRowHash;
    const source = String(row.values[TP_COLS.ACTUAL_SOURCE - 1] || '').trim();
    validateActualRowConflictV032_(row.values, update, source);
    return {
      rowNumber: row.rowNumber,
      rowValues: row.values,
      update: update,
      source: source,
      expectedRowHash: expectedRowHash
    };
  });

  input.updates = operations.map(function(operation) { return operation.update; });
  input.confirmation = input.confirmation || {};
  if (!input.confirmation.confirmation_id) {
    if (options.requireConfirmation) throw new Error('ACTUAL_CONFIRMATION_ID_REQUIRED');
    input.confirmation.confirmation_id = createTrackedIdV030_('CNF');
  }
  if (!/^CNF-[A-Za-z0-9-]+$/.test(String(input.confirmation.confirmation_id))) {
    throw new Error('ACTUAL_CONFIRMATION_ID_INVALID');
  }
  if (!input.confirmation.approved_at) {
    if (options.requireConfirmation) throw new Error('ACTUAL_APPROVED_AT_REQUIRED');
    input.confirmation.approved_at = new Date().toISOString();
  }
  if (isNaN(Date.parse(input.confirmation.approved_at))) throw new Error('ACTUAL_APPROVED_AT_INVALID');

  const computedHash = createPayloadHashV032_(input);
  if (options.requireConfirmation) {
    if (!input.confirmation.payload_hash) throw new Error('ACTUAL_PAYLOAD_HASH_REQUIRED');
    if (input.confirmation.payload_hash !== computedHash) throw new Error('ACTUAL_PAYLOAD_HASH_CONFLICT');
  } else {
    input.confirmation.payload_hash = computedHash;
  }
  return {payload: input, operations: operations};
}

function normalizeActualUpdateV032_(raw, index, timezone) {
  raw = raw || {};
  const date = isoDateV032_(raw.date, timezone);
  if (!date) throw new Error('ACTUAL_DATE_INVALID: index=' + index);
  const status = String(raw.actual_status || '').trim();
  if (Object.keys(ACTUAL_STATUSES).map(function(key) { return ACTUAL_STATUSES[key]; })
      .indexOf(status) < 0) throw new Error('ACTUAL_STATUS_INVALID: ' + date);
  const update = {
    date: date,
    actual_status: status,
    actual_km: optionalActualNumberV032_(raw.actual_km, 'actual_km', 0, 300),
    duration_min: optionalActualNumberV032_(raw.duration_min, 'duration_min', 0, 1440),
    avg_hr: optionalActualNumberV032_(raw.avg_hr, 'avg_hr', 20, 260),
    workout_result_notes: optionalActualTextV032_(raw.workout_result_notes, 2000),
    ai_actual_comment: optionalActualTextV032_(raw.ai_actual_comment, 2000),
    expected_row_hash: String(raw.expected_row_hash || '').trim(),
    performed_today: raw.performed_today === true
  };
  if ((status === ACTUAL_STATUSES.REST || status === ACTUAL_STATUSES.SKIPPED) &&
      [update.actual_km, update.duration_min, update.avg_hr].some(function(value) {
        return value !== null;
      })) throw new Error('ACTUAL_OBJECTIVE_VALUES_NOT_ALLOWED: ' + date);
  if (status === ACTUAL_STATUSES.COMPLETED || status === ACTUAL_STATUSES.PARTIAL) {
    const meaningful = update.actual_km !== null || update.duration_min !== null ||
      update.avg_hr !== null || update.workout_result_notes || update.ai_actual_comment;
    if (!meaningful) throw new Error('ACTUAL_UPDATE_EMPTY: ' + date);
  }
  return update;
}

function validateActualRowConflictV032_(row, update, source) {
  const objective = [TP_COLS.ACTUAL_KM, TP_COLS.DURATION_MIN, TP_COLS.AVG_HR]
    .map(function(column) { return row[column - 1]; });
  const hasObjective = objective.some(function(value) { return !isDashboardV030Blank_(value); });
  const status = String(row[TP_COLS.ACTUAL_STATUS - 1] || '').trim();
  if (source === ACTUAL_SOURCES.MANUAL || source === ACTUAL_SOURCES.LLM_USER_REPORT) {
    throw new Error('ACTUAL_EXISTING_SOURCE_CONFLICT: ' + update.date + ':' + source);
  }
  if (!source && (hasObjective || status || row[TP_COLS.ACTUAL_UPDATE_ID - 1])) {
    throw new Error('ACTUAL_UNTYPED_EXISTING_DATA_CONFLICT: ' + update.date);
  }
  if (source && source !== ACTUAL_SOURCES.STRAVA) {
    throw new Error('ACTUAL_SOURCE_INVALID: ' + update.date + ':' + source);
  }
  if (!source) {
    assertBlankOrSameActualTextV032_(row[TP_COLS.RESULT_NOTES - 1],
      update.workout_result_notes, update.date, 'NOTES');
    assertBlankOrSameActualTextV032_(row[TP_COLS.AI_ACTUAL_COMMENT - 1],
      update.ai_actual_comment, update.date, 'AI_COMMENT');
  }
  if (source === ACTUAL_SOURCES.STRAVA) {
    const proposed = [update.actual_km, update.duration_min, update.avg_hr];
    proposed.forEach(function(value, index) {
      if (value === null) return;
      const existing = objective[index];
      if (isDashboardV030Blank_(existing) || Math.abs(Number(existing) - value) > 0.000001) {
        throw new Error('ACTUAL_STRAVA_OBJECTIVE_CONFLICT: ' + update.date);
      }
    });
    assertBlankOrSameActualTextV032_(row[TP_COLS.RESULT_NOTES - 1],
      update.workout_result_notes, update.date, 'NOTES');
    assertBlankOrSameActualTextV032_(row[TP_COLS.AI_ACTUAL_COMMENT - 1],
      update.ai_actual_comment, update.date, 'AI_COMMENT');
    if (status && status !== update.actual_status) {
      throw new Error('ACTUAL_STATUS_CONFLICT: ' + update.date);
    }
  }
}

function buildActualAfterRowV032_(before, update, source, now, actualUpdateId) {
  const after = before.slice();
  if (update.workout_result_notes && isDashboardV030Blank_(after[TP_COLS.RESULT_NOTES - 1])) {
    after[TP_COLS.RESULT_NOTES - 1] = update.workout_result_notes;
  }
  if (source !== ACTUAL_SOURCES.STRAVA) {
    if (update.actual_km !== null) after[TP_COLS.ACTUAL_KM - 1] = update.actual_km;
    if (update.duration_min !== null) after[TP_COLS.DURATION_MIN - 1] = update.duration_min;
    if (update.avg_hr !== null) after[TP_COLS.AVG_HR - 1] = update.avg_hr;
    after[TP_COLS.ACTUAL_SOURCE - 1] = ACTUAL_SOURCES.LLM_USER_REPORT;
  }
  if (update.ai_actual_comment && isDashboardV030Blank_(after[TP_COLS.AI_ACTUAL_COMMENT - 1])) {
    after[TP_COLS.AI_ACTUAL_COMMENT - 1] = update.ai_actual_comment;
  }
  after[TP_COLS.ACTUAL_STATUS - 1] = update.actual_status;
  after[TP_COLS.ACTUAL_UPDATED_AT - 1] = now;
  after[TP_COLS.ACTUAL_UPDATE_ID - 1] = actualUpdateId;
  return after;
}

function writeActualRowFieldsV032_(sheet, rowNumber, rowValues) {
  sheet.getRange(rowNumber, TP_COLS.RESULT_NOTES, 1,
    TP_COLS.ACTUAL_SOURCE - TP_COLS.RESULT_NOTES + 1)
    .setValues([rowValues.slice(TP_COLS.RESULT_NOTES - 1, TP_COLS.ACTUAL_SOURCE)]);
  sheet.getRange(rowNumber, TP_COLS.AI_ACTUAL_COMMENT, 1,
    TP_COLS.ACTUAL_UPDATE_ID - TP_COLS.AI_ACTUAL_COMMENT + 1)
    .setValues([rowValues.slice(TP_COLS.AI_ACTUAL_COMMENT - 1, TP_COLS.ACTUAL_UPDATE_ID)]);
}

function buildActualAuditRowV032_(payload, update, actualUpdateId, expectedRowHash,
    before, after, result, errorCode, appliedAt) {
  return [
    actualUpdateId,
    payload.consultation_id,
    payload.confirmation.confirmation_id,
    payload.source_snapshot_id,
    payload.confirmation.payload_hash,
    normalizeDashboardDateV030_(update.date),
    expectedRowHash,
    stableStringifyV032_(canonicalizeTrainingRowV032_(before)),
    stableStringifyV032_(canonicalizeTrainingRowV032_(after)),
    result,
    errorCode || '',
    new Date(payload.confirmation.approved_at),
    appliedAt || new Date(),
    'Actual Report Gateway'
  ];
}

function appendActualAuditRowsV032_(rows) {
  if (!rows.length) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (!sheet) throw new Error('ACTUAL_UPDATE_LOG_MISSING');
  const start = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(start, 1, rows.length, ACTUAL_UPDATE_LOG_HEADERS.length).setValues(rows);
}

function writeActualConflictAuditV032_(payload, error) {
  try {
    const input = payload || {};
    const updates = Array.isArray(input.updates) ? input.updates : [];
    const confirmation = input.confirmation || {};
    if (!updates.length || !confirmation.confirmation_id) return;
    const now = new Date();
    const rows = updates.map(function(update) {
      return [
        createTrackedIdV030_('ACT'), String(input.consultation_id || ''),
        String(confirmation.confirmation_id || ''), String(input.source_snapshot_id || ''),
        String(confirmation.payload_hash || ''), normalizeDashboardDateV030_(update.date) || '',
        String(update.expected_row_hash || ''), '', '', 'CONFLICT',
        actualGatewayErrorCodeV032_(error),
        confirmation.approved_at ? new Date(confirmation.approved_at) : now,
        now, 'Actual Report Gateway'
      ];
    });
    appendActualAuditRowsV032_(rows);
  } catch (auditError) {
    console.error(auditError);
  }
}

function advanceActualReviewedThroughV032_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const range = ss.getRangeByName('ACTUAL_REVIEWED_THROUGH');
  const props = PropertiesService.getDocumentProperties();
  if (!range || !props) return '';
  const timezone = ss.getSpreadsheetTimeZone() || DASHBOARD_V030.TIMEZONE;
  const yesterday = addCalendarDaysV032_(normalizeDashboardDateV030_(new Date()), -1);
  const pointerText = String(range.getDisplayValue() ||
    props.getProperty(PROPERTY_KEYS.ACTUAL_REVIEWED_THROUGH) || '').trim().replace(/\//g, '-');
  let cursor = pointerText && isIsoDateTextV032_(pointerText)
    ? addCalendarDaysV032_(normalizeDashboardDateV030_(pointerText), 1)
    : addCalendarDaysV032_(yesterday, -13);
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  const rows = sheet.getLastRow() >= 2
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, TP_COLS.ACTUAL_UPDATE_ID).getValues() : [];
  const byDate = {};
  rows.forEach(function(row) { byDate[isoDateV032_(row[0], timezone)] = row; });
  let lastResolved = pointerText;
  while (cursor && cursor.getTime() <= yesterday.getTime()) {
    const key = isoDateV032_(cursor, timezone);
    const row = byDate[key];
    if (!row || !isActualReviewDateResolvedV032_(row)) break;
    lastResolved = key;
    cursor = addCalendarDaysV032_(cursor, 1);
  }
  if (lastResolved && lastResolved !== pointerText) {
    range.setValue(lastResolved).setNumberFormat('@');
    props.setProperty(PROPERTY_KEYS.ACTUAL_REVIEWED_THROUGH, lastResolved);
  }
  return lastResolved || '';
}

function isActualReviewDateResolvedV032_(row) {
  const type = String(row[TP_COLS.TYPE - 1] || '').trim();
  if (type === 'Rest' || type === 'TBD') return true;
  const status = String(row[TP_COLS.ACTUAL_STATUS - 1] || '').trim();
  if (Object.keys(ACTUAL_STATUSES).map(function(key) { return ACTUAL_STATUSES[key]; })
      .indexOf(status) >= 0) return true;
  return !isDashboardV030Blank_(row[TP_COLS.ACTUAL_SOURCE - 1]) ||
    [TP_COLS.ACTUAL_KM, TP_COLS.DURATION_MIN, TP_COLS.AVG_HR]
      .some(function(column) { return !isDashboardV030Blank_(row[column - 1]); });
}

function createExpectedRowHashV032_(row, timezone) {
  return 'ROW-SHA256-' + sha256HexV032_(stableStringifyV032_(
    canonicalizeTrainingRowV032_(row, timezone)
  ));
}

function createPayloadHashV032_(payload) {
  const copy = cloneJsonV032_(payload || {});
  if (copy.confirmation) delete copy.confirmation.payload_hash;
  return 'SHA256-' + sha256HexV032_(stableStringifyV032_(copy));
}

function canonicalizeTrainingRowV032_(row, timezone) {
  timezone = timezone || DASHBOARD_V030.TIMEZONE;
  return row.slice(0, TP_COLS.ACTUAL_UPDATE_ID).map(function(value, index) {
    if (isDashboardV030Blank_(value)) return null;
    if (value instanceof Date && !isNaN(value.getTime())) {
      return index === 0 ? isoDateV032_(value, timezone) :
        Utilities.formatDate(value, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    return value;
  });
}

function stableStringifyV032_(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringifyV032_).join(',') + ']';
  return '{' + Object.keys(value).sort().map(function(key) {
    return JSON.stringify(key) + ':' + stableStringifyV032_(value[key]);
  }).join(',') + '}';
}

function sha256HexV032_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8)
    .map(function(value) { return (value < 0 ? value + 256 : value).toString(16).padStart(2, '0'); })
    .join('').toUpperCase();
}

function isoDateV032_(value, timezone) {
  const date = normalizeDashboardDateV030_(value);
  return date ? Utilities.formatDate(date, timezone || DASHBOARD_V030.TIMEZONE, 'yyyy-MM-dd') : '';
}

function addCalendarDaysV032_(date, days) {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function optionalActualNumberV032_(value, label, min, max) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' || !isFinite(value) || value < min || value > max) {
    throw new Error('ACTUAL_NUMBER_INVALID: ' + label);
  }
  return value;
}

function optionalActualTextV032_(value, maxLength) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value !== 'string' || value.length > maxLength || value.trim() !== value) {
    throw new Error('ACTUAL_TEXT_INVALID');
  }
  return value;
}

function assertBlankOrSameActualTextV032_(existing, proposed, date, label) {
  if (!proposed || isDashboardV030Blank_(existing) || String(existing) === proposed) return;
  throw new Error('ACTUAL_STRAVA_' + label + '_CONFLICT: ' + date);
}

function cloneJsonV032_(value) {
  return JSON.parse(JSON.stringify(value));
}

function actualGatewayErrorCodeV032_(error) {
  return String(error && error.message || error || 'ACTUAL_GATEWAY_FAILED').split(':')[0].slice(0, 120);
}
