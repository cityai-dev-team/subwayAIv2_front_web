// src/lib/api.ts
import type {
  ApiRequestOptions,
  ApiError,
} from '../shared/types';

// 기존 타입들을 중앙화된 타입으로 대체
export type RequestOpts = ApiRequestOptions;

const API_BASE   = (import.meta.env.VITE_API_BASE   ?? '').replace(/\/$/, '');
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '');
export const TOKEN_KEY = 'auth:token';

/* ── Token helpers ───────────────────────────────────────────────────── */
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try {
    if (!t) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, t);
    // 탭 동기화를 위해 storage 이벤트 전파는 브라우저가 해줌
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

/* ── URL builder ─────────────────────────────────────────────────────── */
function buildUrl(path: string, params?: Record<string, any>) {
  const p = path.startsWith('/') ? path : `/${path}`;
  // API_BASE가 설정되어 있으면 절대 URL 사용, 없으면 상대 URL 사용 (proxy 활용)
  if (API_BASE) {
  const url = new URL(`${API_BASE}${API_PREFIX}${p}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
  } else {
    // 상대 URL 사용 (Vite proxy 활용)
    const url = `${API_PREFIX}${p}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) searchParams.set(k, String(v));
      }
      const queryString = searchParams.toString();
      return queryString ? `${url}?${queryString}` : url;
    }
    return url;
  }
}

/* ── Core request ────────────────────────────────────────────────────── */
async function request<T>(method: string, path: string, opts: RequestOpts = {}): Promise<T> {
  const url = buildUrl(path, opts.params);
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;

  const headers: Record<string, string> = { Accept: 'application/json', ...(opts.headers ?? {}) };
  if (opts.body && !isForm) headers['Content-Type'] = 'application/json';

  // Authorization 헤더 자동 첨부
  if (opts.auth) {
    const token = typeof opts.auth === 'string' ? opts.auth : getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body ? (isForm ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined,
    credentials: opts.credentials ?? 'include',
    signal: opts.signal,
  });

  // 공통 에러 처리
  if (!res.ok) {
    let details: any = undefined;
    try {
      const ct = res.headers.get('content-type') || '';
      details = ct.includes('application/json') ? await res.json() : await res.text();
    } catch {
      // 에러 응답 파싱 실패 시 무시
    }
    const err: ApiError = Object.assign(new Error(`HTTP ${res.status} ${res.statusText}`), {
      status: res.status,
      details,
    });

    // 401 처리 훅
    if (res.status === 401 && typeof opts.onUnauthorized === 'function') {
      try { opts.onUnauthorized(); } catch {
        // onUnauthorized 콜백 실행 실패 시 무시
      }
    }
    throw err;
  }

  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? await res.json() : await res.text()) as T;
}

/* ── Blob helper (CSV/엑셀 등) ──────────────────────────────────────── */
async function blob(path: string, opts: Omit<RequestOpts, 'body'> = {}): Promise<Blob> {
  const url = buildUrl(path, opts.params);

  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.auth) {
    const token = typeof opts.auth === 'string' ? opts.auth : getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: opts.credentials ?? 'include',
    signal: opts.signal,
  });

  if (!res.ok) {
    let details: any = undefined;
    try { details = await res.text(); } catch {
      // 에러 응답 파싱 실패 시 무시
    }
    const err: ApiError = Object.assign(new Error(`HTTP ${res.status} ${res.statusText}`), {
      status: res.status,
      details,
    });
    if (res.status === 401 && typeof opts.onUnauthorized === 'function') {
      try { opts.onUnauthorized(); } catch {
        // onUnauthorized 콜백 실행 실패 시 무시
      }
    }
    throw err;
  }
  return res.blob();
}

/* ── Public API ─────────────────────────────────────────────────────── */
export const api = {
  get:   <T>(path: string, opts?: Omit<RequestOpts, 'body'>) =>
           request<T>('GET', path, opts),
  post:  <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'body'>) =>
           request<T>('POST', path, { ...opts, body }),
  put:   <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'body'>) =>
           request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'body'>) =>
           request<T>('PATCH', path, { ...opts, body }),
  del:   <T>(path: string, opts?: Omit<RequestOpts, 'body'>) =>
           request<T>('DELETE', path, opts),
  blob,
};
