// src/modules/users/columns.ts
import type { User } from './types';
import type { Column } from '../../components/ui/CompactTable';

type Handlers = {
  onOpenRoles: (u: User) => void;
  onOpenDetail: (u: User) => void;
};

const columns = (h: Handlers): Column<User>[] => [
  { key: 'id', header: 'ID', sortable: true, width: 80 },

  // 이메일: 링크로 표시
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    width: 180,
    render: (u) => (
      <a
        href={`mailto:${u.email}`}
        className="text-link hover:text-link-hover truncate underline-offset-2 hover:underline transition-colors duration-200"
        title={`${u.email}에게 이메일 보내기`}
      >
        {u.email}
      </a>
    ),
  },

  {
    key: 'name',
    header: '이름',
    sortable: true,
    width: 160,
    render: (u) => (
      <button
        onClick={() => h.onOpenDetail(u)}
        className="font-medium text-link hover:text-link-hover underline-offset-2 hover:underline transition-colors duration-200 text-left"
        title={`${u.name || u.email} 상세 정보 보기`}
      >
        {u.name || '-'}
      </button>
    ),
  },

  {
    key: 'roles',
    header: '역할',
    width: 200,
    render: (u) => <span>{(u.roles ?? []).join(', ') || '-'}</span>,
  },

  // 상태: 읽기 전용 배지 (이벤트 제거)
  {
    key: 'status',
    header: '상태',
    width: 110,
    render: (u) => (
      <span
        className={`px-2 py-0.5 rounded text-sm inline-block ${
          u.status === 'active' ? 'bg-green-100 text-green-700' :
          u.status === 'inactive' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}
      >
        {u.status === 'active' ? 'Active' :
         u.status === 'inactive' ? 'Inactive' : 'Pending'}
      </span>
    ),
  },

  {
    key: 'created_at',
    header: '가입일',
    sortable: true,
    width: 200,
    render: (u) => (
      <span className="whitespace-nowrap text-sm">
        {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
      </span>
    ),
  },

  {
    key: 'actions',
    header: '관리',
    width: 140,
    render: (u) => (
      <div className="flex gap-2 justify-end">
        <button
          className="text-sm bg-accent text-accent-foreground hover:bg-accent-hover px-3 py-1 rounded font-medium transition-colors duration-200 flex items-center justify-center"
          onClick={() => h.onOpenRoles(u)}
        >
          권한
        </button>
        <button
          className="text-sm bg-gray-500 text-white hover:bg-gray-600 px-2 py-1 rounded transition-colors duration-200 flex items-center justify-center"
          onClick={() => h.onOpenDetail(u)}
        >
          상세
        </button>
      </div>
    ),
  },
];

export default columns;
