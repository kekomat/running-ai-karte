/** Running AI Karte v0.3.2 - safe, idempotent schema migration. */

function migrateToV032() {
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('MIGRATION_DOCUMENT_CONTEXT_UNAVAILABLE');
  if (!lock.tryLock(10000)) throw new Error('MIGRATION_LOCK_TIMEOUT');
  try {
    return migrateToV032WithLockHeld_();
  } finally {
    lock.releaseLock();
  }
}

function migrateToV032WithLockHeld_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getDocumentProperties();
  if (!props) throw new Error('MIGRATION_DOCUMENT_PROPERTIES_UNAVAILABLE');

  preflightMigrationV032_(ss, props);
  applyMigrationChangesV032_(ss);
  SpreadsheetApp.flush();
  verifySheetMigrationV032_(ss);
  initializeAndVerifyActualPointerV032_(ss, props);
  props.setProperty(PROPERTY_KEYS.SCHEMA_VERSION, SCHEMA_VERSION);
  if (props.getProperty(PROPERTY_KEYS.SCHEMA_VERSION) !== SCHEMA_VERSION) {
    throw new Error('MIGRATION_VERSION_WRITE_VERIFICATION_FAILED');
  }
  return {schemaVersion: SCHEMA_VERSION, spreadsheetId: ss.getId()};
}

function preflightMigrationV032_(ss, props) {
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (!sheet) throw new Error('MIGRATION_SHEET_NOT_FOUND: Training_Plan');
  if (sheet.getMaxColumns() < EXPECTED_TP_HEADERS_A_O.length) {
    throw new Error('MIGRATION_GRID_CONFLICT: Training_Plan has insufficient columns.');
  }
  assertHeadersV032_(sheet, 1, EXPECTED_TP_HEADERS_A_O, 'MIGRATION_HEADER_CONFLICT');

  const availablePsColumns = Math.max(0, Math.min(
    EXPECTED_TP_HEADERS_P_S.length,
    sheet.getMaxColumns() - TP_COLS.AI_ACTUAL_COMMENT + 1
  ));
  if (availablePsColumns) {
    const current = sheet.getRange(1, TP_COLS.AI_ACTUAL_COMMENT, 1, availablePsColumns)
      .getDisplayValues()[0];
    current.forEach(function(value, index) {
      const normalized = String(value || '').trim();
      const expected = EXPECTED_TP_HEADERS_P_S[index];
      if (normalized && normalized !== expected) {
        throw new Error('MIGRATION_SCHEMA_CONFLICT: column=' +
          (TP_COLS.AI_ACTUAL_COMMENT + index) + ', value=' + normalized);
      }
    });
  }

  const psHeadersExact = sheet.getMaxColumns() >= TP_COLS.ACTUAL_UPDATE_ID &&
    headersMatchV032_(
      sheet.getRange(1, TP_COLS.AI_ACTUAL_COMMENT, 1, EXPECTED_TP_HEADERS_P_S.length)
        .getDisplayValues()[0],
      EXPECTED_TP_HEADERS_P_S
    );
  if (!psHeadersExact) assertProspectiveActualColumnsBlankV032_(sheet);
  validateExistingActualMetadataV032_(sheet);

  const logSheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (logSheet) {
    if (logSheet.getMaxColumns() < ACTUAL_UPDATE_LOG_HEADERS.length) {
      throw new Error('MIGRATION_LOG_GRID_CONFLICT');
    }
    assertHeadersV032_(logSheet, 1, ACTUAL_UPDATE_LOG_HEADERS,
      'MIGRATION_LOG_SCHEMA_CONFLICT');
  }

  const currentVersion = props.getProperty(PROPERTY_KEYS.SCHEMA_VERSION);
  if (currentVersion && ['0.3.0', '0.3.1', SCHEMA_VERSION].indexOf(currentVersion) < 0) {
    throw new Error('MIGRATION_VERSION_CONFLICT: ' + currentVersion);
  }
  const pointer = props.getProperty(PROPERTY_KEYS.ACTUAL_REVIEWED_THROUGH);
  if (pointer !== null && pointer !== '' && !isIsoDateTextV032_(pointer)) {
    throw new Error('MIGRATION_POINTER_CONFLICT: ' + pointer);
  }
}

