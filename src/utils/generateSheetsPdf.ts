import { jsPDF } from 'jspdf';
import {
  BankTransferSheetData,
  BillPaymentSheetData,
  computeBankTransferTotals,
  computeBillPaymentTotals,
  computeMonthlyVoucherTotals,
  formatRawOrComma,
  formatSheetNum,
  getRowVoValues,
  getVoLabel,
  MIN_VO_COLUMNS,
  MonthlyVoucherSheetData,
} from '../data/sheetsDefaults';

function fitTextSingleLine(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize = 5.5
): number {
  let size = baseSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.3;
    doc.setFontSize(size);
  }
  return size;
}

function drawCellText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    fontSize?: number;
    fillRgb?: [number, number, number];
    border?: boolean;
    padX?: number;
  }
) {
  const align = options?.align ?? 'left';
  const bold = options?.bold ?? false;
  const fontSize = options?.fontSize ?? 9;
  const padX = options?.padX ?? 1.8;

  if (options?.fillRgb) {
    doc.setFillColor(...options.fillRgb);
    doc.rect(x, y, w, h, 'F');
  }

  if (options?.border !== false) {
    doc.setDrawColor(35, 35, 35);
    doc.setLineWidth(0.22);
    doc.rect(x, y, w, h, 'S');
  }

  if (!text) return;

  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(17, 17, 17);
  const fitted = fitTextSingleLine(doc, text, Math.max(2, w - padX * 2), fontSize, 5.2);
  doc.setFontSize(fitted);

  const textY = y + h / 2 + fitted * 0.125;
  if (align === 'center') {
    doc.text(text, x + w / 2, textY, { align: 'center' });
  } else if (align === 'right') {
    doc.text(text, x + w - padX, textY, { align: 'right' });
  } else {
    doc.text(text, x + padX, textY);
  }
}

/* =========================================================
   SHEET 1 PDF: Bill Payment & T,T (A4 Portrait)
   ========================================================= */
