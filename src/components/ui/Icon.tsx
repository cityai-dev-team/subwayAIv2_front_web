import { icons, type LucideIcon } from 'lucide-react';

// name은 lucide 키값(e.g. "user", "settings", "shield")을 기대
type Props = {
  name?: string;        // 메뉴 등에서 넘어오는 문자열
  className?: string;
};

export function Icon({ name, className }: Props) {
  if (!name) return <span className={className} />;

  // lucide 키는 보통 소문자-캐멀/케밥 형태를 씁니다.
  const key = name.toLowerCase().replace(/\s+/g, '-') as keyof typeof icons;

  const Cmp = icons[key] as LucideIcon | undefined;
  if (!Cmp) return <span className={className} />;

  return <Cmp className={className} />;
}
