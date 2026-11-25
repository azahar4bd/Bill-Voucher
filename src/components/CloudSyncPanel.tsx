import React, { useEffect, useRef, useState } from 'react';
import {
  CloudDownload,
  CloudUpload,
  Download,
  FileJson,
  Upload,
  X,
} from 'lucide-react';
import {
  applyRemoteData,
  collectLocalData,
  emitStatus,
  getLastSyncedAt,
  getSyncCode,
  pullAndApply,
  pushToCloud,
  reconcileAutoSync,
  scheduleAutoPush,
  setSyncCode,
  type Payload,
} from '../utils/autoSync';

interface CloudSyncPanelProps {
  onClose: () => void;
  notify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

const formatTime = (at: number | null) =>
  at ? new Date(at).toLocaleString('bn-BD') : '';

export function CloudSyncPanel({ onClose, notify }: CloudSyncPanelProps) {
  const [code, setCode] = useState(() => getSyncCode() || '');
  const [busy, setBusy] = useState<'push' | 'pull' | null>(null);
  const [lastSync, setLastSync] = useState(() => formatTime(getLastSyncedAt(getSyncCode())));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const trimmedCode = code.trim();
  const validCode = /^[A-Za-z0-9_-]{4,64}$/.test(trimmedCode);

  // Joining or changing a workspace auto-reconciles after the user stops typing.
  useEffect(() => {
    if (!validCode) return;
    let cancelled = false;
    const delay = firstRun.current ? 0 : 800;
    firstRun.current = false;
    const timer = window.setTimeout(async () => {
      const result = await reconcileAutoSync(trimmedCode);
      if (cancelled) return;
      setLastSync(formatTime(getLastSyncedAt(trimmedCode)));
      if (result === 'pulled') {
        notifyRef.current('ক্লাউডের ডেটা লোড হয়েছে—পেইজ রিফ্রেশ হচ্ছে…');
        window.setTimeout(() => window.location.reload(), 500);
      }
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedCode, validCode]);

  const saveCode = (value: string) => {
    setCode(value);
    setSyncCode(value);
    setLastSync(formatTime(getLastSyncedAt(value.trim())));
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(value.trim())) emitStatus('offline');
  };

  const push = async () => {
    if (!validCode) {
      notify('কোড কমপক্ষে ৪ অক্ষরের হতে হবে (A-Z, 0-9, -, _)', 'warning');
      return;
    }
    setBusy('push');
    try {
      await pushToCloud(trimmedCode);
      setLastSync(formatTime(Date.now()));
      notify('ডেটা ক্লাউডে সেভ হয়েছে ✅');
    } catch {
      notify('ক্লাউডে সেভ করা যায়নি। Neon connection চেক করুন।', 'error');
    } finally {
      setBusy(null);
    }
  };

  const pull = async () => {
    if (!validCode) {
      notify('প্রথমে একটি বৈধ কোড দিন', 'warning');
      return;
    }
    setBusy('pull');
    try {
      const remote = await pullAndApply(trimmedCode);
      if (!remote) {
        notify('এই কোডে ক্লাউডে কোনো ডেটা নেই', 'warning');
        return;
      }
      setLastSync(formatTime(Date.now()));
      notify('ডেটা লোড হয়েছে—পেইজ রিফ্রেশ হচ্ছে…');
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      notify('ক্লাউড থেকে ডেটা আনা যায়নি', 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(collectLocalData(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bill-voucher-data.json';
    link.click();
    URL.revokeObjectURL(url);
    notify('JSON ফাইল ডাউনলোড হয়েছে');
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as Payload;
      if (!applyRemoteData(payload)) {
        throw new Error('invalid file');
      }
      notify('ফাইল ইমপোর্ট হয়েছে—অটো-সিঙ্ক চলছে…');
      if (validCode) {
        void pushToCloud(trimmedCode)
          .then(() => setLastSync(formatTime(Date.now())))
          .catch(() => notify('ক্লাউডে আপলোড করা যায়নি', 'error'));
      } else {
        scheduleAutoPush();
      }
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      notify('এই JSON ফাইলটি বৈধ নয়', 'error');
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border border-[#DCE3DF] bg-white shadow-xl p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold text-[#006633]">
          <FileJson className="w-4 h-4" />
          ডেটা সিঙ্ক
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="p-1 rounded hover:bg-[#F4F6F5] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <label className="block text-xs font-medium text-[#47554E] mb-1">
        Workspace code (সব ডিভাইসে একই লিখুন)
      </label>
      <input
        value={code}
        onChange={(event) => saveCode(event.target.value)}
        placeholder="উদাহরণ: bkf-forms-2026"
        className="w-full rounded-md border border-[#DCE3DF] px-3 py-2 text-sm outline-none focus:border-[#006633]"
      />
      <p className="mt-1 text-[11px] text-[#66736C]">
        {validCode
          ? 'অটো সিঙ্ক চালু: সেভ করলেই ক্লাউডে যাবে, অন্য ডিভাইসের নতুন ডেটাও এসে যাবে।'
          : 'কোড দিলেই অটো সিঙ্ক চালু হয়ে যাবে।'}
      </p>
      {lastSync && (
        <p className="mt-1 text-[11px] text-[#66736C]">শেষ সিঙ্ক: {lastSync}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={push}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#006633] text-white px-3 py-2 text-xs font-semibold hover:bg-[#004E27] disabled:opacity-60 cursor-pointer"
        >
          <CloudUpload className="w-4 h-4" />
          {busy === 'push' ? 'সেভ হচ্ছে…' : 'এখনই পাঠান'}
        </button>
        <button
          type="button"
          onClick={pull}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#006633] text-[#006633] px-3 py-2 text-xs font-semibold hover:bg-[#F0F7F3] disabled:opacity-60 cursor-pointer"
        >
          <CloudDownload className="w-4 h-4" />
          {busy === 'pull' ? 'লোড হচ্ছে…' : 'এখনই আনুন'}
        </button>
      </div>

      <div className="border-t border-[#E7ECE9] my-3" />
      <p className="text-[11px] text-[#66736C] mb-2">
        Neon setup না থাকলে JSON ফাইল দিয়েও ডেটা স্থানান্তর করা যায়।
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#F4F6F5] px-3 py-2 text-xs font-semibold hover:bg-[#E8EDEA] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          JSON Export
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#F4F6F5] px-3 py-2 text-xs font-semibold hover:bg-[#E8EDEA] cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          JSON Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            void importJson(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
