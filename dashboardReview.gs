/** Running AI Karte v0.3.0 - Dashboard review and action handlers. */

function handleReviewManualEditsV030_(sheet, editedRange) {
  const first = Math.max(editedRange.getRow(), DASHBOARD_V030.REVIEW.FIRST_ROW);
  const last = Math.min(
    editedRange.getRow() + editedRange.getNumRows() - 1,
    DASHBOARD_V030.REVIEW.LAST_ROW
  );
  if (last < first) return;
  sheet.getRange(first, DASHBOARD_V030.REVIEW.COLUMNS.APPLY, last - first + 1, 1)
    .setValue(true);
}

function handleAiCopyEditsV030_(sheet, editedRange) {
  const first = Math.max(editedRange.getRow(), DASHBOARD_V030.REVIEW.FIRST_ROW);
  const last = Math.min(
    editedRange.getRow() + editedRange.getNumRows() - 1,
    DASHBOARD_V030.REVIEW.LAST_ROW
  );
  for (let row = first; row <= last; row++) {
    if (isDashboardV030Checked_(sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY).getValue())) {
      handleAiCopyActionV030_(sheet, row);
    }
  }
}

function handleAiCopyActionV030_(sheet, row) {
  const values = sheet.getRange(row, 1, 1, DASHBOARD_V030.REVIEW.COLUMN_COUNT).getValues()[0];
  const date = normalizeDashboardDateV030_(values[0]);
  const ai = [values[7], values[8], values[9], values[10]];
  const hasProposal = ai.some(function(value) { return !isDashboardV030Blank_(value); });
  const proposalId = String(values[DASHBOARD_V030.REVIEW.COLUMNS.PROPOSAL_ID - 1] || '').trim();

  if (!date || !hasProposal || !proposalId) {
    sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY).setValue(false);
    setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.WARNING,
      'Row ' + row + ': 日付またはAI提案がないためコピーできません。');
    return;
  }

  try {
    validateProposalForApplyV030_(proposalId, dashboardDateKeyV030_(date));
  } catch (error) {
    sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY).setValue(false);
    setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.WARNING,
      'Row ' + row + ': ' + error.message);
    return;
  }

  const output = [
    isDashboardV030Blank_(ai[0]) ? values[2] : ai[0],
    isDashboardV030Blank_(ai[1]) ? values[3] : ai[1],
    isDashboardV030Blank_(ai[2]) ? values[4] : ai[2],
    isDashboardV030Blank_(ai[3]) ? values[5] : ai[3]
  ];
  sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.TYPE, 1, 4).setValues([output]);
  sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.APPLY).setValue(true);
  sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY).setValue(false);
  setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.NORMAL,
    'AI提案を作業コピーへ反映しました。Row ' + row);
}

function handleBulkAiCopyActionV032_(sheet) {
  const actionRange = getDashboardV030NamedRange_('DASH_ACTION_BULK_AI_COPY');
  const lock = LockService.getDocumentLock();
  let locked = false;
  try {
    if (!lock) throw new Error('Document Lockを取得できません。');
    locked = lock.tryLock(5000);
    if (!locked) throw new Error('別の処理を実行中です。少し待って再実行してください。');
    const review = getDashboardV030NamedRange_('DASH_REVIEW_RANGE').getValues();
    let selected = 0;
    const skipped = [];
    review.forEach(function(row, index) {
      const dashboardRow = DASHBOARD_V030.REVIEW.FIRST_ROW + index;
      const date = normalizeDashboardDateV030_(row[0]);
      const proposalId = String(row[12] || '').trim();
      const hasAiValues = row.slice(7, 11).some(function(value) {
        return !isDashboardV030Blank_(value);
      });
      if (!date || !proposalId || !hasAiValues) return;
      try {
        validateProposalForApplyV030_(proposalId, dashboardDateKeyV030_(date));
        const output = [
          isDashboardV030Blank_(row[7]) ? row[2] : row[7],
          isDashboardV030Blank_(row[8]) ? row[3] : row[8],
          isDashboardV030Blank_(row[9]) ? row[4] : row[9],
          isDashboardV030Blank_(row[10]) ? row[5] : row[10]
        ];
        sheet.getRange(dashboardRow, DASHBOARD_V030.REVIEW.COLUMNS.TYPE, 1, 4)
          .setValues([output]);
        sheet.getRange(dashboardRow, DASHBOARD_V030.REVIEW.COLUMNS.APPLY).setValue(true);
        sheet.getRange(dashboardRow, DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY).setValue(false);
        selected++;
      } catch (error) {
        skipped.push('Row ' + dashboardRow + ': ' + error.message);
      }
    });
    setDashboardSystemStatusV030_(skipped.length ? DASHBOARD_V030.STATUS.WARNING :
      DASHBOARD_V030.STATUS.NORMAL,
      '表示中AI案を' + selected + '件作業コピーへ取込' +
      (skipped.length ? ' / 除外' + skipped.length + '件: ' + skipped.slice(0, 2).join(' / ') : ''));
  } catch (error) {
    setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.ERROR, error.message);
    console.error(error);
  } finally {
    actionRange.setValue(false);
    if (locked) lock.releaseLock();
  }
}

