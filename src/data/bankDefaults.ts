export type FormType = 'BEFTN' | 'RTGS';

export interface BankProfile {
  name: string;
  receiving_bank: string;
  district: string;
  receiving_branch: string;
  routing_number: string;
  receiver_account_number: string;
  receiver_name: string;
  receiver_mobile: string;
  purpose: string;
}

export interface SenderFormData {
  date: string;
  branch: string;
  accountNumber: string;
  accountTitle: string;
  amount: string;
  amountWords: string;
  chequeNo: string;
  mobileNo: string;
  branchName: string;
}

export interface ReceiverFormData {
  receivingBank: string;
  district: string;
  receivingBranch: string;
  routingNumber: string;
  receiverAccountNumber: string;
  receiverName: string;
  receiverMobile: string;
  receiverAmount: string;
  receiverAmountWords: string;
  purpose: string;
}

export const STORAGE_KEY_PROFILES = 'bankProfiles';

export const DEFAULT_PROFILES: BankProfile[] = [
  {
    name: 'Bank Asia PLC - Khulna Branch',
    receiving_bank: 'Bank Asia PLC',
    district: 'Khulna',
    receiving_branch: 'Khulna Branch',
    routing_number: '070471548',
    receiver_account_number: '0002536000048',
    receiver_name: 'Bandhu Kallyan Foundation',
    receiver_mobile: '',
    purpose: 'Fund Transfer',
  },
  {
    name: 'Bank Asia PLC - Boro Bazar, Khulna (Gratuity)',
    receiving_bank: 'Bank Asia PLC',
    district: 'Khulna',
    receiving_branch: 'Boro Bazar, Khulna',
    routing_number: '070472163',
    receiver_account_number: '0015636000143',
    receiver_name: 'Bandhu Kallyan Foundation -Gratuity',
    receiver_mobile: '',
    purpose: 'Gratuity Fund Transfer',
  },
  {
    name: 'UCBL PLC - Noapara, Jessore (PF)',
    receiving_bank: 'UCBL PLC',
    district: 'Jessore',
    receiving_branch: 'Noapara',
    routing_number: '245411667',
    receiver_account_number: '0592112000001077',
    receiver_name: 'Bandhu Kallyan Foundation P F',
    receiver_mobile: '',
    purpose: 'PF Fund Transfer',
  },
];

export const DEFAULT_SENDER: Omit<SenderFormData, 'date' | 'amount' | 'amountWords'> = {
  branch: 'Gobra',
  accountNumber: '2502333001396',
  accountTitle: 'Bandhu Kallyan Foundation',
  chequeNo: '',
  mobileNo: '01720597579',
  branchName: 'Gobra',
};

export { SONALI_BANK_LOGO_URI } from './sonaliLogo';

function twoDigits(n: number): string {
  const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const TENS = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function threeDigits(n: number): string {
  const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) parts.push(twoDigits(r));
  return parts.join(' ');
}

export function numberToWords(numInput: string | number): string {
  const cleaned = String(numInput).replace(/,/g, '').trim();
  if (!cleaned) return '';
  let num = parseInt(cleaned, 10);
  if (Number.isNaN(num)) return '';
  if (num === 0) return 'Zero';

  const parts: string[] = [];
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) parts.push(`${numberToWords(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (num) parts.push(threeDigits(num));
  return parts.join(' ');
}

export function amountInWords(amount: string): string {
  const words = numberToWords(amount);
  if (!words) return '';
  const titled = words
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return `${titled} Taka Only`;
}

export function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
