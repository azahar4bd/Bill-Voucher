import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Cloud,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AddBankModal } from './components/AddBankModal';
import { CloudSyncPanel } from './components/CloudSyncPanel';
import { BankTransferPrintView, BankTransferSheet } from './components/BankTransferSheet';
import { BillPaymentPrintView, BillPaymentSheet } from './components/BillPaymentSheet';
import { ChallanPrintView, ChallanSheet } from './components/ChallanSheet';
import {
  MonthlyVoucherPrintView,
  MonthlyVoucherSheet,
} from './components/MonthlyVoucherSheet';
import { SearchableSelect } from './components/SearchableSelect';
import { SonaliFormSheet } from './components/SonaliFormSheet';
import {
  amountInWords,
  BankProfile,
  DEFAULT_PROFILES,
  DEFAULT_SENDER,
  FormType,
  ReceiverFormData,
  SenderFormData,
  STORAGE_KEY_PROFILES,
  todayDDMMYYYY,
} from './data/bankDefaults';
import {
  AppPage,
  BankTransferBlock,
  BankTransferSheetData,
  BillPaymentSheetData,
  ChallanSheetData,
  DEFAULT_BANK_TRANSFER_DATA,
  DEFAULT_BILL_PAYMENT_DATA,
  DEFAULT_MONTHLY_VOUCHER_DATA,
  DEFAULT_TAX_CHALLAN_DATA,
  DEFAULT_VAT_CHALLAN_DATA,
  fixGratuitySpellingInText,
  getRowVoValues,
  MonthlyVoucherSheetData,
  parseSheetNum,
  STORAGE_KEY_BANK_TRANSFER,
  STORAGE_KEY_BILL_PAYMENT,
  STORAGE_KEY_MONTHLY_VOUCHER,
  STORAGE_KEY_TAX_CHALLAN,
  STORAGE_KEY_VAT_CHALLAN,
  syncMonthlyVoucherRatesFromChallan,
} from './data/sheetsDefaults';
import {
  generateBankTransferPdf,
  generateBillPaymentPdf,
  generateMonthlyVoucherPdf,
} from './utils/generateSheetsPdf';
import { generateSonaliPdf } from './utils/generateSonaliPdf';

function loadInitialProfiles(): BankProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface ToastState {
  message: string;
  tone: 'success' | 'warning' | 'error';
}

function normalizeBankBlock(block: BankTransferBlock): BankTransferBlock {
  const legacy = block.accountName || '';
  if (legacy.includes('Gratuity')) {
    return { ...block, bankName: 'Bank Asia PLC-Gratuity', accountName: '' };
  }
  if (/PF/i.test(legacy)) {
    return { ...block, bankName: 'UCBL PLC-pf', accountName: '' };
  }
  if (legacy.includes('Bandhu Kallyan Foundation')) {
    return { ...block, bankName: 'Bank Asia PLC-48', accountName: '' };
  }
  return block;
}

