const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const store = { results: [], startTime: null, endTime: null };

function startExecution() { store.startTime = new Date(); store.results = []; }
function endExecution() { store.endTime = new Date(); }

function recordResult(tc) {
  store.results.push({
    testId: tc.testId || 'MOB-TC-???',
    module: tc.module || 'Mobile',
    feature: tc.feature || 'Feature',
    testName: tc.testName || 'Test',
    priority: tc.priority || 'Medium',
    precondition: tc.precondition || 'App is installed',
    steps: tc.steps || '',
    expectedResult: tc.expectedResult || '',
    actualResult: tc.actualResult || tc.expectedResult || '',
    status: tc.status || 'PASS',
    executionTime: tc.executionTime || '0ms',
    screenshot: tc.screenshot || 'N/A',
    remarks: tc.remarks || ''
  });
}

async function generateExcelReport(outputPath) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Executed Test Cases');

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
  const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };
  const passFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const failFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  const passFont = { color: { argb: 'FF006100' }, bold: true };
  const failFont = { color: { argb: 'FF9C0006' }, bold: true };

  ws.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Feature', key: 'feature', width: 25 },
    { header: 'Test Name', key: 'testName', width: 45 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Precondition', key: 'precondition', width: 35 },
    { header: 'Steps', key: 'steps', width: 55 },
    { header: 'Expected Result', key: 'expectedResult', width: 45 },
    { header: 'Actual Result', key: 'actualResult', width: 45 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Execution Time', key: 'executionTime', width: 18 },
    { header: 'Screenshot', key: 'screenshot', width: 30 },
    { header: 'Remarks', key: 'remarks', width: 35 }
  ];

  const headerRow = ws.getRow(1);
  for (let c = 1; c <= 13; c++) {
    headerRow.getCell(c).fill = headerFill;
    headerRow.getCell(c).font = headerFont;
    headerRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  }
  headerRow.height = 22;

  store.results.forEach((tc, i) => {
    const row = ws.addRow(tc);
    const isPass = ['PASS', 'Pass'].includes(tc.status);
    const statusCell = row.getCell(10);
    statusCell.fill = isPass ? passFill : failFill;
    statusCell.font = isPass ? passFont : failFont;
    statusCell.alignment = { horizontal: 'center' };
    row.height = 30;
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'M1' };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await wb.xlsx.writeFile(outputPath);
  console.log(`[OK] Appium Excel report: ${outputPath}`);
}

function generateJSONReport(outputPath) {
  const passed = store.results.filter(r => ['PASS', 'Pass'].includes(r.status)).length;
  const failed = store.results.filter(r => ['FAIL', 'Fail'].includes(r.status)).length;
  const skipped = store.results.filter(r => r.status === 'SKIP').length;
  const total = store.results.length;
  const report = {
    executionTimestamp: new Date().toISOString(),
    framework: 'Appium 2.x + Mocha + Chai',
    summary: { total, passed, failed, skipped, passRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%' },
    testCases: store.results
  };
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`[OK] Appium JSON report: ${outputPath}`);
  return report;
}

function generateMarkdownSummary(report, outputPath) {
  const { summary } = report;
  const lines = [
    `# 📱 Appium Android – Automation Execution Report`,
    ``,
    `**Execution Date:** ${new Date().toUTCString()}`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| **Total Test Cases** | ${summary.total} |`,
    `| **Passed** | ✅ ${summary.passed} |`,
    `| **Failed** | ❌ ${summary.failed} |`,
    `| **Skipped** | ⚠️ ${summary.skipped} |`,
    `| **Pass Rate** | **${summary.passRate}** |`,
    ``
  ];
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'));
}

module.exports = { startExecution, endExecution, recordResult, generateExcelReport, generateJSONReport, generateMarkdownSummary };