export function generateBillPaymentPdf(data: BillPaymentSheetData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totals = computeBillPaymentTotals(data);

  const x0 = 14;
  const voCount = totals.voCount;
  const nameW = Math.max(26, 46 - Math.max(0, voCount - MIN_VO_COLUMNS) * 1.5);
  const voW = (182 - nameW - 25) / voCount;
  const colWidths = [nameW, ...Array.from({ length: voCount }, () => voW), 25];
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  const GOLD: [number, number, number] = [249, 228, 142];
  const LAVENDER: [number, number, number] = [217, 207, 227];

  let y = 14;

  // Title Row
  drawCellText(doc, data.title || 'Bill Payment', x0, y, totalW, 9, {
    align: 'center',
    bold: false,
    fontSize: 13,
  });
  y += 9;

  // Header Row
  const headers = [
    'Name',
    ...Array.from({ length: voCount }, (_, idx) => getVoLabel(idx)),
    'Total',
  ];
  let cx = x0;
  headers.forEach((hLabel, idx) => {
    drawCellText(doc, hLabel, cx, y, colWidths[idx], 8.5, {
      align: 'center',
      bold: false,
      fontSize: 9.5,
      fillRgb: idx === colWidths.length - 1 ? LAVENDER : undefined,
    });
    cx += colWidths[idx];
  });
  y += 8.5;

  // Data Rows
  const rowH = Math.min(7.2, Math.max(5.5, 92 / Math.max(1, data.rows.length)));
  data.rows.forEach((row, rIdx) => {
    const rTotal = totals.rowTotals[rIdx];
    const cells = [
      row.name,
      ...Array.from({ length: voCount }, (_, idx) =>
        formatRawOrComma(getRowVoValues(row)[idx] ?? '')
      ),
      formatSheetNum(rTotal, true),
    ];

    cx = x0;
    cells.forEach((val, cIdx) => {
      const isVoucherCol = cIdx >= 1 && cIdx <= voCount;
      const isTotalCol = cIdx === colWidths.length - 1;
      const shouldFill = (isVoucherCol && val !== '') || (isTotalCol && val !== '');
      drawCellText(doc, val, cx, y, colWidths[cIdx], rowH, {
        align: cIdx === 0 ? 'left' : 'right',
        fontSize: cIdx === 0 && row.name.length > 20 ? 7.2 : 9,
        fillRgb: shouldFill ? GOLD : undefined,
      });
      cx += colWidths[cIdx];
    });

    if (row.ok) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(17, 17, 17);
      doc.text('ok', x0 + totalW + 2, y + rowH / 2 + 1);
    }

    y += rowH;
  });

  // Total Row
  const footVals = [
    'Total',
    ...totals.voTotals.map((voTotal) => formatSheetNum(voTotal, false)),
    formatSheetNum(totals.billTotal, false),
  ];
  cx = x0;
  footVals.forEach((val, idx) => {
    drawCellText(doc, val, cx, y, colWidths[idx], 7.8, {
      align: idx === 0 ? 'left' : 'right',
      bold: false,
      fontSize: 9.5,
    });
    cx += colWidths[idx];
  });
  y += 7.8;

  // T,T Section Header
  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text(data.ttTitle || 'T,T', x0 + totalW / 2, y, { align: 'center' });
  y += 4;

  const ttLabelW = 40;
  const ttValW = 48;
  const ttRowH = 7.4;

  data.ttItems.forEach((item) => {
    drawCellText(doc, item.label, x0, y, ttLabelW, ttRowH, {
      align: 'left',
      fontSize: 9.2,
    });
    drawCellText(doc, formatRawOrComma(item.amount), x0 + ttLabelW, y, ttValW, ttRowH, {
      align: 'right',
      fontSize: 9.2,
    });
    y += ttRowH;
  });

  drawCellText(doc, 'total', x0, y, ttLabelW, ttRowH, {
    align: 'left',
    fontSize: 9.2,
  });
  drawCellText(doc, formatSheetNum(totals.ttTotal, false), x0 + ttLabelW, y, ttValW, ttRowH, {
    align: 'right',
    fontSize: 9.2,
  });
  y += ttRowH + 7;

  drawCellText(doc, 'Salary', x0, y, ttLabelW, ttRowH, {
    align: 'left',
    fontSize: 9.2,
  });
  drawCellText(doc, formatRawOrComma(data.salary), x0 + ttLabelW, y, ttValW, ttRowH, {
    align: 'right',
    fontSize: 9.2,
  });
  y += ttRowH;

  drawCellText(doc, 'Others', x0, y, ttLabelW, ttRowH, {
    align: 'left',
    fontSize: 9.2,
  });
  drawCellText(doc, formatRawOrComma(data.others), x0 + ttLabelW, y, ttValW, ttRowH, {
    align: 'right',
    fontSize: 9.2,
  });
  y += ttRowH;

  drawCellText(doc, 'Grand Total', x0, y, ttLabelW, ttRowH, {
    align: 'left',
    fontSize: 9.5,
  });
  drawCellText(doc, formatSheetNum(totals.grandTotal, false), x0 + ttLabelW, y, ttValW, ttRowH, {
    align: 'right',
    fontSize: 9.5,
  });

  doc.save(`Bill_Payment_Summary.pdf`);
}

/* =========================================================
   SHEET 2 PDF: Bank Transfer Breakdown (A4 Landscape)
   ========================================================= */
