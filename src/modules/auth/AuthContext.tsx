// src/modules/auth/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, TOKEN_KEY, getToken, setToken as writeToken } from '../../lib/api';

type AuthUser = { id?: number | string; email: string; full_name?: string | null; roles: string[]; };
type LoginInput = { email: string; password: string } | Record<string, any>;

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthed: boolean;
  login: (payload: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: (tokenOverride?: string | null) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setToken: (t: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(u: any): AuthUser {
  const roles = Array.isArray(u?.roles) ? (u.roles as string[]) : [];
  return { id: u?.id, email: u?.email ?? '', full_name: u?.full_name ?? u?.name ?? null, roles };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, _setToken] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState<boolean>(true);

  const setToken = useCallback((t: string | null) => {
    writeToken(t);       // localStorage 즉시 반영
    _setToken(t);        // state 업데이트(비동기)
  }, []);

  /** me 동기화: tokenOverride 있으면 그걸로, 없으면 localStorage에서 가져옴 */
  // 인증 비활성화: 항상 더미 사용자로 설정
  const refresh = useCallback(
    async (_tokenOverride?: string | null) => {
      // 인증 비활성화: tokenOverride 파라미터는 무시
      setLoading(true);
      try {
        // 인증 없이 항상 더미 사용자로 설정
        const dummyUser: AuthUser = {
          id: 1,
          email: 'admin@subwayai.local',
          full_name: '관리자',
          roles: ['admin'],
        };
        setUser(dummyUser);
        setLoading(false);
      } catch {
        // 에러 발생 시에도 더미 사용자 설정
        const dummyUser: AuthUser = {
          id: 1,
          email: 'admin@subwayai.local',
          full_name: '관리자',
          roles: ['admin'],
        };
        setUser(dummyUser);
        setLoading(false);
      }
    },
    [],
  );

  /** 로그인: 받은 토큰으로 즉시 refresh(token) 호출 */
  const login = useCallback(
    async (payload: LoginInput) => {
      setLoading(true);
      try {
        const resp = await api.post<any>('/auth/login', payload);
        const t =
          resp?.access_token ??
          resp?.token ??
          (typeof resp === 'string' ? resp : null);

        if (t) {
          setToken(t);        // localStorage에 즉시 기록
          if (resp?.user) {
            setUser(normalizeUser(resp.user));
          } else {
            await refresh(t); // 상태 토큰 반영 전에, 받은 토큰으로 바로 me 호출
          }
        } else {
          // 토큰이 없어도 혹시 쿠키 세션을 사용한다면 me 시도
          await refresh();
        }
      } finally {
        setLoading(false);
      }
    },
    [refresh, setToken],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      try { await api.post('/auth/logout', undefined, { auth: true }); } catch {
        // 로그아웃 API 호출 실패 시 무시
      }
    } finally {
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  }, [setToken]);

  // 첫 마운트에서 더미 사용자로 즉시 설정 (인증 비활성화)
  useEffect(() => { 
    const dummyUser: AuthUser = {
      id: 1,
      email: 'admin@subwayai.local',
      full_name: '관리자',
      roles: ['admin'],
    };
    setUser(dummyUser);
    setLoading(false);
  }, []);

  // 탭 간 토큰 변경 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        _setToken(e.newValue);
        refresh(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthed: !!user,
      login,
      logout,
      refresh,
      setUser,
      setToken,
    }),
    [user, token, loading, login, logout, refresh, setToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
