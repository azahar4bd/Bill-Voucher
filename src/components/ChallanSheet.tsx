import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileDown, FileText, Printer, Settings2 } from 'lucide-react';
import {
  amountInWordsBengali,
  formatBengaliTaka,
  toBengaliDigits,
} from '../data/bengaliUtils';
import {
  CHALLAN_ROW_MAPPINGS,
  ChallanSheetData,
  computeMonthlyVoucherRow,
  DEFAULT_TAX_CHALLAN_DATA,
  DEFAULT_VAT_CHALLAN_DATA,
  findMatchingMonthlyVoucherRow,
  MONTH_OPTIONS,
  MonthlyVoucherSheetData,
} from '../data/sheetsDefaults';
import { SearchableSelect } from './SearchableSelect';

export type ChallanMode = 'VAT' | 'TAX';

interface ComputedChallanRow {
  key: string;
  bnLabel: string;
  baseAmount: number;
  rate: string;
  challanAmount: number;
}

export function computeChallanFromMonthlyVoucher(
  mode: ChallanMode,
  monthlyVoucherData: MonthlyVoucherSheetData
) {
  const rows: ComputedChallanRow[] = CHALLAN_ROW_MAPPINGS.map((mapping) => {
    const mvRow = findMatchingMonthlyVoucherRow(monthlyVoucherData.rows, mapping);
    if (!mvRow) {
      return {
        key: mapping.key,
        bnLabel: mapping.bnLabel,
        baseAmount: 0,
        rate: mode === 'VAT' ? mapping.defaultVatRate : mapping.defaultTaxRate,
        challanAmount: 0,
      };
    }

    const calc = computeMonthlyVoucherRow(mvRow);
    const activeRate =
      mode === 'VAT'
        ? mvRow.vatRate.trim() || mapping.defaultVatRate
        : mvRow.taxRate.trim() || mapping.defaultTaxRate;

    const computedAmt =
      mode === 'VAT'
        ? mvRow.vatRate.trim() !== '' || mvRow.vatManual.trim() !== ''
          ? calc.vat
          : Math.round((calc.taxVatCalcBase * Number(mapping.defaultVatRate)) / 100)
        : mvRow.taxRate.trim() !== '' || mvRow.taxManual.trim() !== ''
        ? calc.tax
        : Math.round((calc.taxVatCalcBase * Number(mapping.defaultTaxRate)) / 100);

    return {
      key: mapping.key,
      bnLabel: mapping.bnLabel,
      baseAmount: calc.taxVatCalcBase,
      rate: activeRate,
      challanAmount: computedAmt,
    };
  });

  const totalAmount = rows.reduce((sum, r) => sum + r.challanAmount, 0);
  const wordsBn = amountInWordsBengali(totalAmount);

  return { rows, totalAmount, wordsBn };
}

interface ChallanPrintViewProps {
  mode: ChallanMode;
  data: ChallanSheetData;
  monthlyVoucherData: MonthlyVoucherSheetData;
}

