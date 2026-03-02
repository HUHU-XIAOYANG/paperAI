/**
 * Theme toggle button component
 * Implements Requirement 10.3: Support theme switching
 */

import { useTheme } from '../hooks/useTheme';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Button component for toggling between light, dark, and auto themes
 * 
 * @example
 * ```tsx
 * <ThemeToggle showLabel={true} />
 * ```
 */
export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Cycle through: light -> dark -> auto -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'auto') {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2v2m0 12v2M4.22 4.22l1.42 1.42m8.72 8.72l1.42 1.42M2 10h2m12 0h2M4.22 15.78l1.42-1.42m8.72-8.72l1.42-1.42"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    
    if (effectiveTheme === 'dark') {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
            fill="currentColor"
          />
        </svg>
      );
    }
    
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <path
          d="M10 2v2m0 12v2M4.22 4.22l1.42 1.42m8.72 8.72l1.42 1.42M2 10h2m12 0h2M4.22 15.78l1.42-1.42m8.72-8.72l1.42-1.42"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const getLabel = () => {
    if (theme === 'auto') return 'Auto';
    return effectiveTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      className={`${styles.themeToggle} ${className}`}
      onClick={handleToggle}
      aria-label={`Switch theme (current: ${getLabel()})`}
      title={`Current theme: ${getLabel()}`}
    >
      <span className={styles.icon}>{getIcon()}</span>
      {showLabel && <span className={styles.label}>{getLabel()}</span>}
    </button>
  );
}
