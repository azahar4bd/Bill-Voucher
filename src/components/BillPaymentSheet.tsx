import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  FileDown,
  FileText,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  addSheetAmount,
  BillPaymentRow,
  BillPaymentSheetData,
  BILL_PAYMENT_STAFF_CATALOG,
  BILL_PAYMENT_TT_CATALOG,
  computeBillPaymentTotals,
  DEFAULT_BILL_PAYMENT_DATA,
  formatRawOrComma,
  formatSheetNum,
  getRowVoValues,
  getVoColumnCount,
  getVoLabel,
  MIN_VO_COLUMNS,
  MONTH_OPTIONS,
  parseSheetNum,
  setRowVoValue,
  TTItem,
} from '../data/sheetsDefaults';
import { SearchableSelect } from './SearchableSelect';

interface BillPaymentPrintViewProps {
  data: BillPaymentSheetData;
}

export const BillPaymentPrintView: React.FC<BillPaymentPrintViewProps> = ({ data }) => {
  const totals = computeBillPaymentTotals(data);
  const voCount = totals.voCount;
  const nameWidth = Math.max(16, 26 - Math.max(0, voCount - MIN_VO_COLUMNS) * 1.2);
  const voWidth = (100 - nameWidth - 14) / voCount;

  return (
    <div className="sheet-a4-portrait bg-white text-[#111111]">
      {/* Bill Payment Table */}
      <table className="w-full border-collapse text-[11pt]" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: `${nameWidth}%` }} />
          {Array.from({ length: voCount }, (_, idx) => (
            <col key={idx} style={{ width: `${voWidth}%` }} />
          ))}
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr>
            <th
              colSpan={voCount + 2}
              className="border border-[#222] py-1.5 text-center text-[15pt] font-normal font-sans"
            >
              {data.title || 'Bill Payment'}
            </th>
          </tr>
          <tr>
            <th className="border border-[#222] py-1 px-2 text-center font-normal">Name</th>
            {Array.from({ length: voCount }, (_, idx) => (
              <th
                key={idx}
                className="border border-[#222] py-1 px-1 text-center font-normal"
              >
                {getVoLabel(idx)}
              </th>
            ))}
            <th
              className="border border-[#222] py-1 px-2 text-center font-normal"
              style={{ backgroundColor: '#D9CFE3' }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => {
            const rowTotal = totals.rowTotals[idx];
            const cells = Array.from(
              { length: voCount },
              (_, idx) => getRowVoValues(row)[idx] ?? ''
            );
            return (
              <tr key={row.id} className="relative">
                <td
                  className={`border border-[#222] py-0.5 px-2 text-left ${
                    row.name.length > 20 ? 'text-[8.5pt]' : 'text-[10.5pt]'
                  }`}
                >
                  {row.name}
                </td>
                {cells.map((val, cIdx) => {
                  const display = formatRawOrComma(val);
                  return (
                    <td
                      key={cIdx}
                      className="border border-[#222] py-0.5 px-2 text-right text-[10.5pt]"
                      style={{
                        backgroundColor: display ? '#F9E48E' : '#FFFFFF',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {display}
                    </td>
                  );
                })}
                <td
                  className="border border-[#222] py-0.5 px-2 text-right text-[10.5pt] relative"
                  style={{
                    backgroundColor: rowTotal > 0 ? '#F9E48E' : '#FFFFFF',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatSheetNum(rowTotal, true)}
                  {row.ok && (
                    <span
                      className="absolute text-[9pt] font-sans text-[#111]"
                      style={{
                        left: 'calc(100% + 6px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      ok
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="border border-[#222] py-1 px-2 text-left text-[11pt]">Total</td>
            {totals.voTotals.map((voTotal, idx) => (
              <td
                key={idx}
                className="border border-[#222] py-1 px-1 text-right text-[11pt]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatSheetNum(voTotal, false)}
              </td>
            ))}
            <td className="border border-[#222] py-1 px-2 text-right text-[11pt]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatSheetNum(totals.billTotal, false)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* T,T Section */}
      <div className="mt-7 mb-2 text-center font-sans text-[11.5pt]">
        {data.ttTitle || 'T,T'}
      </div>

      <table className="border-collapse text-[10.5pt]" style={{ width: '50%', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '46%' }} />
          <col style={{ width: '54%' }} />
        </colgroup>
        <tbody>
          {data.ttItems.map((item) => (
            <tr key={item.id}>
              <td className="border border-[#222] py-1 px-2 text-left">{item.label}</td>
              <td
                className="border border-[#222] py-1 px-2 text-right"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatRawOrComma(item.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="border border-[#222] py-1 px-2 text-left">total</td>
            <td
              className="border border-[#222] py-1 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.ttTotal, false)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Salary, Others, Grand Total */}
      <table className="mt-6 border-collapse text-[10.5pt]" style={{ width: '50%', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '46%' }} />
          <col style={{ width: '54%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-[#222] py-1 px-2 text-left">Salary</td>
            <td
              className="border border-[#222] py-1 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatRawOrComma(data.salary)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#222] py-1 px-2 text-left">Others</td>
            <td
              className="border border-[#222] py-1 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatRawOrComma(data.others)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#222] py-1 px-2 text-left">Grand Total</td>
            <td
              className="border border-[#222] py-1 px-2 text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatSheetNum(totals.grandTotal, false)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

type EntrySectionType = 'BILL_ROW' | 'TT_ITEM' | 'SALARY_OTHERS';

interface BillPaymentSheetProps {
  data: BillPaymentSheetData;
  onChange: (next: BillPaymentSheetData) => void;
  onPrint: () => void;
  onSavePdf: () => void;
}

export const BillPaymentSheet: React.FC<BillPaymentSheetProps> = ({
  data,
  onChange,
  onPrint,
  onSavePdf,
}) => {
  const [viewMode, setViewMode] = useState<'workspace' | 'preview'>('workspace');
  const [selectedSection, setSelectedSection] = useState<EntrySectionType | ''>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Selected Bill Payment row ID or '__NEW__' (starts empty)
  const [selectedRowId, setSelectedRowId] = useState<string>('');
  const [rowDraft, setRowDraft] = useState<BillPaymentRow>({
    id: '',
    name: '',
    vo1: '',
    vo2: '',
    vo3: '',
    vo4: '',
    vo5: '',
    ok: false,
  });
  const [voucherAmount, setVoucherAmount] = useState<string>('');

  // Selected T,T item ID or '__NEW__' (starts empty)
  const [selectedTTId, setSelectedTTId] = useState<string>('');
  const [ttDraft, setTTDraft] = useState<TTItem>({ id: '', label: '', amount: '' });

  // Salary & Others draft (starts empty)
  const [salaryDraft, setSalaryDraft] = useState<string>('');
  const [othersDraft, setOthersDraft] = useState<string>('');

  // Fullscreen Edit Popup State
  const [editingRowModal, setEditingRowModal] = useState<BillPaymentRow | null>(null);
  const [editingTTModal, setEditingTTModal] = useState<TTItem | null>(null);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const totals = computeBillPaymentTotals(data);

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

  // Draft amounts are always empty; previously saved amounts stay in the table.
  const handleSelectRowId = (id: string) => {
    setSelectedRowId(id);
    setVoucherAmount('');
    if (!id || id === '__NEW__') {
      setRowDraft({
        id: '',
        name: '',
        vo1: '',
        vo2: '',
        vo3: '',
        vo4: '',
        vo5: '',
        ok: false,
      });
      return;
    }
    if (id.startsWith('catalog:')) {
      setRowDraft({
        id: '',
        name: id.slice('catalog:'.length),
        vo1: '',
        vo2: '',
        vo3: '',
        vo4: '',
        vo5: '',
        ok: false,
      });
      return;
    }
    const found = data.rows.find((r) => r.id === id);
    if (found) {
      setRowDraft({
        ...found,
        vo1: '',
        vo2: '',
        vo3: '',
        vo4: '',
        vo5: '',
        extraVos: undefined,
      });
    }
  };

  const handleSelectTTId = (id: string) => {
    setSelectedTTId(id);
    if (!id || id === '__NEW__') {
      setTTDraft({ id: '', label: '', amount: '' });
      return;
    }
    if (id.startsWith('catalog:')) {
      setTTDraft({ id: '', label: id.slice('catalog:'.length), amount: '' });
      return;
    }
    const found = data.ttItems.find((t) => t.id === id);
    if (found) setTTDraft({ ...found, amount: '' });
  };

  const handleSelectSection = (sec: string) => {
    setSelectedSection((sec as EntrySectionType) || '');
    if (sec === 'SALARY_OTHERS') {
      setSalaryDraft('');
      setOthersDraft('');
    }
  };

  const getNextVoIndex = (row: BillPaymentRow): number => {
    const values = getRowVoValues(row);
    const emptyIndex = values.findIndex((value) => value.trim() === '');
    return emptyIndex === -1 ? values.length : emptyIndex;
  };

  const handleSaveRowEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRowId) {
      setFeedback('অনুগ্রহ করে আগে নাম সিলেক্ট করুন।');
      return;
    }
    if (!rowDraft.name.trim()) {
      setFeedback('অনুগ্রহ করে Name লিখুন।');
      return;
    }

    const entered = voucherAmount.trim();
    const isNewEntry = selectedRowId === '__NEW__' || selectedRowId.startsWith('catalog:');
    const existingByName = isNewEntry
      ? data.rows.find(
          (r) => r.name.trim().toLowerCase() === rowDraft.name.trim().toLowerCase()
        )
      : undefined;

    if (isNewEntry && !existingByName) {
      const created: BillPaymentRow = {
        id: `bp-${Date.now()}`,
        name: rowDraft.name.trim(),
        vo1: entered,
        vo2: '',
        vo3: '',
        vo4: '',
        vo5: '',
        ok: rowDraft.ok,
      };
      onChange({ ...data, rows: [...data.rows, created] });
      setFeedback(`'${created.name}' টেবিলে যোগ ও সেভ হয়েছে!`);
    } else {
      const targetId = existingByName?.id ?? selectedRowId;
      const current = data.rows.find((r) => r.id === targetId) || rowDraft;
      let updatedRow: BillPaymentRow = {
        ...current,
        name: current.name.trim(),
        ok: rowDraft.ok,
      };

      if (entered !== '') {
        const values = getRowVoValues(current);
        const targetIndex = getNextVoIndex(current);
        const mergedValue =
          targetIndex < values.length
            ? String(parseSheetNum(values[targetIndex]) + parseSheetNum(entered))
            : entered;
        updatedRow = setRowVoValue(updatedRow, targetIndex, mergedValue);
      }

      const updatedRows = data.rows.map((r) => (r.id === targetId ? updatedRow : r));
      onChange({ ...data, rows: updatedRows });
      setFeedback(`'${updatedRow.name}' আপডেট ও সেভ হয়েছে!`);
    }

    // Clear all inputs and dropdown after Save
    setSelectedRowId('');
    setRowDraft({ id: '', name: '', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false });
    setVoucherAmount('');
  };

  const handleResetRowDraft = () => {
    setVoucherAmount('');
    setRowDraft((prev) => ({
      ...prev,
      name: selectedRowId === '__NEW__' ? '' : prev.name,
      ok: false,
    }));
  };

  const handleSaveTTEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTTId) {
      setFeedback('অনুগ্রহ করে আগে T,T খাত সিলেক্ট করুন।');
      return;
    }
    if (!ttDraft.label.trim()) {
      setFeedback('অনুগ্রহ করে T,T খাতের নাম লিখুন।');
      return;
    }
    const isNewEntry = selectedTTId === '__NEW__' || selectedTTId.startsWith('catalog:');
    const existingByLabel = isNewEntry
      ? data.ttItems.find(
          (t) => t.label.trim().toLowerCase() === ttDraft.label.trim().toLowerCase()
        )
      : undefined;
    if (isNewEntry && !existingByLabel) {
      const created: TTItem = {
        id: `tt-${Date.now()}`,
        label: ttDraft.label.trim(),
        amount: ttDraft.amount,
      };
      onChange({ ...data, ttItems: [...data.ttItems, created] });
      setFeedback(`'${created.label}' টেবিলে যোগ হয়েছে!`);
    } else {
      onChange({
        ...data,
        ttItems: data.ttItems.map((it) =>
          it.id === (existingByLabel?.id ?? selectedTTId)
            ? {
                ...it,
                label: ttDraft.label.trim(),
                amount: addSheetAmount(it.amount, ttDraft.amount),
              }
            : it
        ),
      });
      setFeedback(`'${ttDraft.label.trim()}' আপডেট হয়েছে!`);
    }
    setSelectedTTId('');
    setTTDraft({ id: '', label: '', amount: '' });
  };

  const handleResetTTDraft = () => {
    setTTDraft((prev) => ({
      ...prev,
      label: selectedTTId === '__NEW__' ? '' : prev.label,
      amount: '',
    }));
  };

  const handleSaveSalaryOthers = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({
      ...data,
      salary: addSheetAmount(data.salary, salaryDraft),
      others: addSheetAmount(data.others, othersDraft),
    });
    setSalaryDraft('');
    setOthersDraft('');
    setFeedback('Salary ও Others আপডেট হয়েছে!');
  };

  const handleResetSalaryOthers = () => {
    setSalaryDraft('');
    setOthersDraft('');
  };

  const handleDeleteRow = (id: string) => {
    const nextRows = data.rows.filter((r) => r.id !== id);
    onChange({ ...data, rows: nextRows });
    if (selectedRowId === id) {
      const fallback = nextRows[0];
      if (fallback) {
        setSelectedRowId(fallback.id);
        setRowDraft({ ...fallback, vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', extraVos: undefined });
      } else {
        setSelectedRowId('__NEW__');
        setRowDraft({ id: '', name: '', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false });
      }
    }
    setFeedback('সারি ডিলিট করা হয়েছে।');
  };

  const handleDeleteTT = (id: string) => {
    const nextTT = data.ttItems.filter((t) => t.id !== id);
    onChange({ ...data, ttItems: nextTT });
    if (selectedTTId === id) {
      const fallback = nextTT[0];
      if (fallback) {
        setSelectedTTId(fallback.id);
        setTTDraft({ ...fallback, amount: '' });
      } else {
        setSelectedTTId('__NEW__');
        setTTDraft({ id: '', label: '', amount: '' });
      }
    }
    setFeedback('T,T আইটেম ডিলিট করা হয়েছে।');
  };

  const handleSaveModalRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRowModal) return;
    onChange({
      ...data,
      rows: data.rows.map((r) => (r.id === editingRowModal.id ? editingRowModal : r)),
    });
    if (selectedRowId === editingRowModal.id) {
      setRowDraft({ ...editingRowModal, vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', extraVos: undefined });
    }
    setEditingRowModal(null);
    setFeedback('তথ্য আপডেট হয়েছে!');
  };

  const handleSaveModalTT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTTModal) return;
    onChange({
      ...data,
      ttItems: data.ttItems.map((t) => (t.id === editingTTModal.id ? editingTTModal : t)),
    });
    if (selectedTTId === editingTTModal.id) {
      setTTDraft({ ...editingTTModal, amount: '' });
    }
    setEditingTTModal(null);
    setFeedback('T,T তথ্য আপডেট হয়েছে!');
  };

  const handleResetAllToZero = () => {
    onChange(DEFAULT_BILL_PAYMENT_DATA);
    setSelectedRowId('');
    setRowDraft({ id: '', name: '', vo1: '', vo2: '', vo3: '', vo4: '', vo5: '', ok: false });
    setSelectedTTId('');
    setTTDraft({ id: '', label: '', amount: '' });
    setSalaryDraft('');
    setOthersDraft('');
    setVoucherAmount('');
    setFeedback('সব ডেটা ডিফল্ট ০ / খালি করা হয়েছে।');
  };

  const draftVoValues = getRowVoValues(rowDraft);
  const selectedTableRow = data.rows.find((r) => r.id === selectedRowId);
  const existingRowTotal = selectedTableRow
    ? getRowVoValues(selectedTableRow).reduce((acc, value) => acc + parseSheetNum(value), 0)
    : 0;
  const rowDraftTotal = existingRowTotal + parseSheetNum(voucherAmount);
  const nextVoIndex = getNextVoIndex(rowDraft);
  const nextSlotLabel = `${getVoLabel(nextVoIndex)}${
    nextVoIndex >= draftVoValues.length ? ' (+)' : ''
  }`;

  return (
    <div className="space-y-4">
      {/* Top Workspace Bar */}
      <div className="bg-white border border-[#DCE3DF] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#131C18]">
            Bill Payment &amp; T,T Summary
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6962] mt-0.5 font-mono-tabular">
            <span>Bill Total: {formatSheetNum(totals.billTotal, false)}</span>
            <span aria-hidden="true">·</span>
            <span>T,T Total: {formatSheetNum(totals.ttTotal, false)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#006633]">
              Grand Total: {formatSheetNum(totals.grandTotal, false)}
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
              Print Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetAllToZero}
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
          {/* 1. Searchable Dropdown Selector + Single Active Entry Form */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 mb-4 border-b border-[#EAEFEF] items-end">
              <div className="md:col-span-8">
                <label
                  htmlFor="bpSectionSelect"
                  className="block text-xs font-semibold text-[#006633] mb-1.5"
                >
                  এন্ট্রি ধরন সিলেক্ট করুন (যেটি সিলেক্ট করবেন শুধু সেটিই দেখাবে)
                </label>
                <SearchableSelect
                  id="bpSectionSelect"
                  options={[
                    {
                      value: 'BILL_ROW',
                      label: 'Staff Payment',
                      keywords: 'bill payment name voucher',
                    },
                    {
                      value: 'TT_ITEM',
                      label: 'Deduction / S/c / Gratuity / Vat+Tax',
                      keywords: 'tt deduction sc stationary gratuity earn leave vat tax',
                    },
                    {
                      value: 'SALARY_OTHERS',
                      label: '3. Salary & Others',
                      keywords: 'salary others',
                    },
                  ]}
                  value={selectedSection}
                  onChange={handleSelectSection}
                  placeholder="এন্ট্রি ধরন খুঁজুন বা সিলেক্ট করুন..."
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="bpMonthSelect"
                  className="block text-xs font-medium text-[#47554E] mb-1.5"
                >
                  Month (মাসের নাম)
                </label>
                <SearchableSelect
                  id="bpMonthSelect"
                  options={MONTH_OPTIONS.map((m) => ({ value: m, label: m }))}
                  value={data.monthLabel || ''}
                  onChange={(val) => onChange({ ...data, monthLabel: val })}
                  placeholder="মাস খুঁজুন বা সিলেক্ট করুন..."
                />
              </div>
            </div>

            {/* Only Selected Form Renders */}
            {selectedSection === 'BILL_ROW' && (
              <form onSubmit={handleSaveRowEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className={selectedRowId === '__NEW__' ? 'md:col-span-5' : 'md:col-span-9'}>
                    <label className="block text-xs font-medium text-[#47554E] mb-1">
                      নাম নির্বাচন করুন (অথবা নতুন নাম যোগ করুন)
                    </label>
                    <SearchableSelect
                      options={[
                        ...data.rows.map((r) => ({ value: r.id, label: r.name })),
                        ...BILL_PAYMENT_STAFF_CATALOG.filter(
                          (name) =>
                            !data.rows.some(
                              (r) => r.name.trim().toLowerCase() === name.toLowerCase()
                            )
                        ).map((name) => ({
                          value: `catalog:${name}`,
                          label: name,
                        })),
                        {
                          value: '__NEW__',
                          label: '+ নতুন নাম যোগ করুন (New Row)',
                          keywords: 'new add নতুন নাম',
                        },
                      ]}
                      value={selectedRowId}
                      onChange={handleSelectRowId}
                      placeholder="নাম খুঁজুন বা সিলেক্ট করুন..."
                    />
                  </div>

                  {selectedRowId === '__NEW__' && (
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={rowDraft.name}
                        onChange={(e) =>
                          setRowDraft((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="নতুন নাম লিখুন..."
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  )}

                  {selectedRowId !== '' && (
                    <div
                      className={
                        selectedRowId === '__NEW__'
                          ? 'md:col-span-2 flex items-end pb-2'
                          : 'md:col-span-3 flex items-end pb-2'
                      }
                    >
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-[#131C18] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rowDraft.ok}
                          onChange={(e) =>
                            setRowDraft((prev) => ({ ...prev, ok: e.target.checked }))
                          }
                          className="w-4 h-4 accent-[#006633]"
                        />
                        <span>ok মার্ক দেখাও</span>
                      </label>
                    </div>
                  )}
                </div>

                {selectedRowId !== '' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-[#47554E]">
                            Voucher Amount
                          </label>
                          <span className="text-[11px] text-[#5B6962]">
                            সেভ হবে: {selectedRowId === '__NEW__' ? 'vo-1' : nextSlotLabel}
                          </span>
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={voucherAmount}
                          onChange={(e) => setVoucherAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#47554E] mb-1">
                          Row Total
                        </label>
                        <div className="px-3 py-2 text-sm text-right font-mono-tabular font-bold bg-[#FEF3C7] border border-[#E5D28A] rounded text-[#131C18]">
                          {formatSheetNum(rowDraftTotal, false)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetRowDraft}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {selectedSection === 'TT_ITEM' && (
              <form onSubmit={handleSaveTTEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className={selectedTTId === '__NEW__' ? 'md:col-span-4' : 'md:col-span-6'}>
                    <label className="block text-xs font-medium text-[#47554E] mb-1">
                      T,T খাত নির্বাচন করুন
                    </label>
                    <SearchableSelect
                      options={[
                        ...data.ttItems.map((t) => ({ value: t.id, label: t.label })),
                        ...BILL_PAYMENT_TT_CATALOG.filter(
                          (label) =>
                            !data.ttItems.some(
                              (t) => t.label.trim().toLowerCase() === label.toLowerCase()
                            )
                        ).map((label) => ({
                          value: `catalog:${label}`,
                          label,
                        })),
                        {
                          value: '__NEW__',
                          label: '+ নতুন T,T খাত যোগ করুন',
                          keywords: 'new add tt নতুন খাত',
                        },
                      ]}
                      value={selectedTTId}
                      onChange={handleSelectTTId}
                      placeholder="T,T খাত খুঁজুন বা সিলেক্ট করুন..."
                    />
                  </div>

                  {selectedTTId === '__NEW__' && (
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        খাতের নাম (Label) *
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={ttDraft.label}
                        onChange={(e) =>
                          setTTDraft((prev) => ({ ...prev, label: e.target.value }))
                        }
                        placeholder="খাতের নাম লিখুন..."
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  )}

                  {selectedTTId !== '' && (
                    <div className={selectedTTId === '__NEW__' ? 'md:col-span-4' : 'md:col-span-6'}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-[#47554E]">
                          Amount
                        </label>
                        {ttDraft.label.toLowerCase().includes('deduction') && (
                          <button
                            type="button"
                            onClick={() =>
                              setTTDraft((prev) => ({
                                ...prev,
                                amount: String(totals.billTotal),
                              }))
                            }
                            className="text-xs text-[#1565C0] hover:underline cursor-pointer"
                          >
                            Use Bill Total ({formatSheetNum(totals.billTotal, false)})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={ttDraft.amount}
                        onChange={(e) =>
                          setTTDraft((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  )}
                </div>

                {selectedTTId !== '' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTTDraft}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {selectedSection === 'SALARY_OTHERS' && (
              <form onSubmit={handleSaveSalaryOthers} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-medium text-[#47554E] mb-1">
                      Salary
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={salaryDraft}
                      onChange={(e) => setSalaryDraft(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#47554E] mb-1">
                      Others
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={othersDraft}
                      onChange={(e) => setOthersDraft(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSalaryOthers}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 2. Updated Summary Tables with Edit & Delete Actions */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-4 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAEFEF]">
              <div>
                <h2 className="text-sm font-semibold text-[#006633]">
                  Bill Payment টেবিল (সেভ করা ডেটা)
                </h2>
                <span className="text-xs text-[#5B6962]">
                  যেকোনো সারিতে Edit চাপলে ফুলস্ক্রিন এডিট পপআপ খুলবে
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetAllToZero}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Table (0)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse text-xs"
                style={{ minWidth: 720 + Math.max(0, totals.voCount - MIN_VO_COLUMNS) * 80 }}
              >
                <thead>
                  <tr className="bg-[#F4F6F5] text-[#47554E] font-semibold">
                    <th className="border border-[#DCE3DF] px-2.5 py-2 text-left">Name</th>
                    {Array.from({ length: totals.voCount }, (_, idx) => (
                      <th
                        key={idx}
                        className="border border-[#DCE3DF] px-2 py-2 text-right"
                      >
                        {getVoLabel(idx)}
                      </th>
                    ))}
                    <th className="border border-[#DCE3DF] px-2.5 py-2 text-right bg-[#ECE7F2]">
                      Total
                    </th>
                    <th className="border border-[#DCE3DF] px-2 py-2 text-center">ok</th>
                    <th className="border border-[#DCE3DF] px-2.5 py-2 text-center w-36">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => {
                    const rowTot = totals.rowTotals[idx];
                    return (
                      <tr key={row.id} className="hover:bg-[#FAFCFB]">
                        <td className="border border-[#DCE3DF] px-2.5 py-2 font-medium">
                          {row.name}
                        </td>
                        {Array.from({ length: totals.voCount }, (_, idx) => {
                          const disp = formatRawOrComma(getRowVoValues(row)[idx] ?? '');
                          return (
                            <td
                              key={idx}
                              className="border border-[#DCE3DF] px-2 py-2 text-right font-mono-tabular"
                              style={{ backgroundColor: disp ? '#FEF3C7' : undefined }}
                            >
                              {disp}
                            </td>
                          );
                        })}
                        <td
                          className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular font-semibold"
                          style={{ backgroundColor: rowTot > 0 ? '#FEF3C7' : undefined }}
                        >
                          {formatSheetNum(rowTot, true)}
                        </td>
                        <td className="border border-[#DCE3DF] px-2 py-2 text-center">
                          {row.ok ? 'ok' : ''}
                        </td>
                        <td className="border border-[#DCE3DF] px-2 py-1.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingRowModal({ ...row })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-medium cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-medium cursor-pointer"
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
                  <tr className="bg-[#F4F6F5] font-bold">
                    <td className="border border-[#DCE3DF] px-2.5 py-2">Total</td>
                    {totals.voTotals.map((voTotal, idx) => (
                      <td
                        key={idx}
                        className="border border-[#DCE3DF] px-2 py-2 text-right font-mono-tabular"
                      >
                        {formatSheetNum(voTotal, false)}
                      </td>
                    ))}
                    <td className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular text-[#006633]">
                      {formatSheetNum(totals.billTotal, false)}
                    </td>
                    <td colSpan={2} className="border border-[#DCE3DF]" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* T,T & Grand Total Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="overflow-x-auto">
                <h3 className="text-xs font-bold text-[#131C18] mb-2">T,T Table</h3>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {data.ttItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAFCFB]">
                        <td className="border border-[#DCE3DF] px-2.5 py-2 font-medium">
                          {item.label}
                        </td>
                        <td className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular">
                          {formatRawOrComma(item.amount)}
                        </td>
                        <td className="border border-[#DCE3DF] px-2 py-1.5 text-center w-36">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingTTModal({ ...item })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-medium cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTT(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#F4F6F5] font-bold">
                      <td className="border border-[#DCE3DF] px-2.5 py-2">total</td>
                      <td className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular text-[#006633]">
                        {formatSheetNum(totals.ttTotal, false)}
                      </td>
                      <td className="border border-[#DCE3DF]" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#131C18] mb-2">
                  Salary &amp; Grand Total
                </h3>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-[#DCE3DF] px-2.5 py-2 font-medium">Salary</td>
                      <td className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular">
                        {formatRawOrComma(data.salary) || '0'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[#DCE3DF] px-2.5 py-2 font-medium">Others</td>
                      <td className="border border-[#DCE3DF] px-2.5 py-2 text-right font-mono-tabular">
                        {formatRawOrComma(data.others) || '0'}
                      </td>
                    </tr>
                    <tr className="bg-[#E8F5E9] font-bold text-sm">
                      <td className="border border-[#DCE3DF] px-2.5 py-2.5">Grand Total</td>
                      <td className="border border-[#DCE3DF] px-2.5 py-2.5 text-right font-mono-tabular text-[#006633]">
                        {formatSheetNum(totals.grandTotal, false)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div ref={previewWrapRef}>
          <div className="bg-white border border-[#DCE3DF] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#EAEFEF] flex items-center justify-between bg-[#FAFBFA]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#131C18]">
                <FileText className="w-4 h-4 text-[#006633]" />
                <span>Print Preview (A4 Portrait)</span>
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
                  <BillPaymentPrintView data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Edit Popup Modal — Bill Payment Row */}
      {editingRowModal && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Bill Payment Row"
        >
          <div className="px-6 py-4 border-b border-[#DCE3DF] flex items-center justify-between bg-[#FAFBFA]">
            <h2 className="text-base font-bold text-[#006633]">
              Edit Bill Payment Entry — {editingRowModal.name}
            </h2>
            <button
              type="button"
              onClick={() => setEditingRowModal(null)}
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
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editingRowModal.name}
                  onChange={(e) =>
                    setEditingRowModal({ ...editingRowModal, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-4 flex items-end pb-2.5">
                <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRowModal.ok}
                    onChange={(e) =>
                      setEditingRowModal({ ...editingRowModal, ok: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#006633]"
                  />
                  <span>ok মার্ক দেখাও</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from(
                {
                  length: Math.max(
                    MIN_VO_COLUMNS,
                    getRowVoValues(editingRowModal).length
                  ),
                },
                (_, idx) => {
                  const value = getRowVoValues(editingRowModal)[idx] ?? '';
                  return (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                        {getVoLabel(idx)}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={value}
                        onChange={(e) =>
                          setEditingRowModal((prev) =>
                            prev ? setRowVoValue(prev, idx, e.target.value) : prev
                          )
                        }
                        placeholder="0"
                        className="w-full px-3 py-2.5 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  );
                }
              )}
              <button
                type="button"
                onClick={() =>
                  setEditingRowModal((prev) =>
                    prev ? setRowVoValue(prev, getRowVoValues(prev).length, '') : prev
                  )
                }
                className="self-end px-3 py-2.5 rounded-md border border-dashed border-[#006633] text-[#006633] text-xs font-semibold hover:bg-[#F0F7F3] cursor-pointer"
              >
                + {getVoLabel(getRowVoValues(editingRowModal).length)}
              </button>
            </div>

            <div className="p-4 bg-[#F8FAF9] border border-[#DCE3DF] rounded-md flex items-center justify-between">
              <span className="text-sm font-semibold text-[#47554E]">Calculated Row Total</span>
              <span className="text-lg font-bold font-mono-tabular text-[#006633]">
                {formatSheetNum(
                  getRowVoValues(editingRowModal).reduce(
                    (acc, value) => acc + parseSheetNum(value),
                    0
                  ),
                  false
                )}
              </span>
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
                onClick={() => setEditingRowModal(null)}
                className="px-5 py-2.5 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fullscreen Edit Popup Modal — T,T Item */}
      {editingTTModal && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Edit T,T Entry"
        >
          <div className="px-6 py-4 border-b border-[#DCE3DF] flex items-center justify-between bg-[#FAFBFA]">
            <h2 className="text-base font-bold text-[#006633]">
              Edit T,T Entry — {editingTTModal.label}
            </h2>
            <button
              type="button"
              onClick={() => setEditingTTModal(null)}
              className="p-2 rounded-md text-[#47554E] hover:bg-[#ECEFF1] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSaveModalTT}
            className="flex-1 overflow-y-auto p-6 max-w-2xl w-full mx-auto space-y-5"
          >
            <div>
              <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                Label
              </label>
              <input
                type="text"
                value={editingTTModal.label}
                onChange={(e) =>
                  setEditingTTModal({ ...editingTTModal, label: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                Amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={editingTTModal.amount}
                onChange={(e) =>
                  setEditingTTModal({ ...editingTTModal, amount: e.target.value })
                }
                placeholder="0"
                className="w-full px-3 py-2.5 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
              />
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
                onClick={() => setEditingTTModal(null)}
                className="px-5 py-2.5 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
