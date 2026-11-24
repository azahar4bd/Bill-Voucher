import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileDown,
  FileText,
  GripVertical,
  ListOrdered,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  CHALLAN_ROW_MAPPINGS,
  computeMonthlyVoucherRow,
  computeMonthlyVoucherTotals,
  DEFAULT_MONTHLY_VOUCHER_DATA,
  formatSheetNum,
  MONTH_OPTIONS,
  MonthlyVoucherRow,
  MonthlyVoucherSheetData,
  resequenceMonthlyVoucherRows,
  syncMonthlyVoucherRatesFromChallan,
} from '../data/sheetsDefaults';
import { SearchableSelect } from './SearchableSelect';

interface MonthlyVoucherPrintViewProps {
  data: MonthlyVoucherSheetData;
}

/* =========================================================
   PRINT VIEW: Strictly 7 columns as requested:
   SL | Particular | Code | Total Voucher | VAT | Tax | Grand Total
   ========================================================= */
export const MonthlyVoucherPrintView: React.FC<MonthlyVoucherPrintViewProps> = ({
  data,
}) => {
  const totals = computeMonthlyVoucherTotals(data.rows);

  return (
    <div className="sheet-a4-portrait bg-white text-[#111111]">
      <div className="mb-3 text-center font-sans text-[13pt] font-bold">
        {data.sheetTitle || 'Monthly Voucher Statement'}
        {data.monthLabel.trim() ? ` - ${data.monthLabel}` : ''}
      </div>

      <table
        className="w-full border-collapse text-[9.5pt]"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: '6%' }} />
          <col style={{ width: '32%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: '#F2F4F3' }}>
            <th className="border border-[#222] py-1.5 px-1 text-center font-bold">SL</th>
            <th className="border border-[#222] py-1.5 px-2 text-left font-bold">Particular</th>
            <th className="border border-[#222] py-1.5 px-1 text-center font-bold">Code</th>
            <th className="border border-[#222] py-1.5 px-2 text-right font-bold">
              Total Voucher
            </th>
            <th className="border border-[#222] py-1.5 px-2 text-right font-bold">VAT</th>
            <th className="border border-[#222] py-1.5 px-2 text-right font-bold">Tax</th>
            <th className="border border-[#222] py-1.5 px-2 text-right font-bold">
              Grand Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => {
            const c = totals.computedRows[idx];
            return (
              <tr key={row.id}>
                <td className="border border-[#222] py-1 px-1 text-center">{row.slNo}</td>
                <td className="border border-[#222] py-1 px-2 text-left truncate">
                  {row.particulars}
                </td>
                <td
                  className="border border-[#222] py-1 px-1 text-center"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {row.codeNo}
                </td>
                <td
                  className="border border-[#222] py-1 px-2 text-right"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {c.totalVoucher > 0 ? formatSheetNum(c.totalVoucher, true) : ''}
                </td>
                <td
                  className="border border-[#222] py-1 px-2 text-right"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {c.vat > 0 ? formatSheetNum(c.vat, true) : ''}
                </td>
                <td
                  className="border border-[#222] py-1 px-2 text-right"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {c.tax > 0 ? formatSheetNum(c.tax, true) : ''}
                </td>
                <td
                  className="border border-[#222] py-1 px-2 text-right font-semibold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {c.grandTotal > 0 ? formatSheetNum(c.grandTotal, true) : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ backgroundColor: '#F9E48E' }}>
            <td className="border border-[#222] py-1.5 px-1" />
            <td className="border border-[#222] py-1.5 px-2 text-left">Total</td>
            <td className="border border-[#222] py-1.5 px-1" />
            <td
              className="border border-[#222] py-1.5 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.sumTotalVoucher, false)}
            </td>
            <td
              className="border border-[#222] py-1.5 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.sumVat, false)}
            </td>
            <td
              className="border border-[#222] py-1.5 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.sumTax, false)}
            </td>
            <td
              className="border border-[#222] py-1.5 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.sumGrandTotal, false)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

interface MonthlyVoucherSheetProps {
  data: MonthlyVoucherSheetData;
  onChange: (next: MonthlyVoucherSheetData) => void;
  onPrint: () => void;
  onSavePdf: () => void;
}

function emptyRowDraft(nextSl: string): MonthlyVoucherRow {
  return {
    id: '',
    slNo: nextSl,
    particulars: '',
    codeNo: '',
    totalVoucher: '',
    preAmount: '',
    vatRate: '',
    taxRate: '',
    vatManual: '',
    taxManual: '',
    fixedVatTaxBase: '',
  };
}

export const MonthlyVoucherSheet: React.FC<MonthlyVoucherSheetProps> = ({
  data,
  onChange,
  onPrint,
  onSavePdf,
}) => {
  const [viewMode, setViewMode] = useState<'workspace' | 'preview'>('workspace');
  const [selectedRowId, setSelectedRowId] = useState<string>('');
  const [rowDraft, setRowDraft] = useState<MonthlyVoucherRow>(() => emptyRowDraft(''));
  const [editingModalRow, setEditingModalRow] = useState<MonthlyVoucherRow | null>(null);
  const [manageRateMode, setManageRateMode] = useState<'VAT' | 'TAX' | null>(null);
  const [rateDraftMap, setRateDraftMap] = useState<Record<string, string>>({});
  const [fixedBaseDraftMap, setFixedBaseDraftMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const totals = computeMonthlyVoucherTotals(data.rows);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const avail = el.clientWidth - 32;
      setScale(Math.min(1, Math.max(0.35, avail / 794)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  const headOptions = useMemo(
    () => [
      ...data.rows.map((r) => ({
        value: r.id,
        label: `${r.slNo}. ${r.particulars || 'Unnamed'} (${r.codeNo || '-'})`,
        keywords: `${r.slNo} ${r.particulars} ${r.codeNo} ${r.codeNo.replace(/,/g, '')}`,
      })),
      {
        value: '__NEW__',
        label: '+ নতুন খাত যোগ করুন (New Particular)',
        keywords: 'new add particular নতুন খাত',
      },
    ],
    [data.rows]
  );

  const monthOptions = useMemo(
    () => MONTH_OPTIONS.map((m) => ({ value: m, label: m })),
    []
  );

  const handleSelectRow = (id: string) => {
    setSelectedRowId(id);
    if (!id) {
      setRowDraft(emptyRowDraft(''));
    } else if (id === '__NEW__') {
      setRowDraft(emptyRowDraft(String(data.rows.length + 1)));
    } else {
      const found = data.rows.find((r) => r.id === id);
      if (found) setRowDraft({ ...found });
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRowId) {
      setFeedback('অনুগ্রহ করে আগে খাত (Particulars) সিলেক্ট করুন।');
      return;
    }
    if (!rowDraft.particulars.trim()) {
      setFeedback('অনুগ্রহ করে Particulars লিখুন।');
      return;
    }

    if (selectedRowId === '__NEW__') {
      const created: MonthlyVoucherRow = {
        ...rowDraft,
        id: `mv-${Date.now()}`,
        particulars: rowDraft.particulars.trim(),
      };
      const nextRows = resequenceMonthlyVoucherRows([...data.rows, created]);
      onChange({ ...data, rows: nextRows });
      setFeedback(`'${created.particulars}' টেবিলে যোগ ও সেভ হয়েছে!`);
    } else {
      onChange({
        ...data,
        rows: data.rows.map((r) =>
          r.id === selectedRowId
            ? { ...rowDraft, particulars: rowDraft.particulars.trim() }
            : r
        ),
      });
      setFeedback(`'${rowDraft.particulars.trim()}' আপডেট ও সেভ হয়েছে!`);
    }

    // Clear all entry fields and dropdown after Save
    setSelectedRowId('');
    setRowDraft(emptyRowDraft(''));
  };

  const handleResetDraft = () => {
    setRowDraft((prev) => ({
      ...prev,
      particulars: selectedRowId === '__NEW__' ? '' : prev.particulars,
      codeNo: selectedRowId === '__NEW__' ? '' : prev.codeNo,
      totalVoucher: '',
      preAmount: '',
      vatManual: '',
      taxManual: '',
    }));
  };

  const openRateModal = (mode: 'VAT' | 'TAX') => {
    const initialMap: Record<string, string> = {};
    const initialFixedMap: Record<string, string> = {};
    data.rows.forEach((r) => {
      initialMap[r.id] = mode === 'VAT' ? r.vatRate : r.taxRate;
      initialFixedMap[r.id] = r.fixedVatTaxBase ?? '';
    });
    setRateDraftMap(initialMap);
    setFixedBaseDraftMap(initialFixedMap);
    setManageRateMode(mode);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageRateMode) return;
    const nextRows = data.rows.map((r) => {
      const nextRate = (rateDraftMap[r.id] ?? '').trim();
      const nextFixedBase = (fixedBaseDraftMap[r.id] ?? '').trim();
      if (manageRateMode === 'VAT') {
        return {
          ...r,
          vatRate: nextRate,
          vatManual: nextRate !== '' ? '' : r.vatManual,
          fixedVatTaxBase: nextFixedBase,
        };
      }
      return {
        ...r,
        taxRate: nextRate,
        taxManual: nextRate !== '' ? '' : r.taxManual,
        fixedVatTaxBase: nextFixedBase,
      };
    });
    onChange({ ...data, rows: nextRows });
    const synced = nextRows.find((r) => r.id === selectedRowId);
    if (synced) {
      setRowDraft((prev) => ({
        ...prev,
        vatRate: synced.vatRate,
        taxRate: synced.taxRate,
        vatManual: synced.vatManual,
        taxManual: synced.taxManual,
        fixedVatTaxBase: synced.fixedVatTaxBase,
      }));
    }
    const label = manageRateMode === 'VAT' ? 'VAT' : 'Tax';
    setManageRateMode(null);
    setFeedback(`${label} Rate ও Fixed Base আপডেট ও টেবিলে অটো হিসাব করা হয়েছে!`);
  };

  const handleDeleteRow = (id: string) => {
    const nextRows = resequenceMonthlyVoucherRows(data.rows.filter((r) => r.id !== id));
    onChange({ ...data, rows: nextRows });
    if (selectedRowId === id) {
      setSelectedRowId('');
      setRowDraft(emptyRowDraft(''));
    }
    setFeedback('খাত ডিলিট করা হয়েছে ও SL অটো ঠিক করা হয়েছে।');
  };

  const handleMoveRow = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= data.rows.length || fromIdx === toIdx) return;
    const copy = [...data.rows];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const resequenced = resequenceMonthlyVoucherRows(copy);
    onChange({ ...data, rows: resequenced });
  };

  const handleFixSL = () => {
    onChange({ ...data, rows: resequenceMonthlyVoucherRows(data.rows) });
    setFeedback('সব সারির SL নং (1, 2, 3...) ঠিক করা হয়েছে!');
  };

  const handleSaveModalRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModalRow) return;
    onChange({
      ...data,
      rows: data.rows.map((r) => (r.id === editingModalRow.id ? editingModalRow : r)),
    });
    if (selectedRowId === editingModalRow.id) {
      setRowDraft({ ...editingModalRow });
    }
    setEditingModalRow(null);
    setFeedback('তথ্য আপডেট হয়েছে!');
  };

  const handleResetEntriesOnly = () => {
    const clearedRows = data.rows.map((r) => ({
      ...r,
      totalVoucher: '',
      preAmount: '',
      vatManual: '',
      taxManual: '',
    }));
    onChange({ ...data, monthLabel: '', rows: clearedRows });
    setSelectedRowId('');
    setRowDraft(emptyRowDraft(''));
    setFeedback('টেবিলের সব এন্ট্রি ০ / খালি করা হয়েছে (VAT ও Tax রেট সংরক্ষিত আছে)।');
  };

  const handleResetAllDefault = () => {
    const currentById = new Map(data.rows.map((r) => [r.id, r]));
    const currentByCode = new Map(
      data.rows.map((r) => [r.codeNo.replace(/,/g, '').trim(), r])
    );

    const resetRows = DEFAULT_MONTHLY_VOUCHER_DATA.rows.map((defRow) => {
      const existing =
        currentById.get(defRow.id) ||
        currentByCode.get(defRow.codeNo.replace(/,/g, '').trim());
      return {
        ...defRow,
        vatRate: existing ? existing.vatRate : defRow.vatRate,
        taxRate: existing ? existing.taxRate : defRow.taxRate,
        fixedVatTaxBase:
          existing && existing.fixedVatTaxBase !== undefined
            ? existing.fixedVatTaxBase
            : defRow.fixedVatTaxBase,
      };
    });

    onChange({
      ...DEFAULT_MONTHLY_VOUCHER_DATA,
      rows: resetRows,
    });
    setSelectedRowId('');
    setRowDraft(emptyRowDraft(''));
    setFeedback('সব এন্ট্রি ডিফল্ট ০ / খালি করা হয়েছে (VAT, Tax রেট ও Fixed Base অপরিবর্তিত আছে)।');
  };

  const draftCalc = computeMonthlyVoucherRow(rowDraft);
  const modalCalc = editingModalRow ? computeMonthlyVoucherRow(editingModalRow) : null;

  const qRaw = searchQuery.trim().toLowerCase();
  const qNorm = qRaw.replace(/,/g, '');
  const visibleRows = data.rows
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => {
      if (!qRaw) return true;
      const nameMatch = r.particulars.toLowerCase().includes(qRaw);
      const slMatch = r.slNo.toLowerCase().includes(qRaw);
      const codeNorm = r.codeNo.toLowerCase().replace(/,/g, '');
      const codeRaw = r.codeNo.toLowerCase();
      return nameMatch || slMatch || codeNorm.includes(qNorm) || codeRaw.includes(qRaw);
    });

  return (
    <div className="space-y-4">
      {/* Workspace Action Bar */}
      <div className="bg-white border border-[#DCE3DF] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#131C18]">
            Monthly Voucher Statement
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6962] mt-0.5 font-mono-tabular">
            <span>Total Voucher: {formatSheetNum(totals.sumTotalVoucher, false)}</span>
            <span aria-hidden="true">·</span>
            <span>VAT: {formatSheetNum(totals.sumVat, false)}</span>
            <span aria-hidden="true">·</span>
            <span>Tax: {formatSheetNum(totals.sumTax, false)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#006633]">
              Grand Total: {formatSheetNum(totals.sumGrandTotal, false)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#EFF3F1] rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('workspace')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'workspace'
                  ? 'bg-white text-[#006633] font-semibold shadow-xs'
                  : 'text-[#47554E] hover:text-[#131C18]'
              }`}
            >
              Entry &amp; Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'preview'
                  ? 'bg-white text-[#006633] font-semibold shadow-xs'
                  : 'text-[#47554E] hover:text-[#131C18]'
              }`}
            >
              Print Preview (7 Cols)
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetAllDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>All Reset (0)</span>
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

      {feedback && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {viewMode === 'workspace' ? (
        <div className="space-y-5">
          {/* 1. Searchable Dropdown Selector + Single Expense Head Entry Form */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <label
                  htmlFor="mvHeadSelector"
                  className="block text-xs font-semibold text-[#006633] mb-1.5"
                >
                  খাত (Particulars) সিলেক্ট করুন (নাম বা কোড লিখে খুঁজুন)
                </label>
                <SearchableSelect
                  id="mvHeadSelector"
                  options={headOptions}
                  value={selectedRowId}
                  onChange={handleSelectRow}
                  placeholder="খাত বা কোড খুঁজুন (যেমন: 6501 বা Office Rent)..."
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="mvMonthSelector"
                  className="block text-xs font-medium text-[#47554E] mb-1.5"
                >
                  Month (মাসের নাম)
                </label>
                <SearchableSelect
                  id="mvMonthSelector"
                  options={monthOptions}
                  value={data.monthLabel}
                  onChange={(val) => onChange({ ...data, monthLabel: val })}
                  placeholder="মাস খুঁজুন বা সিলেক্ট করুন..."
                />
              </div>
            </div>

            {selectedRowId !== '' && (
              <form
                onSubmit={handleSaveEntry}
                className="space-y-4 pt-4 border-t border-[#EAEFEF]"
              >
                {/* Show SL/Particulars/Code inputs ONLY when adding a brand new head */}
                {selectedRowId === '__NEW__' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        SL No
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={rowDraft.slNo}
                        onChange={(e) =>
                          setRowDraft((prev) => ({ ...prev, slNo: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-7">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Particulars *
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={rowDraft.particulars}
                        onChange={(e) =>
                          setRowDraft((prev) => ({ ...prev, particulars: e.target.value }))
                        }
                        placeholder="নতুন খাতের নাম লিখুন..."
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Code No
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={rowDraft.codeNo}
                        onChange={(e) =>
                          setRowDraft((prev) => ({ ...prev, codeNo: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-[#47554E] mb-1">
                      Total Voucher
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={rowDraft.totalVoucher}
                      onChange={(e) =>
                        setRowDraft((prev) => ({ ...prev, totalVoucher: e.target.value }))
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-[#FEF9C3]/40 border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#47554E] mb-1">
                      Pre Amount
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={rowDraft.preAmount}
                      onChange={(e) =>
                        setRowDraft((prev) => ({ ...prev, preAmount: e.target.value }))
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-[#F3D5D5]/30 border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#47554E] mb-1">
                      Fixed VAT/Tax Base (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={rowDraft.fixedVatTaxBase ?? ''}
                      onChange={(e) =>
                        setRowDraft((prev) => ({
                          ...prev,
                          fixedVatTaxBase: e.target.value,
                        }))
                      }
                      placeholder="খালি = Voucher + Pre"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>

                  <div className="px-4 py-2 bg-[#F8FAF9] border border-[#DCE3DF] rounded flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#006633]">
                        Total (Voucher + VAT + Tax)
                      </div>
                      {(rowDraft.vatRate || rowDraft.taxRate || draftCalc.hasFixedBase) && (
                        <div className="text-[11px] text-[#5B6962] font-mono-tabular">
                          VAT {rowDraft.vatRate || '0'}% · Tax {rowDraft.taxRate || '0'}%
                          {draftCalc.hasFixedBase
                            ? ` · Fixed Base ${formatSheetNum(draftCalc.fixedBaseNum, false)}`
                            : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono-tabular text-[#006633]">
                      {formatSheetNum(draftCalc.grandTotal, false)}
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 2. Monthly Voucher Table */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#EAEFEF]">
              <div>
                <h2 className="text-sm font-semibold text-[#006633]">
                  Monthly Voucher টেবিল (সকল তথ্য)
                </h2>
                <p className="text-xs text-[#5B6962]">
                  সারি ড্র্যাগ বা ↑/↓ বাটনে সাজান · Manage VAT / Manage Tax দিয়ে রেট সেট করুন
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5B6962] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="খুঁজুন (Particulars বা Code)..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633] w-56"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFixSL}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#0D47A1] border border-[#90CAF9] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  title="সব সারির SL নং 1, 2, 3... ক্রমে অটো ঠিক করুন"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Auto Fix SL</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetEntriesOnly}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  title="এক ক্লিকে টেবিলের সব এন্ট্রি ০ / খালি করুন"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Entries (0)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F6F5] text-[#47554E] font-semibold">
                    <th className="border border-[#BFCAC4] px-1.5 py-2 text-center w-16">
                      SL No
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-left min-w-[165px]">
                      Particulars
                    </th>
                    <th className="border border-[#BFCAC4] px-1.5 py-2 text-center w-24">
                      Coad no
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-right bg-[#FEF9C3]">
                      Total Voucher
                    </th>
                    <th className="border border-[#BFCAC4] px-1.5 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => openRateModal('VAT')}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-[#006633] hover:bg-[#004E27] text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                        title="Particular অনুযায়ী VAT Rate (%) সেট করুন"
                      >
                        Manage VAT
                      </button>
                    </th>
                    <th className="border border-[#BFCAC4] px-1.5 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => openRateModal('TAX')}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                        title="Particular অনুযায়ী Tax Rate (%) সেট করুন"
                      >
                        Manage Tax
                      </button>
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-right bg-[#FEF9C3]">
                      Total
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-right bg-[#F3D5D5]">
                      Pre Ammount
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-right">
                      Total
                    </th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-center w-52">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(({ r: row, idx }) => {
                    const c = totals.computedRows[idx];
                    const hasVoucher = c.totalVoucher > 0;
                    const hasPre = c.preAmount > 0;
                    const isFiltered = Boolean(qRaw);
                    return (
                      <tr
                        key={row.id}
                        draggable={!isFiltered}
                        onDragStart={() => setDragRowId(row.id)}
                        onDragOver={(e) => {
                          if (!isFiltered && dragRowId) e.preventDefault();
                        }}
                        onDrop={() => {
                          if (!isFiltered && dragRowId && dragRowId !== row.id) {
                            const fromIdx = data.rows.findIndex((x) => x.id === dragRowId);
                            if (fromIdx !== -1) handleMoveRow(fromIdx, idx);
                          }
                          setDragRowId(null);
                        }}
                        onDragEnd={() => setDragRowId(null)}
                        className={`hover:bg-[#FAFCFB] ${
                          dragRowId === row.id ? 'opacity-50 bg-[#E8F5E9]' : ''
                        }`}
                      >
                        <td className="border border-[#BFCAC4] px-1.5 py-1.5 text-center font-mono-tabular">
                          <div className="inline-flex items-center gap-1">
                            {!isFiltered && (
                              <GripVertical
                                className="w-3.5 h-3.5 text-[#8A9790] cursor-grab shrink-0"
                                aria-label="Drag to reorder"
                              />
                            )}
                            <span>{row.slNo}</span>
                          </div>
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1.5 font-medium">
                          <div>{row.particulars}</div>
                          {c.hasFixedBase && (
                            <div className="text-[10px] text-[#006633] font-normal">
                              Fixed VAT/Tax Base: {formatSheetNum(c.fixedBaseNum, false)}
                            </div>
                          )}
                        </td>
                        <td className="border border-[#BFCAC4] px-1.5 py-1.5 text-center font-mono-tabular">
                          {row.codeNo}
                        </td>
                        <td
                          className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular"
                          style={{ backgroundColor: hasVoucher ? '#FEF08A' : undefined }}
                        >
                          {c.totalVoucher > 0 ? formatSheetNum(c.totalVoucher, true) : '-'}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular">
                          {c.vat > 0 ? (
                            <span>{formatSheetNum(c.vat, true)}</span>
                          ) : row.vatRate.trim() !== '' ? (
                            <span className="text-[10px] text-[#5B6962]">{row.vatRate}%</span>
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular">
                          {c.tax > 0 ? (
                            <span>{formatSheetNum(c.tax, true)}</span>
                          ) : row.taxRate.trim() !== '' ? (
                            <span className="text-[10px] text-[#5B6962]">{row.taxRate}%</span>
                          ) : (
                            ''
                          )}
                        </td>
                        <td
                          className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular font-semibold"
                          style={{
                            backgroundColor: c.grandTotal > 0 ? '#FEF08A' : undefined,
                          }}
                        >
                          {c.grandTotal > 0 ? formatSheetNum(c.grandTotal, true) : '-'}
                        </td>
                        <td
                          className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular"
                          style={{ backgroundColor: hasPre ? '#FEF08A' : '#F3D5D5' }}
                        >
                          {hasPre ? formatSheetNum(c.preAmount, true) : ''}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular font-semibold">
                          {c.baseWithPre > 0 ? formatSheetNum(c.baseWithPre, true) : '-'}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveRow(idx, idx - 1)}
                              className="p-1 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] disabled:opacity-35 cursor-pointer"
                              title="উপরে নিন"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === data.rows.length - 1}
                              onClick={() => handleMoveRow(idx, idx + 1)}
                              className="p-1 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] disabled:opacity-35 cursor-pointer"
                              title="নিচে নিন"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingModalRow({ ...row })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-medium cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FEF08A] font-bold text-[#131C18]">
                    <td className="border border-[#BFCAC4] px-1.5 py-2" />
                    <td className="border border-[#BFCAC4] px-2 py-2">Total</td>
                    <td className="border border-[#BFCAC4] px-1.5 py-2" />
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular">
                      {formatSheetNum(totals.sumTotalVoucher, false)}
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular">
                      {formatSheetNum(totals.sumVat, false)}
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular">
                      {formatSheetNum(totals.sumTax, false)}
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular">
                      {formatSheetNum(totals.sumGrandTotal, false)}
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular">
                      {formatSheetNum(totals.sumPre, false)}
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular bg-white">
                      {formatSheetNum(totals.sumBaseWithPre, false)}
                    </td>
                    <td className="border border-[#BFCAC4] bg-white" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div ref={previewWrapRef}>
          <div className="bg-white border border-[#DCE3DF] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#EAEFEF] flex items-center justify-between bg-[#FAFBFA]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#131C18]">
                <FileText className="w-4 h-4 text-[#006633]" />
                <span>
                  Print Preview (A4 Portrait · SL, Particular, Code, Total Voucher, VAT, Tax, Grand Total)
                </span>
              </div>
              <span className="text-xs font-mono-tabular text-[#5B6962]">
                A4 · {Math.round(scale * 100)}%
              </span>
            </div>
            <div className="bg-[#E3E8E5] p-4 flex justify-center overflow-x-auto">
              <div
                style={{
                  width: `${794 * scale}px`,
                  height: `${1123 * scale}px`,
                  position: 'relative',
                }}
              >
                <div
                  className="origin-top-left shadow-md"
                  style={{ width: '210mm', transform: `scale(${scale})` }}
                >
                  <MonthlyVoucherPrintView data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Edit Popup Modal */}
      {editingModalRow && modalCalc && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Monthly Voucher Entry"
        >
          <div className="px-6 py-4 border-b border-[#DCE3DF] flex items-center justify-between bg-[#FAFBFA]">
            <h2 className="text-base font-bold text-[#006633]">
              Edit Monthly Voucher — {editingModalRow.particulars || 'New Entry'}
            </h2>
            <button
              type="button"
              onClick={() => setEditingModalRow(null)}
              className="p-2 rounded-md text-[#47554E] hover:bg-[#ECEFF1] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSaveModalRow}
            className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  SL No
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editingModalRow.slNo}
                  onChange={(e) =>
                    setEditingModalRow({ ...editingModalRow, slNo: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Particulars
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editingModalRow.particulars}
                  onChange={(e) =>
                    setEditingModalRow({
                      ...editingModalRow,
                      particulars: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Coad no
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editingModalRow.codeNo}
                  onChange={(e) =>
                    setEditingModalRow({ ...editingModalRow, codeNo: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Total Voucher
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={editingModalRow.totalVoucher}
                  onChange={(e) =>
                    setEditingModalRow({
                      ...editingModalRow,
                      totalVoucher: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Pre Amount
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={editingModalRow.preAmount}
                  onChange={(e) =>
                    setEditingModalRow({
                      ...editingModalRow,
                      preAmount: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  VAT Rate (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={editingModalRow.vatRate}
                  onChange={(e) =>
                    setEditingModalRow({
                      ...editingModalRow,
                      vatRate: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={editingModalRow.taxRate}
                  onChange={(e) =>
                    setEditingModalRow({
                      ...editingModalRow,
                      taxRate: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                Fixed VAT/Tax Base Amount (ঐচ্ছিক — যেমন 500 দিলে যত অ্যামাউন্টই হোক 500 টাকার ওপর VAT ও Tax হবে)
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={editingModalRow.fixedVatTaxBase ?? ''}
                onChange={(e) =>
                  setEditingModalRow({
                    ...editingModalRow,
                    fixedVatTaxBase: e.target.value,
                  })
                }
                placeholder="খালি থাকলে Total Voucher + Pre Amount এর ওপর হিসাব হবে"
                className="w-full sm:w-80 px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
              />
            </div>

            {editingModalRow.vatRate.trim() === '' ||
            editingModalRow.taxRate.trim() === '' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editingModalRow.vatRate.trim() === '' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                      Manual VAT Amount (যদি Rate না দেন)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={editingModalRow.vatManual}
                      onChange={(e) =>
                        setEditingModalRow({
                          ...editingModalRow,
                          vatManual: e.target.value,
                        })
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>
                )}
                {editingModalRow.taxRate.trim() === '' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                      Manual Tax Amount (যদি Rate না দেন)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={editingModalRow.taxManual}
                      onChange={(e) =>
                        setEditingModalRow({
                          ...editingModalRow,
                          taxManual: e.target.value,
                        })
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>
                )}
              </div>
            ) : null}

            <div className="p-4 bg-[#F8FAF9] border border-[#DCE3DF] rounded-md grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[#5B6962]">Total (Voucher + Pre)</div>
                <div className="text-base font-bold font-mono-tabular">
                  {formatSheetNum(modalCalc.baseWithPre, false)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#5B6962]">VAT</div>
                <div className="text-base font-bold font-mono-tabular">
                  {formatSheetNum(modalCalc.vat, false)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#5B6962]">Tax</div>
                <div className="text-base font-bold font-mono-tabular">
                  {formatSheetNum(modalCalc.tax, false)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#006633] font-semibold">
                  Total (Voucher + VAT + Tax)
                </div>
                <div className="text-lg font-bold font-mono-tabular text-[#006633]">
                  {formatSheetNum(modalCalc.grandTotal, false)}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingModalRow(null)}
                className="px-5 py-2.5 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fullscreen Manage VAT / Manage Tax Rate Modal */}
      {manageRateMode && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={manageRateMode === 'VAT' ? 'Manage VAT Rates' : 'Manage Tax Rates'}
        >
          <div className="px-6 py-4 border-b border-[#DCE3DF] flex items-center justify-between bg-[#FAFBFA]">
            <div>
              <h2
                className={`text-base font-bold ${
                  manageRateMode === 'VAT' ? 'text-[#006633]' : 'text-[#1565C0]'
                }`}
              >
                {manageRateMode === 'VAT'
                  ? 'Manage VAT — Particular অনুযায়ী VAT Rate (%) সেট করুন'
                  : 'Manage Tax — Particular অনুযায়ী Tax Rate (%) সেট করুন'}
              </h2>
              <p className="text-xs text-[#5B6962] mt-0.5">
                এখানে রেট বসিয়ে Save করলে Total Voucher + Pre Amount এর ওপর অটো হিসাব হবে
              </p>
            </div>
            <button
              type="button"
              onClick={() => setManageRateMode(null)}
              className="p-2 rounded-md text-[#47554E] hover:bg-[#ECEFF1] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveRates} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F6F5] text-[#47554E] font-semibold">
                    <th className="border border-[#BFCAC4] px-2 py-2 text-center w-14">SL</th>
                    <th className="border border-[#BFCAC4] px-3 py-2 text-left">Particulars</th>
                    <th className="border border-[#BFCAC4] px-2 py-2 text-center w-24">Code</th>
                    <th className="border border-[#BFCAC4] px-3 py-2 text-right w-28">
                      Voucher + Pre
                    </th>
                    <th className="border border-[#BFCAC4] px-3 py-2 text-center w-32">
                      Fixed Base
                    </th>
                    <th className="border border-[#BFCAC4] px-3 py-2 text-center w-32">
                      {manageRateMode === 'VAT' ? 'VAT Rate (%)' : 'Tax Rate (%)'}
                    </th>
                    <th className="border border-[#BFCAC4] px-3 py-2 text-right w-28">
                      {manageRateMode === 'VAT' ? 'Auto VAT' : 'Auto Tax'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => {
                    const rateVal = rateDraftMap[r.id] ?? '';
                    const fixedBaseVal = fixedBaseDraftMap[r.id] ?? '';
                    const previewRow: MonthlyVoucherRow =
                      manageRateMode === 'VAT'
                        ? {
                            ...r,
                            vatRate: rateVal,
                            vatManual: rateVal.trim() !== '' ? '' : r.vatManual,
                            fixedVatTaxBase: fixedBaseVal,
                          }
                        : {
                            ...r,
                            taxRate: rateVal,
                            taxManual: rateVal.trim() !== '' ? '' : r.taxManual,
                            fixedVatTaxBase: fixedBaseVal,
                          };
                    const calc = computeMonthlyVoucherRow(previewRow);
                    const previewAmt = manageRateMode === 'VAT' ? calc.vat : calc.tax;

                    return (
                      <tr key={r.id} className="hover:bg-[#FAFCFB]">
                        <td className="border border-[#BFCAC4] px-2 py-1.5 text-center font-mono-tabular">
                          {r.slNo}
                        </td>
                        <td className="border border-[#BFCAC4] px-3 py-1.5 font-medium">
                          {r.particulars}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1.5 text-center font-mono-tabular">
                          {r.codeNo}
                        </td>
                        <td className="border border-[#BFCAC4] px-3 py-1.5 text-right font-mono-tabular">
                          {calc.baseWithPre > 0 ? formatSheetNum(calc.baseWithPre, true) : '0'}
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={fixedBaseVal}
                            onChange={(e) =>
                              setFixedBaseDraftMap((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="Voucher+Pre"
                            className="w-full px-2 py-1 text-xs text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                          />
                        </td>
                        <td className="border border-[#BFCAC4] px-2 py-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={rateVal}
                            onChange={(e) =>
                              setRateDraftMap((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1 text-xs text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                          />
                        </td>
                        <td className="border border-[#BFCAC4] px-3 py-1.5 text-right font-mono-tabular font-semibold text-[#006633]">
                          {formatSheetNum(previewAmt, false)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-[#DCE3DF] bg-[#FAFBFA] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const synced = syncMonthlyVoucherRatesFromChallan(data.rows, true);
                  const nextMap: Record<string, string> = {};
                  const nextFixedMap: Record<string, string> = { ...fixedBaseDraftMap };
                  synced.forEach((r) => {
                    nextMap[r.id] = manageRateMode === 'VAT' ? r.vatRate : r.taxRate;
                    if (!nextFixedMap[r.id] && r.fixedVatTaxBase) {
                      nextFixedMap[r.id] = r.fixedVatTaxBase;
                    }
                  });
                  setRateDraftMap(nextMap);
                  setFixedBaseDraftMap(nextFixedMap);
                }}
                className="px-4 py-2 rounded-md bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#A5D6A7] text-xs font-semibold cursor-pointer"
              >
                {manageRateMode === 'VAT' ? 'VAT Challan থেকে রেট লোড করুন' : 'Tax Challan থেকে রেট লোড করুন'} ({CHALLAN_ROW_MAPPINGS.length}টি খাত)
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setManageRateMode(null)}
                  className="px-5 py-2 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 px-6 py-2 rounded-md text-white text-sm font-semibold cursor-pointer ${
                    manageRateMode === 'VAT'
                      ? 'bg-[#006633] hover:bg-[#004E27]'
                      : 'bg-[#1565C0] hover:bg-[#0D47A1]'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Save {manageRateMode === 'VAT' ? 'VAT' : 'Tax'} Rates</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
