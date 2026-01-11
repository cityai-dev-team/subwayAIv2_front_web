import React, { createContext, useContext, useEffect, useMemo } from 'react';

export type ThemeKey = 'white' | 'gray' | 'black';

// 소스 코드에서 테마 변경: 이 값만 수정하면 됩니다
const FIXED_THEME: ThemeKey = 'white';

type ThemeCtx = {
  theme: ThemeKey;
  // setTheme 함수는 제거됨 - 소스 코드에서만 변경 가능
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', FIXED_THEME);
  }, []);

  const value = useMemo(() => ({ theme: FIXED_THEME }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}
