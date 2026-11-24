export type AppPage =
  | 'BEFTN'
  | 'RTGS'
  | 'BILL_PAYMENT'
  | 'BANK_TRANSFER'
  | 'MONTHLY_VOUCHER'
  | 'VAT_CHALLAN'
  | 'TAX_CHALLAN';

export const STORAGE_KEY_BILL_PAYMENT = 'sonaliStudio_billPayment_v2';
export const STORAGE_KEY_BANK_TRANSFER = 'sonaliStudio_bankTransfer_v2';
export const STORAGE_KEY_MONTHLY_VOUCHER = 'sonaliStudio_monthlyVoucher_v3';
export const STORAGE_KEY_VAT_CHALLAN = 'sonaliStudio_vatChallan_v1';
export const STORAGE_KEY_TAX_CHALLAN = 'sonaliStudio_taxChallan_v1';

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseSheetNum(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatSheetNum(num: number, blankIfZero = true): string {
  if (blankIfZero && num === 0) return '';
  return Math.round(num).toLocaleString('en-US');
}

export function formatRawOrComma(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return '';
  const n = parseSheetNum(trimmed);
  if (n === 0 && trimmed !== '0') return trimmed;
  if (n === 0) return '';
  return n.toLocaleString('en-US');
}

/* =========================================================
   SHEET 1: Bill Payment & T,T Summary (All defaults empty/0)
   ========================================================= */
export interface BillPaymentRow {
  id: string;
  name: string;
  vo1: string;
  vo2: string;
  vo3: string;
  vo4: string;
  vo5: string;
  ok: boolean;
}

export interface TTItem {
  id: string;
  label: string;
  amount: string;
}

export interface BillPaymentSheetData {
  title: string;
  monthLabel?: string;
  rows: BillPaymentRow[];
  ttTitle: string;
  ttItems: TTItem[];
  salary: string;
  others: string;
}

export const DEFAULT_BILL_PAYMENT_DATA: BillPaymentSheetData = {
  title: 'Bill Payment',
  monthLabel: '',
  rows: [
    { id: 'bp-1', name: 'Manager SIR', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-2', name: 'Azahar', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-3', name: 'Sakib', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-4', name: 'Monir', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-5', name: 'Minthu', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-6', name: 'Alamgir', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-7', name: 'Radhuni', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-8', name: 'House', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-9', name: 'Dokan', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-10', name: 'Entertainment', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
    { id: 'bp-11', name: 'Etc/Wifi/Electricity/Sakib', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false },
  ],
  ttTitle: 'T,T',
  ttItems: [
    { id: 'tt-1', label: 'Deduction', amount: '' },
    { id: 'tt-2', label: 'S/c', amount: '' },
    { id: 'tt-3', label: 'Stationary', amount: '' },
    { id: 'tt-4', label: 'Gratuity', amount: '' },
    { id: 'tt-5', label: 'Earn Leave', amount: '' },
    { id: 'tt-6', label: 'Vat+Tax', amount: '' },
  ],
  salary: '',
  others: '',
};

/* =========================================================
   SHEET 2: Bank Transfer Breakdown (All amounts empty/0)
   ========================================================= */
export interface BankTransferLineItem {
  id: string;
  description: string;
  amount: string;
  bold?: boolean;
}

export interface BankTransferBlock {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNo: string;
  branchName: string;
  showTotalRow: boolean;
  items: BankTransferLineItem[];
}

export interface BankTransferSheetData {
  monthLabel: string;
  blocks: BankTransferBlock[];
}

export const DEFAULT_BANK_TRANSFER_DATA: BankTransferSheetData = {
  monthLabel: '',
  blocks: [
    {
      id: 'bt-1',
      bankName: 'Bank Asia PLC',
      accountName: 'Bandhu Kallyan Foundation',
      accountNumber: '0002536000048',
      routingNo: '070471548',
      branchName: 'Bank Asia ,Khulna Branch,Khulna',
      showTotalRow: true,
      items: [
        { id: 'bti-1', description: 'Motor Cycle', amount: '' },
        { id: 'bti-2', description: 'Service Charge', amount: '' },
        { id: 'bti-3', description: 'Mobile Loan', amount: '' },
        { id: 'bti-4', description: 'Leave Expense', amount: '' },
        { id: 'bti-5', description: 'Fund', amount: '' },
      ],
    },
    {
      id: 'bt-2',
      bankName: 'Bank Asia PLC',
      accountName: 'Bandhu Kallyan Foundation Gratuity',
      accountNumber: '0015636000143',
      routingNo: '070472163',
      branchName: 'Bank Asia ,Boro Bazar Branch,Khulna',
      showTotalRow: false,
      items: [{ id: 'bti-6', description: 'Gratuity', amount: '', bold: true }],
    },
    {
      id: 'bt-3',
      bankName: 'UCBL PLC',
      accountName: 'Bandhu Kallyan Foundation PF',
      accountNumber: '0592112000001077',
      routingNo: '245411667',
      branchName: 'UCBL PLC ,Noapara Branch ,Noapara, Jashore',
      showTotalRow: true,
      items: [
        { id: 'bti-7', description: 'PF', amount: '' },
        { id: 'bti-8', description: 'PF Loan', amount: '' },
      ],
    },
  ],
};

/* =========================================================
   SHEET 3: Monthly Voucher Statement (Sequential SL, exact formulas)
   ========================================================= */
export interface MonthlyVoucherRow {
  id: string;
  slNo: string;
  particulars: string;
  codeNo: string;
  totalVoucher: string;
  preAmount: string;
  vatRate: string;
  taxRate: string;
  vatManual: string;
  taxManual: string;
  fixedVatTaxBase?: string;
}

export interface MonthlyVoucherSheetData {
  sheetTitle: string;
  monthLabel: string;
  rows: MonthlyVoucherRow[];
}

export const DEFAULT_MONTHLY_VOUCHER_DATA: MonthlyVoucherSheetData = {
  sheetTitle: 'Monthly Voucher Statement',
  monthLabel: '',
  rows: [
    { id: 'mv-1', slNo: '1', particulars: 'Salary & Allowance', codeNo: '5,001', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-2', slNo: '2', particulars: 'Gratuity', codeNo: '7,601', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-3', slNo: '3', particulars: 'Office Rent-Office', codeNo: '6,501', totalVoucher: '', preAmount: '', vatRate: '15', taxRate: '10', vatManual: '', taxManual: '' },
    { id: 'mv-4', slNo: '4', particulars: 'Office Rent-Abashik', codeNo: '6,506', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-5', slNo: '5', particulars: 'Printing & Stationary', codeNo: '6,001', totalVoucher: '', preAmount: '', vatRate: '7.5', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-6', slNo: '6', particulars: 'Postage & Telephone', codeNo: '5,901', totalVoucher: '', preAmount: '', vatRate: '5', taxRate: '5', vatManual: '', taxManual: '', fixedVatTaxBase: '500' },
    { id: 'mv-7', slNo: '7', particulars: 'Fuel & Lubricant', codeNo: '5,601', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-8', slNo: '8', particulars: 'Entertainment', codeNo: '6,801', totalVoucher: '', preAmount: '', vatRate: '7.5', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-9', slNo: '9', particulars: 'Water & Electricity', codeNo: '5,801', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-10', slNo: '10', particulars: 'Photocopy Bill', codeNo: '6,003', totalVoucher: '', preAmount: '', vatRate: '15', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-11', slNo: '11', particulars: 'Miscellaneous Exp.', codeNo: '7,011', totalVoucher: '', preAmount: '', vatRate: '15', taxRate: '10', vatManual: '', taxManual: '' },
    { id: 'mv-12', slNo: '12', particulars: 'Bank charge', codeNo: '5,301', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-13', slNo: '13', particulars: 'Picnic', codeNo: '7,008', totalVoucher: '', preAmount: '', vatRate: '7.5', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-14', slNo: '14', particulars: 'Conveyance', codeNo: '5,103', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-15', slNo: '15', particulars: 'Furniture & Fixture', codeNo: '1,504', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-16', slNo: '16', particulars: 'Electronics Good', codeNo: '1,505', totalVoucher: '', preAmount: '', vatRate: '7.5', taxRate: '7', vatManual: '', taxManual: '' },
    { id: 'mv-17', slNo: '17', particulars: 'Crokeries/ Leave Expense', codeNo: '6004-5101', totalVoucher: '', preAmount: '', vatRate: '5', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-18', slNo: '18', particulars: 'Repair And Maintanance', codeNo: '5,707', totalVoucher: '', preAmount: '', vatRate: '15', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-19', slNo: '19', particulars: 'Legal Expen', codeNo: '6,101', totalVoucher: '', preAmount: '', vatRate: '15', taxRate: '15', vatManual: '', taxManual: '' },
    { id: 'mv-20', slNo: '20', particulars: 'Food Bill', codeNo: '7,012', totalVoucher: '', preAmount: '', vatRate: '7.5', taxRate: '5', vatManual: '', taxManual: '' },
    { id: 'mv-21', slNo: '21', particulars: 'Service Charge Jagoron', codeNo: '5,511', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-22', slNo: '22', particulars: 'Service Charge Agrossor', codeNo: '5,512', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-24', slNo: '23', particulars: 'Service Charge Buniyed', codeNo: '5,513', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-25', slNo: '24', particulars: 'Service Charge Sufolon', codeNo: '5,514', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
    { id: 'mv-29', slNo: '25', particulars: 'MFCE', codeNo: '5,525', totalVoucher: '', preAmount: '', vatRate: '', taxRate: '', vatManual: '', taxManual: '' },
  ],
};

export function resequenceMonthlyVoucherRows(rows: MonthlyVoucherRow[]): MonthlyVoucherRow[] {
  return rows.map((row, idx) => ({
    ...row,
    slNo: String(idx + 1),
  }));
}

/* =========================================================
   SHEET 4 & 5: Treasury Challan (TR Form 6 - VAT & Tax)
   ========================================================= */
export interface ChallanSheetData {
  challanNo: string;
  date: string;
  monthLabel: string;
  district: string;
  branch: string;
  codeDigits: string[];
}

export const DEFAULT_VAT_CHALLAN_DATA: ChallanSheetData = {
  challanNo: '',
  date: '',
  monthLabel: '',
  district: 'নড়াইল',
  branch: 'গোবরা',
  codeDigits: ['১', '১', '১', '০', '২', '০', '৪', '১', '০', '২', '০', '২', '০', '১', '৪', '১', '১', '০', '১'],
};

export const DEFAULT_TAX_CHALLAN_DATA: ChallanSheetData = {
  challanNo: '',
  date: '',
  monthLabel: '',
  district: 'নড়াইল',
  branch: 'গোবরা',
  codeDigits: ['১', '১', '১', '০', '২', '১', '৭', '১', '০', '৩', '০', '৮', '৫', '১', '১', '১', '২', '১', '০', '১'],
};

export interface ChallanMappingItem {
  key: string;
  mvId: string;
  particularAliases: string[];
  codeAliases: string[];
  bnLabel: string;
  defaultVatRate: string;
  defaultTaxRate: string;
  vatSuffixStyle?: 'dash' | 'space';
  taxSuffixStyle?: 'dash' | 'space';
}

export const CHALLAN_ROW_MAPPINGS: ChallanMappingItem[] = [
  {
    key: 'office-rent',
    mvId: 'mv-3',
    particularAliases: ['office rent-office', 'office rent'],
    codeAliases: ['6501'],
    bnLabel: 'অফিস ভাড়া',
    defaultVatRate: '15',
    defaultTaxRate: '10',
  },
  {
    key: 'entertainment',
    mvId: 'mv-8',
    particularAliases: ['entertainment'],
    codeAliases: ['6801'],
    bnLabel: 'আপ্যায়ন',
    defaultVatRate: '7.5',
    defaultTaxRate: '5',
  },
  {
    key: 'photocopy',
    mvId: 'mv-10',
    particularAliases: ['photocopy bill', 'photocopy'],
    codeAliases: ['6003'],
    bnLabel: 'ফটোকপি',
    defaultVatRate: '15',
    defaultTaxRate: '5',
  },
  {
    key: 'printing',
    mvId: 'mv-5',
    particularAliases: ['printing & stationary', 'printing'],
    codeAliases: ['6001'],
    bnLabel: 'প্রিন্টিং',
    defaultVatRate: '7.5',
    defaultTaxRate: '5',
  },
  {
    key: 'internet',
    mvId: 'mv-6',
    particularAliases: ['postage & telephone', 'internet'],
    codeAliases: ['5901'],
    bnLabel: 'ইন্টারনেট',
    defaultVatRate: '5',
    defaultTaxRate: '5',
  },
  {
    key: 'repair',
    mvId: 'mv-18',
    particularAliases: ['repair and maintanance', 'repair'],
    codeAliases: ['5707'],
    bnLabel: 'মেরামত ও সার্ভিসিং',
    defaultVatRate: '15',
    defaultTaxRate: '5',
  },
  {
    key: 'crockeries',
    mvId: 'mv-17',
    particularAliases: ['crokeries/ leave expense', 'crokeries', 'crockeries'],
    codeAliases: ['6004-5101', '6004'],
    bnLabel: 'ক্রোকারিজ',
    defaultVatRate: '5',
    defaultTaxRate: '5',
  },
  {
    key: 'consultant',
    mvId: 'mv-19',
    particularAliases: ['legal expen', 'consultant'],
    codeAliases: ['6101'],
    bnLabel: 'পরামর্শক সেবা',
    defaultVatRate: '15',
    defaultTaxRate: '15',
  },
  {
    key: 'misc',
    mvId: 'mv-11',
    particularAliases: ['miscellaneous exp', 'miscellaneous'],
    codeAliases: ['7011'],
    bnLabel: 'বিবিধ ব্যয়',
    defaultVatRate: '15',
    defaultTaxRate: '10',
  },
  {
    key: 'electronics',
    mvId: 'mv-16',
    particularAliases: ['electronics good', 'electronics'],
    codeAliases: ['1505'],
    bnLabel: 'ইলেকট্রনিক্স গুডস',
    defaultVatRate: '7.5',
    defaultTaxRate: '7',
  },
  {
    key: 'food',
    mvId: 'mv-20',
    particularAliases: ['food bill', 'food'],
    codeAliases: ['7012'],
    bnLabel: 'ফুড বিল',
    defaultVatRate: '7.5',
    defaultTaxRate: '5',
  },
  {
    key: 'picnic',
    mvId: 'mv-13',
    particularAliases: ['picnic'],
    codeAliases: ['7008'],
    bnLabel: 'বনভোজন',
    defaultVatRate: '7.5',
    defaultTaxRate: '5',
  },
];

export function findMatchingMonthlyVoucherRow(
  rows: MonthlyVoucherRow[],
  mapping: ChallanMappingItem
): MonthlyVoucherRow | undefined {
  const byId = rows.find((r) => r.id === mapping.mvId);
  if (byId) return byId;

  const byCode = rows.find((r) => {
    const cleanCode = r.codeNo.replace(/,/g, '').trim().toLowerCase();
    return mapping.codeAliases.some((c) => cleanCode === c || cleanCode.startsWith(c));
  });
  if (byCode) return byCode;

  return rows.find((r) => {
    const cleanName = r.particulars.trim().toLowerCase();
    return mapping.particularAliases.some((p) => cleanName.includes(p));
  });
}

export function fixGratuitySpellingInText(text: string): string {
  return text.replace(/gratyity|graututy/gi, 'Gratuity');
}

export function syncMonthlyVoucherRatesFromChallan(
  rows: MonthlyVoucherRow[],
  overwriteExisting = true
): MonthlyVoucherRow[] {
  return rows.map((row) => {
    const fixedRow: MonthlyVoucherRow = {
      ...row,
      particulars: fixGratuitySpellingInText(row.particulars),
    };
    const matchedMapping = CHALLAN_ROW_MAPPINGS.find((mapping) => {
      if (fixedRow.id === mapping.mvId) return true;
      const cleanCode = fixedRow.codeNo.replace(/,/g, '').trim().toLowerCase();
      if (mapping.codeAliases.some((c) => cleanCode === c || cleanCode.startsWith(c))) {
        return true;
      }
      const cleanName = fixedRow.particulars.trim().toLowerCase();
      return mapping.particularAliases.some((p) => cleanName.includes(p));
    });

    if (!matchedMapping) return fixedRow;

    const nextVatRate =
      overwriteExisting || fixedRow.vatRate.trim() === ''
        ? matchedMapping.defaultVatRate
        : fixedRow.vatRate;
    const nextTaxRate =
      overwriteExisting || fixedRow.taxRate.trim() === ''
        ? matchedMapping.defaultTaxRate
        : fixedRow.taxRate;

    return {
      ...fixedRow,
      vatRate: nextVatRate,
      taxRate: nextTaxRate,
      vatManual: nextVatRate !== '' ? '' : fixedRow.vatManual,
      taxManual: nextTaxRate !== '' ? '' : fixedRow.taxManual,
      fixedVatTaxBase:
        fixedRow.fixedVatTaxBase !== undefined
          ? fixedRow.fixedVatTaxBase
          : matchedMapping.key === 'internet'
          ? '500'
          : undefined,
    };
  });
}

export function computeBillPaymentTotals(data: BillPaymentSheetData) {
  let vo1 = 0;
  let vo2 = 0;
  let vo3 = 0;
  let vo4 = 0;
  let vo5 = 0;
  const rowTotals = data.rows.map((r) => {
    const v1 = parseSheetNum(r.vo1);
    const v2 = parseSheetNum(r.vo2);
    const v3 = parseSheetNum(r.vo3);
    const v4 = parseSheetNum(r.vo4);
    const v5 = parseSheetNum(r.vo5);
    vo1 += v1;
    vo2 += v2;
    vo3 += v3;
    vo4 += v4;
    vo5 += v5;
    return v1 + v2 + v3 + v4 + v5;
  });
  const billTotal = rowTotals.reduce((acc, n) => acc + n, 0);
  const ttTotal = data.ttItems.reduce((acc, item) => acc + parseSheetNum(item.amount), 0);
  const salaryNum = parseSheetNum(data.salary);
  const othersNum = parseSheetNum(data.others);
  const grandTotal = billTotal + ttTotal + salaryNum + othersNum;
  return { rowTotals, vo1, vo2, vo3, vo4, vo5, billTotal, ttTotal, grandTotal };
}

export function computeBankTransferTotals(data: BankTransferSheetData) {
  const blockTotals = data.blocks.map((block) =>
    block.items.reduce((acc, item) => acc + parseSheetNum(item.amount), 0)
  );
  const grandTotal = blockTotals.reduce((acc, n) => acc + n, 0);
  return { blockTotals, grandTotal };
}

export function computeMonthlyVoucherRow(row: MonthlyVoucherRow) {
  const totalVoucher = parseSheetNum(row.totalVoucher);
  const preAmount = parseSheetNum(row.preAmount);
  const baseWithPre = totalVoucher + preAmount;

  const fixedBaseNum = parseSheetNum(row.fixedVatTaxBase);
  const hasFixedBase = Boolean(row.fixedVatTaxBase?.trim()) && fixedBaseNum > 0;
  // When a fixed base (e.g. 500 for Postage & Telephone) is configured and there is an amount (> 0),
  // calculate VAT and Tax on that fixed base regardless of the entered amount.
  const taxVatCalcBase = hasFixedBase && baseWithPre > 0 ? fixedBaseNum : baseWithPre;

  const vatRateNum = parseSheetNum(row.vatRate);
  const taxRateNum = parseSheetNum(row.taxRate);

  const vat =
    row.vatRate.trim() !== ''
      ? Math.round((taxVatCalcBase * vatRateNum) / 100)
      : parseSheetNum(row.vatManual);

  const tax =
    row.taxRate.trim() !== ''
      ? Math.round((taxVatCalcBase * taxRateNum) / 100)
      : parseSheetNum(row.taxManual);

  // Total BEFORE Pre Amount = Total Voucher + VAT + Tax
  const grandTotal = totalVoucher + vat + tax;
  // Total AFTER Pre Amount = Total Voucher + Pre Amount
  const net = baseWithPre;

  return {
    totalVoucher,
    preAmount,
    baseWithPre,
    taxVatCalcBase,
    hasFixedBase,
    fixedBaseNum,
    vatRateNum,
    taxRateNum,
    vat,
    tax,
    grandTotal,
    net,
  };
}

export function computeMonthlyVoucherTotals(rows: MonthlyVoucherRow[]) {
  let sumTotalVoucher = 0;
  let sumPre = 0;
  let sumBaseWithPre = 0;
  let sumVat = 0;
  let sumTax = 0;
  let sumGrandTotal = 0;
  let sumNet = 0;

  const computedRows = rows.map((row) => {
    const c = computeMonthlyVoucherRow(row);
    sumTotalVoucher += c.totalVoucher;
    sumPre += c.preAmount;
    sumBaseWithPre += c.baseWithPre;
    sumVat += c.vat;
    sumTax += c.tax;
    sumGrandTotal += c.grandTotal;
    sumNet += c.net;
    return c;
  });

  return {
    computedRows,
    sumTotalVoucher,
    sumPre,
    sumBaseWithPre,
    sumVat,
    sumTax,
    sumGrandTotal,
    sumNet,
  };
}
