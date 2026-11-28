import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const sender = {
  date: '28-11-2026', branch: 'Gobra', accountNumber: '2502333001396',
  accountTitle: 'Bandhu Kallyan Foundation', amount: '125614',
  amountWords: 'One Lakh Twenty Five Thousand Six Hundred Fourteen Taka Only',
  chequeNo: 'CHQ123', mobileNo: '01720597579', branchName: 'Gobra',
};
const receiver = {
  receivingBank: 'Example Bank PLC', district: 'Khulna', receivingBranch: 'Khulna Branch',
  routingNumber: '070471548', receiverAccountNumber: '1234567890123',
  receiverName: 'Bandhu Kallyan Foundation', receiverMobile: '01720000000',
  receiverAmount: '125614', receiverAmountWords: sender.amountWords, purpose: 'Fund Transfer',
};

test('original template PDF overlays preserve all entries for both forms', async () => {
  const server = await createServer({ configFile: false, base: './', server: { middlewareMode: true } });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const pathname = String(url).replace(/^\.\//, '');
    const data = await readFile(`public/${pathname}`);
    return new Response(data);
  };
  try {
    const { createSonaliTemplatePdf, createSonaliPrintPdf } = await server.ssrLoadModule('/src/utils/sonaliTemplatePdf.ts');
    for (const form of ['BEFTN', 'RTGS']) {
      const result = await createSonaliTemplatePdf(form, sender, receiver);
      const pdf = await PDFDocument.load(result);
      assert.equal(pdf.getPageCount(), 1);
      assert.deepEqual(pdf.getPage(0).getSize(), { width: 612, height: 792 });
      const pdfjs = await getDocument({ data: result.slice(), useSystemFonts: false }).promise;
      const page = await pdfjs.getPage(1);
      const contents = await page.getTextContent();
      const text = contents.items.map((item) => item.str).join(' ');
      for (const value of ['125614/-', sender.amountWords, 'CHQ123', receiver.receivingBank,
        receiver.routingNumber, receiver.receiverAccountNumber, receiver.receiverMobile, receiver.purpose]) {
        assert.ok(text.includes(value), `${form} is missing ${value}`);
      }
      assert.equal((await page.getAnnotations()).length, 0);

      // The iframe print fallback is a separate A4 copy with blank side margins
      // trimmed. All form fields remain present and larger than before.
      const printBytes = await createSonaliPrintPdf(result);
      assert.deepEqual(pdf.getPage(0).getSize(), { width: 612, height: 792 });
      const printable = await PDFDocument.load(printBytes);
      const size = printable.getPage(0).getSize();
      assert.equal(printable.getPageCount(), 1);
      assert.ok(Math.abs(size.width - 595.28) < 0.1 && Math.abs(size.height - 841.89) < 0.1);
      const printDoc = await getDocument({ data: printBytes.slice(), useSystemFonts: false }).promise;
      const printPage = await printDoc.getPage(1);
      const printItems = (await printPage.getTextContent()).items;
      const printText = printItems.map((item) => item.str).join(' ');
      for (const value of ['125614/-', sender.amountWords, receiver.receivingBank, receiver.receiverAccountNumber]) {
        assert.ok(printText.includes(value), `${form} print PDF is missing ${value}`);
      }
      const originalItem = contents.items.find((item) => item.str === sender.accountNumber);
      const printItem = printItems.find((item) => item.str === sender.accountNumber);
      assert.ok(printItem.width > originalItem.width * 0.98, 'print copy must keep text near original size');
      assert.ok(printItem.transform[4] >= 14 && printItem.transform[4] + printItem.width <= size.width - 14);
      await printDoc.destroy();
      await pdfjs.destroy();
    }
    const longWords = 'One Hundred Twenty Three Crore Forty Five Lakh Sixty Seven Thousand Eight Hundred Ninety Taka Only '.repeat(4).trim();
    const result = await createSonaliTemplatePdf('BEFTN', { ...sender, amountWords: longWords }, receiver);
    const doc = await getDocument({ data: result.slice(), useSystemFonts: false }).promise;
    const items = (await (await doc.getPage(1)).getTextContent()).items.filter((item) => item.str === longWords);
    assert.equal(items.length, 2, 'long amount words must remain complete in sender and acknowledgement');
    for (const item of items) {
      const maxX = item.transform[4] > 200 ? 496 : 308;
      assert.ok(item.transform[4] + item.width <= maxX, 'long words overflow their blank');
    }
    await doc.destroy();
    const bengali = await createSonaliTemplatePdf('BEFTN', sender, { ...receiver, receiverName: 'বন্ধু কল্যাণ ফাউন্ডেশন' });
    assert.ok(bengali.length > 0, 'Bengali text should be embedded');
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
