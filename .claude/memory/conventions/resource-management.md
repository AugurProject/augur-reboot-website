# Resource Management Conventions

## Core Rule

- **ALWAYS** implement `dispose()` methods for GPU resources
- **MUST** call `dispose()` in React component cleanup effects
- **NEVER** render after disposal - add `isDisposed` guards

This prevents GPU memory leaks from accumulating over time as components mount/unmount.

## WebGL Component Pattern

```tsx
import { useEffect, useRef } from 'react';
import { GaugeRenderer } from '../lib/gauge-renderer';

export function AnimatedGauge({ value, onAnimationEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GaugeRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new GaugeRenderer(canvasRef.current);
    rendererRef.current = renderer;

    // Animate to value
    renderer.animateTo(value, () => {
      if (!rendererRef.current?.isDisposed) onAnimationEnd?.();
    });

    // Cleanup: Dispose GPU resources
    return () => renderer.dispose();
  }, [value, onAnimationEnd]);

  return <canvas ref={canvasRef} width={300} height={300} />;
}
```

## Implementing dispose() in GPU Classes

```typescript
export class GaugeRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private isDisposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl')!;
    this.program = this.createProgram();
    this.buffer = this.gl.createBuffer()!;
  }

  animateTo(value: number, onComplete?: () => void) {
    if (this.isDisposed) return;  // Guard: Never render if disposed

    const frame = () => {
      if (this.isDisposed) return;
      // ... render frame
      requestAnimationFrame(frame);
    };
    frame();
  }

  dispose() {
    if (this.isDisposed) return;  // Guard against double-disposal
    this.gl.deleteProgram(this.program);
    this.gl.deleteBuffer(this.buffer);
    this.isDisposed = true;
  }
}
```

## Resource Cleanup Patterns

### WebGL Resources
```typescript
// In dispose() method:
gl.deleteProgram(program);
gl.deleteBuffer(buffer);
gl.deleteTexture(texture);
gl.deleteFramebuffer(framebuffer);
gl.deleteRenderbuffer(renderbuffer);
```

### Canvas Context
```tsx
useEffect(() => {
  return () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}, []);
```

### Animation Frames
```tsx
useEffect(() => {
  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
  };
  animate();
  return () => cancelAnimationFrame(animationId);
}, []);
```

### Event Listeners
```tsx
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Testing Resource Cleanup

### Chrome DevTools Memory Profiling
1. Open DevTools → Memory tab
2. Take heap snapshot **before** mounting component
3. Interact with component or mount/unmount multiple times
4. Take heap snapshot **after** unmounting
5. Compare snapshots - should return to baseline if cleanup works

### Automated Testing
```typescript
for (let i = 0; i < 100; i++) {
  ReactDOM.render(<Component />, container);
  ReactDOM.unmountComponentAtNode(container);
}
// Check: No significant memory increase = cleanup working ✓
```

## Common Mistakes

### ❌ No Cleanup in useEffect
```tsx
// WRONG - GPU resources leak
useEffect(() => {
  const renderer = new GaugeRenderer(canvasRef.current);
  renderer.animateTo(value);
  // Missing cleanup return - memory leak!
}, [value]);
```

### ❌ Double-Disposal Without Guard
```typescript
// WRONG - Second call fails
dispose() {
  this.gl.deleteProgram(this.program); // ❌ Already deleted
}

// CORRECT - Guard with flag
dispose() {
  if (this.isDisposed) return;
  this.gl.deleteProgram(this.program);
  this.isDisposed = true;
}
```

### ❌ Rendering After Disposal
```typescript
// WRONG - Can cause WebGL errors after dispose()
animateTo() {
  // Component still tries to render after dispose - ERROR!
  requestAnimationFrame(frame);
}

// CORRECT - Guard in render loops
animateTo() {
  const frame = () => {
    if (this.isDisposed) return;  // Stop rendering
    requestAnimationFrame(frame);
  };
}
```

## Related Conventions
- See `component-patterns.md` for lifecycle patterns
- See `styling-standards.md` for custom utilities (fx-glow)
- See `.claude/memory/architecture/fork-risk-system.md` for gauge implementation
