/**
 * Theme management hook
 * Implements Requirement 10.3: Support theme switching
 */

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'app-theme';

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the stored theme preference or default to 'auto'
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}

/**
 * Apply theme to the document
 */
function applyTheme(theme: Theme): void {
  const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', effectiveTheme);
}

/**
 * Hook for managing application theme
 * 
 * @returns Object containing current theme, effective theme, and setTheme function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, effectiveTheme, setTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme('dark')}>
 *       Current: {effectiveTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    const stored = getStoredTheme();
    return stored === 'auto' ? getSystemTheme() : stored;
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    const effective = theme === 'auto' ? getSystemTheme() : theme;
    setEffectiveTheme(effective);
  }, [theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  /**
   * Set the theme and persist to localStorage
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
  };
}
