// src/shared/types/index.ts
/**
 * CT Project - 중앙화된 타입 시스템
 * 모든 타입 정의를 한 곳에서 관리하여 일관성과 재사용성을 보장합니다.
 */

/* ─────────────────────────────────────────────────────────────
   기본 타입 정의
────────────────────────────────────────────────────────────── */

/** 기본 원시 타입 */
export type Primitive = string | number | boolean | null | undefined;

/** ID 타입 (숫자 또는 문자열) */
export type ID = number | string;

/** 날짜 문자열 타입 (ISO 8601) */
export type ISODateString = string;

/** 페이지네이션 기본 타입 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** 정렬 옵션 */
export interface SortOptions {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/** 검색 옵션 */
export interface SearchOptions {
  q?: string;
}

/* ─────────────────────────────────────────────────────────────
   API 관련 타입
────────────────────────────────────────────────────────────── */

/** API 요청 옵션 */
export interface ApiRequestOptions {
  params?: Record<string, Primitive>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  auth?: boolean | string;
  onUnauthorized?: () => void;
}

/** API 에러 타입 */
export interface ApiError extends Error {
  status?: number;
  details?: any;
}

/** 페이지네이션 결과 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/* ─────────────────────────────────────────────────────────────
   사용자 관련 타입
────────────────────────────────────────────────────────────── */

/** 사용자 ID 타입 */
export type UserId = number;

/** 사용자 역할 타입 */
export type UserRole = 'admin' | 'manager' | 'user';

/** 사용자 상태 타입 */
export type UserStatus = 'active' | 'inactive' | 'pending';

/** 사용자 기본 정보 */
export interface User {
  id: UserId;
  email: string;
  name?: string;
  phone?: string;
  roles: UserRole[];
  status: UserStatus;
  created_at: ISODateString;
  updated_at?: ISODateString;
  last_login_at?: ISODateString;
}

/** 사용자 생성 입력 */
export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  roles?: UserRole[];
  status?: UserStatus;
}

/** 사용자 업데이트 입력 */
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  roles?: UserRole[];
  status?: UserStatus;
}

/** 사용자 쿼리 옵션 */
export interface UsersQuery extends PaginationParams, SortOptions, SearchOptions {
  status?: 'all' | 'active' | 'inactive' | 'pending';
  role?: UserRole;
}

/** 사용자 테이블 행 타입 */
export type UserRow = User;

/* ─────────────────────────────────────────────────────────────
   네비게이션 관련 타입
────────────────────────────────────────────────────────────── */

/** 메뉴 아이템 타입 */
export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  children?: MenuItem[];
  roles?: UserRole[];
  external?: boolean;
  hidden?: boolean;
  order?: number;
  icon?: string;
}

/** 사이드바 상태 */
export interface SidebarState {
  collapsed: boolean;
  activeItem?: string;
}

/* ─────────────────────────────────────────────────────────────
   테마 관련 타입
────────────────────────────────────────────────────────────── */

/** 테마 타입 */
export type Theme = 'white' | 'gray' | 'black';

/** 테마 컨텍스트 */
export interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/* ─────────────────────────────────────────────────────────────
   컴포넌트 Props 타입
────────────────────────────────────────────────────────────── */

/** 버튼 변형 타입 */
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'accent';

/** 버튼 크기 타입 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/** 배지 변형 타입 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'accent' | 'success' | 'warning';

/** 배지 크기 타입 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/** 카드 변형 타입 */
export type CardVariant = 'default' | 'outlined' | 'elevated';

/** 카드 패딩 타입 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/** 입력 변형 타입 */
export type InputVariant = 'default' | 'error' | 'success';

/** 모달 크기 타입 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/** 테이블 컬럼 타입 */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

/* ─────────────────────────────────────────────────────────────
   폼 관련 타입
────────────────────────────────────────────────────────────── */

/** 폼 필드 타입 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/** 폼 상태 타입 */
export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/* ─────────────────────────────────────────────────────────────
   유틸리티 타입
────────────────────────────────────────────────────────────── */

/** 선택적 필드 타입 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 필수 필드 타입 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** 부분 업데이트 타입 */
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

/** ID를 제외한 타입 */
export type WithoutId<T> = Omit<T, 'id'>;

/** 날짜 필드를 제외한 타입 */
export type WithoutTimestamps<T> = Omit<T, 'created_at' | 'updated_at' | 'last_login_at'>;

/* ─────────────────────────────────────────────────────────────
   이벤트 타입
────────────────────────────────────────────────────────────── */

/** 커스텀 이벤트 타입 */
export interface CustomEvent<T = any> extends Event {
  detail: T;
}

/** 폼 이벤트 타입 */
export interface FormEvent<T = any> extends React.FormEvent<HTMLFormElement> {
  target: EventTarget & T;
}

/* ─────────────────────────────────────────────────────────────
   설정 관련 타입
────────────────────────────────────────────────────────────── */

/** 앱 설정 타입 */
export interface AppConfig {
  title: string;
  version: string;
  apiBase: string;
  apiPrefix: string;
  theme: Theme;
  locale: string;
}

/** 환경 변수 타입 */
export interface EnvironmentVariables {
  VITE_API_BASE?: string;
  VITE_API_PREFIX?: string;
  VITE_APP_TITLE?: string;
  VITE_APP_VERSION?: string;
}

/* ─────────────────────────────────────────────────────────────
   에러 관련 타입
────────────────────────────────────────────────────────────── */

/** 에러 레벨 타입 */
export type ErrorLevel = 'error' | 'warning' | 'info';

/** 에러 정보 타입 */
export interface ErrorInfo {
  code: string;
  message: string;
  level: ErrorLevel;
  details?: any;
  timestamp: ISODateString;
}

/** 유효성 검사 에러 타입 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/* ─────────────────────────────────────────────────────────────
   모든 타입들이 이미 위에서 정의되어 있으므로 별도 export 불필요
────────────────────────────────────────────────────────────── */
