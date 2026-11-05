/**
 * واجهة قراءة فقط لموقع العرض — انشرها كـ Web app (انظر README)
 * ?action=list  → أسماء الأوراق
 * ?sheet=NAME   → محتوى ورقة بتنسيقها
 */
const VIEW_SS_ID = '15VzCSA6OHp0IOu9E0BsORUvX82DylsVCqMjYOZH9rn0';

function doGet(e) {
  const p = (e && e.parameter) || {};
  const ss = SpreadsheetApp.openById(VIEW_SS_ID);
  let out;
  if (p.sheet) {
    const sh = ss.getSheetByName(p.sheet) ||
      ss.getSheets().filter(s => s.getName().trim() === p.sheet.trim())[0];
    out = sh ? readSheet_(sh) : { error: 'not found' };
  } else {
    out = ss.getSheets().filter(s => !s.isSheetHidden()).map(s => s.getName().trim());
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheet_(sh) {
  const NC = 6;
  const vals = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), NC).getDisplayValues();
  let last = 0;
  vals.forEach((r, i) => { if (r.some(v => String(v).trim())) last = i + 1; });
  if (!last) last = 1;
  const rg = sh.getRange(1, 1, last, NC);
  const v = rg.getDisplayValues(), bg = rg.getBackgrounds(), fw = rg.getFontWeights(),
        fc = rg.getFontColors(), fs = rg.getFontSizes(), ha = rg.getHorizontalAlignments();
  const cells = [], rows = [], cols = [];
  for (let c = 1; c <= NC; c++) cols.push(sh.getColumnWidth(c));
  for (let r = 0; r < last; r++) {
    rows.push(sh.getRowHeight(r + 1));
    const line = [];
    for (let c = 0; c < NC; c++) {
      const d = {}, t = String(v[r][c]).trim();
      if (t) d.v = t;
      if (bg[r][c] && bg[r][c] !== '#ffffff') d.bg = bg[r][c];
      if (fw[r][c] === 'bold') d.b = 1;
      if (fc[r][c] && fc[r][c] !== '#000000') d.c = fc[r][c];
      if (fs[r][c] && fs[r][c] !== 10) d.sz = fs[r][c];
      if (['left', 'center', 'right'].indexOf(ha[r][c]) > -1) d.h = ha[r][c];
      line.push(d);
    }
    cells.push(line);
  }
  const merges = rg.getMergedRanges().map(m =>
    [m.getRow() - 1, m.getColumn() - 1, m.getLastRow() - 1, m.getLastColumn() - 1]);
  return { title: sh.getName().trim(), cols, rows, cells, merges };
}
