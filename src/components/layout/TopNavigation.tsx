// src/components/layout/TopNavigation.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

export interface TopNavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
}

// project_plan에 명시된 화면만 포함
const topNavItems: TopNavItem[] = [
  {
    id: 'dashboard',
    label: '실시간 모니터링',
    path: '/',
    description: '신도림역 혼잡도 안전관리체계 실시간 모니터링'
  },
  {
    id: 'cctv',
    label: 'CCTV',
    path: '/cctv',
    description: 'CCTV 목록 및 상세'
  },
  {
    id: 'statistics',
    label: '통계',
    path: '/statistics',
    description: '일일/주간/월간 통계'
  },
  {
    id: 'alerts',
    label: '알림',
    path: '/alerts',
    description: '현재 알림 및 알림 이력'
  }
];

export default function TopNavigation() {
  const { pathname } = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="h-full">
      <div className="flex items-center h-full space-x-4">
        {topNavItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <div key={item.id} className="relative h-full flex items-center">
              <NavLink
                to={item.path}
                className={`
                  flex items-center px-3 py-2 text-sm font-semibold border-b-2 transition-colors duration-200 h-full nav-link-fixed
                  ${active 
                    ? 'border-blue-600' 
                    : 'border-transparent hover:border-gray-400'
                  }
                `}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {item.label}
              </NavLink>
              
              {/* 호버 시 설명 툴팁 */}
              {hoveredItem === item.id && item.description && (
                <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap">
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
