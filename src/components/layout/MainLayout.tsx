// src/components/layout/MainLayout.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useCallback, memo } from 'react';

import Topbar from './Topbar';
import SideNavigation from './SideNavigation';

function MainLayout() {
  const nav = useNavigate();

  const onLogoClick = useCallback(() => nav('/'), [nav]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Topbar */}
      <Topbar
        onLogoClick={onLogoClick}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* 좌측 사이드바 - 항상 열린 상태 */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
          <SideNavigation />
        </aside>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 메인 컨텐츠 */}
          <main className="flex-1 min-w-0 bg-white overflow-auto">
              <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default memo(MainLayout);
