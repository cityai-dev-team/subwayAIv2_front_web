// src/components/ui/Toolbar.tsx  (경로는 네가 둔 곳 유지)
import type { ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export default function Toolbar({ title, left, right, className }: Props) {
  return (
    <div className={['flex items-center justify-between gap-3', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-3">
        {title ? <h2 className="text-2xl font-bold text-app-text">{title}</h2> : null}
        {left}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