function handleApplySelectedRowsActionV030_(sheet) {
  const actionRange = getDashboardV030NamedRange_('DASH_ACTION_APPLY');
  const lock = LockService.getDocumentLock();
  let locked = false;

  try {
    locked = lock.tryLock(5000);
    if (!locked) throw new Error('別の処理を実行中です。少し待って再実行してください。');

    const review = getDashboardV030NamedRange_('DASH_REVIEW_RANGE').getValues();
    const rowsToApply = [];
    review.forEach(function(row, index) {
      if (isDashboardV030Checked_(row[1])) {
        rowsToApply.push({
          dashboardRow: DASHBOARD_V030.REVIEW.FIRST_ROW + index,
          date: row[0],
          type: row[2],
          workout: row[3],
          targetPace: row[4],
          planKm: row[5],
          proposalId: String(row[12] || '').trim()
        });
      }
    });

    if (!rowsToApply.length) {
      writeDashboardApplyResultV030_('反映対象 0件');
      return;
    }

    const result = updateTrainingPlanFromDashboardV030_(rowsToApply);
    result.succeededDashboardRows.forEach(function(row) {
      sheet.getRange(row, DASHBOARD_V030.REVIEW.COLUMNS.APPLY).setValue(false);
    });

    const summary = result.successCount + '件反映 / ' + result.failCount + '件失敗';
    writeDashboardApplyResultV030_(summary);
    setDashboardSystemStatusV030_(
      result.failCount ? DASHBOARD_V030.STATUS.ERROR : DASHBOARD_V030.STATUS.NORMAL,
      result.failCount ? summary + ': ' + result.errors.slice(0, 3).join(' / ') :
        '選択行（' + result.successCount + '件）をTraining_Planへ反映しました。'
    );
  } catch (error) {
    writeDashboardApplyResultV030_('反映失敗');
    setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.ERROR, error.message);
    console.error(error);
  } finally {
    actionRange.setValue(false);
    if (locked) lock.releaseLock();
  }
}

function handleRefreshDashboardActionV030_(sheet) {
  const actionRange = getDashboardV030NamedRange_('DASH_ACTION_REFRESH');
  const lock = LockService.getDocumentLock();
  let locked = false;

  try {
    const hasChanges = getDashboardV030NamedRange_('DASH_APPLY_FLAGS').getValues().flat()
      .some(isDashboardV030Checked_);
    if (hasChanges) {
      setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.WARNING,
        '未反映の変更（B列ON）があるためRefreshを中断しました。');
      return;
    }

    if (typeof refreshActuals === 'function') refreshActuals();

    locked = lock.tryLock(10000);
    if (!locked) throw new Error('別の処理を実行中です。少し待って再実行してください。');

    const changedDuringSync = getDashboardV030NamedRange_('DASH_APPLY_FLAGS').getValues().flat()
      .some(isDashboardV030Checked_);
    if (changedDuringSync) {
      setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.WARNING,
        '実績同期中に未反映の変更が生じたためRefreshを中断しました。');
      return;
    }

    ensureTrainingPlanCoverageV032_();
    ensureProposalStagingSheetV030_();
    const proposalResult = validateAndLoadProposalsV030_();
    const rows = loadDashboardReviewRowsV030_(proposalResult.proposalsByDate);
    writeDashboardReviewRowsV030_(sheet, rows);
    refreshDashboardSummaryV030_(sheet);
    buildLlmBrief();

    const warningText = proposalResult.warnings.length
      ? ' / 警告: ' + proposalResult.warnings.slice(0, 3).join(' / ')
      : '';
    setDashboardSystemStatusV030_(
      proposalResult.warnings.length ? DASHBOARD_V030.STATUS.WARNING : DASHBOARD_V030.STATUS.NORMAL,
      Utilities.formatDate(new Date(), DASHBOARD_V030.TIMEZONE, 'MM/dd HH:mm') +
        ' 更新 / 表示' + rows.length + '行 / AI案' + proposalResult.loadedCount +
        '件 / 再検証' + proposalResult.revalidatedCount + '件 / INVALID ' +
        proposalResult.invalidCount + '件' + warningText
    );
  } catch (error) {
    setDashboardSystemStatusV030_(DASHBOARD_V030.STATUS.ERROR,
      'Dashboard更新に失敗しました: ' + error.message);
    console.error(error);
  } finally {
    actionRange.setValue(false);
    if (locked) lock.releaseLock();
  }
}

function writeDashboardReviewRowsV030_(sheet, rows) {
  const area = getDashboardV030NamedRange_('DASH_REVIEW_RANGE');
  area.clearContent().clearDataValidations();
  if (!rows.length) return;
  if (rows.length > DASHBOARD_V030.REVIEW.ROW_COUNT) {
    throw new Error('予定レビューが22行を超えています。');
  }

  area.offset(0, 0, rows.length, DASHBOARD_V030.REVIEW.COLUMN_COUNT).setValues(rows);
  sheet.getRange(DASHBOARD_V030.REVIEW.FIRST_ROW, 1, rows.length, 1)
    .setNumberFormat('M/d(ddd)');
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DASHBOARD_V030.PLAN_TYPES, true)
    .setAllowInvalid(true).build();
  sheet.getRange(DASHBOARD_V030.REVIEW.FIRST_ROW, 3, rows.length, 1).setDataValidation(typeRule);
  sheet.getRange(DASHBOARD_V030.REVIEW.FIRST_ROW, 2, rows.length, 1)
    .insertCheckboxes().setValue(false);
  sheet.getRange(DASHBOARD_V030.REVIEW.FIRST_ROW, 7, rows.length, 1)
    .insertCheckboxes().setValue(false);
  sheet.hideColumns(DASHBOARD_V030.REVIEW.COLUMNS.PROPOSAL_ID);
}

function writeDashboardApplyResultV030_(message) {
  getDashboardV030NamedRange_('DASH_APPLY_RESULT').setValue(
    Utilities.formatDate(new Date(), DASHBOARD_V030.TIMEZONE, 'MM/dd HH:mm') + ' ' + message
  );
}

function setDashboardSystemStatusV030_(status, message) {
  getDashboardV030NamedRange_('DASH_REFRESH_RESULT').setValue(status + '｜' + message);
}
