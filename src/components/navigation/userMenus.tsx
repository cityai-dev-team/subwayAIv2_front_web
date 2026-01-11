import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api';

/** 메뉴 아이템 타입 */
export type MenuItem = {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
};

/** 활성 경로 체크 유틸 */
export function isActivePath(currentPath: string, itemPath?: string) {
  if (!itemPath) return false;
  if (itemPath === '/') return currentPath === '/';
  return currentPath.startsWith(itemPath);
}

/** 기본(폴백) 메뉴 – 서버 오류 시 사용 */
export const FALLBACK_MENUS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  {
    id: 'system',
    label: '시스템관리',
    children: [
      { id: 'system.users', label: '사용자 관리', path: '/users' },
    ],
  },
];

/** 컨텍스트 */
type Ctx = {
  menu: MenuItem[];
  refresh: () => Promise<void>;
};
const MenuCtx = createContext<Ctx | null>(null);

/** Provider */
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(FALLBACK_MENUS);

  const fetchMenus = async () => {
    try {
      // api.ts가 prefix(/api)를 붙여주도록 되어 있다면 path는 '/navigation/menus'
      // prefix가 없다면 '/api/navigation/menus'로 변경하세요.
      const data = await api.get<MenuItem[]>('/navigation/menus');
      if (Array.isArray(data) && data.length) setMenu(data);
    } catch {
      // 실패 시 폴백 유지
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  return (
    <MenuCtx.Provider value={{ menu, refresh: fetchMenus }}>
      {children}
    </MenuCtx.Provider>
  );
}

/** 훅 */
export function useMenu() {
  const ctx = useContext(MenuCtx);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
