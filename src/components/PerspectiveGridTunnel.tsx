import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $isGridAnimating, animationActions, getAnimationState } from '../stores/animationStore';

interface PerspectiveGridTunnelProps {
  numLines?: number;
  lineColor?: string;
  animationSpeed?: number;
  maxOpacity?: number;
}

// Create a stable component ID for view transitions
const COMPONENT_ID = 'perspective-grid-tunnel';

const PerspectiveGridTunnel: React.FC<PerspectiveGridTunnelProps> = ({
  numLines = 20,
  lineColor = '#00ff00',
  animationSpeed = 1,
  maxOpacity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCount = useRef(0);
  const [opacity, setOpacity] = useState(0);
  
  // Use nanostores for animation state instead of props/events
  const isGridAnimating = useStore($isGridAnimating);

  // Initialize animation based on current page context and restore frame state
  useEffect(() => {
    // Restore frameCount from persistent store for animation continuity
    const savedState = getAnimationState();
    if (savedState.frameCount > 0) {
      frameCount.current = savedState.frameCount;
    }
    
    // For non-homepage (like /mission), start animation immediately
    const isHomepage = typeof window !== 'undefined' && 
      (window.location.pathname === '/' || window.location.pathname === '');
    
    if (!isHomepage) {
      // Ensure animation starts for mission page visits
      animationActions.startAnimations();
    }
  }, []);

  // Additional safety check: if we're on mission page but grid isn't animating, start it
  useEffect(() => {
    const isHomepage = typeof window !== 'undefined' && 
      (window.location.pathname === '/' || window.location.pathname === '');
    
    if (!isHomepage && !isGridAnimating) {
      // Safety fallback: ensure animation starts on non-homepage
      console.log('Safety fallback: starting animations on mission page');
      animationActions.startAnimations();
    }
  }, [isGridAnimating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // --- Style Setup ---
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = lineColor;

      // --- Horizon Definition ---
      const horizonWidth = width * 0.1;
      const horizonHeight = height * 0.15;
      const horizonX = (width - horizonWidth) / 2;
      const horizonY = (height - horizonHeight) / 2;
      const vanishingPoint = 0.75;

      // --- 1. Draw STATIC Converging Lines with Gradient Opacity ---
      const drawConvergingLines = () => {
        for (let i = 0; i <= numLines; i++) {
          const ratio = i / numLines;

          // --- Gradient for Top lines ---
          const x1_top = ratio * width;
          const y1_top = 0;
          const x2_top = horizonX + ratio * horizonWidth;
          const y2_top = horizonY;

          let gradient = ctx.createLinearGradient(x1_top, y1_top, x2_top, y2_top);
          gradient.addColorStop(0, `${lineColor}ff`); // Opaque at the edge
          gradient.addColorStop(vanishingPoint, `${lineColor}00`); // Transparent at the horizon
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1_top, y1_top);
          ctx.lineTo(x2_top, y2_top);
          ctx.stroke();

          // --- Gradient for Bottom lines ---
          const y1_bot = height;
          const y2_bot = horizonY + horizonHeight;
          gradient = ctx.createLinearGradient(x1_top, y1_bot, x2_top, y2_bot);
          gradient.addColorStop(0, `${lineColor}ff`);
          gradient.addColorStop(vanishingPoint, `${lineColor}00`);
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1_top, y1_bot);
          ctx.lineTo(x2_top, y2_bot);
          ctx.stroke();

          // --- Gradient for Left lines ---
          const x1_left = 0;
          const y1_left = ratio * height;
          const x2_left = horizonX;
          const y2_left = horizonY + ratio * horizonHeight;
          gradient = ctx.createLinearGradient(x1_left, y1_left, x2_left, y2_left);
          gradient.addColorStop(0, `${lineColor}ff`);
          gradient.addColorStop(vanishingPoint, `${lineColor}00`);
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1_left, y1_left);
          ctx.lineTo(x2_left, y2_left);
          ctx.stroke();

          // --- Gradient for Right lines ---
          const x1_right = width;
          const x2_right = horizonX + horizonWidth;
          gradient = ctx.createLinearGradient(x1_right, y1_left, x2_right, y2_left);
          gradient.addColorStop(0, `${lineColor}ff`);
          gradient.addColorStop(vanishingPoint, `${lineColor}00`);
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1_right, y1_left);
          ctx.lineTo(x2_right, y2_left);
          ctx.stroke();
        }
      };

      // --- 2. Draw ANIMATED Grid Squares (Center to Edge) ---
      const drawAnimatedGrid = () => {
        const zOffset = frameCount.current * animationSpeed;
        const segmentLength = 40;
        const totalSegments = 15;

        for (let i = 0; i < totalSegments; i++) {
          const z = (i * segmentLength + zOffset) % (segmentLength * totalSegments);
          const linearScale = z / (totalSegments * segmentLength);

          if (linearScale > 1 || linearScale < 0) continue;

          // Use an exponential scale for a more realistic perspective effect
          const scale = Math.pow(linearScale, 2.5);

          const rectWidth = horizonWidth + (width - horizonWidth) * scale;
          const rectHeight = horizonHeight + (height - horizonHeight) * scale;
          const rectX = (width - rectWidth) / 2;
          const rectY = (height - rectHeight) / 2;

          // Opacity is 0 at the center and fades in towards the edge.
          const alpha = Math.pow(linearScale, 5);
          ctx.strokeStyle = `${lineColor}${Math.floor(alpha * 255)
            .toString(16)
            .padStart(2, '0')}`;

          ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        }
      };

      drawAnimatedGrid();
      drawConvergingLines();
    };

    const animate = () => {
      if (isGridAnimating) {
        frameCount.current++;
        // Update store with current frame data for persistence
        animationActions.updateGridFrame(frameCount.current, animationFrameId.current);
        draw();
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (isGridAnimating) {
      setOpacity(maxOpacity);
      animate();
    } else {
      setOpacity(0);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [numLines, lineColor, animationSpeed, isGridAnimating, maxOpacity]);

  return (
    <canvas
      ref={canvasRef}
      id={COMPONENT_ID}
      data-astro-transition-persist={COMPONENT_ID}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: opacity,
        background: 'transparent',
      }}
    />
  );
};

export default PerspectiveGridTunnel;