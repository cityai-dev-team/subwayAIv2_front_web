// src/modules/users/pages/UsersListPage.tsx
import { useState } from 'react';
import { Users, UserPlus, Download, AlertCircle, CheckCircle } from 'lucide-react';

// 모듈 내부 imports
import columnsFactory from '../columns';
import { useUsers } from '../service';
import type { User } from '../types';
import { exportCsv } from '../api';

// 컴포넌트 imports
import UserDetailModal from '../components/UserDetailModal';
import UserRoleModal from '../components/UserRoleModal';
import UserCreateModal from '../components/UserCreateModal';

// UI 컴포넌트 imports
import Pagination from '../../../components/ui/Pagination';
import { CompactTable, type Order } from '../../../components/ui/CompactTable';

export default function UsersListPage() {
  const { data, query, setQuery, loading, err, refetch } = useUsers({
    page: 1,
    pageSize: 10,
    sortBy: 'id',
    order: 'desc',
  });

  const [selected, setSelected] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 토스트 메시지 자동 제거
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const columns = columnsFactory({
    onOpenRoles: (u) => setRoleTarget(u),
    onOpenDetail: (u) => setSelected(u),
  });

  const onSort = (key: string, order: Order) => {
    setQuery({ ...query, sortBy: key as any, order });
  };

  const onExport = async () => {
    try {
      const blob = await exportCsv(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'CSV 파일이 성공적으로 다운로드되었습니다.');
    } catch (e: any) {
      console.error('CSV export failed:', e);
      showToast('error', e?.message ?? 'CSV 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 카드 클릭 핸들러
  const handleCardClick = (userType: string) => {
    if (selectedRoleFilter === userType) {
      // 이미 선택된 카드라면 필터 해제
      setSelectedRoleFilter(null);
    } else {
      // 해당 역할의 모든 사용자를 필터링 (페이지를 1로 리셋)
      setSelectedRoleFilter(userType);
      setQuery({ ...query, page: 1 });
    }
  };

  // 필터링된 데이터 계산 (역할 필터 + 상태 필터)
  const filteredData = (() => {
    let filteredItems = data.items;
    
    // 역할 필터 적용
    if (selectedRoleFilter) {
      filteredItems = filteredItems.filter(u => u.roles.includes(selectedRoleFilter as any));
    }
    
    // 상태 필터 적용
    if (query.status && query.status !== 'all') {
      filteredItems = filteredItems.filter(u => u.status === query.status);
    }
    
    // 검색 필터 적용
    if (query.q && query.q.trim()) {
      const searchTerm = query.q.toLowerCase().trim();
      filteredItems = filteredItems.filter(u => 
        u.email.toLowerCase().includes(searchTerm) || 
        (u.name && u.name.toLowerCase().includes(searchTerm))
      );
    }
    
    // 필터가 적용된 경우에만 클라이언트 사이드 페이징 적용
    const hasFilters = selectedRoleFilter || (query.status && query.status !== 'all') || (query.q && query.q.trim());
    
    if (hasFilters) {
      // 필터링된 데이터의 페이징 정보 계산
      const filteredTotal = filteredItems.length;
      const filteredPageSize = data.pageSize;
      const filteredTotalPages = Math.ceil(filteredTotal / filteredPageSize);
      const filteredPage = Math.min(query.page || 1, Math.max(1, filteredTotalPages));
      
      // 현재 페이지에 해당하는 아이템들만 반환
      const startIndex = (filteredPage - 1) * filteredPageSize;
      const endIndex = startIndex + filteredPageSize;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      
      return {
        ...data,
        items: paginatedItems,
        total: filteredTotal,
        page: filteredPage,
        pageSize: filteredPageSize,
        totalPages: filteredTotalPages
      };
    } else {
      // 필터가 없는 경우 서버 사이드 페이징된 데이터 그대로 사용
      return data;
    }
  })();

  // 통계 계산
  const totalUsers = data.total;

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">사용자 계정 및 권한 관리</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>Total Users: {totalUsers}</span>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users 카드 - 필터 해제용 */}
        <div 
          className={`bg-white p-4 rounded-lg border shadow-sm h-24 cursor-pointer transition-all duration-200 ${
            !selectedRoleFilter && (!query.status || query.status === 'all') && (!query.q || !query.q.trim())
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
          onClick={() => {
            setSelectedRoleFilter(null);
            setQuery({ ...query, status: 'all', q: '' });
          }}
        >
          <div className="flex items-center h-full">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Admin Users 카드 - 클릭 가능 */}
        <div 
          className={`bg-white p-4 rounded-lg border shadow-sm h-24 cursor-pointer transition-all duration-200 ${
            selectedRoleFilter === 'admin'
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
          }`}
          onClick={() => handleCardClick('admin')}
        >
          <div className="flex items-center h-full">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Admin Users</p>
              <p className="text-xl font-bold text-gray-900">{data.items.filter(u => u.roles.includes('admin')).length}</p>
            </div>
          </div>
        </div>

        {/* Manager Users 카드 - 클릭 가능 */}
        <div 
          className={`bg-white p-4 rounded-lg border shadow-sm h-24 cursor-pointer transition-all duration-200 ${
            selectedRoleFilter === 'manager'
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
          }`}
          onClick={() => handleCardClick('manager')}
        >
          <div className="flex items-center h-full">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Manager Users</p>
              <p className="text-xl font-bold text-gray-900">{data.items.filter(u => u.roles.includes('manager')).length}</p>
            </div>
          </div>
        </div>

        {/* Regular Users 카드 - 클릭 가능 */}
        <div 
          className={`bg-white p-4 rounded-lg border shadow-sm h-24 cursor-pointer transition-all duration-200 ${
            selectedRoleFilter === 'user'
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300 hover:shadow-md'
          }`}
          onClick={() => handleCardClick('user')}
        >
          <div className="flex items-center h-full">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Regular Users</p>
              <p className="text-xl font-bold text-gray-900">{data.items.filter(u => u.roles.includes('user')).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 상태 표시 */}
      {(selectedRoleFilter || (query.status && query.status !== 'all') || (query.q && query.q.trim())) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700">
                필터링 중: 
                {selectedRoleFilter && (
                  <span> <strong>{selectedRoleFilter === 'admin' ? 'Admin' : selectedRoleFilter === 'manager' ? 'Manager' : 'Regular'} 사용자</strong></span>
                )}
                {query.status && query.status !== 'all' && (
                  <span> <strong>{query.status === 'active' ? '활성' : query.status === 'inactive' ? '비활성' : query.status} 상태</strong></span>
                )}
                {query.q && query.q.trim() && (
                  <span> <strong>"{query.q}" 검색</strong></span>
                )}
                <span> ({filteredData.items.length}명)</span>
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedRoleFilter(null);
                setQuery({ ...query, status: 'all', q: '' });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              모든 필터 해제
            </button>
          </div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">데이터 로딩 오류</h4>
              <p className="text-sm text-red-700 mt-1">{err}</p>
              <button
                onClick={refetch}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            사용자 목록 {(selectedRoleFilter || (query.status && query.status !== 'all') || (query.q && query.q.trim())) && `(${filteredData.items.length}명 표시)`}
          </h3>
          <div className="flex items-center gap-3">
            {/* 검색 및 필터 */}
            <div className="flex gap-2">
              <input
                value={query.q ?? ''}
                onChange={(e) => setQuery({ ...query, page: 1, q: e.target.value })}
                placeholder="이메일/이름 검색"
                className="w-48 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <select
                value={query.status ?? 'all'}
                onChange={(e) => setQuery({ ...query, page: 1, status: e.target.value as any })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">전체</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1 text-sm"
                onClick={() => setOpenCreate(true)}
              >
                <UserPlus className="h-4 w-4" />
                추가
              </button>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-1 text-sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          
          {err && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{err}</div>}

          <CompactTable<User>
            items={filteredData.items}
            columns={columns}
            loading={loading}
            sortBy={query.sortBy}
            order={query.order}
            onSort={onSort}
          />
          
          <div className="mt-6">
            <Pagination
              page={filteredData.page}
              pageSize={filteredData.pageSize}
              total={filteredData.total}
              onChange={(p) => setQuery({ ...query, page: p })}
            />
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <UserCreateModal
        isOpen={openCreate}
        onClose={() => {
          setOpenCreate(false);
          refetch();
        }}
      />

      <UserDetailModal
        isOpen={!!selected}
        userId={selected?.id || 0}
        onClose={() => setSelected(null)}
        onSaved={refetch}
      />

      <UserRoleModal
        isOpen={!!roleTarget}
        userId={roleTarget?.id || 0}
        onClose={() => setRoleTarget(null)}
        onSaved={refetch}
      />

      {/* 토스트 메시지 */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
          toastMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}

