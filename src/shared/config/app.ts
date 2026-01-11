// src/shared/config/app.ts
// Vite 환경변수(VITE_APP_TITLE)가 있으면 사용, 없으면 기본값.
export const APP_TITLE =
  (import.meta as any)?.env?.VITE_APP_TITLE?.trim?.() || '혼잡도 리포팅';

// 필요하면 확장해서 쓰기
export const APP_BRAND = APP_TITLE;
// export const APP_DESCRIPTION = "관리 콘솔";
// export const APP_VERSION = import.meta.env?.VITE_APP_VERSION ?? "dev";
