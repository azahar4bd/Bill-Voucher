import React, { useEffect, useState } from 'react';
import { Building2, Save, X } from 'lucide-react';
import { BankProfile } from '../data/bankDefaults';

interface AddBankModalProps {
  isOpen: boolean;
  existingNames: string[];
  onClose: () => void;
  onSaveBank: (profile: BankProfile) => void;
}

export const AddBankModal: React.FC<AddBankModalProps> = ({
  isOpen,
  existingNames,
  onClose,
  onSaveBank,
}) => {
  const [receivingBank, setReceivingBank] = useState('');
  const [receivingBranch, setReceivingBranch] = useState('');
  const [district, setDistrict] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('Bandhu Kallyan Foundation');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [purpose, setPurpose] = useState('Fund Transfer');
  const [customProfileName, setCustomProfileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setReceivingBank('');
    setReceivingBranch('');
    setDistrict('');
    setRoutingNumber('');
    setAccountNumber('');
    setReceiverName('Bandhu Kallyan Foundation');
    setReceiverMobile('');
    setPurpose('Fund Transfer');
    setCustomProfileName('');
    setErrorMsg('');
  }, [isOpen]);

  if (!isOpen) return null;

  const autoProfileName = [receivingBank.trim(), receivingBranch.trim()]
    .filter(Boolean)
    .join(' - ');
  const resolvedProfileName = customProfileName.trim() || autoProfileName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingBank.trim()) {
      setErrorMsg('ব্যাংকের নাম (Receiving Bank) অবশ্যই লিখুন।');
      return;
    }
    if (!receivingBranch.trim()) {
      setErrorMsg('শাখার নাম (Branch) অবশ্যই লিখুন।');
      return;
    }
    if (!routingNumber.trim()) {
      setErrorMsg('রাউটিং নম্বর (Routing Number) অবশ্যই লিখুন।');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMsg('হিসাব নম্বর (Account Number) অবশ্যই লিখুন।');
      return;
    }
    if (existingNames.includes(resolvedProfileName)) {
      setErrorMsg(
        `"${resolvedProfileName}" নামে একটি ব্যাংক ইতিমধ্যে সেভ করা আছে। অনুগ্রহ করে প্রোফাইলের নাম পরিবর্তন করুন।`
      );
      return;
    }

    onSaveBank({
      name: resolvedProfileName,
      receiving_bank: receivingBank.trim(),
      district: district.trim(),
      receiving_branch: receivingBranch.trim(),
      routing_number: routingNumber.trim(),
      receiver_account_number: accountNumber.trim(),
      receiver_name: receiverName.trim(),
      receiver_mobile: receiverMobile.trim(),
      purpose: purpose.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bank-title"
    >
      <div className="w-full max-w-xl bg-white border border-[#DCE3DF] rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAEFEF] bg-[#FAFBFA]">
          <div className="flex items-center gap-2 text-[#006633]">
            <Building2 className="w-4 h-4" />
            <h2 id="add-bank-title" className="text-base font-bold text-[#131C18]">
              নতুন ব্যাংক যোগ করুন (Add New Bank)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded text-[#5B6962] hover:text-[#131C18] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="px-3 py-2 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                ব্যাংকের নাম (Bank Name) *
              </label>
              <input
                type="text"
                autoFocus
                value={receivingBank}
                onChange={(e) => {
                  setReceivingBank(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="যেমন: Dutch-Bangla Bank PLC"
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                শাখা (Branch) *
              </label>
              <input
                type="text"
                value={receivingBranch}
                onChange={(e) => {
                  setReceivingBranch(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="যেমন: Uttara Branch"
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                জেলা (District)
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="যেমন: Dhaka"
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                রাউটিং নং (Routing No) *
              </label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => {
                  setRoutingNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="যেমন: 090264635"
                className="w-full px-2.5 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                হিসাব নং (Account No) *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="যেমন: 1171100012345"
                className="w-full px-2.5 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                প্রাপকের নাম (Account Title / Receiver Name)
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                মোবাইল নং (Mobile No)
              </label>
              <input
                type="text"
                value={receiverMobile}
                onChange={(e) => setReceiverMobile(e.target.value)}
                placeholder="ঐচ্ছিক"
                className="w-full px-2.5 py-2 text-sm font-mono-tabular bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                লেনদেনের উদ্দেশ্য (Purpose)
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="যেমন: Fund Transfer"
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-[#47554E] mb-1">
                প্রোফাইলের নাম (Saved Label)
              </label>
              <input
                type="text"
                value={customProfileName}
                onChange={(e) => {
                  setCustomProfileName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={autoProfileName || 'যেমন: DBBL - Uttara (Salary)'}
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#BFCAC4] rounded focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAEFEF] flex items-center justify-between gap-3">
            <span className="text-xs text-[#5B6962]">
              সেভ করলে এই ব্রাউজারে স্থায়ীভাবে সংরক্ষিত থাকবে।
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#263238] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#006633] hover:bg-[#004E27] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ব্যাংক সেভ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
