import { useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { makeTheme, applyThemeVars } from '../theme';

export const useTheme = () => {
  const hue = useStore((s) => s.hue);
  const dark = useStore((s) => s.dark);

  const theme = useMemo(() => makeTheme(hue, dark), [hue, dark]);

  useEffect(() => {
    applyThemeVars(theme, theme.accent);
    document.body.style.background = theme.bg;
  }, [theme]);

  return { t: theme, accent: theme.accent, hue, dark };
};
