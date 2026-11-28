import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { FormType, ReceiverFormData, SenderFormData } from '../data/bankDefaults';

// Coordinates are in PDF points, measured from the top-left of the supplied
// 612 × 792 pt form. The scanned artwork itself is never redrawn or covered.
interface Slot {
  value: string;
  x: number;
  top: number;
  width: number;
  size?: number;
}

function drawSlot(page: PDFPage, font: PDFFont, slot: Slot) {
  const text = slot.value.replace(/\s+/g, ' ').trim();
  if (!text) return;

  const maxSize = slot.size ?? 9;
  const measuredWidth = font.widthOfTextAtSize(text, maxSize);
  // There is deliberately no lower bound: even unusually long values must
  // stay inside their original blank rather than overlap the form or be cut.
  // Leave a small safety margin for differences between PDF font renderers.
  const size = Math.min(maxSize, maxSize * (slot.width * 0.96) / Math.max(measuredWidth, 1));
  page.drawText(text, {
    x: slot.x,
    y: page.getHeight() - slot.top - size,
    size,
    font,
    color: rgb(0, 0, 1),
  });
}

function getSlots(type: FormType, sender: SenderFormData, receiver: ReceiverFormData): Slot[] {
  const amount = sender.amount.trim() ? `${sender.amount.trim()}/-` : '';
  const receiverAmount = receiver.receiverAmount.trim() || sender.amount.trim();
  const receiverAmountText = receiverAmount ? `${receiverAmount}/-` : '';
  const words = sender.amountWords.trim() || receiver.receiverAmountWords.trim();
  const rtgsBranch = [receiver.receivingBranch.trim(), receiver.district.trim()].filter(Boolean).join(',');
  const slot = (value: string, x: number, top: number, width: number, size = 9): Slot => ({ value, x, top, width, size });

  if (type === 'BEFTN') {
    return [
      slot(sender.date, 110, 112, 64),
      slot(sender.branch, 108, 160, 108),
      slot(sender.accountNumber, 151, 249, 100),
      slot(sender.accountTitle, 309, 250, 188),
      slot(amount, 120, 273, 80),
      slot(sender.amountWords, 270, 269, 226),
      slot(sender.chequeNo, 127, 294, 84),
      slot(sender.mobileNo, 391, 293, 105),
      slot(sender.branchName, 202, 315, 131),
      slot(receiver.receivingBank, 146, 507, 87),
      slot(receiver.district, 267, 506, 75),
      slot(receiver.receivingBranch, 407, 504, 98),
      slot(receiver.routingNumber, 149, 529, 103),
      slot(receiver.receiverAccountNumber, 357, 525, 149),
      slot(receiver.receiverName, 151, 549, 222),
      slot(receiverAmountText, 411, 545, 96),
      slot(receiver.receiverAmountWords, 151, 565, 185),
      slot(receiver.receiverMobile, 415, 566, 91),
      slot(receiver.purpose, 171, 588, 334),
      slot(sender.date, 119, 645, 52),
      slot(sender.branch, 231, 667, 116),
      slot(amount, 437, 664, 58),
      slot(words, 128, 685, 180, 8),
      slot(sender.accountNumber, 393, 686, 63, 8),
      slot(receiver.receiverAccountNumber, 154, 710, 94),
      slot(receiver.receivingBank, 261, 710, 85),
      slot(receiver.receivingBranch, 380, 708, 97),
    ];
  }

  return [
    slot(sender.date, 105, 85, 63),
    slot(sender.branch, 108, 132, 104),
    slot(sender.accountNumber, 150, 226, 96),
    slot(sender.accountTitle, 300, 227, 193),
    slot(amount, 110, 247, 84),
    slot(sender.amountWords, 260, 247, 231),
    slot(sender.chequeNo, 119, 273, 103),
    slot(sender.mobileNo, 332, 272, 157),
    slot(sender.branchName, 190, 294, 301),
    slot(receiver.receivingBank, 136, 328, 88),
    slot(receiver.receivingBranch, 291, 326, 101),
    slot(receiver.district, 426, 329, 75),
    slot(receiver.routingNumber, 137, 348, 108),
    slot(receiver.receiverAccountNumber, 345, 351, 154),
    slot(receiver.receiverName, 135, 369, 228),
    slot(receiverAmountText, 412, 375, 86),
    slot(receiver.receiverAmountWords, 140, 388, 185, 8),
    slot(receiver.receiverMobile, 407, 394, 91),
    slot(receiver.purpose, 162, 411, 333),
    slot(sender.date, 102, 652, 54),
    slot(sender.branch, 216, 671, 117),
    slot(amount, 423, 671, 60),
    slot(words, 108, 689, 176, 8),
    slot(sender.accountNumber, 373, 694, 63, 8),
    slot(receiver.receiverAccountNumber, 136, 713, 96),
    slot(receiver.receivingBank, 248, 716, 84),
    slot(rtgsBranch, 367, 715, 96),
  ];
}

