// src/components/layout/SideNavigation.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

export interface SideNavItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType<any>;
  children?: SideNavItem[];
  badge?: string;
  description?: string;
}

// 2뎁스 메뉴 구조
const sideNavItems: SideNavItem[] = [
  {
    id: 'monitoring',
    label: '모니터링',
    path: '/',
    children: [
        {
          id: 'overview',
        label: '종합 모니터링',
          path: '/',
        description: '신도림역 혼잡도 종합 모니터링'
      },
      {
        id: 'cctv-monitoring',
        label: 'CCTV별 모니터링',
        path: '/dashboard/cctv-monitoring',
        description: 'CCTV별 혼잡도 모니터링'
        },
        {
          id: 'time-trend',
        label: '시간별 모니터링',
          path: '/dashboard/time-trend',
        description: '시간별 혼잡도 모니터링'
        }
    ]
  },
  {
    id: 'statistics',
    label: '통계',
    path: '/statistics',
    children: [
        {
        id: 'hourly',
        label: '시간별 혼잡 현황',
        path: '/statistics/hourly',
        description: '시간별 혼잡 현황 통계'
      },
        {
          id: 'daily',
        label: '일별 혼잡 현황',
          path: '/statistics/daily',
        description: '일별 혼잡 현황 통계'
        },
        {
          id: 'monthly',
        label: '월별 혼잡 현황',
          path: '/statistics/monthly',
        description: '월별 혼잡 현황 통계'
        }
    ]
  },
        {
    id: 'management',
    label: '관리',
    path: '/management',
    children: [
        {
        id: 'cctv-management',
        label: 'CCTV 관리',
        path: '/management/cctv-management',
        description: 'CCTV 관리'
        },
        {
        id: 'data-management',
        label: '데이터 관리',
        path: '/management/data-management',
        description: '5분 데이터 조회 및 다운로드'
        }
    ]
  }
];

export default function SideNavigation() {
  const { pathname } = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['monitoring']));

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isExpanded = (itemId: string) => expandedItems.has(itemId);

  // 현재 활성화된 1뎁스 메뉴 찾기
  const getActiveParent = () => {
    for (const item of sideNavItems) {
      if (item.children) {
        for (const child of item.children) {
          if (isActive(child.path)) {
            return item.id;
          }
        }
      }
      if (isActive(item.path)) {
        return item.id;
      }
    }
    return null;
  };

  // 활성화된 부모 메뉴는 자동으로 펼침
  const activeParent = getActiveParent();
  if (activeParent && !expandedItems.has(activeParent)) {
    setExpandedItems(prev => new Set(prev).add(activeParent));
  }

  const renderNavItem = (item: SideNavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isExpanded(item.id);
    const Icon = item.icon;

    // 심플한 스타일
    const baseClasses = `
      flex items-center px-4 py-2.5 text-sm transition-colors duration-150
      ${depth > 0 ? 'pl-8' : ''}
    `;

    const activeClasses = active 
      ? 'bg-blue-50 text-black font-medium' 
      : 'text-black hover:bg-gray-50';

    const parentClasses = depth === 0
      ? 'font-semibold text-black'
      : '';

    const content = (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1 min-w-0">
          {Icon && <Icon className="h-4 w-4 mr-2 flex-shrink-0" />}
          <span className={`truncate ${parentClasses}`}>{item.label}</span>
        {item.badge && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
            {item.badge}
            </span>
          )}
        </div>
        {hasChildren && (
          <span className={`ml-2 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ›
          </span>
        )}
      </div>
    );

    return (
      <li key={item.id}>
        {item.path && !hasChildren ? (
          <NavLink
            to={item.path}
            className={`${baseClasses} ${activeClasses}`}
            title={item.description}
            end={item.path === '/'}
          >
            {content}
          </NavLink>
        ) : hasChildren ? (
          <div
            onClick={() => toggleExpand(item.id)}
            className={`${baseClasses} ${activeClasses} cursor-pointer ${parentClasses}`}
            title={item.description}
          >
            {content}
          </div>
        ) : (
          <div
            className={`${baseClasses} ${activeClasses} ${parentClasses}`}
            title={item.description}
          >
            {content}
          </div>
        )}

        {/* 2뎁스 메뉴 표시 */}
        {hasChildren && expanded && (
          <ul className="space-y-0.5">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className="bg-white h-full overflow-y-auto">
      <div className="py-2">
        <ul className="space-y-0.5">
          {sideNavItems.map(item => renderNavItem(item))}
        </ul>
      </div>
    </nav>
  );
}
