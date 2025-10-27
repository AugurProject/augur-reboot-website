# Resource Management Conventions

## WebGL Resource Cleanup

### The Core Rule
- **ALWAYS** implement `dispose()` methods for GPU resources
- **MUST** call `dispose()` in React component cleanup effects
- **NEVER** render after disposal - add `isDisposed` guards

This prevents GPU memory leaks from accumulating over time as components mount/unmount.

## WebGL Component Pattern

### Full Example: Animated Gauge with Cleanup
```tsx
import { useEffect, useRef } from 'react';
import { GaugeRenderer } from '../lib/gauge-renderer';

interface Props {
  value: number;
  onAnimationEnd?: () => void;
}

export function AnimatedGauge({ value, onAnimationEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GaugeRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create GPU resources
    const renderer = new GaugeRenderer(canvasRef.current);
    rendererRef.current = renderer;

    // Animate to value
    renderer.animateTo(value, () => {
      if (!rendererRef.current?.isDisposed) {
        onAnimationEnd?.();
      }
    });

    // Cleanup: Dispose GPU resources
    return () => {
      renderer.dispose();
    };
  }, [value, onAnimationEnd]);

  return <canvas ref={canvasRef} width={300} height={300} />;
}
```

## Implementing dispose() in GPU Classes

### Example: Gauge Renderer
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
    // ... other initialization
  }

  animateTo(value: number, onComplete?: () => void) {
    // Guard: Never render if disposed
    if (this.isDisposed) return;

    // Animation logic
    const frame = () => {
      if (this.isDisposed) return;
      // ... render frame
      requestAnimationFrame(frame);
    };
    frame();
  }

  dispose() {
    if (this.isDisposed) return;

    // Delete GPU resources
    this.gl.deleteProgram(this.program);
    this.gl.deleteBuffer(this.buffer);
    // ... delete other resources

    this.isDisposed = true;
  }
}
```

## Resource Types to Clean Up

### WebGL Resources
- **Programs**: `gl.deleteProgram(program)`
- **Buffers**: `gl.deleteBuffer(buffer)`
- **Textures**: `gl.deleteTexture(texture)`
- **Framebuffers**: `gl.deleteFramebuffer(framebuffer)`
- **Renderbuffers**: `gl.deleteRenderbuffer(renderbuffer)`

### Canvas Resources
```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');

  return () => {
    // Clear canvas context
    if (ctx) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    }
  };
}, []);
```

### Animation Frame Resources
```tsx
useEffect(() => {
  let animationId: number;

  const animate = () => {
    // ... animation logic
    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
  };
}, []);
```

### Event Listeners
```tsx
useEffect(() => {
  const handleResize = () => {
    // ... handle resize
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## Real-World Example: PerspectiveGridTunnel

This component renders an animated 3D perspective grid using WebGL:

```tsx
// src/components/PerspectiveGridTunnel.tsx
import { useEffect, useRef } from 'react';
import { TunnelRenderer } from '../lib/tunnel-renderer';

export function PerspectiveGridTunnel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TunnelRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create renderer (allocates GPU memory)
    const renderer = new TunnelRenderer(containerRef.current);
    rendererRef.current = renderer;

    // Start animation
    renderer.start();

    // CRITICAL: Cleanup function
    return () => {
      // Stop animation
      renderer.stop();
      // Dispose GPU resources
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      rendererRef.current?.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
```

## Testing Resource Cleanup

### Memory Leak Detection
```tsx
// In tests or dev tools
const mount = () => ReactDOM.render(<Component />, container);
const unmount = () => ReactDOM.unmountComponentAtNode(container);

// Mount/unmount 100 times
for (let i = 0; i < 100; i++) {
  mount();
  unmount();
}

// Check GPU memory (varies by device/driver)
// No significant memory increase = cleanup working ✓
```

### Chrome DevTools
1. Open DevTools → Memory tab
2. Take heap snapshot before mounting
3. Interact with component
4. Take heap snapshot after unmounting
5. Compare - should return to baseline if cleanup works

## Common Mistakes

### ❌ Rendering After Disposal
```typescript
// WRONG - Can cause WebGL errors
dispose() {
  this.gl.deleteProgram(this.program);
  // Component still calls render() - ERROR!
}
```

### ❌ No Cleanup in useEffect
```tsx
// WRONG - GPU resources leak
export function Gauge({ value }) {
  useEffect(() => {
    const renderer = new GaugeRenderer(canvasRef.current);
    renderer.animateTo(value);
    // Missing cleanup return - memory leak!
  }, [value]);
}
```

### ❌ Calling dispose() Multiple Times
```typescript
// WRONG - Second call can fail
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

## Related Conventions
- See `component-architecture.md` for useEffect lifecycle patterns
- See `.claude/memory/architecture/components.md` for component examples
- See `.claude/memory/architecture/fork-risk-system.md` for gauge component implementation