function applyMigrationChangesV032_(ss) {
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  if (sheet.getMaxColumns() < TP_COLS.ACTUAL_UPDATE_ID) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(),
      TP_COLS.ACTUAL_UPDATE_ID - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < 2) sheet.insertRowsAfter(1, 1);

  const headerRange = sheet.getRange(1, TP_COLS.AI_ACTUAL_COMMENT, 1,
    EXPECTED_TP_HEADERS_P_S.length);
  if (!headersMatchV032_(headerRange.getDisplayValues()[0], EXPECTED_TP_HEADERS_P_S)) {
    headerRange.setValues([EXPECTED_TP_HEADERS_P_S]);
  }
  headerRange.setBackground('#38761D').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  sheet.setColumnWidth(TP_COLS.AI_ACTUAL_COMMENT, 300);

  const rowCount = sheet.getMaxRows() - 1;
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(ACTUAL_STATUSES).map(function(key) {
      return ACTUAL_STATUSES[key];
    }), true).setAllowInvalid(false).build();
  const sourceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(ACTUAL_SOURCES).map(function(key) {
      return ACTUAL_SOURCES[key];
    }), true).setAllowInvalid(false).build();
  sheet.getRange(2, TP_COLS.ACTUAL_STATUS, rowCount, 1).setDataValidation(statusRule);
  sheet.getRange(2, TP_COLS.ACTUAL_SOURCE, rowCount, 1).setDataValidation(sourceRule);
  sheet.getRange(2, TP_COLS.ACTUAL_UPDATED_AT, rowCount, 1)
    .setNumberFormat('yyyy/MM/dd HH:mm:ss');
  sheet.hideColumns(TP_COLS.ACTUAL_STATUS, 3);

  let logSheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (!logSheet) logSheet = ss.insertSheet(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (logSheet.getMaxColumns() < ACTUAL_UPDATE_LOG_HEADERS.length) {
    logSheet.insertColumnsAfter(logSheet.getMaxColumns(),
      ACTUAL_UPDATE_LOG_HEADERS.length - logSheet.getMaxColumns());
  }
  if (!headersMatchV032_(
    logSheet.getRange(1, 1, 1, ACTUAL_UPDATE_LOG_HEADERS.length).getDisplayValues()[0],
    ACTUAL_UPDATE_LOG_HEADERS
  )) {
    logSheet.getRange(1, 1, 1, ACTUAL_UPDATE_LOG_HEADERS.length)
      .setValues([ACTUAL_UPDATE_LOG_HEADERS]);
  }
  logSheet.setFrozenRows(1);
  logSheet.getRange(1, 1, 1, ACTUAL_UPDATE_LOG_HEADERS.length)
    .setBackground('#666666').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  logSheet.getRange('F:F').setNumberFormat('yyyy/MM/dd');
  logSheet.getRange('L:M').setNumberFormat('yyyy/MM/dd HH:mm:ss');

  const dashboard = ss.getSheetByName(DASHBOARD_V030.SHEETS.DASHBOARD);
  if (!dashboard) throw new Error('MIGRATION_SHEET_NOT_FOUND: Dashboard');
  if (dashboard.getMaxColumns() < 15) {
    dashboard.insertColumnsAfter(dashboard.getMaxColumns(), 15 - dashboard.getMaxColumns());
  }
  ss.setNamedRange('ACTUAL_REVIEWED_THROUGH', dashboard.getRange('O5'));
  dashboard.hideColumns(15);
}

function verifySheetMigrationV032_(ss) {
  const sheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.TRAINING_PLAN);
  assertHeadersV032_(sheet, 1,
    EXPECTED_TP_HEADERS_A_O.concat(EXPECTED_TP_HEADERS_P_S),
    'MIGRATION_VERIFICATION_FAILED');
  validateExistingActualMetadataV032_(sheet);
  verifyValidationColumnV032_(sheet, TP_COLS.ACTUAL_SOURCE, Object.keys(ACTUAL_SOURCES)
    .map(function(key) { return ACTUAL_SOURCES[key]; }));
  verifyValidationColumnV032_(sheet, TP_COLS.ACTUAL_STATUS, Object.keys(ACTUAL_STATUSES)
    .map(function(key) { return ACTUAL_STATUSES[key]; }));

  const logSheet = ss.getSheetByName(DASHBOARD_V030.SHEETS.ACTUAL_UPDATE_LOG);
  if (!logSheet) throw new Error('MIGRATION_VERIFICATION_FAILED: Actual_Update_Log missing');
  assertHeadersV032_(logSheet, 1, ACTUAL_UPDATE_LOG_HEADERS,
    'MIGRATION_VERIFICATION_FAILED');
  const namedRange = ss.getRangeByName('ACTUAL_REVIEWED_THROUGH');
  if (!namedRange || namedRange.getSheet().getName() !== DASHBOARD_V030.SHEETS.DASHBOARD ||
      namedRange.getA1Notation() !== 'O5') {
    throw new Error('MIGRATION_VERIFICATION_FAILED: ACTUAL_REVIEWED_THROUGH');
  }
}

