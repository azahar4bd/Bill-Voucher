import { jsPDF } from 'jspdf';
import {
  FormType,
  ReceiverFormData,
  SONALI_BANK_LOGO_URI,
  SenderFormData,
} from '../data/bankDefaults';

const MARGIN_L = 16;
const MARGIN_R = 194;
const CONTENT_W = MARGIN_R - MARGIN_L; // 178mm
const BLUE_R = 19;
const BLUE_G = 34;
const BLUE_B = 184;

function drawDottedLine(doc: jsPDF, x1: number, x2: number, y: number) {
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.3);
  doc.setLineCap('round');
  doc.setLineDashPattern([0.04, 0.92], 0);
  doc.line(x1, y, x2, y);
  doc.setLineDashPattern([], 0);
  doc.setLineCap('butt');
}

function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.26);
  doc.setLineDashPattern([1.1, 0.9], 0);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}

function drawUnderlinedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: 'left' | 'center' = 'left'
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(17, 17, 17);
  const w = doc.getTextWidth(text);

  if (align === 'center') {
    doc.text(text, x, y, { align: 'center' });
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(fontSize >= 12 ? 0.35 : 0.25);
    doc.line(x - w / 2, y + 0.9, x + w / 2, y + 0.9);
  } else {
    doc.text(text, x, y);
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.25);
    doc.line(x, y + 0.9, x + w, y + 0.9);
  }
}

function drawSlotValue(
  doc: jsPDF,
  value: string,
  xStart: number,
  xEnd: number,
  y: number,
  center = false
) {
  drawDottedLine(doc, xStart, xEnd, y + 0.8);
  const clean = value.trim();
  if (!clean) return;

  const slotW = Math.max(4, xEnd - xStart - 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BLUE_R, BLUE_G, BLUE_B);

  let size = 10;
  doc.setFontSize(size);
  const measured = doc.getTextWidth(clean);

  if (measured <= slotW) {
    if (center) {
      doc.text(clean, (xStart + xEnd) / 2, y - 0.2, { align: 'center' });
    } else {
      doc.text(clean, xStart + 1.2, y - 0.2);
    }
    return;
  }

  // First try shrinking cleanly on 1 line down to 6.2pt
  size = Math.max(6.2, Math.min(10, (10 * (slotW - 0.6)) / measured));
  doc.setFontSize(size);
  while (size > 6.2 && doc.getTextWidth(clean) > slotW) {
    size -= 0.2;
    doc.setFontSize(size);
  }

  if (doc.getTextWidth(clean) <= slotW) {
    if (center) {
      doc.text(clean, (xStart + xEnd) / 2, y - 0.2, { align: 'center' });
    } else {
      doc.text(clean, xStart + 1.2, y - 0.2);
    }
    return;
  }

  // For extreme length (e.g. 100+ crore), wrap onto 2 compact lines instead of clipping
  let wrapSize = 6.6;
  doc.setFontSize(wrapSize);
  let lines = doc.splitTextToSize(clean, slotW) as string[];
  while (wrapSize > 4.6 && lines.length > 2) {
    wrapSize -= 0.3;
    doc.setFontSize(wrapSize);
    lines = doc.splitTextToSize(clean, slotW) as string[];
  }

  if (lines.length === 1) {
    if (center) {
      doc.text(lines[0], (xStart + xEnd) / 2, y - 0.2, { align: 'center' });
    } else {
      doc.text(lines[0], xStart + 1.2, y - 0.2);
    }
  } else {
    const line1 = lines[0];
    const line2 = lines.slice(1).join(' ');
    // Ensure line 2 also fits slotW
    let l2Size = wrapSize;
    doc.setFontSize(l2Size);
    while (l2Size > 4.4 && doc.getTextWidth(line2) > slotW) {
      l2Size -= 0.2;
      doc.setFontSize(l2Size);
    }
    doc.setFontSize(wrapSize);
    doc.text(line1, xStart + 1.0, y - 2.35);
    doc.setFontSize(l2Size);
    doc.text(line2, xStart + 1.0, y - 0.15);
  }
}

