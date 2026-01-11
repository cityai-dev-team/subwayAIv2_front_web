import type { PropsWithChildren, ReactNode } from 'react';

type ModalProps = {
  open?: boolean;                 // 기본 true (미지정 시 표시)
  title?: ReactNode;              // 헤더 제목
  onClose?: () => void;           // 닫기 핸들러
  widthClass?: string;            // 패널 폭 커스터마이즈 (기본 w-[560px])
  footer?: ReactNode;             // 하단 버튼 등
  className?: string;             // 패널 추가 클래스
  backdrop?: boolean;             // 배경 오버레이 표시 여부 (기본 true)
};

export default function Modal({
  open = true,
  title,
  onClose,
  widthClass = 'w-[560px]',
  footer,
  className = '',
  backdrop = true,
  children,
}: PropsWithChildren<ModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 - 더 진한 배경과 블러 효과 */}
      {backdrop && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 모달 패널 */}
      <div className={`relative bg-main-bg border border-app-border rounded-card shadow-2xl overflow-hidden ${widthClass} ${className} animate-in fade-in-0 zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="relative flex items-center px-6 py-4 bg-top-bg border-b border-app-border">
          {/* 제목 */}
          {title ? (
            <h2 className="font-semibold text-app-text pr-10 select-none text-lg">
              {title}
            </h2>
          ) : null}

          {/* 닫기(X) - 항상 우측 상단 일정 여백으로 고정 */}
          {onClose && (
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                rounded-full w-8 h-8 flex items-center justify-center
                hover:bg-app-hover focus:outline-none focus:ring-2 focus:ring-accent-ring
                transition-colors duration-200
              "
              title="닫기"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
                className="text-app-text"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 bg-main-bg">{children}</div>

        {/* Footer (선택) */}
        {footer ? (
          <div className="px-6 py-4 border-t border-app-border bg-top-bg">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
