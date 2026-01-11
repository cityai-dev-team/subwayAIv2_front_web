// 임시 해결책: clsx 대신 간단한 클래스 병합 함수 사용
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
