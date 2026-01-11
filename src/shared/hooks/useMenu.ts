import { useEffect, useState } from 'react';
import { useAuth } from '../../modules/auth/AuthContext';
import { api } from '../../lib/api';
import type { MenuItem } from '../../components/navigation/types';
import { FALLBACK_MENUS } from '../../components/navigation/userMenus';

export function useMenu() {
  const { token } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>(FALLBACK_MENUS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Expect: GET /api/navigation -> MenuItem[]  (또는 {items: MenuItem[]})
        const res = await api.get<MenuItem[] | { items?: MenuItem[] }>('/api/navigation/menus', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const items = Array.isArray(res) ? res : (res.items ?? []);
        if (!cancelled && items?.length) setMenu(items);
      } catch (e) {
        // 메뉴 로딩 실패 시 FALLBACK_MENU 그대로 사용 (조용히 실패)
        // 개발 환경에서만 에러 로깅
        if (import.meta.env.DEV) {
          console.warn('useMenu: 메뉴 로딩 실패, fallback 메뉴 사용', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { menu, loading };
}
