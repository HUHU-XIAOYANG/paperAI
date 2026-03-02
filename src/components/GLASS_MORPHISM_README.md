# Glass Morphism Components

This directory contains the Glass Morphism UI components for the Agent Swarm Writing System, implementing Requirements 10.1, 10.2, and 10.3.

## Overview

The glass morphism design provides a modern, elegant appearance with:
- Semi-transparent backgrounds with backdrop blur
- Soft shadows and borders
- Smooth transitions
- Theme support (light/dark/auto)
- Customizable blur and opacity levels
- Browser fallbacks for unsupported features

## Components

### GlassContainer

A versatile container component with glass morphism effects.

**Features:**
- Customizable blur intensity (default: 10px)
- Adjustable opacity (0-1, default: 0.7)
- Three variants: light, default, strong
- Multiple border radius sizes: sm, md, lg, xl
- Flexible padding options: xs, sm, md, lg, xl
- Optional hover effects
- Supports any HTML element via `as` prop
- Fallback for browsers without backdrop-filter support

**Usage:**

```tsx
import { GlassContainer } from './components/GlassContainer';

// Basic usage
<GlassContainer>
  <h2>Hello World</h2>
</GlassContainer>

// Custom blur and opacity
<GlassContainer blur={20} opacity={0.5}>
  <p>Custom glass effect</p>
</GlassContainer>

// Strong variant with hover
<GlassContainer variant="strong" hover padding="lg">
  <button>Click me</button>
</GlassContainer>

// As different HTML element
<GlassContainer as="section" radius="xl">
  <article>Content</article>
</GlassContainer>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Content to render inside |
| blur | number | 10 | Blur intensity in pixels |
| opacity | number | 0.7 | Background opacity (0-1) |
| variant | 'default' \| 'light' \| 'strong' | 'default' | Glass effect variant |
| radius | 'sm' \| 'md' \| 'lg' \| 'xl' | 'lg' | Border radius size |
| padding | 'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Padding size |
| hover | boolean | false | Enable hover effect |
| className | string | '' | Additional CSS class |
| style | CSSProperties | {} | Inline styles |
| as | keyof JSX.IntrinsicElements | 'div' | HTML element to render |

### ThemeToggle

A button component for switching between light, dark, and auto themes.

**Features:**
- Cycles through light → dark → auto → light
- Visual icons for each theme state
- Optional label display
- Glass morphism styling
- Persists preference to localStorage
- Auto mode follows system preference

**Usage:**

```tsx
import { ThemeToggle } from './components/ThemeToggle';

// Basic usage
<ThemeToggle />

// With label
<ThemeToggle showLabel={true} />

// Custom styling
<ThemeToggle className="my-custom-class" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS class |
| showLabel | boolean | false | Show theme label text |

### useTheme Hook

A React hook for managing application theme.

**Features:**
- Get current theme setting
- Get effective theme (resolves 'auto' to actual theme)
- Set theme with persistence
- Automatic system theme detection
- Listens for system theme changes

**Usage:**

```tsx
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current setting: {theme}</p>
      <p>Effective theme: {effectiveTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('auto')}>Auto Mode</button>
    </div>
  );
}
```

**Return Value:**

| Property | Type | Description |
|----------|------|-------------|
| theme | 'light' \| 'dark' \| 'auto' | Current theme setting |
| effectiveTheme | 'light' \| 'dark' | Actual applied theme |
| setTheme | (theme: Theme) => void | Function to change theme |

## Theme System

### CSS Variables

The theme system uses CSS custom properties defined in `src/styles/theme.css`:

**Colors:**
- `--color-background`: Main background color
- `--color-surface`: Surface/card background
- `--color-text-primary`: Primary text color
- `--color-text-secondary`: Secondary text color
- `--color-accent`: Accent/brand color
- `--color-success/warning/error/info`: Status colors

**Glass Morphism:**
- `--glass-blur`: Blur intensity (10px / 20px)
- `--glass-opacity`: Background opacity
- `--glass-background`: Glass background color
- `--glass-border`: Glass border color
- `--glass-shadow`: Glass shadow

**Spacing:**
- `--spacing-xs/sm/md/lg/xl/2xl`: Consistent spacing scale

**Border Radius:**
- `--radius-sm/md/lg/xl/full`: Border radius sizes

**Transitions:**
- `--transition-fast/base/slow`: Animation durations

### Theme Switching

Themes are applied via the `data-theme` attribute on the document root:

```html
<html data-theme="light">  <!-- or "dark" -->
```

The theme automatically switches all CSS variables to the appropriate values.

### Browser Support

**Backdrop Filter:**
- Chrome/Edge: 76+
- Safari: 9+ (with -webkit- prefix)
- Firefox: 103+

**Fallback:**
For browsers without backdrop-filter support, the components automatically use solid backgrounds with high opacity to maintain readability.

## Utility Classes

Global utility classes are available in `src/styles/globals.css`:

**Glass Effects:**
- `.glass`: Base glass effect
- `.glass-light`: Light glass variant
- `.glass-strong`: Strong glass variant
- `.glass-hover`: Glass with hover effect

**Spacing:**
- `.p-xs/sm/md/lg/xl`: Padding utilities
- `.m-xs/sm/md/lg/xl`: Margin utilities

**Border Radius:**
- `.rounded-sm/md/lg/xl/full`: Border radius utilities

**Text:**
- `.text-primary/secondary/tertiary`: Text color utilities

**Transitions:**
- `.transition-fast/base/slow`: Transition utilities

## Examples

See `GlassContainer.example.tsx` for comprehensive usage examples including:
- Basic containers
- All variants
- Custom blur and opacity
- Border radius options
- Padding sizes
- Hover effects
- Nested containers
- Practical UI components (cards, panels)
- Different HTML elements

## Best Practices

1. **Performance**: Use glass effects sparingly on complex layouts to maintain performance
2. **Contrast**: Ensure sufficient contrast for text readability (WCAG AA minimum)
3. **Fallbacks**: Always test in browsers without backdrop-filter support
4. **Nesting**: Limit nesting depth to 2-3 levels for best visual effect
5. **Blur Amount**: Use 10-20px blur for most cases; higher values can impact performance
6. **Opacity**: Keep opacity between 0.5-0.9 for best glass effect

## Accessibility

- All interactive elements have proper ARIA labels
- Theme toggle includes descriptive aria-label and title
- Sufficient color contrast maintained in both themes
- Keyboard navigation fully supported
- Focus states clearly visible

## Testing

To test the glass morphism components:

```bash
# Run the example component
npm run dev

# Navigate to the examples page to see all variants
```

## Requirements Mapping

- **Requirement 10.1**: Theme system with CSS variables ✓
- **Requirement 10.2**: Glass morphism visual effects ✓
- **Requirement 10.3**: Theme switching support ✓
