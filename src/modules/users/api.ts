// src/modules/users/api.ts
import { api } from '../../lib/api';
import type {
  PageResult,
  User,
  UsersQuery,
  UserId,
  UpdateUserInput,
} from './types';

const BASE = '/users';

// UsersQuery를 API params로 변환하는 헬퍼 함수
function queryToParams(q: UsersQuery): Record<string, any> {
  const params: Record<string, any> = {};

  if (q.page !== undefined) params.page = q.page;
  if (q.pageSize !== undefined) params.pageSize = q.pageSize;
  if (q.sortBy !== undefined) params.sortBy = q.sortBy;
  if (q.order !== undefined) params.order = q.order;
  if (q.q !== undefined) params.q = q.q;
  if (q.status !== undefined) params.status = q.status;
  if (q.role !== undefined) params.role = q.role;

  return params;
}

export function listUsers(q: UsersQuery) {
  return api.get<PageResult<User>>(BASE, { params: queryToParams(q), auth: true });
}

export function getUser(id: UserId) {
  return api.get<User>(`${BASE}/${id}`, { auth: true });
}

export function createUser(payload: {
  email: string;
  password?: string;
  full_name?: string;
  active?: boolean;
  roles?: string[];
}) {
  return api.post<User>(BASE, payload, { auth: true });
}

export function updateUser(id: UserId, patch: UpdateUserInput) {
  return api.patch<User>(`${BASE}/${id}`, patch, { auth: true });
}

export function toggleActive(id: UserId) {
  return api.post<User>(`${BASE}/${id}/toggle-active`, undefined, { auth: true });
}

export function assignRoles(id: UserId, roles: string[]) {
  return api.put<User>(`${BASE}/${id}/roles`, { roles }, { auth: true });
}

export function exportCsv(q: UsersQuery) {
  return api.blob(`${BASE}/export`, { params: queryToParams(q), auth: true });
}

export function changePassword(id: UserId, password: string) {
  return api.post(`${BASE}/${id}/password`, { password }, { auth: true });
}