export function generateBankTransferPdf(data: BankTransferSheetData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totals = computeBankTransferTotals(data);

  const x0 = 12;
  const w = [10, 30, 56, 38, 27, 50, 34, 28];
  const totalW = w.reduce((a, b) => a + b, 0);

  let y = 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13.5);
  doc.setTextColor(17, 17, 17);
  doc.text(`Name Of Month-   ${data.monthLabel || ''}`, x0 + 4, y);
  y += 5.5;

  const hdrH = 12;
  const subH = 6;
  const singleHdrLabels = [
    'S/L',
    'Bank Name',
    'Account Name',
    'Account number',
    'Routing NO:',
    'Branch Name',
  ];

  let cx = x0;
  singleHdrLabels.forEach((lbl, idx) => {
    drawCellText(doc, lbl, cx, y, w[idx], hdrH, {
      align: 'center',
      fontSize: 9,
    });
    cx += w[idx];
  });

  drawCellText(doc, 'Taka', cx, y, w[6] + w[7], subH, {
    align: 'center',
    fontSize: 9,
  });
  drawCellText(doc, 'Discribetion', cx, y + subH, w[6], subH, {
    align: 'center',
    fontSize: 8.5,
  });
  drawCellText(doc, 'Taka', cx + w[6], y + subH, w[7], subH, {
    align: 'center',
    fontSize: 8.5,
  });

  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.45);
  doc.rect(x0, y, totalW, hdrH, 'S');
  y += hdrH;

  data.blocks.forEach((block, bIdx) => {
    const items = block.items.length > 0 ? block.items : [{ id: 'empty', description: '', amount: '' }];
    const itemH = 7.5;
    const blockBodyH = items.length * itemH;
    const blockTotal = totals.blockTotals[bIdx];

    const leftValues = [
      String(bIdx + 1),
      block.bankName,
      block.accountName,
      block.accountNumber,
      block.routingNo,
      block.branchName,
    ];

    cx = x0;
    leftValues.forEach((val, idx) => {
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.24);
      doc.rect(cx, y, w[idx], blockBodyH, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 17, 17);
      const maxTextW = w[idx] - 3;
      let fontSize = 9;
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(val || '', maxTextW) as string[];
      if (lines.length > 2) {
        fontSize = 7.6;
        doc.setFontSize(fontSize);
      }
      const wrapped = doc.splitTextToSize(val || '', maxTextW) as string[];
      const lineStep = fontSize * 0.42;
      const startY =
        y + blockBodyH / 2 - ((wrapped.length - 1) * lineStep) / 2 + fontSize * 0.12;
      wrapped.forEach((ln, lIdx) => {
        doc.text(ln, cx + w[idx] / 2, startY + lIdx * lineStep, { align: 'center' });
      });

      cx += w[idx];
    });

    items.forEach((item, iIdx) => {
      const iy = y + iIdx * itemH;
      drawCellText(doc, item.description, cx, iy, w[6], itemH, {
        align: 'left',
        fontSize: 8.8,
      });
      drawCellText(doc, item.amount.trim(), cx + w[6], iy, w[7], itemH, {
        align: 'right',
        bold: Boolean(item.bold),
        fontSize: 9,
      });
    });

    const blockEndY = y + blockBodyH;
    if (block.showTotalRow) {
      drawCellText(doc, 'Total', x0, blockEndY, totalW - w[7], 7.2, {
        align: 'center',
        bold: true,
        fontSize: 9.2,
      });
      drawCellText(doc, String(blockTotal), x0 + totalW - w[7], blockEndY, w[7], 7.2, {
        align: 'right',
        bold: true,
        fontSize: 9.2,
      });
      doc.setDrawColor(17, 17, 17);
      doc.setLineWidth(0.45);
      doc.rect(x0, y, totalW, blockBodyH + 7.2, 'S');
      y = blockEndY + 7.2;
    } else {
      doc.setDrawColor(17, 17, 17);
      doc.setLineWidth(0.45);
      doc.rect(x0, y, totalW, blockBodyH, 'S');
      y = blockEndY;
    }

    if (bIdx < data.blocks.length - 1) {
      y += 6.5;
    }
  });

  drawCellText(doc, 'Grand Total', x0, y, totalW - w[7], 7.8, {
    align: 'center',
    bold: true,
    fontSize: 9.5,
  });
  drawCellText(doc, String(totals.grandTotal), x0 + totalW - w[7], y, w[7], 7.8, {
    align: 'right',
    bold: true,
    fontSize: 9.5,
  });
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.48);
  doc.rect(x0, y, totalW, 7.8, 'S');

  const safeMonth = data.monthLabel.replace(/[^\w-]/g, '_') || 'Month';
  doc.save(`Bank_Transfer_Breakdown_${safeMonth}.pdf`);
}

