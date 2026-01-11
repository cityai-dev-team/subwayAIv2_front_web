// src/components/navigation/Sidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMenu, isActivePath, type MenuItem } from './userMenus';
import {
  LayoutDashboard,
  Users,
  Settings,
  Folder,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/** 아이콘 매핑: id나 icon 키로 매칭 */
function getIconFor(item: MenuItem) {
  const key = (item.icon ?? item.id ?? '').toLowerCase();

  const map: Record<string, React.ComponentType<any>> = {
    dashboard: LayoutDashboard,
    system: Settings,
    'system.users': Users,
    settings: Settings,
  };

  const Cmp = map[key] ?? Folder;
  return <Cmp className="h-4 w-4 shrink-0 opacity-90" aria-hidden />;
}

/**
 * 사이드바: 메뉴 트리
 * - 내부 여백을 주어 좌측 모서리에 붙지 않게 정렬
 * - collapsed 시 아이콘만 보이고 라벨은 sr-only 처리
 * - 상단에 메뉴 토글 버튼 추가
 */
export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { menu } = useMenu();
  const { pathname } = useLocation();

  return (
    <div className="h-full flex flex-col bg-side-bg">
      {/* 메뉴 네비게이션 */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-3"
        aria-label="Main navigation"
      >
        <ul className="space-y-1">
          {menu.map((item) => (
            <Node
              key={item.id}
              item={item}
              depth={0}
              activePath={pathname}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      {/* 메뉴 토글 버튼 - 하단 우측 정렬 */}
      {onToggleCollapse && (
        <div className="p-3 border-t border-app-border bg-side-bg">
          <div className="flex justify-end">
            <button
              onClick={onToggleCollapse}
              className="
                flex items-center justify-center p-2 rounded-input
                hover:bg-app-hover transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-ring
                text-app-subtext hover:text-app-text
              "
              title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Node({
  item,
  depth,
  activePath,
  collapsed,
}: {
  item: MenuItem;
  depth: number;
  activePath: string;
  collapsed: boolean;
}) {
  const hasChildren = !!item.children?.length;
  const active = isActivePath(activePath, item.path);
  const [isExpanded, setIsExpanded] = useState(false);

  // 하위 메뉴가 활성화된 경우 부모 메뉴 자동 열기
  useEffect(() => {
    if (hasChildren && item.children) {
      const hasActiveChild = item.children.some(child =>
        isActivePath(activePath, child.path),
      );
      if (hasActiveChild) {
        setIsExpanded(true);
      }
    }
  }, [activePath, hasChildren, item.children]);

  const base =
    'flex items-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent-ring select-none';
  const padding = collapsed ? 'px-2 py-2' : 'px-2 py-2';
  const indent = collapsed
    ? '' // 접힘일 땐 들여쓰기 없음
    : depth === 0
    ? 'pl-1'
    : depth === 1
    ? 'pl-5'
    : 'pl-9';
  const color = active
    ? 'bg-side-active-bg text-side-active-fg'
    : 'hover:bg-app-hover text-app-text';

  const IconEl = getIconFor(item);

  const labelEl = (
    <span className={`${collapsed ? 'sr-only' : 'truncate'} select-none`}>{item.label}</span>
  );

  const content = (
    <div className="flex w-full items-center gap-2">
      {/* 아이콘 칸 고정폭으로 정렬 안정화 */}
      <div className={collapsed ? 'w-full flex justify-center' : 'w-5'}>
        {IconEl}
      </div>
      {!collapsed && labelEl}
      {/* 하위 메뉴가 있으면 토글 아이콘 추가 */}
      {hasChildren && !collapsed && (
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  );

  return (
    <li>
      {item.path ? (
        <NavLink
          to={item.path}
          title={collapsed ? item.label : undefined}
          className={`${base} ${padding} ${indent} ${color}`}
          aria-current={active ? 'page' : undefined}
        >
          {content}
        </NavLink>
      ) : (
        <div
          className={[
            base,
            padding,
            indent,
            'text-app-subtext select-none',
            collapsed ? 'justify-center' : '',
            hasChildren ? 'cursor-pointer' : '',
          ].join(' ')}
          title={collapsed ? item.label : undefined}
          role="heading"
          aria-level={depth + 2}
          onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
        >
          {content}
        </div>
      )}

      {hasChildren && (isExpanded || collapsed) && (
        <ul className={`mt-1 space-y-1 ${collapsed ? '' : ''}`}>
          {item.children!.map((c) => (
            <Node
              key={c.id}
              item={c}
              depth={depth + 1}
              activePath={activePath}
              collapsed={collapsed}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
