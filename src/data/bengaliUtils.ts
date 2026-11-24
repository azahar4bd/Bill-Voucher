const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

export function formatBengaliTaka(amount: number, showDashIfZero = true): string {
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return showDashIfZero ? '/-' : '০/-';
  }
  return `${toBengaliDigits(rounded)}/-`;
}

const ONES_TENS_BN: string[] = [
  'শূন্য',
  'এক',
  'দুই',
  'তিন',
  'চার',
  'পাঁচ',
  'ছয়',
  'সাত',
  'আট',
  'নয়',
  'দশ',
  'এগারো',
  'বারো',
  'তেরো',
  'চৌদ্দ',
  'পনেরো',
  'ষোলো',
  'সতেরো',
  'আঠারো',
  'উনিশ',
  'বিশ',
  'একুশ',
  'বাইশ',
  'তেইশ',
  'চব্বিশ',
  'পঁচিশ',
  'ছাব্বিশ',
  'সাতাশ',
  'আটাশ',
  'ঊনত্রিশ',
  'ত্রিশ',
  'একত্রিশ',
  'বত্রিশ',
  'তেত্রিশ',
  'চৌত্রিশ',
  'পঁয়ত্রিশ',
  'ছত্রিশ',
  'সাঁইত্রিশ',
  'আটত্রিশ',
  'ঊনচল্লিশ',
  'চল্লিশ',
  'একচল্লিশ',
  'বিয়াল্লিশ',
  'তেতাল্লিশ',
  'চুয়াল্লিশ',
  'পঁয়তাল্লিশ',
  'ছেচল্লিশ',
  'সাতচল্লিশ',
  'আটচল্লিশ',
  'ঊনপঞ্চাশ',
  'পঞ্চাশ',
  'একান্ন',
  'বায়ান্ন',
  'তিপ্পান্ন',
  'চুয়ান্ন',
  'পঞ্চান্ন',
  'ছাপ্পান্ন',
  'সাতান্ন',
  'আটান্ন',
  'ঊনষাট',
  'ষাট',
  'একষট্টি',
  'বাষট্টি',
  'তেষট্টি',
  'চৌষট্টি',
  'পঁয়ষট্টি',
  'ছেষট্টি',
  'সাতষট্টি',
  'আটষট্টি',
  'ঊনসত্তর',
  'সত্তর',
  'একাত্তর',
  'বাহাত্তর',
  'তিয়াত্তর',
  'চুয়াত্তর',
  'পঁচাত্তর',
  'ছিয়াত্তর',
  'সাতাত্তর',
  'আটাত্তর',
  'ঊনআশি',
  'আশি',
  'একাশি',
  'বিরাশি',
  'তিরাশি',
  'চুরাশি',
  'পঁচাশি',
  'ছিয়াশি',
  'সাতাশি',
  'আটাশি',
  'ঊননব্বই',
  'নব্বই',
  'একানব্বই',
  'বিরানব্বই',
  'তিরানব্বই',
  'চুরানব্বই',
  'পঁচানব্বই',
  'ছিয়ানব্বই',
  'সাতানব্বই',
  'আটানব্বই',
  'নিরানব্বই',
];

function convertIntegerToBengali(n: number): string {
  if (n === 0) return '';
  if (n < 100) return ONES_TENS_BN[n];

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  const remAfterCrore = n % 10000000;
  if (crore > 0) {
    parts.push(`${convertIntegerToBengali(crore)} কোটি`);
  }

  const lakh = Math.floor(remAfterCrore / 100000);
  const remAfterLakh = remAfterCrore % 100000;
  if (lakh > 0) {
    parts.push(`${ONES_TENS_BN[lakh]} লক্ষ`);
  }

  const thousand = Math.floor(remAfterLakh / 1000);
  const remAfterThousand = remAfterLakh % 1000;
  if (thousand > 0) {
    parts.push(`${ONES_TENS_BN[thousand]} হাজার`);
  }

  const hundred = Math.floor(remAfterThousand / 100);
  const lastTwo = remAfterThousand % 100;
  if (hundred > 0) {
    parts.push(`${ONES_TENS_BN[hundred]}শত`);
  }
  if (lastTwo > 0) {
    parts.push(ONES_TENS_BN[lastTwo]);
  }

  return parts.join(' ').trim();
}

export function amountInWordsBengali(amount: number): string {
  const rounded = Math.round(amount);
  if (!Number.isFinite(rounded) || rounded <= 0) {
    return 'শূন্য টাকা মাত্র';
  }
  return `${convertIntegerToBengali(rounded)} টাকা মাত্র`;
}