function initializeAndVerifyActualPointerV032_(ss, props) {
  const key = PROPERTY_KEYS.ACTUAL_REVIEWED_THROUGH;
  const all = props.getProperties();
  if (!Object.prototype.hasOwnProperty.call(all, key)) props.setProperty(key, '');
  const propertyValue = props.getProperty(key) || '';
  if (propertyValue && !isIsoDateTextV032_(propertyValue)) {
    throw new Error('MIGRATION_POINTER_CONFLICT: ' + propertyValue);
  }
  const range = ss.getRangeByName('ACTUAL_REVIEWED_THROUGH');
  const cellValue = String(range.getDisplayValue() || '').trim().replace(/\//g, '-');
  if (cellValue && !isIsoDateTextV032_(cellValue)) {
    throw new Error('MIGRATION_POINTER_CELL_CONFLICT: ' + cellValue);
  }
  if (propertyValue && cellValue && propertyValue !== cellValue) {
    throw new Error('MIGRATION_POINTER_DIVERGENCE');
  }
  const canonical = propertyValue || cellValue || '';
  props.setProperty(key, canonical);
  range.setValue(canonical).setNumberFormat('@');
  if ((props.getProperty(key) || '') !== canonical ||
      String(range.getDisplayValue() || '').trim() !== canonical) {
    throw new Error('MIGRATION_POINTER_WRITE_VERIFICATION_FAILED');
  }
}

function assertProspectiveActualColumnsBlankV032_(sheet) {
  if (sheet.getLastRow() < 2 || sheet.getMaxColumns() < TP_COLS.AI_ACTUAL_COMMENT) return;
  const width = Math.min(EXPECTED_TP_HEADERS_P_S.length,
    sheet.getMaxColumns() - TP_COLS.AI_ACTUAL_COMMENT + 1);
  if (!width) return;
  const values = sheet.getRange(2, TP_COLS.AI_ACTUAL_COMMENT, sheet.getLastRow() - 1, width)
    .getDisplayValues();
  if (values.some(function(row) { return row.some(function(value) {
    return String(value || '').trim() !== '';
  }); })) throw new Error('MIGRATION_DATA_CONFLICT: P2:S contains existing data');
}

function validateExistingActualMetadataV032_(sheet) {
  if (sheet.getLastRow() < 2) return;
  const width = Math.min(sheet.getMaxColumns(), TP_COLS.ACTUAL_UPDATE_ID);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, width)
    .getValues().map(function(row) {
      while (row.length < TP_COLS.ACTUAL_UPDATE_ID) row.push('');
      return row;
    });
  const statuses = Object.keys(ACTUAL_STATUSES).map(function(key) { return ACTUAL_STATUSES[key]; });
  const sources = Object.keys(ACTUAL_SOURCES).map(function(key) { return ACTUAL_SOURCES[key]; });
  const ids = {};
  values.forEach(function(row, index) {
    const rowNumber = index + 2;
    const source = row[TP_COLS.ACTUAL_SOURCE - 1];
    const status = row[TP_COLS.ACTUAL_STATUS - 1];
    const updatedAt = row[TP_COLS.ACTUAL_UPDATED_AT - 1];
    const updateId = row[TP_COLS.ACTUAL_UPDATE_ID - 1];
    if (source !== '' && sources.indexOf(source) < 0) {
      throw new Error('MIGRATION_ACTUAL_VALUE_CONFLICT: row=' + rowNumber + ', column=K');
    }
    if (status !== '' && statuses.indexOf(status) < 0) {
      throw new Error('MIGRATION_ACTUAL_VALUE_CONFLICT: row=' + rowNumber + ', column=Q');
    }
    if (updatedAt !== '' && (!(updatedAt instanceof Date) || isNaN(updatedAt.getTime()))) {
      throw new Error('MIGRATION_ACTUAL_VALUE_CONFLICT: row=' + rowNumber + ', column=R');
    }
    if (updateId !== '') {
      if (typeof updateId !== 'string' || updateId.trim() !== updateId || !updateId) {
        throw new Error('MIGRATION_ACTUAL_VALUE_CONFLICT: row=' + rowNumber + ', column=S');
      }
      if (ids[updateId]) throw new Error('MIGRATION_ACTUAL_UPDATE_ID_DUPLICATE: ' + updateId);
      ids[updateId] = true;
    }
  });
}

function verifyValidationColumnV032_(sheet, column, expectedValues) {
  const rules = sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .getDataValidations();
  rules.forEach(function(row, index) {
    const rule = row[0];
    if (!rule || rule.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST ||
        rule.getAllowInvalid()) {
      throw new Error('MIGRATION_VERIFICATION_FAILED: validation row=' + (index + 2) +
        ', column=' + column);
    }
    const actual = (rule.getCriteriaValues()[0] || []).map(String);
    if (actual.join('\u0000') !== expectedValues.join('\u0000')) {
      throw new Error('MIGRATION_VERIFICATION_FAILED: validation values column=' + column);
    }
  });
}

function assertHeadersV032_(sheet, startColumn, expected, errorCode) {
  const actual = sheet.getRange(1, startColumn, 1, expected.length).getDisplayValues()[0];
  if (!headersMatchV032_(actual, expected)) {
    throw new Error(errorCode + ': ' + sheet.getName() + ' headers=' + JSON.stringify(actual));
  }
}

function headersMatchV032_(actual, expected) {
  return actual.length === expected.length && expected.every(function(value, index) {
    return String(actual[index] || '').trim() === String(value || '').trim();
  });
}

function isIsoDateTextV032_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}