interface RowSegment {
  label?: string;
  value?: string;
  weight?: number;
  fixedWidth?: number;
  center?: boolean;
}

function drawFormRow(
  doc: jsPDF,
  segments: RowSegment[],
  y: number,
  xStart = MARGIN_L,
  xEnd = MARGIN_R,
  fontSize = 9.2
) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(17, 17, 17);

  let fixedTotal = 0;
  let totalWeight = 0;
  const gap = 1.4;

  const labelWidths = segments.map((seg) =>
    seg.label ? doc.getTextWidth(seg.label) + gap : 0
  );

  segments.forEach((seg, idx) => {
    fixedTotal += labelWidths[idx];
    if (seg.fixedWidth !== undefined) {
      fixedTotal += seg.fixedWidth + gap;
    } else if (seg.value !== undefined) {
      totalWeight += seg.weight ?? 1;
      fixedTotal += gap;
    }
  });

  const avail = Math.max(10, xEnd - xStart - fixedTotal);
  let cursor = xStart;

  segments.forEach((seg, idx) => {
    if (seg.label) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(17, 17, 17);
      doc.text(seg.label, cursor, y);
      cursor += labelWidths[idx];
    }

    if (seg.fixedWidth !== undefined) {
      const slotEnd = cursor + seg.fixedWidth;
      drawSlotValue(doc, seg.value || '', cursor, slotEnd, y, Boolean(seg.center));
      cursor = slotEnd + gap;
    } else if (seg.value !== undefined) {
      const w = totalWeight > 0 ? (avail * (seg.weight ?? 1)) / totalWeight : avail;
      const slotEnd = cursor + w;
      drawSlotValue(doc, seg.value || '', cursor, slotEnd, y, Boolean(seg.center));
      cursor = slotEnd + gap;
    }
  });
}

function drawScissorIcon(doc: jsPDF, cx: number, cy: number) {
  // Mask dots behind scissor icon
  doc.setFillColor(255, 255, 255);
  doc.rect(cx - 2.6, cy - 2.0, 5.2, 4.0, 'F');

  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.28);
  // Two handles (circles)
  doc.circle(cx - 1.2, cy - 0.85, 0.58, 'S');
  doc.circle(cx - 1.2, cy + 0.85, 0.58, 'S');
  // Crossed blades
  doc.line(cx - 0.7, cy - 0.45, cx + 1.8, cy + 0.85);
  doc.line(cx - 0.7, cy + 0.45, cx + 1.8, cy - 0.85);
}

function drawScissorCutLine(doc: jsPDF, y: number) {
  drawDottedLine(doc, MARGIN_L, MARGIN_R, y);
  const count = 6;
  const step = CONTENT_W / (count + 1);
  for (let i = 1; i <= count; i++) {
    drawScissorIcon(doc, MARGIN_L + step * i, y);
  }
}

