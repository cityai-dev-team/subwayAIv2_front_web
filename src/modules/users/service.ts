import { useEffect, useState } from 'react';
import * as api from './api';
import type { PageResult, User, UsersQuery, UpdateUserInput, UserId } from './types';

export function useUsers(
  initial: UsersQuery = { page: 1, pageSize: 10, sortBy: 'id', order: 'desc' },
) {
  const [query, setQuery] = useState<UsersQuery>(initial);

  const [data, setData] = useState<PageResult<User>>({
    items: [],
    total: 0,
    page: initial.page ?? 1,
    pageSize: initial.pageSize ?? 10,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // 백엔드 응답을 프론트엔드 타입에 맞게 변환
  const transformUser = (user: any): User => ({
    id: user.id,
    email: user.email,
    name: user.name || user.full_name,
    phone: user.phone,
    roles: user.roles || [],
    status: user.active ? 'active' : 'inactive',
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  });

  const refetch = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.listUsers(query);
      // 백엔드 응답의 active 필드를 status로 변환
      const transformedData = {
        ...res,
        items: res.items.map(transformUser),
      };
      setData(transformedData);
    } catch (e: any) {
      setErr(e?.message ?? '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.pageSize, query.q, query.sortBy, query.order, query.status, query.role]);

  return { query, setQuery, data, loading, err, refetch };
}

export async function saveUser(id: UserId, patch: UpdateUserInput) {
  return api.updateUser(id, patch);
}

export async function setActive(id: UserId) {
  return api.toggleActive(id);
}

export async function setRoles(id: UserId, roles: string[]) {
  return api.assignRoles(id, roles);
}
