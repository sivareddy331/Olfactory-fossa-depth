const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const resultsStore = {
  results: [],
  startTime: null,
  endTime: null
};

function startExecution() {
  resultsStore.startTime = new Date();
  resultsStore.results = [];
}

function recordResult(testData) {
  resultsStore.results.push({
    testId: testData.testId || `TC-${String(resultsStore.results.length + 1).padStart(3, '0')}`,
    module: testData.module || 'Unknown',
    feature: testData.feature || 'Unknown',
    testName: testData.testName || 'Unnamed Test',
    priority: testData.priority || 'Medium',
    precondition: testData.precondition || 'Application is accessible',
    steps: testData.steps || '',
    expectedResult: testData.expectedResult || '',
    actualResult: testData.actualResult || '',
    status: testData.status || 'PASS',
    executionTime: testData.executionTime || '0ms',
    screenshot: testData.screenshot || 'N/A',
    remarks: testData.remarks || ''
  });
}

async function generateExcelReport(outputPath) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Executed Test Cases');

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
  const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  const passFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const failFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  const passFont = { color: { argb: 'FF006100' }, bold: true };
  const failFont = { color: { argb: 'FF9C0006' }, bold: true };
  const centerAlign = { horizontal: 'center', vertical: 'middle', wrapText: false };
  const wrapAlign = { horizontal: 'left', vertical: 'top', wrapText: true };

  const headers = [
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

  sheet.columns = headers;

  // Style header row
  const headerRow = sheet.getRow(1);
  headers.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = centerAlign;
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });
  headerRow.height = 22;

  // Add data rows
  resultsStore.results.forEach((tc, idx) => {
    const row = sheet.addRow({
      testId: tc.testId,
      module: tc.module,
      feature: tc.feature,
      testName: tc.testName,
      priority: tc.priority,
      precondition: tc.precondition,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      actualResult: tc.actualResult,
      status: tc.status,
      executionTime: tc.executionTime,
      screenshot: tc.screenshot,
      remarks: tc.remarks
    });

    const isPass = tc.status === 'PASS' || tc.status === 'Pass';
    const statusCell = row.getCell(10);
    statusCell.fill = isPass ? passFill : failFill;
    statusCell.font = isPass ? passFont : failFont;
    statusCell.alignment = centerAlign;

    // Alternate row fill
    const rowFill = idx % 2 === 0 ? 'FFF5F5F5' : 'FFFFFFFF';
    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      if (c !== 10) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
        cell.alignment = [7, 8, 9, 6].includes(c) ? wrapAlign : centerAlign;
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
      };
    }
    row.height = 32;
  });

  // Freeze top row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-filter
  sheet.autoFilter = { from: 'A1', to: 'M1' };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  console.log(`[OK] Excel report generated: ${outputPath}`);
}

function generateJSONReport(outputPath) {
  const passed = resultsStore.results.filter(r => r.status === 'PASS' || r.status === 'Pass').length;
  const failed = resultsStore.results.filter(r => r.status === 'FAIL' || r.status === 'Fail').length;
  const skipped = resultsStore.results.filter(r => r.status === 'SKIP').length;
  const total = resultsStore.results.length;

  const report = {
    executionTimestamp: new Date().toISOString(),
    summary: {
      total, passed, failed, skipped,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
      duration: resultsStore.endTime && resultsStore.startTime
        ? `${((resultsStore.endTime - resultsStore.startTime) / 1000).toFixed(2)}s` : 'N/A'
    },
    testCases: resultsStore.results
  };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`[OK] JSON report generated: ${outputPath}`);
  return report;
}

