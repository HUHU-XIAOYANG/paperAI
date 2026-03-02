/**
 * Glass Container usage examples
 * Demonstrates various configurations and use cases
 */

import { GlassContainer } from './GlassContainer';
import { ThemeToggle } from './ThemeToggle';

/**
 * Example component showcasing GlassContainer usage
 */
export function GlassContainerExamples() {
  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Theme toggle in top right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle showLabel />
      </div>

      <h1>Glass Morphism Examples</h1>

      {/* Basic usage */}
      <section>
        <h2>Basic Glass Container</h2>
        <GlassContainer>
          <h3>Default Glass Effect</h3>
          <p>This is a basic glass container with default settings.</p>
        </GlassContainer>
      </section>

      {/* Variants */}
      <section>
        <h2>Variants</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <GlassContainer variant="light">
            <h4>Light Variant</h4>
            <p>More transparent, subtle effect</p>
          </GlassContainer>

          <GlassContainer variant="default">
            <h4>Default Variant</h4>
            <p>Balanced transparency</p>
          </GlassContainer>

          <GlassContainer variant="strong">
            <h4>Strong Variant</h4>
            <p>More opaque, stronger blur</p>
          </GlassContainer>
        </div>
      </section>

      {/* Custom blur and opacity */}
      <section>
        <h2>Custom Blur and Opacity</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <GlassContainer blur={5} opacity={0.5}>
            <h4>Light Blur (5px)</h4>
            <p>Opacity: 0.5</p>
          </GlassContainer>

          <GlassContainer blur={15} opacity={0.7}>
            <h4>Medium Blur (15px)</h4>
            <p>Opacity: 0.7</p>
          </GlassContainer>

          <GlassContainer blur={30} opacity={0.9}>
            <h4>Heavy Blur (30px)</h4>
            <p>Opacity: 0.9</p>
          </GlassContainer>
        </div>
      </section>

      {/* Border radius */}
      <section>
        <h2>Border Radius</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <GlassContainer radius="sm">
            <p>Small radius</p>
          </GlassContainer>

          <GlassContainer radius="md">
            <p>Medium radius</p>
          </GlassContainer>

          <GlassContainer radius="lg">
            <p>Large radius</p>
          </GlassContainer>

          <GlassContainer radius="xl">
            <p>Extra large radius</p>
          </GlassContainer>
        </div>
      </section>

      {/* Padding */}
      <section>
        <h2>Padding Sizes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <GlassContainer padding="xs">
            <p>Extra small padding</p>
          </GlassContainer>

          <GlassContainer padding="sm">
            <p>Small padding</p>
          </GlassContainer>

          <GlassContainer padding="md">
            <p>Medium padding</p>
          </GlassContainer>

          <GlassContainer padding="lg">
            <p>Large padding</p>
          </GlassContainer>

          <GlassContainer padding="xl">
            <p>Extra large padding</p>
          </GlassContainer>
        </div>
      </section>

      {/* Hover effect */}
      <section>
        <h2>Hover Effects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <GlassContainer hover>
            <h4>Hover Me!</h4>
            <p>This container has hover effects enabled</p>
          </GlassContainer>

          <GlassContainer hover variant="strong">
            <h4>Strong + Hover</h4>
            <p>Combining strong variant with hover</p>
          </GlassContainer>
        </div>
      </section>

      {/* Nested containers */}
      <section>
        <h2>Nested Glass Containers</h2>
        <GlassContainer variant="light" padding="lg">
          <h3>Outer Container</h3>
          <p>Glass containers can be nested for layered effects</p>
          
          <div style={{ marginTop: '16px' }}>
            <GlassContainer variant="strong" padding="md">
              <h4>Inner Container</h4>
              <p>This creates a nice depth effect</p>
            </GlassContainer>
          </div>
        </GlassContainer>
      </section>

      {/* Practical examples */}
      <section>
        <h2>Practical Examples</h2>
        
        {/* Card */}
        <GlassContainer hover padding="lg" style={{ marginBottom: '16px' }}>
          <h3>Card Component</h3>
          <p>This could be used as a card component in your UI</p>
          <button style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}>
            Action Button
          </button>
        </GlassContainer>

        {/* Panel */}
        <GlassContainer variant="strong" padding="xl">
          <h3>Panel Component</h3>
          <p>Perfect for displaying important information or forms</p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter text..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--glass-background-light)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button style={{
              padding: '8px 16px',
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}>
              Submit
            </button>
          </div>
        </GlassContainer>
      </section>

      {/* Different HTML elements */}
      <section>
        <h2>Different HTML Elements</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <GlassContainer as="section" padding="md">
            <p>Rendered as &lt;section&gt;</p>
          </GlassContainer>

          <GlassContainer as="article" padding="md">
            <p>Rendered as &lt;article&gt;</p>
          </GlassContainer>

          <GlassContainer as="aside" padding="md">
            <p>Rendered as &lt;aside&gt;</p>
          </GlassContainer>
        </div>
      </section>
    </div>
  );
}

export default GlassContainerExamples;