const templateCache = new Map<FormType, Promise<ArrayBuffer>>();
let bengaliFontBytes: Promise<ArrayBuffer> | undefined;

function getBengaliFont(): Promise<ArrayBuffer> {
  if (!bengaliFontBytes) {
    bengaliFontBytes = fetch(`${import.meta.env.BASE_URL}fonts/HindSiliguri-Regular.ttf`).then((response) => {
      if (!response.ok) throw new Error('বাংলা ফন্ট পাওয়া যায়নি।');
      return response.arrayBuffer();
    });
    bengaliFontBytes.catch(() => { bengaliFontBytes = undefined; });
  }
  return bengaliFontBytes;
}

async function getTemplate(type: FormType): Promise<ArrayBuffer> {
  let pending = templateCache.get(type);
  if (!pending) {
    const url = `${import.meta.env.BASE_URL}templates/sonali-${type.toLowerCase()}.pdf`;
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error('মূল PDF টেমপ্লেট পাওয়া যায়নি।');
      return response.arrayBuffer();
    });
    templateCache.set(type, pending);
    pending.catch(() => templateCache.delete(type));
  }
  return pending;
}

export async function createSonaliTemplatePdf(
  type: FormType,
  sender: SenderFormData,
  receiver: ReceiverFormData,
): Promise<Uint8Array> {
  // PDFDocument.load and save operate on a fresh copy, not the original file.
  const source = await getTemplate(type);
  const pdf = await PDFDocument.load(source.slice(0));
  const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const slots = getSlots(type, sender, receiver);
  let bengaliFont: PDFFont | undefined;
  if (slots.some((slot) => /[\u0980-\u09ff]/.test(slot.value))) {
    await import('regenerator-runtime/runtime');
    const { default: fontkit } = await import('@pdf-lib/fontkit');
    pdf.registerFontkit(fontkit);
    bengaliFont = await pdf.embedFont(await getBengaliFont(), { subset: true });
  }
  try {
    for (const slot of slots) {
      const useBengali = /[\u0980-\u09ff]/.test(slot.value);
      if (useBengali && bengaliFont) {
        const supported = new Set(bengaliFont.getCharacterSet());
        if ([...slot.value].some((char) => !/\s/.test(char) && !supported.has(char.codePointAt(0)!))) {
          throw new Error('Unsupported character');
        }
      }
      drawSlot(page, useBengali && bengaliFont ? bengaliFont : font, slot);
    }
  } catch (error) {
    console.error('Cannot write a form field to PDF', error);
    throw new Error('কিছু অক্ষর PDF ফর্মে সমর্থিত নয়। বাংলা বা ইংরেজি অক্ষর ও সংখ্যা ব্যবহার করুন।');
  }
  return pdf.save();
}

export async function renderSonaliPdfPreview(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  // PDF.js transfers its input to the worker; preserve the bytes used for saving.
  const task = pdfjs.getDocument({ data: bytes.slice() });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    // A 3× raster keeps the scanned form legible when sent to a printer.
    const viewport = page.getViewport({ scale: 3 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PDF প্রিভিউ তৈরি করা যায়নি।');
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  } finally {
    await task.destroy();
  }
}

export function downloadSonaliPdf(bytes: Uint8Array, type: FormType): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}_Application.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