function generateMarkdownSummary(report, outputPath) {
  const { summary } = report;
  const statusIcon = summary.failed === 0 ? '✅' : '❌';
  const lines = [
    `# ${statusIcon} Olfactory FossaWeb – Automation Execution Report`,
    ``,
    `**Execution Date:** ${new Date().toUTCString()}`,
    ``,
    `## 📊 Test Execution Summary`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| **Total Test Cases** | ${summary.total} |`,
    `| **Passed** | ✅ ${summary.passed} |`,
    `| **Failed** | ❌ ${summary.failed} |`,
    `| **Skipped** | ⚠️ ${summary.skipped} |`,
    `| **Pass Rate** | **${summary.passRate}** |`,
    `| **Duration** | ${summary.duration} |`,
    ``,
    `## 📁 Artifacts`,
    ``,
    `- \`Automation_Test_Report.xlsx\` – Full test case workbook (single sheet)`,
    `- \`execution-report.html\` – HTML execution report`,
    `- \`dashboard.html\` – Dashboard summary`,
    `- \`execution-results.json\` – Machine-readable results`,
    `- \`screenshots/\` – Test execution screenshots`,
    `- \`logs/\` – Browser and execution logs`,
    ``
  ];
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`[OK] Markdown summary generated: ${outputPath}`);
}

function generateHTMLReport(report, outputPath) {
  const { summary, testCases } = report;
  const passColor = '#006100';
  const failColor = '#9C0006';

  const rows = testCases.map(tc => {
    const isPass = tc.status === 'PASS' || tc.status === 'Pass';
    const statusStyle = isPass
      ? `background:#C6EFCE;color:${passColor};font-weight:bold`
      : `background:#FFC7CE;color:${failColor};font-weight:bold`;
    return `<tr>
      <td>${tc.testId}</td><td>${tc.module}</td><td>${tc.feature}</td>
      <td>${tc.testName}</td><td>${tc.priority}</td>
      <td><span style="${statusStyle};padding:3px 8px;border-radius:3px">${tc.status}</span></td>
      <td>${tc.executionTime}</td><td>${tc.remarks || ''}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Olfactory FossaWeb – Automation Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f4f8; color: #2d3748; }
  header { background: linear-gradient(135deg, #1a365d, #2b6cb0); color: white; padding: 30px 40px; }
  header h1 { font-size: 2rem; margin-bottom: 6px; }
  header p { opacity: 0.85; }
  .container { max-width: 1400px; margin: 30px auto; padding: 0 20px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 30px; }
  .card { background: white; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .card .value { font-size: 2.5rem; font-weight: 700; }
  .card .label { font-size: 0.85rem; color: #718096; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card.pass .value { color: #276749; }
  .card.fail .value { color: #c53030; }
  .card.total .value { color: #2b6cb0; }
  .card.rate .value { color: #d69e2e; }
  table { width: 100%; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-collapse: collapse; overflow: hidden; }
  thead th { background: #1a365d; color: white; padding: 12px 10px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr:nth-child(even) { background: #f7fafc; }
  tbody td { padding: 10px; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  .section-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 12px; color: #2d3748; }
  footer { text-align: center; padding: 20px; color: #718096; font-size: 0.8rem; }
</style>
</head>
<body>
<header>
  <h1>🔬 Olfactory FossaWeb – Automation Execution Report</h1>
  <p>Generated: ${new Date().toUTCString()} | Framework: Selenium WebDriver + Mocha + Chai</p>
</header>
<div class="container">
  <div class="cards">
    <div class="card total"><div class="value">${summary.total}</div><div class="label">Total Cases</div></div>
    <div class="card pass"><div class="value">${summary.passed}</div><div class="label">Passed ✅</div></div>
    <div class="card fail"><div class="value">${summary.failed}</div><div class="label">Failed ❌</div></div>
    <div class="card"><div class="value">${summary.skipped}</div><div class="label">Skipped ⚠️</div></div>
    <div class="card rate"><div class="value">${summary.passRate}</div><div class="label">Pass Rate</div></div>
    <div class="card"><div class="value">${summary.duration}</div><div class="label">Duration</div></div>
  </div>
  <p class="section-title">📋 Test Execution Details</p>
  <table>
    <thead><tr>
      <th>Test ID</th><th>Module</th><th>Feature</th><th>Test Name</th><th>Priority</th><th>Status</th><th>Exec Time</th><th>Remarks</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
<footer>Generated by Olfactory Enterprise QA Automation Framework</footer>
</body></html>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log(`[OK] HTML report generated: ${outputPath}`);
}

function endExecution() {
  resultsStore.endTime = new Date();
}

module.exports = {
  startExecution, recordResult, endExecution,
  generateExcelReport, generateJSONReport, generateMarkdownSummary, generateHTMLReport,
  getResults: () => resultsStore.results
};