export function generateSonaliPdf(
  formType: FormType,
  sender: SenderFormData,
  receiver: ReceiverFormData
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isBEFTN = formType === 'BEFTN';
  const amountText = sender.amount.trim() ? `${sender.amount.trim()}/-` : '';
  const recvAmtRaw = receiver.receiverAmount.trim() || sender.amount.trim();
  const recvAmountText = recvAmtRaw ? `${recvAmtRaw}/-` : '';
  const ackWords = sender.amountWords.trim() || receiver.receiverAmountWords.trim();

  const rtgsAckBranch =
    receiver.receivingBranch.trim() && receiver.district.trim()
      ? `${receiver.receivingBranch.trim()},${receiver.district.trim()}`
      : receiver.receivingBranch.trim();
  const ackBranchDisplay = isBEFTN ? receiver.receivingBranch.trim() : rtgsAckBranch;

  // 1. Centered Logo (459x132 aspect ratio -> 64mm x 18.4mm)
  try {
    doc.addImage(SONALI_BANK_LOGO_URI, 'PNG', 73, 8.5, 64, 18.4);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Sonali Bank Limited', 105, 19, { align: 'center' });
  }

  // BEFTN Top-Right Sys No. box
  if (isBEFTN) {
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.25);
    doc.rect(148, 12, 46, 13.5);
    doc.setDrawColor(51, 51, 51);
    doc.line(152, 19.5, 190, 19.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(34, 34, 34);
    doc.text("Sys no. (Bank's use only)", 171, 23.2, { align: 'center' });
  }

  // 2. Title
  drawUnderlinedText(
    doc,
    isBEFTN
      ? 'BEFTN Outward (Credit) Application Form'
      : 'RTGS Application Form',
    105,
    30.5,
    13,
    'center'
  );

  // 3. Date & Salutation
  drawFormRow(
    doc,
    [{ label: 'Date:', value: sender.date, fixedWidth: 30 }],
    39.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(17, 17, 17);
  doc.text('The Manager,', MARGIN_L, 46.5);

  drawFormRow(
    doc,
    [
      { value: sender.branch, fixedWidth: 48, center: true },
      { label: 'Branch' },
    ],
    53.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(17, 17, 17);
  doc.text('Dear Sir,', MARGIN_L, 61.5);

  const reqText = `I/We would like to request you to arrange fund transfer through ${formType} facility as per receiver details/attached documents by debiting my/our below mentioning account maintaining with your branch with applicable charge & Government Taxes.`;
  const reqLines = doc.splitTextToSize(reqText, CONTENT_W) as string[];
  doc.text(reqLines, MARGIN_L, 66.2, { lineHeightFactor: 1.38 });

  // 4. Sender Details
  drawUnderlinedText(doc, 'Sender Details :', MARGIN_L, 84, 9.5);

  drawFormRow(
    doc,
    [
      { label: 'Account Number:', value: sender.accountNumber, weight: 0.95 },
      { label: 'Account Title:', value: sender.accountTitle, weight: 1.45 },
    ],
    90.5
  );

  drawFormRow(
    doc,
    [
      { label: 'Amount:', value: amountText, weight: 0.36 },
      { label: 'Amount in words:', value: sender.amountWords, weight: 2.4 },
    ],
    97
  );

  const chequeRow: RowSegment[] = [
    { label: 'Cheque no:', value: sender.chequeNo, weight: 0.62 },
  ];
  if (isBEFTN) {
    chequeRow.push({ label: '(If applicable)' });
  }
  chequeRow.push({
    label: "Account Holder's Mobile No:",
    value: sender.mobileNo,
    weight: 1.15,
  });
  drawFormRow(doc, chequeRow, 103.5);

  drawFormRow(
    doc,
    [{ label: "Account Holder's Branch Name:", value: sender.branchName, weight: 1 }],
    110
  );

  if (isBEFTN) {
    // BEFTN: Signature + For Bank's use only (4-cell) right after Sender Details
    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.28);
    doc.line(146, 122.5, MARGIN_R, 122.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Signature of Account Holder(s)', 170, 126, { align: 'center' });

    drawUnderlinedText(doc, "For Bank's use only", 105, 132.5, 9.2, 'center');

    // Dashed 2-col box
    drawDashedLine(doc, MARGIN_L, 135.5, MARGIN_R, 135.5);
    drawDashedLine(doc, MARGIN_L, 169.5, MARGIN_R, 169.5);
    drawDashedLine(doc, MARGIN_L, 135.5, MARGIN_L, 169.5);
    drawDashedLine(doc, MARGIN_R, 135.5, MARGIN_R, 169.5);
    drawDashedLine(doc, 105, 135.5, 105, 169.5);

    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    // Left col signatures
    doc.line(35, 148, 86, 148);
    doc.text('Account debited by', 60.5, 151.5, { align: 'center' });
    doc.line(35, 163, 86, 163);
    doc.text('Authorized By', 60.5, 166.5, { align: 'center' });
    // Right col signatures
    doc.line(124, 148, 175, 148);
    doc.text('BEFTN Originated by', 149.5, 151.5, { align: 'center' });
    doc.line(124, 163, 175, 163);
    doc.text('BEFTN verified by', 149.5, 166.5, { align: 'center' });

    // 5. Receiver's Details (BEFTN)
    drawUnderlinedText(doc, "Receiver's Details:", MARGIN_L, 178.5, 9.5);

    drawFormRow(
      doc,
      [
        { label: 'Receiving Bank :', value: receiver.receivingBank, weight: 1.15 },
        { label: 'District:', value: receiver.district, weight: 0.65 },
        { label: 'Receiving Branch:', value: receiver.receivingBranch, weight: 1.05 },
      ],
      184.5
    );

    drawFormRow(
      doc,
      [
        { label: 'Routing Number:', value: receiver.routingNumber, weight: 0.75 },
        {
          label: "Receiver's Account Number:",
          value: receiver.receiverAccountNumber,
          weight: 1.25,
        },
      ],
      191
    );

    drawFormRow(
      doc,
      [
        { label: "Receiver's Name:", value: receiver.receiverName, weight: 1.55 },
        { label: 'Amount:', value: recvAmountText, weight: 0.55 },
      ],
      197.5
    );

    drawFormRow(
      doc,
      [
        { label: 'Amount is words :', value: receiver.receiverAmountWords, weight: 2.1 },
        { label: "Receiver's Mobile No:", value: receiver.receiverMobile, weight: 0.42 },
      ],
      204
    );

    drawFormRow(
      doc,
      [{ label: 'Purpose of Transaction :', value: receiver.purpose, weight: 1 }],
      210.5
    );

    // 6. Scissor Cut Line
    drawScissorCutLine(doc, 219.5);

    // 7. Acknowledgement Box (BEFTN)
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.35);
    doc.rect(MARGIN_L, 227, CONTENT_W, 54);

    drawUnderlinedText(doc, 'ACKNOWLEDGEMENT', 105, 233, 9.8, 'center');

    drawFormRow(
      doc,
      [{ label: 'Dated', value: sender.date, fixedWidth: 30 }],
      240,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: 'Acknowledge that Sonali Bank Limited,', value: sender.branch, weight: 1.15, center: true },
        { label: 'Branch has debited Tk.', value: amountText, weight: 0.55 },
      ],
      247,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: '(In words', value: ackWords, weight: 2.1 },
        { label: ') from account number', value: sender.accountNumber, weight: 0.58 },
        { label: 'For BEFTN to' },
      ],
      254,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: 'Account number', value: receiver.receiverAccountNumber, weight: 0.85 },
        { label: 'of', value: receiver.receivingBank, weight: 0.85 },
        { label: 'Bank of', value: ackBranchDisplay, weight: 0.95 },
        { label: 'Branch.' },
      ],
      261,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.line(25, 273.5, 72, 273.5);
    doc.text('Authorized Signature', 48.5, 277, { align: 'center' });
    doc.line(138, 273.5, 185, 273.5);
    doc.text('Authorized Signature', 161.5, 277, { align: 'center' });
  } else {
    // RTGS: Receiver's Details immediately after Sender Details
    drawUnderlinedText(doc, "Receiver's Details:", MARGIN_L, 119.5, 9.5);

    drawFormRow(
      doc,
      [
        { label: 'Receiving Bank :', value: receiver.receivingBank, weight: 1.0 },
        { label: 'Receiving Branch:', value: receiver.receivingBranch, weight: 1.05 },
        { label: 'District:', value: receiver.district, weight: 0.65 },
      ],
      125.5
    );

    drawFormRow(
      doc,
      [
        { label: 'Routing Number:', value: receiver.routingNumber, weight: 0.75 },
        {
          label: 'Receiving Account Number:',
          value: receiver.receiverAccountNumber,
          weight: 1.25,
        },
      ],
      132
    );

    drawFormRow(
      doc,
      [
        { label: "Receiver's Name:", value: receiver.receiverName, weight: 1.55 },
        { label: 'Amount:', value: recvAmountText, weight: 0.55 },
      ],
      138.5
    );

    drawFormRow(
      doc,
      [
        { label: 'Amount is words :', value: receiver.receiverAmountWords, weight: 2.1 },
        { label: "Receiver's Mobile No:", value: receiver.receiverMobile, weight: 0.42 },
      ],
      145
    );

    drawFormRow(
      doc,
      [{ label: 'Purpose of Transaction :', value: receiver.purpose, weight: 1 }],
      151.5
    );

    drawDottedLine(doc, MARGIN_L, MARGIN_R, 158.5);

    // Signature of Account Holder(s)
    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.28);
    doc.line(146, 170.5, MARGIN_R, 170.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Signature of Account Holder(s)', 170, 174, { align: 'center' });

    // For Bank's use only (2-col)
    drawUnderlinedText(doc, "For Bank's use only", 105, 180.5, 9.2, 'center');

    drawDashedLine(doc, MARGIN_L, 183.5, MARGIN_R, 183.5);
    drawDashedLine(doc, MARGIN_L, 203.5, MARGIN_R, 203.5);
    drawDashedLine(doc, MARGIN_L, 183.5, MARGIN_L, 203.5);
    drawDashedLine(doc, MARGIN_R, 183.5, MARGIN_R, 203.5);
    drawDashedLine(doc, 105, 183.5, 105, 203.5);

    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.line(35, 196.5, 86, 196.5);
    doc.text('Originated by', 60.5, 200, { align: 'center' });
    doc.line(124, 196.5, 175, 196.5);
    doc.text('Authorised by', 149.5, 200, { align: 'center' });

    // Manager signature line
    doc.line(146, 215, MARGIN_R, 215);
    doc.text('Manager', 170, 218.5, { align: 'center' });

    // Scissor Cut Line
    drawScissorCutLine(doc, 224.5);

    // Acknowledgement Box (RTGS)
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.35);
    doc.rect(MARGIN_L, 231, CONTENT_W, 52);

    drawUnderlinedText(doc, 'ACKNOWLEDGEMENT', 105, 237, 9.8, 'center');

    drawFormRow(
      doc,
      [{ label: 'Dated', value: sender.date, fixedWidth: 30 }],
      244,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: 'Acknowledge that Sonali Bank Limited,', value: sender.branch, weight: 1.15, center: true },
        { label: 'Branch has debited Tk.', value: amountText, weight: 0.55 },
      ],
      251,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: 'In words', value: ackWords, weight: 2.1 },
        { label: 'from account number', value: sender.accountNumber, weight: 0.58 },
        { label: 'For RTGS to' },
      ],
      258,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    drawFormRow(
      doc,
      [
        { label: 'Account number', value: receiver.receiverAccountNumber, weight: 0.85 },
        { label: 'of', value: receiver.receivingBank, weight: 0.85 },
        { label: 'Bank of', value: ackBranchDisplay, weight: 0.95 },
        { label: 'Branch.' },
      ],
      265,
      MARGIN_L + 4,
      MARGIN_R - 4,
      9
    );

    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.line(25, 276.5, 72, 276.5);
    doc.text('Officer', 48.5, 280, { align: 'center' });
    doc.line(138, 276.5, 185, 276.5);
    doc.text('Manager', 161.5, 280, { align: 'center' });
  }

  const safeAmt = sender.amount.trim().replace(/[^\d.]/g, '') || 'Form';
  const safeDate = sender.date.trim().replace(/[^\d-]/g, '') || 'Date';
  doc.save(`Sonali_Bank_${formType}_${safeAmt}_${safeDate}.pdf`);
}
