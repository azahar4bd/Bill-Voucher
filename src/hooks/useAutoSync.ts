import { useEffect, useRef, useState } from 'react';
import {
  AUTO_SYNC_EVENT,
  emitStatus,
  getSyncCode,
  reconcileAutoSync,
  type SyncStatus,
} from '../utils/autoSync';

type Notify = (message: string, tone?: 'success' | 'warning' | 'error') => void;

/** Keeps localStorage and the cloud workspace in sync without button presses. */
export function useAutoSync(notify: Notify): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() =>
    getSyncCode() ? 'idle' : 'offline'
  );
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  useEffect(() => {
    const onStatus = (event: Event) => {
      const next = (event as CustomEvent<{ status: SyncStatus }>).detail?.status;
      if (next) setStatus(next);
    };
    window.addEventListener(AUTO_SYNC_EVENT, onStatus);
    return () => window.removeEventListener(AUTO_SYNC_EVENT, onStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async (announce: boolean) => {
      if (document.hidden) return;
      const code = getSyncCode();
      if (!code) {
        emitStatus('offline');
        return;
      }
      emitStatus('syncing');
      const result = await reconcileAutoSync(code);
      if (cancelled) return;

      if (result === 'pulled') {
        if (announce) {
          notifyRef.current('ক্লাউডের নতুন ডেটা এসেছে—রিফ্রেশ হচ্ছে…');
        }
        window.setTimeout(() => window.location.reload(), 500);
      } else if (result === 'pushed' && announce) {
        notifyRef.current('লোকাল পরিবর্তন অটো-সিঙ্ক করা হয়েছে ✅');
      } else if (result === 'unchanged') {
        emitStatus('saved');
      }
    };

    void run(true);
    const interval = window.setInterval(() => void run(false), 60_000);
    const onVisible = () => {
      if (!document.hidden) void run(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return status;
}