export function App() {
  const [profiles, setProfiles] = useState<BankProfile[]>(loadInitialProfiles);
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [profileNameInput, setProfileNameInput] = useState<string>('');

  const [activePage, setActivePage] = useState<AppPage>('BEFTN');
  const formType: FormType = activePage === 'RTGS' ? 'RTGS' : 'BEFTN';
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [billPaymentData, setBillPaymentData] = useState<BillPaymentSheetData>(() => {
    const loaded = loadStoredJson(STORAGE_KEY_BILL_PAYMENT, DEFAULT_BILL_PAYMENT_DATA);
    return {
      ...loaded,
      rows: loaded.rows.filter((r) =>
        getRowVoValues(r).some((v) => parseSheetNum(v) !== 0)
      ),
      ttItems: loaded.ttItems
        .map((item) => ({
          ...item,
          label: fixGratuitySpellingInText(item.label),
        }))
        .filter((item) => parseSheetNum(item.amount) !== 0),
    };
  });
  const [bankTransferData, setBankTransferData] = useState<BankTransferSheetData>(() => {
    const loaded = loadStoredJson(STORAGE_KEY_BANK_TRANSFER, DEFAULT_BANK_TRANSFER_DATA);
    return {
      ...loaded,
      blocks: loaded.blocks
        .map((block) => ({
          ...normalizeBankBlock(block),
          items: block.items
            .map((item) => ({
              ...item,
              description: fixGratuitySpellingInText(item.description),
            }))
            .filter(
              (item) =>
                parseSheetNum(item.amount) !== 0 || item.description.trim() !== ''
            ),
        }))
        .filter((block) => block.items.length > 0),
    };
  });
  const [monthlyVoucherData, setMonthlyVoucherData] = useState<MonthlyVoucherSheetData>(() => {
    const stored = loadStoredJson(STORAGE_KEY_MONTHLY_VOUCHER, DEFAULT_MONTHLY_VOUCHER_DATA);
    const loaded: MonthlyVoucherSheetData = {
      ...stored,
      headRates: stored.headRates ?? {},
      rows: stored.rows.filter(
        (r) =>
          parseSheetNum(r.totalVoucher) !== 0 ||
          parseSheetNum(r.preAmount) !== 0 ||
          parseSheetNum(r.vatManual) !== 0 ||
          parseSheetNum(r.taxManual) !== 0
      ),
    };
    const syncFlagKey = 'sonaliStudio_mv_challanRatesSynced_v3';
    const alreadySynced = (() => {
      try {
        return localStorage.getItem(syncFlagKey) === '1';
      } catch {
        return false;
      }
    })();

    const updatedRows = syncMonthlyVoucherRatesFromChallan(
      loaded.rows.map((r) =>
        r.id === 'mv-4' && r.vatRate === '15' && r.taxRate === '10' && !alreadySynced
          ? { ...r, vatRate: '', taxRate: '' }
          : r
      ),
      !alreadySynced
    );

    const nextData: MonthlyVoucherSheetData = { ...loaded, rows: updatedRows };
    if (!alreadySynced) {
      try {
        localStorage.setItem(STORAGE_KEY_MONTHLY_VOUCHER, JSON.stringify(nextData));
        localStorage.setItem(syncFlagKey, '1');
      } catch {
        // Ignore storage quota errors
      }
    }
    return nextData;
  });
  const [vatChallanData, setVatChallanData] = useState<ChallanSheetData>(() =>
    loadStoredJson(STORAGE_KEY_VAT_CHALLAN, DEFAULT_VAT_CHALLAN_DATA)
  );
  const [taxChallanData, setTaxChallanData] = useState<ChallanSheetData>(() =>
    loadStoredJson(STORAGE_KEY_TAX_CHALLAN, DEFAULT_TAX_CHALLAN_DATA)
  );

  const [sender, setSender] = useState<SenderFormData>(() => ({
    date: todayDDMMYYYY(),
    branch: DEFAULT_SENDER.branch,
    accountNumber: DEFAULT_SENDER.accountNumber,
    accountTitle: DEFAULT_SENDER.accountTitle,
    amount: '',
    amountWords: '',
    chequeNo: DEFAULT_SENDER.chequeNo,
    mobileNo: DEFAULT_SENDER.mobileNo,
    branchName: DEFAULT_SENDER.branchName,
  }));

  const [receiver, setReceiver] = useState<ReceiverFormData>({
    receivingBank: '',
    district: '',
    receivingBranch: '',
    routingNumber: '',
    receiverAccountNumber: '',
    receiverName: '',
    receiverMobile: '',
    receiverAmount: '',
    receiverAmountWords: '',
    purpose: '',
  });

  const challanCaptureRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(0.72);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth - 32;
      const a4WidthPx = 794;
      const nextScale = Math.min(1, Math.max(0.35, availableWidth / a4WidthPx));
      setPreviewScale(nextScale);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileTab, activePage]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastState['tone'] = 'success') => {
    setToast({ message, tone });
  };

  const persistProfiles = (next: BankProfile[]) => {
    setProfiles(next);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const updateBillPaymentData = (next: BillPaymentSheetData) => {
    setBillPaymentData(next);
    try {
      localStorage.setItem(STORAGE_KEY_BILL_PAYMENT, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const updateBankTransferData = (next: BankTransferSheetData) => {
    setBankTransferData(next);
    try {
      localStorage.setItem(STORAGE_KEY_BANK_TRANSFER, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const updateMonthlyVoucherData = (next: MonthlyVoucherSheetData) => {
    setMonthlyVoucherData(next);
    try {
      localStorage.setItem(STORAGE_KEY_MONTHLY_VOUCHER, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const updateVatChallanData = (next: ChallanSheetData) => {
    setVatChallanData(next);
    try {
      localStorage.setItem(STORAGE_KEY_VAT_CHALLAN, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const updateTaxChallanData = (next: ChallanSheetData) => {
    setTaxChallanData(next);
    try {
      localStorage.setItem(STORAGE_KEY_TAX_CHALLAN, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleSendBankBlockToSonali = (block: BankTransferBlock, totalAmount: number) => {
    const parts = block.branchName
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const districtGuess = parts.length >= 2 ? parts[parts.length - 1] : '';
    const branchGuess =
      parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1] || '';

    const amtStr = totalAmount > 0 ? String(totalAmount) : '';
    const words = amtStr ? amountInWords(amtStr) : '';

    setSender((prev) => ({
      ...prev,
      amount: amtStr,
      amountWords: words,
    }));
    setReceiver((prev) => ({
      ...prev,
      receivingBank: block.bankName,
      receivingBranch: branchGuess,
      district: districtGuess,
      routingNumber: block.routingNo,
      receiverAccountNumber: block.accountNumber,
      receiverName: block.accountName,
      receiverAmount: amtStr,
      receiverAmountWords: words,
      purpose:
        block.items
          .map((i) => i.description)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ') || 'Fund Transfer',
    }));
    setActivePage('BEFTN');
    showToast(`${block.bankName} (${amtStr || '0'}/-) BEFTN ফর্মে লোড হয়েছে!`);
  };

  const applyProfile = (profile: BankProfile) => {
    setSelectedProfileName(profile.name);
    setProfileNameInput(profile.name);
    setConfirmDelete(false);
    setReceiver((prev) => ({
      ...prev,
      receivingBank: profile.receiving_bank || '',
      district: profile.district || '',
      receivingBranch: profile.receiving_branch || '',
      routingNumber: profile.routing_number || '',
      receiverAccountNumber: profile.receiver_account_number || '',
      receiverName: profile.receiver_name || '',
      receiverMobile: profile.receiver_mobile || '',
      purpose: profile.purpose || '',
    }));
  };

  const handleProfileDropdownChange = (name: string) => {
    if (!name) {
      setSelectedProfileName('');
      setProfileNameInput('');
      setReceiver((prev) => ({
        ...prev,
        receivingBank: '',
        district: '',
        receivingBranch: '',
        routingNumber: '',
        receiverAccountNumber: '',
        receiverName: '',
        receiverMobile: '',
        purpose: '',
      }));
      return;
    }
    const match = profiles.find((p) => p.name === name);
    if (match) applyProfile(match);
  };

  const handleAmountChange = (rawValue: string) => {
    const cleaned = rawValue.replace(/,/g, '').trim();
    const isNumeric = cleaned !== '' && /^\d+(\.\d+)?$/.test(cleaned);
    const words = isNumeric ? amountInWords(cleaned) : '';

    setSender((prev) => ({
      ...prev,
      amount: rawValue,
      amountWords: words,
    }));
    setReceiver((prev) => ({
      ...prev,
      receiverAmount: isNumeric ? cleaned : '',
      receiverAmountWords: words,
    }));
  };

  const handleNewEntry = () => {
    setSender({
      date: todayDDMMYYYY(),
      branch: DEFAULT_SENDER.branch,
      accountNumber: DEFAULT_SENDER.accountNumber,
      accountTitle: DEFAULT_SENDER.accountTitle,
      amount: '',
      amountWords: '',
      chequeNo: DEFAULT_SENDER.chequeNo,
      mobileNo: DEFAULT_SENDER.mobileNo,
      branchName: DEFAULT_SENDER.branchName,
    });
    setReceiver((prev) => ({
      ...prev,
      receiverAmount: '',
      receiverAmountWords: '',
    }));
    showToast('নতুন এন্ট্রি তৈরি হয়েছে');
  };

  const handleClearAmounts = () => {
    setSender({
      date: sender.date,
      branch: DEFAULT_SENDER.branch,
      accountNumber: DEFAULT_SENDER.accountNumber,
      accountTitle: DEFAULT_SENDER.accountTitle,
      amount: '',
      amountWords: '',
      chequeNo: DEFAULT_SENDER.chequeNo,
      mobileNo: DEFAULT_SENDER.mobileNo,
      branchName: DEFAULT_SENDER.branchName,
    });
    setReceiver((prev) => ({
      ...prev,
      receiverAmount: '',
      receiverAmountWords: '',
      receiverMobile: '',
    }));
    showToast('ফর্ম ক্লিয়ার করা হয়েছে');
  };

  const buildProfileFromInputs = (): BankProfile => ({
    name:
      profileNameInput.trim() ||
      `${receiver.receivingBank.trim()} - ${receiver.receivingBranch.trim()}`,
    receiving_bank: receiver.receivingBank.trim(),
    district: receiver.district.trim(),
    receiving_branch: receiver.receivingBranch.trim(),
    routing_number: receiver.routingNumber.trim(),
    receiver_account_number: receiver.receiverAccountNumber.trim(),
    receiver_name: receiver.receiverName.trim(),
    receiver_mobile: receiver.receiverMobile.trim(),
    purpose: receiver.purpose.trim(),
  });

  const handleSaveNewProfile = () => {
    const nextProfile = buildProfileFromInputs();
    if (!nextProfile.receiving_bank || !nextProfile.receiver_account_number) {
      showToast(
        'Receiving Bank এবং Receiver Account Number অবশ্যই পূরণ করুন।',
        'warning'
      );
      return;
    }
    if (profiles.some((p) => p.name === nextProfile.name)) {
      showToast(
        'এই নামে ইতিমধ্যে প্রোফাইল আছে। Update Selected ব্যবহার করুন।',
        'warning'
      );
      return;
    }
    const updated = [...profiles, nextProfile];
    persistProfiles(updated);
    applyProfile(nextProfile);
    showToast(`'${nextProfile.name}' সেভ হয়েছে!`);
  };

  const handleUpdateSelectedProfile = () => {
    if (!selectedProfileName) {
      showToast('আগে ব্যাংক সিলেক্ট করুন।', 'warning');
      return;
    }
    const nextProfile = buildProfileFromInputs();
    if (!nextProfile.receiving_bank || !nextProfile.receiver_account_number) {
      showToast(
        'Receiving Bank এবং Receiver Account Number অবশ্যই পূরণ করুন।',
        'warning'
      );
      return;
    }
    const updated = profiles.map((p) =>
      p.name === selectedProfileName ? nextProfile : p
    );
    persistProfiles(updated);
    applyProfile(nextProfile);
    showToast('প্রোফাইল আপডেট হয়েছে!');
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileName) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const updated = profiles.filter((p) => p.name !== selectedProfileName);
    persistProfiles(updated);
    setConfirmDelete(false);
    if (updated.length > 0) {
      applyProfile(updated[0]);
    } else {
      setSelectedProfileName('');
      setProfileNameInput('');
    }
    showToast('প্রোফাইল ডিলিট হয়েছে।');
  };

  const triggerActivePdfDownload = async () => {
    if (activePage === 'BILL_PAYMENT') {
      generateBillPaymentPdf(billPaymentData);
      showToast('Bill Payment A4 PDF ডাউনলোড হয়েছে!');
      return;
    }
    if (activePage === 'BANK_TRANSFER') {
      generateBankTransferPdf(bankTransferData);
      showToast('Bank Transfer A4 Landscape PDF ডাউনলোড হয়েছে!');
      return;
    }
    if (activePage === 'MONTHLY_VOUCHER') {
      generateMonthlyVoucherPdf(monthlyVoucherData);
      showToast('Monthly Voucher A4 PDF ডাউনলোড হয়েছে!');
      return;
    }
    if (activePage === 'VAT_CHALLAN' || activePage === 'TAX_CHALLAN') {
      const targetEl = challanCaptureRef.current;
      if (!targetEl) {
        throw new Error('Challan render node missing');
      }
      const dataUrl = await toPng(targetEl, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
      const fname =
        activePage === 'VAT_CHALLAN' ? 'VAT_Challan_TR6.pdf' : 'Tax_Challan_TR6.pdf';
      pdf.save(fname);
      showToast(`${activePage === 'VAT_CHALLAN' ? 'VAT' : 'Tax'} Challan A4 PDF ডাউনলোড হয়েছে!`);
      return;
    }

    generateSonaliPdf(formType, sender, receiver);
    if (!sender.amount.trim()) {
      showToast('PDF ডাউনলোড হয়েছে (Amount খালি ছিল)', 'warning');
    } else {
      showToast(`${formType} A4 PDF ডাউনলোড হয়েছে!`);
    }
  };

  const handleSavePdf = async () => {
    try {
      await triggerActivePdfDownload();
    } catch {
      showToast('PDF তৈরি করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const handlePrint = () => {
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const startedAt = Date.now();
    try {
      window.print();
    } catch {
      // Fall back to direct PDF download if print() throws inside sandbox
    }
    const elapsed = Date.now() - startedAt;

    if (inIframe && elapsed < 80) {
      void triggerActivePdfDownload().catch(() => {
        showToast('PDF তৈরি করতে সমস্যা হয়েছে।', 'error');
      });
      showToast(
        'প্রিভিউ ফ্রেমে সরাসরি Print সীমিত থাকায় A4 PDF ডাউনলোড করা হয়েছে — ফাইলটি ওপেন করে প্রিন্ট করুন।',
        'warning'
      );
    }
  };

  const amtDisp = sender.amount.trim() ? `${sender.amount.trim()}/-` : '___';
  const wordsDisp = sender.amountWords.trim() || '___';

  return (
    <>
      <div id="app-shell" className="min-h-screen flex flex-col bg-[#F4F6F5] text-[#131C18]">
        {/* Top Bar Contract: 1-line brand, concise nav, 1 primary action */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#DCE3DF] px-4 lg:px-6 h-14 flex items-center justify-between gap-8">
          <span className="text-base font-bold tracking-tight text-[#006633] whitespace-nowrap shrink-0">
            Sonali Bank Form Studio
          </span>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#47554E]">
            {(
              [
                { id: 'BEFTN', label: 'BEFTN Form' },
                { id: 'RTGS', label: 'RTGS Form' },
                { id: 'BILL_PAYMENT', label: 'Bill Payment' },
                { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { id: 'MONTHLY_VOUCHER', label: 'Monthly Voucher' },
                { id: 'VAT_CHALLAN', label: 'VAT Challan' },
                { id: 'TAX_CHALLAN', label: 'Tax Challan' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  activePage === item.id
                    ? 'border-[#006633] text-[#006633] font-semibold'
                    : 'border-transparent hover:text-[#131C18]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSyncOpen((open) => !open)}
              title="ডেটা সিঙ্ক"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#006633] text-[#006633] text-sm font-semibold hover:bg-[#F0F7F3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden xl:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
          </div>
        </header>

        {/* Compact Page Switcher for < lg viewports / split preview panes */}
        <div className="lg:hidden bg-white border-b border-[#DCE3DF] px-4 py-2 flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'BEFTN', label: 'BEFTN Form' },
              { id: 'RTGS', label: 'RTGS Form' },
              { id: 'BILL_PAYMENT', label: 'Bill Payment' },
              { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { id: 'MONTHLY_VOUCHER', label: 'Monthly Voucher' },
              { id: 'VAT_CHALLAN', label: 'VAT Challan' },
              { id: 'TAX_CHALLAN', label: 'Tax Challan' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activePage === item.id
                  ? 'bg-[#006633] text-white'
                  : 'bg-[#F4F6F5] text-[#47554E] hover:text-[#131C18]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        {activePage === 'BILL_PAYMENT' && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3">
            <BillPaymentSheet
              data={billPaymentData}
              onChange={updateBillPaymentData}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
            />
          </main>
        )}

        {activePage === 'BANK_TRANSFER' && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3">
            <BankTransferSheet
              data={bankTransferData}
              profiles={profiles}
              onChange={updateBankTransferData}
              onSendToSonaliForm={handleSendBankBlockToSonali}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
            />
          </main>
        )}

        {activePage === 'MONTHLY_VOUCHER' && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3">
            <MonthlyVoucherSheet
              data={monthlyVoucherData}
              onChange={updateMonthlyVoucherData}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
            />
          </main>
        )}

        {activePage === 'VAT_CHALLAN' && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3">
            <ChallanSheet
              mode="VAT"
              data={vatChallanData}
              monthlyVoucherData={monthlyVoucherData}
              onChange={updateVatChallanData}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
            />
          </main>
        )}

        {activePage === 'TAX_CHALLAN' && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3">
            <ChallanSheet
              mode="TAX"
              data={taxChallanData}
              monthlyVoucherData={monthlyVoucherData}
              onChange={updateTaxChallanData}
              onPrint={handlePrint}
              onSavePdf={handleSavePdf}
            />
          </main>
        )}

        {(activePage === 'BEFTN' || activePage === 'RTGS') && (
          <main className="app-workspace compact-ui flex-1 max-w-[1600px] w-full mx-auto px-3 lg:px-5 py-3 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Mobile / Tablet Form Entry vs A4 Preview Switcher */}
          <div className="xl:hidden col-span-1 flex items-center gap-1 p-1 bg-white border border-[#DCE3DF] rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mobileTab === 'editor'
                  ? 'bg-[#006633] text-white'
                  : 'text-[#47554E] hover:text-[#131C18]'
              }`}
            >
              Form Entry
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mobileTab === 'preview'
                  ? 'bg-[#006633] text-white'
                  : 'text-[#47554E] hover:text-[#131C18]'
              }`}
            >
              A4 Preview
            </button>
          </div>

          {/* Left Column: Form Entry */}
          <div
            className={`xl:col-span-6 space-y-4 ${
              mobileTab === 'preview' ? 'hidden xl:block' : 'block'
            }`}
          >
            {/* Bank Profile Management */}
            <section className="bg-white border border-[#DCE3DF] rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#EAEFEF]">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#006633]">
                    উপরে সিলেকশন ও ব্যাংক প্রোফাইল
                  </h2>
                  <span className="text-xs text-[#5B6962]">
                    · {profiles.length}টি সেভ করা ব্যাংক
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBankOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#006633] hover:bg-[#004E27] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>+ নতুন ব্যাংক যোগ করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewEntry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAmounts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] border border-[#B0BEC5] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="formTypeSelect"
                    className="block text-xs font-medium text-[#47554E] mb-1"
                  >
                    Form Type
                  </label>
                  <SearchableSelect
                    id="formTypeSelect"
                    options={[
                      {
                        value: 'BEFTN',
                        label: 'BEFTN (Outward Credit)',
                        keywords: 'beftn outward credit',
                      },
                      { value: 'RTGS', label: 'RTGS Application', keywords: 'rtgs' },
                    ]}
                    value={formType}
                    onChange={(val) => setActivePage(val as FormType)}
                    placeholder="Form Type সিলেক্ট করুন..."
                  />
                </div>

                <div className="sm:col-span-8">
                  <label
                    htmlFor="profileSelect"
                    className="block text-xs font-medium text-[#47554E] mb-1"
                  >
                    Saved Bank Profile
                  </label>
                  <SearchableSelect
                    id="profileSelect"
                    options={profiles.map((p) => ({
                      value: p.name,
                      label: p.name,
                      keywords: `${p.receiving_bank} ${p.receiving_branch} ${p.district} ${p.receiver_account_number}`,
                    }))}
                    value={selectedProfileName}
                    onChange={handleProfileDropdownChange}
                    placeholder="ব্যাংক প্রোফাইল খুঁজুন বা সিলেক্ট করুন..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-5">
                  <label
                    htmlFor="profileNameInput"
                    className="block text-xs font-medium text-[#47554E] mb-1"
                  >
                    Profile Name
                  </label>
                  <input
                    id="profileNameInput"
                    type="text"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    placeholder="যেমন: Dutch Bangla - Uttara"
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-7 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNewProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#006633] hover:bg-[#004E27] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save as New</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSelectedProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </button>
                  {confirmDelete ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleDeleteProfile}
                        className="px-2.5 py-1.5 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1.5 rounded bg-[#ECEFF1] text-[#333] text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#C62828] hover:bg-[#8E0000] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2.5 text-xs text-[#5B6962]">
                ব্যাংক সিলেক্ট করলেই নিচের সব ঘর অটো পূরণ হবে। সেভ করা ব্যাংক প্রোফাইল এই ব্রাউজারেই সংরক্ষিত থাকে।
              </p>
            </section>

            {/* Sender Details */}
            <section className="bg-white border border-[#DCE3DF] rounded-lg p-4">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#EAEFEF]">
                <h2 className="text-sm font-semibold text-[#006633]">
                  Sender Details (প্রেরকের তথ্য)
                </h2>
                <span className="text-xs text-[#5B6962]">Bandhu Kallyan Foundation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Date (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    value={sender.date}
                    onChange={(e) =>
                      setSender((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Branch (The Manager, ... Branch)
                  </label>
                  <input
                    type="text"
                    value={sender.branch}
                    onChange={(e) =>
                      setSender((prev) => ({ ...prev, branch: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Account Holder&apos;s Branch Name
                  </label>
                  <input
                    type="text"
                    value={sender.branchName}
                    onChange={(e) =>
                      setSender((prev) => ({ ...prev, branchName: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={sender.accountNumber}
                    onChange={(e) =>
                      setSender((prev) => ({
                        ...prev,
                        accountNumber: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Account Title
                  </label>
                  <input
                    type="text"
                    value={sender.accountTitle}
                    onChange={(e) =>
                      setSender((prev) => ({
                        ...prev,
                        accountTitle: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Amount (Tk) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={sender.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="যেমন: 2000"
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular font-semibold text-[#006633] bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Amount in Words
                  </label>
                  <input
                    type="text"
                    value={sender.amountWords}
                    onChange={(e) =>
                      setSender((prev) => ({
                        ...prev,
                        amountWords: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Cheque No
                  </label>
                  <input
                    type="text"
                    value={sender.chequeNo}
                    onChange={(e) =>
                      setSender((prev) => ({ ...prev, chequeNo: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Account Holder&apos;s Mobile No
                  </label>
                  <input
                    type="text"
                    value={sender.mobileNo}
                    onChange={(e) =>
                      setSender((prev) => ({ ...prev, mobileNo: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
              </div>
            </section>

            {/* Receiver Details */}
            <section className="bg-white border border-[#DCE3DF] rounded-lg p-4">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#EAEFEF]">
                <h2 className="text-sm font-semibold text-[#006633]">
                  Receiver&apos;s Details (প্রাপকের তথ্য)
                </h2>
                <span className="text-xs text-[#5B6962]">
                  প্রোফাইল থেকে অটো পূরণ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Receiving Bank
                  </label>
                  <input
                    type="text"
                    value={receiver.receivingBank}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receivingBank: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={receiver.district}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        district: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Receiving Branch
                  </label>
                  <input
                    type="text"
                    value={receiver.receivingBranch}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receivingBranch: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={receiver.routingNumber}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        routingNumber: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    {formType === 'BEFTN'
                      ? "Receiver's Account Number"
                      : 'Receiving Account Number'}
                  </label>
                  <input
                    type="text"
                    value={receiver.receiverAccountNumber}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receiverAccountNumber: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Receiver&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={receiver.receiverName}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receiverName: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Receiver&apos;s Mobile No
                  </label>
                  <input
                    type="text"
                    value={receiver.receiverMobile}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receiverMobile: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Receiver Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={receiver.receiverAmount}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receiverAmount: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Amount in Words (Receiver)
                  </label>
                  <input
                    type="text"
                    value={receiver.receiverAmountWords}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        receiverAmountWords: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-medium text-[#47554E] mb-1">
                    Purpose of Transaction
                  </label>
                  <input
                    type="text"
                    value={receiver.purpose}
                    onChange={(e) =>
                      setReceiver((prev) => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
                  />
                </div>
              </div>
            </section>

            {/* Acknowledgement Live Summary */}
            <section className="bg-white border border-[#DCE3DF] rounded-lg p-4">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#EAEFEF]">
                <h2 className="text-sm font-semibold text-[#006633]">
                  Acknowledgement Summary
                </h2>
                <span className="text-xs text-[#5B6962]">
                  {formType} Outward Application
                </span>
              </div>
              <div className="bg-[#F8FAF9] border border-dashed border-[#B5C4BC] rounded p-3 text-xs leading-relaxed text-[#24332C] space-y-1 font-mono-tabular">
                <div>
                  Dated: {sender.date} · Form: {formType}
                </div>
                <div>
                  Acknowledge that Sonali Bank Limited, {sender.branch} Branch has
                  debited Tk. {amtDisp} (In words: {wordsDisp}) from account number{' '}
                  {sender.accountNumber} For {formType} to Account number{' '}
                  {receiver.receiverAccountNumber} of {receiver.receivingBank} Bank
                  of{' '}
                  {formType === 'RTGS' && receiver.district
                    ? `${receiver.receivingBranch},${receiver.district}`
                    : receiver.receivingBranch}{' '}
                  Branch.
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#006633] hover:bg-[#004E27] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Save as PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#131C18] border border-[#B0BEC5] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
                <span className="text-xs text-[#5B6962]">
                  &quot;Save as PDF&quot; চাপলে সরাসরি A4 PDF ফাইল ডাউনলোড হবে।
                </span>
              </div>
            </section>
          </div>

          {/* Right Column: Live A4 Print Layout Preview */}
          <div
            ref={previewContainerRef}
            className={`xl:col-span-6 ${
              mobileTab === 'editor' ? 'hidden xl:block' : 'block'
            }`}
          >
            <div className="bg-white border border-[#DCE3DF] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#EAEFEF] flex items-center justify-between bg-[#FAFBFA]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#131C18]">
                  <FileText className="w-4 h-4 text-[#006633]" />
                  <span>Live A4 Print Preview ({formType})</span>
                </div>
                <span className="text-xs font-mono-tabular text-[#5B6962]">
                  A4 · {Math.round(previewScale * 100)}%
                </span>
              </div>

              <div className="bg-[#E3E8E5] p-4 flex justify-center overflow-x-auto">
                <div
                  style={{
                    width: `${794 * previewScale}px`,
                    height: `${1123 * previewScale}px`,
                    position: 'relative',
                  }}
                >
                  <div
                    className="origin-top-left shadow-md"
                    style={{
                      width: '210mm',
                      transform: `scale(${previewScale})`,
                    }}
                  >
                    <SonaliFormSheet
                      formType={formType}
                      sender={sender}
                      receiver={receiver}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          </main>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-md shadow-lg text-sm font-medium text-white ${
              toast.tone === 'warning'
                ? 'bg-[#D97706]'
                : toast.tone === 'error'
                ? 'bg-[#C62828]'
                : 'bg-[#006633]'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      {isSyncOpen && (
        <CloudSyncPanel
          onClose={() => setIsSyncOpen(false)}
          notify={showToast}
        />
      )}

      {/* Add New Bank Modal */}
      <AddBankModal
        isOpen={isAddBankOpen}
        existingNames={profiles.map((p) => p.name)}
        onClose={() => setIsAddBankOpen(false)}
        onSaveBank={(newProfile) => {
          const updated = [...profiles, newProfile];
          persistProfiles(updated);
          applyProfile(newProfile);
          setIsAddBankOpen(false);
          showToast(`'${newProfile.name}' ব্যাংক সেভ হয়েছে!`);
        }}
      />

      {/* Offscreen unscaled A4 Landscape capture container for Challan PDF export */}
      {(activePage === 'VAT_CHALLAN' || activePage === 'TAX_CHALLAN') && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            pointerEvents: 'none',
            zIndex: -1,
            width: '297mm',
            height: '210mm',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <div ref={challanCaptureRef} style={{ width: '297mm', height: '210mm' }}>
            <ChallanPrintView
              mode={activePage === 'VAT_CHALLAN' ? 'VAT' : 'TAX'}
              data={activePage === 'VAT_CHALLAN' ? vatChallanData : taxChallanData}
              monthlyVoucherData={monthlyVoucherData}
            />
          </div>
        </div>
      )}

      {/* Dedicated A4 Print Portal (visible only during @media print) */}
      <div id="print-portal">
        {activePage === 'BILL_PAYMENT' && <BillPaymentPrintView data={billPaymentData} />}
        {activePage === 'BANK_TRANSFER' && (
          <BankTransferPrintView data={bankTransferData} />
        )}
        {activePage === 'MONTHLY_VOUCHER' && (
          <MonthlyVoucherPrintView data={monthlyVoucherData} />
        )}
        {activePage === 'VAT_CHALLAN' && (
          <ChallanPrintView
            mode="VAT"
            data={vatChallanData}
            monthlyVoucherData={monthlyVoucherData}
          />
        )}
        {activePage === 'TAX_CHALLAN' && (
          <ChallanPrintView
            mode="TAX"
            data={taxChallanData}
            monthlyVoucherData={monthlyVoucherData}
          />
        )}
        {(activePage === 'BEFTN' || activePage === 'RTGS') && (
          <SonaliFormSheet formType={formType} sender={sender} receiver={receiver} />
        )}
      </div>
    </>
  );
}

export default App;
