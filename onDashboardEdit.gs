/**
 * Running AI Karte v0.3.0 - the one installed Dashboard onEdit dispatcher.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onDashboardEdit(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== DASHBOARD_V030.SHEETS.DASHBOARD) return;
  if (!isDashboardV030Ready_()) return;

  if (rangesIntersectV030_(range, 13, 34, [DASHBOARD_V030.REVIEW.COLUMNS.AI_COPY])) {
    handleAiCopyEditsV030_(sheet, range);
    return;
  }

  if (rangesIntersectV030_(range, 13, 34, [
    DASHBOARD_V030.REVIEW.COLUMNS.TYPE,
    DASHBOARD_V030.REVIEW.COLUMNS.WORKOUT,
    DASHBOARD_V030.REVIEW.COLUMNS.TARGET_PACE,
    DASHBOARD_V030.REVIEW.COLUMNS.PLAN_KM
  ])) {
    handleReviewManualEditsV030_(sheet, range);
    return;
  }

  if (range.getNumRows() !== 1 || range.getNumColumns() !== 1) return;
  if (!isDashboardV030Checked_(e.value)) return;

  const a1 = range.getA1Notation();
  if (a1 === DASHBOARD_V030.ACTION_CELLS.REFRESH) {
    handleRefreshDashboardActionV030_(sheet);
  } else if (a1 === DASHBOARD_V030.ACTION_CELLS.APPLY) {
    handleApplySelectedRowsActionV030_(sheet);
  } else if (a1 === DASHBOARD_V030.ACTION_CELLS.BULK_AI_COPY) {
    handleBulkAiCopyActionV032_(sheet);
  }
}
