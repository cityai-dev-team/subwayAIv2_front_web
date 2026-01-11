import React from 'react';

export type Order = 'asc' | 'desc';

export type Column<T> = {
  /** 데이터 키(서버 정렬용 키로도 사용). render가 있으면 표시는 render 우선 */
  key: keyof T | string;
  header: React.ReactNode;
  /** 정렬 가능 여부 (기본 false) */
  sortable?: boolean;
  /** 픽셀 / tailwind width 값 모두 허용 */
  width?: number | string;
  /** 셀 렌더러 */
  render?: (row: T, index: number) => React.ReactNode;
  /** 가운데/오른쪽 정렬 등 추가 클래스 */
  className?: string;
};

type Props<T> = {
  items: T[];
  columns: Column<T>[];
  /** 서버 정렬 값을 외부에서 내려줌 */
  sortBy?: string;
  order?: Order;
  onSort?: (key: string, order: Order) => void;
  /** 로딩 시 스켈레톤/메시지 */
  loading?: boolean;
  /** 행 클릭 */
  onRowClick?: (row: T, index: number) => void;
  /** 빈 목록 문구 */
  emptyText?: string;
  /** 테이블 wrapper 추가 클래스 */
  className?: string;
  /** 행에 부여할 키 (기본: index) */
  getRowKey?: (row: T, index: number) => React.Key;
};

function toWidthStyle(w?: number | string) {
  if (w == null) return undefined;
  if (typeof w === 'number') return { width: `${w}px` };
  return { width: w };
}

export function CompactTable<T>({
  items,
  columns,
  sortBy,
  order = 'asc',
  onSort,
  loading,
  onRowClick,
  emptyText = '데이터가 없습니다',
  className,
  getRowKey,
}: Props<T>) {
  const handleSort = (col: Column<T>) => {
    if (!onSort || !col.sortable) return;
    const key = String(col.key);
    const next: Order = sortBy === key ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    onSort(key, next);
  };

  return (
    <div className={['w-full overflow-x-auto border border-app-border rounded-lg', className].filter(Boolean).join(' ')}>
      <table className="w-full text-sm">
        <thead className="bg-side-bg text-app-text border-b border-app-border">
          <tr>
            {columns.map((c, i) => {
              const isSorted = sortBy === String(c.key);
              return (
                <th
                  key={i}
                  scope="col"
                  className={[
                    'text-left font-medium px-3 py-2 select-none whitespace-nowrap',
                    c.sortable ? 'cursor-pointer hover:bg-app-hover' : '',
                  ].join(' ')}
                  style={toWidthStyle(c.width)}
                  onClick={() => handleSort(c)}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{c.header}</span>
                    {c.sortable && (
                      <span className="inline-flex h-4 w-4 items-center justify-center">
                        {isSorted ? (order === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* 로딩 상태 */}
          {loading && (
            <tr>
              <td className="px-3 py-6 text-center text-app-subtext border-b border-app-border" colSpan={columns.length}>
                로딩 중…
              </td>
            </tr>
          )}

          {/* 빈 상태 */}
          {!loading && items.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-app-subtext border-b border-app-border" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}

          {/* 데이터 렌더 */}
          {!loading &&
            items.length > 0 &&
            items.map((row, idx) => {
              const key = getRowKey ? getRowKey(row, idx) : idx;
              return (
                <tr
                  key={key}
                  className={[
                    'border-b border-app-border last:border-0',
                    onRowClick ? 'cursor-pointer hover:bg-app-hover' : '',
                  ].join(' ')}
                  onClick={() => onRowClick?.(row, idx)}
                >
                  {columns.map((c, ci) => (
                    <td
                      key={ci}
                      className={['px-3 py-2 align-middle', c.className].filter(Boolean).join(' ')}
                      style={toWidthStyle(c.width)}
                      onClick={(e) => {
                        // 셀 내부 버튼 클릭이 행 클릭을 덮어쓰지 않도록
                        if ((e.target as HTMLElement).closest('button,a,input,select,textarea')) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {c.render ? (c.render as any)(row, idx) : String((row as any)[c.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default CompactTable;