export const ChallanPrintView: React.FC<ChallanPrintViewProps> = ({
  mode,
  data,
  monthlyVoucherData,
}) => {
  const { rows, totalAmount, wordsBn } = useMemo(
    () => computeChallanFromMonthlyVoucher(mode, monthlyVoucherData),
    [mode, monthlyVoucherData]
  );

  // Exact digit groupings from user's TR Form 6 PDFs:
  // VAT: 1 | 4 | 4 | 4 | 6 (19 digits)
  // TAX: 1 | 4 | 4 | 4 | 7 (20 digits)
  const groupSizes = mode === 'VAT' ? [1, 4, 4, 4, 6] : [1, 4, 4, 4, 7];
  const groups: string[][] = [];
  let cursor = 0;
  groupSizes.forEach((size) => {
    groups.push(
      Array.from({ length: size }, (_, i) => {
        const raw = data.codeDigits[cursor + i] ?? '';
        return raw ? toBengaliDigits(raw) : '';
      })
    );
    cursor += size;
  });

  const modeWord = mode === 'VAT' ? 'ভ্যাট' : 'ট্যাক্স';
  const dateDisplay = data.date.trim() ? `${toBengaliDigits(data.date.trim())} ইং` : '';

  return (
    <div
      className="sheet-a4-landscape"
      style={{
        width: '297mm',
        minHeight: '210mm',
        padding: '7mm 10mm 6mm 10mm',
        backgroundColor: '#ffffff',
        color: '#111111',
        fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif",
        boxSizing: 'border-box',
        lineHeight: 1.25,
      }}
    >
      {/* Top Copy Strip & Title */}
      <div style={{ position: 'relative', marginBottom: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15pt', fontWeight: 700, color: '#111111' }}>চালান ফরম</div>
          <div style={{ fontSize: '10.5pt', fontWeight: 500, color: '#111111', marginTop: '2px' }}>
            টি, আর ফরম নং ৬ (এস, আর, ৩৭ দ্রষ্টব্য)
          </div>
        </div>

        <table
          style={{
            position: 'absolute',
            right: '36mm',
            top: '0',
            borderCollapse: 'collapse',
            fontSize: '8.5pt',
            color: '#111111',
            backgroundColor: '#ffffff',
          }}
        >
          <tbody>
            <tr>
              <td style={{ border: '1px solid #111111', padding: '2px 7px' }}>১ম (মূল) কপি</td>
              <td style={{ border: '1px solid #111111', padding: '2px 7px' }}>২য় কপি</td>
              <td style={{ border: '1px solid #111111', padding: '2px 7px' }}>৩য় কপি</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Challan No & Manual Date Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '9.5pt',
          marginTop: '4px',
          marginBottom: '2px',
          paddingLeft: '4px',
          paddingRight: '26mm',
        }}
      >
        <div>
          চালান নং{' '}
          {data.challanNo.trim() ? (
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              {toBengaliDigits(data.challanNo.trim())}
            </span>
          ) : (
            <span>..................................................</span>
          )}
        </div>
        <div>
          তারিখ:{' '}
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            {dateDisplay || '............................ ইং'}
          </span>
        </div>
      </div>

      {/* Bank / Branch Center Subtitle */}
      <div style={{ textAlign: 'center', fontSize: '9.5pt', marginBottom: '6px' }}>
        বাংলাদেশ ব্যাংক/সোনালী ব্যাংকের{' '}
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {data.district || 'নড়াইল'}
        </span>{' '}
        জেলার,{' '}
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {data.branch || 'গোবরা'}
        </span>{' '}
        শাখায় টাকা জমা দেওয়ার চালান
      </div>

      {/* Code No Boxes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '7px',
          paddingLeft: '8px',
        }}
      >
        <span style={{ fontSize: '10.5pt', fontWeight: 700, marginRight: '4px' }}>কোড নং</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {groups.map((grp, gIdx) => (
            <div key={gIdx} style={{ display: 'flex' }}>
              {grp.map((digit, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    width: '30px',
                    height: '28px',
                    border: '1.2px solid #111111',
                    marginLeft: dIdx > 0 ? '-1.2px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12pt',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#111111',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Challan Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontSize: '8.4pt',
          color: '#111111',
          backgroundColor: '#ffffff',
        }}
      >
        <colgroup>
          <col style={{ width: '13.5%' }} />
          <col style={{ width: '20.5%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '6.5%' }} />
          <col style={{ width: '4.5%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th
              colSpan={4}
              style={{
                border: '1px solid #111111',
                padding: '3px 6px',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              জমা প্রদানকারী কর্তৃক পূরণ করিতে হইবে
            </th>
            <th
              colSpan={2}
              style={{
                border: '1px solid #111111',
                padding: '3px 4px',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              টাকার অংক
            </th>
            <th
              rowSpan={2}
              style={{
                border: '1px solid #111111',
                padding: '3px 6px',
                textAlign: 'center',
                fontWeight: 500,
                verticalAlign: 'middle',
                lineHeight: 1.25,
              }}
            >
              বিভাগের নাম এবং চালানের
              <br />
              পৃষ্ঠাংকনকারী কর্মকর্তার
              <br />
              নাম, পদবী ও দপ্তর
            </th>
          </tr>
          <tr>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 5px',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.25,
              }}
            >
              যাহার মারফত প্রদত্ত হইল
              <br />
              তাহার নাম ও ঠিকানা
            </th>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 5px',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.25,
              }}
            >
              যে ব্যক্তির/প্রতিষ্ঠানের পক্ষ হইতে টাকা
              <br />
              প্রদত্ত হইল তাহার নাম, পদবী ও ঠিকানা।
            </th>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 5px',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              কি বাবদ জমা দেওয়া হইল তাহার বিবরণ
            </th>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 5px',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.25,
              }}
            >
              মুদ্রা ও নোটের
              <br />
              বিবরণ/ড্রাফট, পে-অর্ডার
              <br />
              ও চেকের বিবরণ।
            </th>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 4px',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              টাকা
            </th>
            <th
              style={{
                border: '1px solid #111111',
                padding: '3px 4px',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              পয়সা
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const baseDisplay = formatBengaliTaka(row.baseAmount, true);
            const rateDisplay = toBengaliDigits(row.rate);
            const amtDisplay = formatBengaliTaka(row.challanAmount, true);

            return (
              <tr key={row.key}>
                {idx === 0 && (
                  <>
                    <td
                      rowSpan={rows.length + 1}
                      style={{
                        border: '1px solid #111111',
                        padding: '6px 5px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        lineHeight: 1.45,
                        fontWeight: 600,
                        fontSize: '8.4pt',
                      }}
                    >
                      বন্ধু কল্যাণ ফাউন্ডেশন
                      <br />
                      গোবরা শাখা,নড়াইল
                      <br />
                      মোবাঃ নং-০১৭১১৮৩৮০৭১
                    </td>
                    <td
                      rowSpan={rows.length + 1}
                      style={{
                        border: '1px solid #111111',
                        padding: '6px 7px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        lineHeight: 1.35,
                        fontSize: '8.3pt',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '9.5pt', marginBottom: '6px' }}>
                        BANDHU KALLYAN
                        <br />
                        FOUNDATION
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '8.5pt', marginBottom: '7px' }}>
                        BIN: 004319473-0901
                        <br />
                        TIN: 839527714923
                      </div>
                      <div style={{ fontSize: '8pt', lineHeight: 1.3 }}>
                        P,O: RajGhat,Noapara
                        <br />
                        Municipal Area,Abhaynagar,
                        <br />
                        Jashore, Bangladesh;Noapara
                        <br />
                        PS;Jessore-4761;Bangladesh
                      </div>
                    </td>
                  </>
                )}

                <td
                  style={{
                    border: '1px solid #111111',
                    padding: '2.5px 6px',
                    textAlign: 'left',
                    color: '#dc2626',
                    fontSize: '8.5pt',
                  }}
                >
                  {row.bnLabel}- {baseDisplay} বাবদ {rateDisplay}% {modeWord} জমা
                </td>
                <td
                  style={{
                    border: '1px solid #111111',
                    padding: '2.5px 4px',
                    textAlign: 'center',
                    fontSize: '8.4pt',
                  }}
                >
                  {idx === 0 ? 'নগদ' : ',,'}
                </td>
                <td
                  style={{
                    border: '1px solid #111111',
                    padding: '2.5px 5px',
                    textAlign: 'right',
                    fontWeight: row.challanAmount > 0 ? 700 : 400,
                    fontSize: '8.5pt',
                  }}
                >
                  {amtDisplay}
                </td>
                <td
                  style={{
                    border: '1px solid #111111',
                    padding: '2.5px 4px',
                    textAlign: 'right',
                  }}
                />

                {idx === 0 && (
                  <td
                    rowSpan={rows.length + 1}
                    style={{
                      border: '1px solid #111111',
                      padding: '6px',
                      verticalAlign: 'bottom',
                      textAlign: 'center',
                    }}
                  />
                )}
              </tr>
            );
          })}

          {/* Total Row (মোটঃ) */}
          <tr>
            <td
              style={{
                border: '1px solid #111111',
                padding: '3px 6px',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              মোটঃ
            </td>
            <td style={{ border: '1px solid #111111', padding: '3px 4px' }} />
            <td
              style={{
                border: '1px solid #111111',
                padding: '3px 5px',
                textAlign: 'right',
                fontWeight: 700,
                fontSize: '9pt',
              }}
            >
              {formatBengaliTaka(totalAmount, false)}
            </td>
            <td style={{ border: '1px solid #111111', padding: '3px 4px' }} />
          </tr>

          {/* Bottom 3 summary rows + Manager Signature */}
          <tr>
            <td
              colSpan={6}
              style={{
                border: '1px solid #111111',
                padding: '3px 8px',
                textAlign: 'left',
                fontSize: '8.6pt',
              }}
            >
              কথায়ঃ- <span style={{ fontWeight: 500 }}>{wordsBn}</span>
            </td>
            <td
              rowSpan={3}
              style={{
                border: '1px solid #111111',
                padding: '5px 6px',
                textAlign: 'center',
                verticalAlign: 'bottom',
                fontSize: '8.3pt',
                lineHeight: 1.3,
              }}
            >
              ম্যানেজার
              <br />
              বাংলাদেশ ব্যাংক/সোনালী ব্যাংক
            </td>
          </tr>
          <tr>
            <td
              colSpan={6}
              style={{
                border: '1px solid #111111',
                padding: '3px 8px',
                textAlign: 'left',
                fontSize: '8.5pt',
              }}
            >
              টাকা পাওয়া গেল
            </td>
          </tr>
          <tr>
            <td
              colSpan={6}
              style={{
                border: '1px solid #111111',
                padding: '3px 8px',
                textAlign: 'left',
                fontSize: '8.5pt',
              }}
            >
              তারিখ:{' '}
              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                {dateDisplay || '............................ ইং'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Notes Footer */}
      <div style={{ marginTop: '5px', fontSize: '8pt', lineHeight: 1.35, color: '#111111' }}>
        <div>নোটঃ &nbsp;১। * সংশ্লিষ্ট দপ্তরের সহিত যোগাযোগ করিয়া সঠিক কোর্ড নম্বর জানিয়া লইবেন।</div>
        <div style={{ paddingLeft: '31px' }}>
          ২। * যে সকল ক্ষেত্রে কর্মকর্তা কর্তৃক পৃষ্ঠাংকন প্রযোজন, সে সকল ক্ষেত্রে প্রযোজ্য হইবে।
        </div>
      </div>
    </div>
  );
};

interface ChallanSheetProps {
  mode: ChallanMode;
  data: ChallanSheetData;
  monthlyVoucherData: MonthlyVoucherSheetData;
  onChange: (next: ChallanSheetData) => void;
  onPrint: () => void;
  onSavePdf: () => void;
}

export const ChallanSheet: React.FC<ChallanSheetProps> = ({
  mode,
  data,
  monthlyVoucherData,
  onChange,
  onPrint,
  onSavePdf,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  const summary = useMemo(
    () => computeChallanFromMonthlyVoucher(mode, monthlyVoucherData),
    [mode, monthlyVoucherData]
  );

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const avail = el.clientWidth - 32;
      setScale(Math.min(1, Math.max(0.32, avail / 1122)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const monthOptions = useMemo(
    () => MONTH_OPTIONS.map((m) => ({ value: m, label: m })),
    []
  );

  const title = mode === 'VAT' ? 'VAT Challan (টি, আর ফরম নং ৬)' : 'Tax Challan (টি, আর ফরম নং ৬)';
  const groupSizes = mode === 'VAT' ? [1, 4, 4, 4, 6] : [1, 4, 4, 4, 7];

  const groupedCodeStrings = useMemo(() => {
    const groups: string[] = [];
    let cursor = 0;
    groupSizes.forEach((size) => {
      groups.push(
        Array.from({ length: size }, (_, i) => toBengaliDigits(data.codeDigits[cursor + i] ?? '')).join('')
      );
      cursor += size;
    });
    return groups;
  }, [data.codeDigits, groupSizes]);

  const toEnglishDigits = (str: string) => {
    const map: Record<string, string> = {
      '০': '0',
      '১': '1',
      '২': '2',
      '৩': '3',
      '৪': '4',
      '৫': '5',
      '৬': '6',
      '৭': '7',
      '৮': '8',
      '৯': '9',
    };
    return str.replace(/[০-৯]/g, (d) => map[d] || d);
  };

  const handleGroupCodeChange = (groupIndex: number, rawVal: string) => {
    const cleaned = rawVal.replace(/\s+/g, '');
    const nextDigits = [...data.codeDigits];
    const startIdx = groupSizes.slice(0, groupIndex).reduce((a, b) => a + b, 0);
    const size = groupSizes[groupIndex];
    for (let i = 0; i < size; i++) {
      nextDigits[startIdx + i] = toBengaliDigits(cleaned[i] ?? '');
    }
    onChange({ ...data, codeDigits: nextDigits });
  };

  const formattedCodeBn = groupedCodeStrings.join(' - ');
  const formattedCodeEn = toEnglishDigits(formattedCodeBn);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white border border-[#DCE3DF] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#131C18]">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6962] mt-0.5">
            <span>Monthly Voucher থেকে অটো পূরণকৃত</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#131C18]">
              কোড: {formattedCodeBn} ({formattedCodeEn})
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#006633]">
              মোট {mode === 'VAT' ? 'ভ্যাট' : 'ট্যাক্স'}: {formatBengaliTaka(summary.totalAmount, false)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{summary.wordsBn}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showSettings ? 'সেটিংস বন্ধ করুন' : 'কোড ও শাখা সেটিংস'}</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#131C18] border border-[#B0BEC5] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onSavePdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#006633] hover:bg-[#004E27] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Minimal Manual Entry Bar (Date + Searchable Month Dropdown) */}
      <section className="bg-white border border-[#DCE3DF] rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label
              htmlFor={`challan-date-${mode}`}
              className="block text-xs font-semibold text-[#006633] mb-1.5"
            >
              তারিখ (ম্যানুয়ালি লিখুন) *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#5B6962] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id={`challan-date-${mode}`}
                type="text"
                autoComplete="off"
                value={data.date}
                onChange={(e) => onChange({ ...data, date: e.target.value })}
                placeholder="যেমন: 27/10/2026 অথবা ২৭/১০/২০২৬"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#006633]/50 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006633]/30"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-[#47554E] mb-1.5">
              Month (মাসের নাম)
            </label>
            <SearchableSelect
              options={monthOptions}
              value={data.monthLabel}
              onChange={(val) => onChange({ ...data, monthLabel: val })}
              placeholder="মাস খুঁজুন বা সিলেক্ট করুন..."
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-[#47554E] mb-1.5">
              চালান নং (ঐচ্ছিক)
            </label>
            <input
              type="text"
              autoComplete="off"
              value={data.challanNo}
              onChange={(e) => onChange({ ...data, challanNo: e.target.value })}
              placeholder="ফাঁকা থাকলে ডট লাইন দেখাবে"
              className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
            />
          </div>
        </div>

        {showSettings && (
          <div className="pt-3 border-t border-[#EAEFEF] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-[#47554E] mb-1">জেলা</label>
                <input
                  type="text"
                  value={data.district}
                  onChange={(e) => onChange({ ...data, district: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-[#47554E] mb-1">শাখা</label>
                <input
                  type="text"
                  value={data.branch}
                  onChange={(e) => onChange({ ...data, branch: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#47554E]">
                    কোড নং ({mode === 'VAT' ? '১৯ ডিজিট: ১-১১০২-০৪১০-২০২০-১৪১১০১' : '২০ ডিজিট: ১-১১০২-১৭১০-৩০৮৫-১১১২১০১'})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...data,
                        codeDigits:
                          mode === 'VAT'
                            ? [...DEFAULT_VAT_CHALLAN_DATA.codeDigits]
                            : [...DEFAULT_TAX_CHALLAN_DATA.codeDigits],
                      })
                    }
                    className="text-[11px] font-semibold text-[#006633] hover:underline cursor-pointer"
                  >
                    ডিফল্ট কোড রিসেট
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {groupedCodeStrings.map((grpVal, gIdx) => (
                    <input
                      key={gIdx}
                      type="text"
                      autoComplete="off"
                      maxLength={groupSizes[gIdx]}
                      value={grpVal}
                      onChange={(e) => handleGroupCodeChange(gIdx, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm text-center font-semibold bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Live A4 Landscape Preview */}
      <div ref={previewWrapRef}>
        <div className="bg-white border border-[#DCE3DF] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#EAEFEF] flex items-center justify-between bg-[#FAFBFA]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#131C18]">
              <FileText className="w-4 h-4 text-[#006633]" />
              <span>
                Live A4 Landscape Preview — {mode === 'VAT' ? 'VAT Challan' : 'Tax Challan'}
              </span>
            </div>
            <span className="text-xs font-mono-tabular text-[#5B6962]">
              A4 Landscape · {Math.round(scale * 100)}%
            </span>
          </div>
          <div className="bg-[#E3E8E5] p-4 flex justify-center overflow-x-auto">
            <div
              style={{
                width: `${1122 * scale}px`,
                height: `${794 * scale}px`,
                position: 'relative',
              }}
            >
              <div
                className="origin-top-left shadow-md"
                style={{ width: '297mm', transform: `scale(${scale})` }}
              >
                <ChallanPrintView
                  mode={mode}
                  data={data}
                  monthlyVoucherData={monthlyVoucherData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
