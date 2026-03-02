/**
 * Glass Morphism container component
 * Implements Requirement 10.2: Create glass morphism visual effects
 */

import { CSSProperties, ReactNode, ElementType } from 'react';
import styles from './GlassContainer.module.css';

export interface GlassContainerProps {
  /** Child elements to render inside the glass container */
  children: ReactNode;
  
  /** Blur intensity in pixels (default: 10) */
  blur?: number;
  
  /** Background opacity (0-1, default: 0.7) */
  opacity?: number;
  
  /** Variant of glass effect */
  variant?: 'default' | 'light' | 'strong';
  
  /** Border radius size */
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Padding size */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Enable hover effect */
  hover?: boolean;
  
  /** Additional CSS class name */
  className?: string;
  
  /** Additional inline styles */
  style?: CSSProperties;
  
  /** HTML element to render as (default: 'div') */
  as?: ElementType;
}

/**
 * A container component with glass morphism effect
 * 
 * Features:
 * - Semi-transparent background with backdrop blur
 * - Soft shadows and borders
 * - Customizable blur and opacity
 * - Multiple variants and sizes
 * - Hover effects
 * - Fallback for browsers without backdrop-filter support
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <GlassContainer>
 *   <h2>Hello World</h2>
 * </GlassContainer>
 * 
 * // With custom blur and opacity
 * <GlassContainer blur={20} opacity={0.5}>
 *   <p>Custom glass effect</p>
 * </GlassContainer>
 * 
 * // Strong variant with hover effect
 * <GlassContainer variant="strong" hover padding="lg">
 *   <button>Click me</button>
 * </GlassContainer>
 * ```
 */
export function GlassContainer({
  children,
  blur,
  opacity,
  variant = 'default',
  radius = 'lg',
  padding = 'md',
  hover = false,
  className = '',
  style = {},
  as: Component = 'div',
}: GlassContainerProps) {
  // Build class names
  const classNames = [
    styles.glassContainer,
    styles[`variant-${variant}`],
    styles[`radius-${radius}`],
    padding !== 'none' && styles[`padding-${padding}`],
    hover && styles.hover,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Build custom styles for blur and opacity
  const customStyles: React.CSSProperties = {
    ...style,
  };

  if (blur !== undefined) {
    (customStyles as any)['--custom-blur'] = `${blur}px`;
  }

  if (opacity !== undefined) {
    (customStyles as any)['--custom-opacity'] = opacity.toString();
  }

  return (
    <Component className={classNames} style={customStyles}>
      {children}
    </Component>
  );
}