/* =========================================================
   SHEET 3 PDF: Monthly Voucher Print (7 Columns, A4 Portrait)
   SL | Particular | Code | Total Voucher | VAT | Tax | Grand Total
   ========================================================= */
export function generateMonthlyVoucherPdf(data: MonthlyVoucherSheetData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totals = computeMonthlyVoucherTotals(data.rows);

  const x0 = 12;
  // 7 columns summing to 186mm
  const w = [12, 58, 22, 26, 21, 21, 26];
  const totalW = w.reduce((a, b) => a + b, 0);

  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 17, 17);
  const titleText = data.monthLabel.trim()
    ? `${data.sheetTitle || 'Monthly Voucher Statement'} - ${data.monthLabel}`
    : data.sheetTitle || 'Monthly Voucher Statement';
  doc.text(titleText, x0 + totalW / 2, y, { align: 'center' });
  y += 6;

  const headers = [
    'SL',
    'Particular',
    'Code',
    'Total Voucher',
    'VAT',
    'Tax',
    'Grand Total',
  ];
  const hdrH = 8.5;
  let cx = x0;
  headers.forEach((lbl, idx) => {
    drawCellText(doc, lbl, cx, y, w[idx], hdrH, {
      align: 'center',
      bold: true,
      fontSize: 9,
      fillRgb: [242, 244, 243],
    });
    cx += w[idx];
  });
  y += hdrH;

  const availH = 276 - y - 9;
  const rowH = Math.min(7.5, Math.max(5.4, availH / Math.max(1, data.rows.length)));

  data.rows.forEach((row, rIdx) => {
    const c = totals.computedRows[rIdx];
    const vals = [
      row.slNo,
      row.particulars,
      row.codeNo,
      c.totalVoucher > 0 ? formatSheetNum(c.totalVoucher, true) : '',
      c.vat > 0 ? formatSheetNum(c.vat, true) : '',
      c.tax > 0 ? formatSheetNum(c.tax, true) : '',
      c.grandTotal > 0 ? formatSheetNum(c.grandTotal, true) : '',
    ];

    cx = x0;
    vals.forEach((val, cIdx) => {
      const align: 'left' | 'center' | 'right' =
        cIdx === 0 || cIdx === 2 ? 'center' : cIdx === 1 ? 'left' : 'right';
      drawCellText(doc, val, cx, y, w[cIdx], rowH, {
        align,
        fontSize: 8.6,
        padX: 1.6,
      });
      cx += w[cIdx];
    });
    y += rowH;
  });

  // Grand Total Footer
  const footerVals = [
    '',
    'Total',
    '',
    formatSheetNum(totals.sumTotalVoucher, false),
    formatSheetNum(totals.sumVat, false),
    formatSheetNum(totals.sumTax, false),
    formatSheetNum(totals.sumGrandTotal, false),
  ];
  cx = x0;
  footerVals.forEach((val, idx) => {
    drawCellText(doc, val, cx, y, w[idx], 8, {
      align: idx === 1 ? 'left' : 'right',
      bold: true,
      fontSize: 9,
      fillRgb: [249, 228, 142],
      padX: 1.6,
    });
    cx += w[idx];
  });

  const safeMonth = data.monthLabel.replace(/[^\w-]/g, '_') || 'Statement';
  doc.save(`Monthly_Voucher_${safeMonth}.pdf`);
}
