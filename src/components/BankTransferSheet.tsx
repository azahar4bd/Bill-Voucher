import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRightCircle,
  Check,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { BankProfile } from '../data/bankDefaults';
import {
  addSheetAmount,
  BankTransferBlock,
  BANK_TRANSFER_BANK_CATALOG,
  BankTransferSheetData,
  computeBankTransferTotals,
  DEFAULT_BANK_TRANSFER_DATA,
  MONTH_OPTIONS,
  parseSheetNum,
} from '../data/sheetsDefaults';
import { SearchableSelect } from './SearchableSelect';

interface BankTransferPrintViewProps {
  data: BankTransferSheetData;
}

export const BankTransferPrintView: React.FC<BankTransferPrintViewProps> = ({ data }) => {
  const totals = computeBankTransferTotals(data);

  return (
    <div className="sheet-a4-landscape bg-white text-[#111111]">
      <div className="mb-2 text-[14pt] font-normal pl-2">
        Name Of Month- &nbsp;&nbsp;{data.monthLabel}
      </div>

      <table
        className="w-full border-collapse text-[9.5pt]"
        style={{ tableLayout: 'fixed', border: '1.5px solid #111' }}
      >
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              S/L
            </th>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              Bank Name
            </th>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              Account Name
            </th>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              Account number
            </th>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              Routing NO:
            </th>
            <th rowSpan={2} className="border border-[#111] py-1 px-1 text-center font-normal">
              Branch Name
            </th>
            <th colSpan={2} className="border border-[#111] py-0.5 px-1 text-center font-normal">
              Taka
            </th>
          </tr>
          <tr style={{ borderBottom: '1.5px solid #111' }}>
            <th className="border border-[#111] py-0.5 px-1 text-center font-normal">
              Discribetion
            </th>
            <th className="border border-[#111] py-0.5 px-1 text-center font-normal">Taka</th>
          </tr>
        </thead>
        <tbody>
          {data.blocks.map((block, bIdx) => {
            const items =
              block.items.length > 0
                ? block.items
                : [{ id: 'empty', description: '', amount: '' }];
            const blockTotal = totals.blockTotals[bIdx];
            const isLastBlock = bIdx === data.blocks.length - 1;

            return (
              <React.Fragment key={block.id}>
                {items.map((item, iIdx) => {
                  const isFirst = iIdx === 0;
                  const isLastItemWithoutTotal =
                    iIdx === items.length - 1 && !block.showTotalRow;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: isFirst ? '1.5px solid #111' : undefined,
                        borderBottom: isLastItemWithoutTotal ? '1.5px solid #111' : undefined,
                      }}
                    >
                      {isFirst && (
                        <>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1 text-center align-middle"
                          >
                            {bIdx + 1}
                          </td>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1.5 text-center align-middle"
                          >
                            {block.bankName}
                          </td>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1.5 text-center align-middle"
                          >
                            {block.accountName}
                          </td>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1.5 text-center align-middle"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {block.accountNumber}
                          </td>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1 text-center align-middle"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {block.routingNo}
                          </td>
                          <td
                            rowSpan={items.length}
                            className="border border-[#111] py-1 px-1.5 text-center align-middle"
                          >
                            {block.branchName}
                          </td>
                        </>
                      )}
                      <td className="border border-[#111] py-1 px-1.5 text-left">
                        {item.description}
                      </td>
                      <td
                        className={`border border-[#111] py-1 px-1.5 text-right ${
                          item.bold ? 'font-bold' : ''
                        }`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {item.amount}
                      </td>
                    </tr>
                  );
                })}

                {block.showTotalRow && (
                  <tr style={{ borderBottom: '1.5px solid #111' }}>
                    <td colSpan={7} className="border border-[#111] py-1 px-2 text-center font-bold">
                      Total
                    </td>
                    <td
                      className="border border-[#111] py-1 px-1.5 text-right font-bold"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {blockTotal}
                    </td>
                  </tr>
                )}

                {!isLastBlock && (
                  <tr>
                    <td
                      colSpan={8}
                      className="h-5 border-x border-[#111]"
                      style={{ background: '#ffffff' }}
                    />
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          <tr style={{ borderTop: '1.5px solid #111', borderBottom: '1.5px solid #111' }}>
            <td colSpan={7} className="border border-[#111] py-1 px-2 text-center font-bold">
              Grand Total
            </td>
            <td
              className="border border-[#111] py-1 px-1.5 text-right font-bold"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {totals.grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

interface BankTransferSheetProps {
  data: BankTransferSheetData;
  profiles: BankProfile[];
  onChange: (next: BankTransferSheetData) => void;
  onSendToSonaliForm: (block: BankTransferBlock, totalAmount: number) => void;
  onPrint: () => void;
  onSavePdf: () => void;
}

function emptyBlockDraft(): BankTransferBlock {
  return {
    id: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNo: '',
    branchName: '',
    showTotalRow: true,
    items: [],
  };
}

export const BankTransferSheet: React.FC<BankTransferSheetProps> = ({
  data,
  profiles: _profiles,
  onChange,
  onSendToSonaliForm,
  onPrint,
  onSavePdf,
}) => {
  const [viewMode, setViewMode] = useState<'workspace' | 'preview'>('workspace');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [blockDraft, setBlockDraft] = useState<BankTransferBlock>(emptyBlockDraft);
  const [editingBlockModal, setEditingBlockModal] = useState<BankTransferBlock | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.68);
  const totals = computeBankTransferTotals(data);

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
      setScale(Math.min(1, Math.max(0.32, avail / 1122)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  const handleSelectBlock = (id: string) => {
    setSelectedBlockId(id);
    if (!id || id === '__NEW__') {
      setBlockDraft(emptyBlockDraft());
      return;
    }
    if (id.startsWith('catalog:')) {
      const template = BANK_TRANSFER_BANK_CATALOG.find((b) => b.id === id.slice(8));
      if (template) {
        setBlockDraft({ ...template, items: [] });
        return;
      }
    }
    const found = data.blocks.find((b) => b.id === id);
    if (found) {
      // Amounts are not copied into the entry form — only into the table on Save.
      setBlockDraft({
        ...found,
        items: found.items.map((it) => ({ ...it, amount: '' })),
      });
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId) {
      setFeedback('অনুগ্রহ করে আগে ব্যাংক সিলেক্ট করুন।');
      return;
    }
    if (!blockDraft.bankName.trim()) {
      setFeedback('অনুগ্রহ করে Bank Name লিখুন।');
      return;
    }

    const existing =
      selectedBlockId === '__NEW__' || selectedBlockId.startsWith('catalog:')
        ? data.blocks.find(
            (b) =>
              b.accountNumber.trim() !== '' &&
              b.accountNumber === blockDraft.accountNumber.trim()
          )
        : data.blocks.find((b) => b.id === selectedBlockId);

    if (!existing) {
      const created: BankTransferBlock = {
        ...blockDraft,
        id: `bt-${Date.now()}`,
        items: blockDraft.items
          .filter((it) => it.description.trim() !== '' || parseSheetNum(it.amount) !== 0)
          .map((it) => ({ ...it, id: `bti-${Date.now()}-${it.id}` })),
      };
      onChange({ ...data, blocks: [...data.blocks, created] });
      setFeedback(`'${created.bankName}' টেবিলে যোগ ও সেভ হয়েছে!`);
    } else {
      const mergedItems = [...existing.items];
      blockDraft.items.forEach((item) => {
        if (item.description.trim() === '' && parseSheetNum(item.amount) === 0) return;
        const match = mergedItems.find(
          (prev) =>
            prev.id === item.id ||
            (item.description.trim() !== '' &&
              prev.description.trim().toLowerCase() === item.description.trim().toLowerCase())
        );
        if (match) {
          match.description = item.description || match.description;
          match.amount = addSheetAmount(match.amount, item.amount);
          match.bold = item.bold ?? match.bold;
        } else {
          mergedItems.push({ ...item, id: `bti-${Date.now()}-${mergedItems.length}` });
        }
      });
      const updated: BankTransferBlock = {
        ...existing,
        ...blockDraft,
        id: existing.id,
        items: mergedItems,
      };
      onChange({
        ...data,
        blocks: data.blocks.map((b) => (b.id === existing.id ? updated : b)),
      });
      setFeedback(`'${updated.bankName}' আগের amount-এ নতুন amount যোগ করা হয়েছে!`);
    }

    setSelectedBlockId('');
    setBlockDraft(emptyBlockDraft());
  };

  const handleResetDraft = () => {
    if (selectedBlockId === '__NEW__') {
      setBlockDraft(emptyBlockDraft());
    } else {
      setBlockDraft((prev) => ({
        ...prev,
        items: prev.items.map((it) => ({ ...it, amount: '' })),
      }));
    }
  };

  const handleDeleteBlock = (id: string) => {
    const nextBlocks = data.blocks.filter((b) => b.id !== id);
    onChange({ ...data, blocks: nextBlocks });
    if (selectedBlockId === id) {
      const first = nextBlocks[0];
      if (first) {
        setSelectedBlockId(first.id);
        setBlockDraft({
          ...first,
          items: first.items.map((it) => ({ ...it, amount: '' })),
        });
      } else {
        setSelectedBlockId('__NEW__');
        setBlockDraft(emptyBlockDraft());
      }
    }
    setFeedback('ব্যাংক ব্লক ডিলিট করা হয়েছে।');
  };

  const handleSaveModalBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlockModal) return;
    onChange({
      ...data,
      blocks: data.blocks.map((b) =>
        b.id === editingBlockModal.id
          ? { ...editingBlockModal, items: editingBlockModal.items.map((it) => ({ ...it })) }
          : b
      ),
    });
    if (selectedBlockId === editingBlockModal.id) {
      setBlockDraft({
        ...editingBlockModal,
        items: editingBlockModal.items.map((it) => ({ ...it })),
      });
    }
    setEditingBlockModal(null);
    setFeedback('ব্যাংক তথ্য আপডেট হয়েছে!');
  };

  const handleResetAllToZero = () => {
    onChange(DEFAULT_BANK_TRANSFER_DATA);
    setSelectedBlockId('');
    setBlockDraft(emptyBlockDraft());
    setFeedback('সব ডেটা ডিফল্ট ০ / খালি করা হয়েছে।');
  };

  const draftTotal = blockDraft.items.reduce(
    (sum, it) => sum + parseSheetNum(it.amount),
    0
  );

  return (
    <div className="space-y-4">
      {/* Workspace Action Bar */}
      <div className="bg-white border border-[#DCE3DF] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#131C18]">
            Bank Transfer Breakdown {data.monthLabel ? `(${data.monthLabel})` : ''}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6962] mt-0.5 font-mono-tabular">
            <span>{data.blocks.length}টি ব্যাংক</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#006633]">
              Grand Total: {totals.grandTotal.toLocaleString('en-US')}
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
          {/* 1. Searchable Dropdown Selector + Single Bank Entry Form */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <label
                  htmlFor="btBlockSelector"
                  className="block text-xs font-semibold text-[#006633] mb-1.5"
                >
                  ব্যাংক সিলেক্ট করুন (শুধু সিলেক্ট করা ব্যাংকের ফর্ম দেখাবে)
                </label>
                <SearchableSelect
                  id="btBlockSelector"
                  options={[
                    ...data.blocks.map((b, i) => ({
                      value: b.id,
                      label: `${i + 1}. ${b.bankName || 'Unnamed Bank'}${
                        b.accountName ? ` — ${b.accountName}` : ''
                      }`,
                      keywords: `${b.bankName} ${b.accountName} ${b.accountNumber} ${b.routingNo}`,
                    })),
                    ...BANK_TRANSFER_BANK_CATALOG.filter(
                      (template) =>
                        !data.blocks.some((b) => b.accountNumber === template.accountNumber)
                    ).map((template) => ({
                      value: `catalog:${template.id}`,
                      label: template.bankName,
                      keywords: `${template.accountNumber} ${template.routingNo} ${template.branchName}`,
                    })),
                    {
                      value: '__NEW__',
                      label: '+ নতুন ব্যাংক যোগ করুন (New Bank Block)',
                      keywords: 'new add bank নতুন ব্যাংক',
                    },
                  ]}
                  value={selectedBlockId}
                  onChange={handleSelectBlock}
                  placeholder="ব্যাংক বা একাউন্ট নাম খুঁজুন..."
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="btMonthSelector"
                  className="block text-xs font-medium text-[#47554E] mb-1.5"
                >
                  Name Of Month (মাসের নাম)
                </label>
                <SearchableSelect
                  id="btMonthSelector"
                  options={MONTH_OPTIONS.map((m) => ({ value: m, label: m }))}
                  value={data.monthLabel}
                  onChange={(val) => onChange({ ...data, monthLabel: val })}
                  placeholder="মাস খুঁজুন বা সিলেক্ট করুন..."
                />
              </div>
            </div>

            {selectedBlockId !== '' && (
              <form
                onSubmit={handleSaveEntry}
                className="space-y-4 pt-4 border-t border-[#EAEFEF]"
              >
                {selectedBlockId === '__NEW__' ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={blockDraft.bankName}
                        onChange={(e) =>
                          setBlockDraft((prev) => ({ ...prev, bankName: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-8">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={blockDraft.accountName}
                        onChange={(e) =>
                          setBlockDraft((prev) => ({ ...prev, accountName: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Account number
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={blockDraft.accountNumber}
                        onChange={(e) =>
                          setBlockDraft((prev) => ({
                            ...prev,
                            accountNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Routing NO:
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={blockDraft.routingNo}
                        onChange={(e) =>
                          setBlockDraft((prev) => ({ ...prev, routingNo: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-[#47554E] mb-1">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={blockDraft.branchName}
                        onChange={(e) =>
                          setBlockDraft((prev) => ({ ...prev, branchName: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#47554E] flex flex-wrap items-center gap-2 font-mono-tabular">
                    <span className="font-semibold text-[#131C18]">{blockDraft.bankName}</span>
                    <span aria-hidden="true">·</span>
                    <span>A/C: {blockDraft.accountNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>Routing: {blockDraft.routingNo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{blockDraft.branchName}</span>
                  </div>
                )}

                {/* Line Items for Selected Bank */}
                <div className="pt-3 border-t border-[#EAEFEF] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#47554E]">
                      Discribetion &amp; Taka (Selected Bank Total:{' '}
                      <span className="font-mono-tabular text-[#006633]">
                        {draftTotal.toLocaleString('en-US')}
                      </span>
                      )
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-1.5 text-xs text-[#47554E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blockDraft.showTotalRow}
                          onChange={(e) =>
                            setBlockDraft((prev) => ({
                              ...prev,
                              showTotalRow: e.target.checked,
                            }))
                          }
                          className="accent-[#006633]"
                        />
                        <span>টেবিলে Total সারি দেখাও</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBlockDraft((prev) => ({
                            ...prev,
                            items: [
                              ...prev.items,
                              { id: `bti-${Date.now()}`, description: '', amount: '' },
                            ],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#006633] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>নতুন আইটেম</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {blockDraft.items.map((item, iIdx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          autoComplete="off"
                          value={item.description}
                          onChange={(e) =>
                            setBlockDraft((prev) => ({
                              ...prev,
                              items: prev.items.map((it, idx) =>
                                idx === iIdx ? { ...it, description: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Discribetion"
                          className="col-span-7 px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={item.amount}
                          onChange={(e) =>
                            setBlockDraft((prev) => ({
                              ...prev,
                              items: prev.items.map((it, idx) =>
                                idx === iIdx ? { ...it, amount: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="0"
                          className="col-span-4 px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (blockDraft.items.length <= 1) return;
                            setBlockDraft((prev) => ({
                              ...prev,
                              items: prev.items.filter((_, idx) => idx !== iIdx),
                            }));
                          }}
                          className="col-span-1 flex justify-center p-1.5 text-[#8A9790] hover:text-[#C62828] cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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

          {/* 2. Bank Transfer Table with Edit / Delete */}
          <section className="bg-white border border-[#DCE3DF] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAEFEF]">
              <div>
                <h2 className="text-sm font-semibold text-[#006633]">
                  Bank Transfer টেবিল (Name Of Month- {data.monthLabel || '___'})
                </h2>
                <span className="text-xs text-[#5B6962]">
                  Edit বাটনে চাপলে ফুলস্ক্রিন এডিট পপআপ খুলবে
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
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F6F5] text-[#47554E] font-semibold">
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      S/L
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Bank Name
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Account Name
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Account number
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Routing NO:
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Branch Name
                    </th>
                    <th colSpan={2} className="border border-[#BFCAC4] px-2 py-1 text-center">
                      Taka
                    </th>
                    <th rowSpan={2} className="border border-[#BFCAC4] px-2 py-2 text-center w-44">
                      Action
                    </th>
                  </tr>
                  <tr className="bg-[#F4F6F5] text-[#47554E] font-semibold">
                    <th className="border border-[#BFCAC4] px-2 py-1 text-center">Discribetion</th>
                    <th className="border border-[#BFCAC4] px-2 py-1 text-center">Taka</th>
                  </tr>
                </thead>
                <tbody>
                  {data.blocks.map((block, bIdx) => {
                    const items =
                      block.items.length > 0
                        ? block.items
                        : [{ id: 'empty', description: '', amount: '' }];
                    const blockTotal = totals.blockTotals[bIdx];

                    return (
                      <React.Fragment key={block.id}>
                        {items.map((item, iIdx) => {
                          const isFirst = iIdx === 0;
                          return (
                            <tr key={item.id} className="hover:bg-[#FAFCFB]">
                              {isFirst && (
                                <>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle font-semibold"
                                  >
                                    {bIdx + 1}
                                  </td>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle"
                                  >
                                    {block.bankName}
                                  </td>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle"
                                  >
                                    {block.accountName}
                                  </td>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle font-mono-tabular"
                                  >
                                    {block.accountNumber}
                                  </td>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle font-mono-tabular"
                                  >
                                    {block.routingNo}
                                  </td>
                                  <td
                                    rowSpan={items.length}
                                    className="border border-[#BFCAC4] px-2 py-2 text-center align-middle"
                                  >
                                    {block.branchName}
                                  </td>
                                </>
                              )}
                              <td className="border border-[#BFCAC4] px-2 py-1.5">
                                {item.description}
                              </td>
                              <td className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular">
                                {item.amount}
                              </td>
                              {isFirst && (
                                <td
                                  rowSpan={items.length}
                                  className="border border-[#BFCAC4] px-2 py-2 text-center align-middle"
                                >
                                  <div className="flex flex-col gap-1.5 items-center">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingBlockModal({
                                            ...block,
                                            items: block.items.map((it) => ({ ...it })),
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-medium cursor-pointer"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-medium cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onSendToSonaliForm(block, blockTotal)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#006633] hover:bg-[#004E27] text-white text-xs font-medium cursor-pointer whitespace-nowrap"
                                    >
                                      <ArrowRightCircle className="w-3 h-3" />
                                      <span>BEFTN/RTGS-এ নিন</span>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {block.showTotalRow && (
                          <tr className="bg-[#F8FAF9] font-bold">
                            <td colSpan={7} className="border border-[#BFCAC4] px-2 py-1.5 text-center">
                              Total
                            </td>
                            <td className="border border-[#BFCAC4] px-2 py-1.5 text-right font-mono-tabular">
                              {blockTotal.toLocaleString('en-US')}
                            </td>
                            <td className="border border-[#BFCAC4]" />
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-[#E8F5E9] font-bold text-sm">
                    <td colSpan={7} className="border border-[#BFCAC4] px-2 py-2 text-center">
                      Grand Total
                    </td>
                    <td className="border border-[#BFCAC4] px-2 py-2 text-right font-mono-tabular text-[#006633]">
                      {totals.grandTotal.toLocaleString('en-US')}
                    </td>
                    <td className="border border-[#BFCAC4]" />
                  </tr>
                </tbody>
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
                <span>Print Preview (A4 Landscape)</span>
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
                  <BankTransferPrintView data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Edit Popup Modal */}
      {editingBlockModal && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Bank Transfer Block"
        >
          <div className="px-6 py-4 border-b border-[#DCE3DF] flex items-center justify-between bg-[#FAFBFA]">
            <h2 className="text-base font-bold text-[#006633]">
              Edit Bank Block — {editingBlockModal.bankName}
            </h2>
            <button
              type="button"
              onClick={() => setEditingBlockModal(null)}
              className="p-2 rounded-md text-[#47554E] hover:bg-[#ECEFF1] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSaveModalBlock}
            className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editingBlockModal.bankName}
                  onChange={(e) =>
                    setEditingBlockModal({
                      ...editingBlockModal,
                      bankName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={editingBlockModal.accountName}
                  onChange={(e) =>
                    setEditingBlockModal({
                      ...editingBlockModal,
                      accountName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Account number
                </label>
                <input
                  type="text"
                  value={editingBlockModal.accountNumber}
                  onChange={(e) =>
                    setEditingBlockModal({
                      ...editingBlockModal,
                      accountNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Routing NO:
                </label>
                <input
                  type="text"
                  value={editingBlockModal.routingNo}
                  onChange={(e) =>
                    setEditingBlockModal({
                      ...editingBlockModal,
                      routingNo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-[#47554E] mb-1.5">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={editingBlockModal.branchName}
                  onChange={(e) =>
                    setEditingBlockModal({
                      ...editingBlockModal,
                      branchName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAEFEF] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#47554E]">
                  Discribetion &amp; Taka
                </span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBlockModal.showTotalRow}
                      onChange={(e) =>
                        setEditingBlockModal({
                          ...editingBlockModal,
                          showTotalRow: e.target.checked,
                        })
                      }
                      className="accent-[#006633]"
                    />
                    <span>Total সারি দেখাও</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingBlockModal({
                        ...editingBlockModal,
                        items: [
                          ...editingBlockModal.items,
                          { id: `bti-${Date.now()}`, description: '', amount: '' },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#006633] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {editingBlockModal.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      setEditingBlockModal({
                        ...editingBlockModal,
                        items: editingBlockModal.items.map((it, i) =>
                          i === idx ? { ...it, description: e.target.value } : it
                        ),
                      })
                    }
                    placeholder="Description"
                    className="col-span-7 px-3 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={item.amount}
                    onChange={(e) =>
                      setEditingBlockModal({
                        ...editingBlockModal,
                        items: editingBlockModal.items.map((it, i) =>
                          i === idx ? { ...it, amount: e.target.value } : it
                        ),
                      })
                    }
                    placeholder="0"
                    className="col-span-4 px-3 py-2 text-sm text-right font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:border-[#006633]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editingBlockModal.items.length <= 1) return;
                      setEditingBlockModal({
                        ...editingBlockModal,
                        items: editingBlockModal.items.filter((_, i) => i !== idx),
                      });
                    }}
                    className="col-span-1 flex justify-center p-1.5 text-[#8A9790] hover:text-[#C62828] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                onClick={() => setEditingBlockModal(null)}
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
