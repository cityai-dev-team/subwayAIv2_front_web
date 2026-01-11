import type { MenuItem } from './types';
export const FALLBACK_MENUS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard' },
  { id: 'summary', label: 'Summary', path: '/summary', icon: 'summary' },
  { id: 'realdata', label: 'Realdata', path: '/realdata', icon: 'live' },
  {
    id: 'admin',
    label: '시스템 관리',
    icon: 'admin',
    children: [
      { id: 'users.list', label: '사용자 목록', path: '/users/list', icon: 'list' },
    ],
  },
];
