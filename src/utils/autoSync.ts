import { STORAGE_KEY_PROFILES } from '../data/bankDefaults';
import {
  STORAGE_KEY_BANK_TRANSFER,
  STORAGE_KEY_BILL_PAYMENT,
  STORAGE_KEY_MONTHLY_VOUCHER,
  STORAGE_KEY_TAX_CHALLAN,
  STORAGE_KEY_VAT_CHALLAN,
} from '../data/sheetsDefaults';

export const API_URL =
  import.meta.env.VITE_SYNC_API_URL || 'https://bill-voucher-bkf.vercel.app';
export const SYNC_CODE_KEY = 'billVoucherSyncCode';
const SYNC_META_KEY = 'billVoucherAutoSyncMeta';
export const AUTO_SYNC_EVENT = 'billvoucher:autosync-status';

export type Payload = Record<string, unknown>;
export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'saved' | 'error';
export type ReconcileResult = 'unchanged' | 'pushed' | 'pulled' | 'error';

const STORAGE_KEYS = [
  STORAGE_KEY_PROFILES,
  STORAGE_KEY_BILL_PAYMENT,
  STORAGE_KEY_BANK_TRANSFER,
  STORAGE_KEY_MONTHLY_VOUCHER,
  STORAGE_KEY_VAT_CHALLAN,
  STORAGE_KEY_TAX_CHALLAN,
] as const;

interface SyncMeta {
  code: string;
  signature: string;
  at: number;
}

interface RemoteState {
  payload: Payload;
  updatedAt?: string;
  signature: string;
}

let pushTimer: number | undefined;
let pendingPush = false;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`;
}

export function emitStatus(status: SyncStatus) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTO_SYNC_EVENT, { detail: { status } }));
}

export function getSyncCode(): string | null {
  try {
    const raw = localStorage.getItem(SYNC_CODE_KEY)?.trim() || '';
    return /^[A-Za-z0-9_-]{4,64}$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setSyncCode(value: string) {
  const code = value.trim();
  try {
    if (/^[A-Za-z0-9_-]{4,64}$/.test(code)) {
      localStorage.setItem(SYNC_CODE_KEY, code);
    } else {
      localStorage.removeItem(SYNC_CODE_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

export function collectLocalData(): Payload {
  const payload: Payload = {};
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        payload[key] = JSON.parse(raw);
      } catch {
        // Skip malformed entries rather than blocking all syncing.
      }
    }
  }
  return payload;
}

export function applyRemoteData(payload: Payload): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const keys = (STORAGE_KEYS as readonly string[]).filter((key) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  );
  if (keys.length === 0) return false;
  for (const key of keys) {
    try {
      localStorage.setItem(key, JSON.stringify(payload[key]));
    } catch {
      // Ignore storage quota errors.
    }
  }
  return true;
}

function getSyncMeta(code: string): SyncMeta | null {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw) as SyncMeta;
    return meta?.code === code && typeof meta.signature === 'string' ? meta : null;
  } catch {
    return null;
  }
}

export function getLastSyncedAt(code: string | null): number | null {
  if (!code) return null;
  return getSyncMeta(code)?.at ?? null;
}

function markSynced(code: string, signature: string) {
  const meta: SyncMeta = { code, signature, at: Date.now() };
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage errors.
  }
}

export async function pushToCloud(code: string): Promise<string> {
  const payload = collectLocalData();
  const signature = stableStringify(payload);
  emitStatus('syncing');
  const res = await fetch(`${API_URL}/api/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'push failed');
  }
  markSynced(code, signature);
  emitStatus('saved');
  return signature;
}

export async function fetchFromCloud(code: string): Promise<RemoteState | null> {
  const res = await fetch(`${API_URL}/api/state?code=${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('fetch failed');
  const data = (await res.json()) as { payload?: Payload; updatedAt?: string };
  if (!data.payload || typeof data.payload !== 'object' || Array.isArray(data.payload)) {
    throw new Error('invalid payload');
  }
  return {
    payload: data.payload,
    updatedAt: data.updatedAt,
    signature: stableStringify(data.payload),
  };
}

export async function pullAndApply(code: string): Promise<RemoteState | null> {
  const remote = await fetchFromCloud(code);
  if (!remote) return null;
  if (!applyRemoteData(remote.payload)) throw new Error('invalid payload');
  markSynced(code, remote.signature);
  emitStatus('saved');
  return remote;
}

export function cancelScheduledPush() {
  if (pushTimer !== undefined) window.clearTimeout(pushTimer);
  pushTimer = undefined;
  pendingPush = false;
}

/** Called after any local save; pushes once after edits settle. */
export function scheduleAutoPush(delay = 1200) {
  const code = getSyncCode();
  if (!code) return;
  cancelScheduledPush();
  pendingPush = true;
  emitStatus('syncing');
  pushTimer = window.setTimeout(() => {
    pushTimer = undefined;
    void pushToCloud(code)
      .catch(() => emitStatus('error'))
      .finally(() => {
        pendingPush = false;
      });
  }, delay);
}

/**
 * Reconciles local and cloud state. A save that is still waiting to be pushed
 * always wins; otherwise a remote change is applied and the caller reloads.
 */
export async function reconcileAutoSync(code: string): Promise<ReconcileResult> {
  if (pendingPush) {
    cancelScheduledPush();
    await pushToCloud(code);
    return 'pushed';
  }

  const localSignature = stableStringify(collectLocalData());
  const meta = getSyncMeta(code);

  let remote: RemoteState | null;
  try {
    remote = await fetchFromCloud(code);
  } catch {
    emitStatus('error');
    return 'error';
  }

  if (!remote) {
    if (localSignature === '{}') {
      emitStatus('saved');
      return 'unchanged';
    }
    await pushToCloud(code);
    return 'pushed';
  }

  if (remote.signature === localSignature) {
    markSynced(code, localSignature);
    emitStatus('saved');
    return 'unchanged';
  }

  // Local edits made after the last successful sync are newer than the cloud copy.
  if (meta && meta.signature && localSignature !== meta.signature) {
    await pushToCloud(code);
    return 'pushed';
  }

  try {
    if (!applyRemoteData(remote.payload)) throw new Error('invalid payload');
    markSynced(code, remote.signature);
    emitStatus('saved');
    return 'pulled';
  } catch {
    emitStatus('error');
    return 'error';
  }
}
