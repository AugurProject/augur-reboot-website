import type React from 'react';
import { useRef, useEffect } from 'react';

interface PerspectiveGridTunnelProps {
  numLines?: number;
  lineColor?: string;
  animationSpeed?: number;
  maxOpacity?: number;
  vanishingPoint?: number; // 0.0-1.0, defines where lines fade to transparent
}


// WebGL shaders for high-performance rendering
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_alpha;
uniform vec2 u_resolution;
uniform vec3 u_color;
varying float v_alpha;

void main() {
  vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  v_alpha = a_alpha;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 u_color;
varying float v_alpha;

void main() {
  gl_FragColor = vec4(u_color, v_alpha);
}
`;

class WebGLGridRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private staticLinesBuffer: WebGLBuffer | null = null;
  private gridBuffer: WebGLBuffer | null = null;
  private staticVertices: Float32Array;
  private gridVertices: Float32Array;
  private numLines: number;
  private lineColor: [number, number, number];
  private vanishingPoint: number;
  private isDisposed: boolean = false;

  constructor(gl: WebGLRenderingContext, numLines: number, lineColor: string, vanishingPoint: number) {
    this.gl = gl;
    this.numLines = numLines;
    this.lineColor = this.hexToRgb(lineColor);
    this.vanishingPoint = vanishingPoint;
    // Fix: Allocate for all 4 line types (top, bottom, left, right) with proper vertex count
    // Each line = 2 vertices * 3 floats (x, y, alpha) = 6 floats per line
    // 4 line types * (numLines + 1) lines * 6 floats = 24 * (numLines + 1)
    this.staticVertices = new Float32Array((numLines + 1) * 4 * 6);
    this.gridVertices = new Float32Array(15 * 24); // 15 segments * 4 lines per rect * 6 floats per line
    
    this.initializeWebGL();
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 1, 0];
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  private initializeWebGL() {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;

    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    // Create buffers
    this.staticLinesBuffer = this.gl.createBuffer();
    this.gridBuffer = this.gl.createBuffer();

    // Enable blending for transparency
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
    this.precomputeStaticLines(width, height);
  }

  private precomputeStaticLines(width: number, height: number) {
    const horizonWidth = width * 0.1;
    const horizonHeight = height * 0.15;
    const horizonX = (width - horizonWidth) / 2;
    const horizonY = (height - horizonHeight) / 2;

    let index = 0;
    
    // Pre-compute all static line vertices - now includes all 4 line types
    for (let i = 0; i <= this.numLines; i++) {
      const ratio = i / this.numLines;
      
      // Top lines: from top edge to vanishing point (NOT horizon)
      const x1_top = ratio * width;
      const y1_top = 0;
      // Calculate vanishing point position: lerp between start and horizon by vanishingPoint percentage
      const x2_top = x1_top + (horizonX + ratio * horizonWidth - x1_top) * this.vanishingPoint;
      const y2_top = y1_top + (horizonY - y1_top) * this.vanishingPoint;
      const alpha1_top = 1.0; // Full opacity at edge
      const alpha2_top = 0.0; // Full transparency at vanishing point
      
      this.staticVertices[index++] = x1_top;
      this.staticVertices[index++] = y1_top;
      this.staticVertices[index++] = alpha1_top;
      this.staticVertices[index++] = x2_top;
      this.staticVertices[index++] = y2_top;
      this.staticVertices[index++] = alpha2_top;

      // Bottom lines: from bottom edge to vanishing point
      const x1_bot = ratio * width;
      const y1_bot = height;
      const x2_bot = x1_bot + (horizonX + ratio * horizonWidth - x1_bot) * this.vanishingPoint;
      const y2_bot = y1_bot + (horizonY + horizonHeight - y1_bot) * this.vanishingPoint;
      const alpha1_bot = 1.0;
      const alpha2_bot = 0.0; // Full transparency at vanishing point
      
      this.staticVertices[index++] = x1_bot;
      this.staticVertices[index++] = y1_bot;
      this.staticVertices[index++] = alpha1_bot;
      this.staticVertices[index++] = x2_bot;
      this.staticVertices[index++] = y2_bot;
      this.staticVertices[index++] = alpha2_bot;

      // Left lines: from left edge to vanishing point
      const x1_left = 0;
      const y1_left = ratio * height;
      const x2_left = x1_left + (horizonX - x1_left) * this.vanishingPoint;
      const y2_left = y1_left + (horizonY + ratio * horizonHeight - y1_left) * this.vanishingPoint;
      const alpha1_left = 1.0;
      const alpha2_left = 0.0; // Full transparency at vanishing point
      
      this.staticVertices[index++] = x1_left;
      this.staticVertices[index++] = y1_left;
      this.staticVertices[index++] = alpha1_left;
      this.staticVertices[index++] = x2_left;
      this.staticVertices[index++] = y2_left;
      this.staticVertices[index++] = alpha2_left;

      // Right lines: from right edge to vanishing point
      const x1_right = width;
      const y1_right = ratio * height;
      const x2_right = x1_right + (horizonX + horizonWidth - x1_right) * this.vanishingPoint;
      const y2_right = y1_right + (horizonY + ratio * horizonHeight - y1_right) * this.vanishingPoint;
      const alpha1_right = 1.0;
      const alpha2_right = 0.0; // Full transparency at vanishing point
      
      this.staticVertices[index++] = x1_right;
      this.staticVertices[index++] = y1_right;
      this.staticVertices[index++] = alpha1_right;
      this.staticVertices[index++] = x2_right;
      this.staticVertices[index++] = y2_right;
      this.staticVertices[index++] = alpha2_right;
    }

    // Upload to GPU
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.staticLinesBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.staticVertices, this.gl.STATIC_DRAW);
  }

  render(frameCount: number, animationSpeed: number, width: number, height: number) {
    if (!this.program || this.isDisposed) return;

    // Set WebGL state for proper rendering
    this.gl.clearColor(0, 0, 0, 0); // Transparent background
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    // Set uniforms
    const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    const colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    
    this.gl.uniform2f(resolutionLocation, width, height);
    this.gl.uniform3f(colorLocation, this.lineColor[0], this.lineColor[1], this.lineColor[2]);
    

    // Get attribute locations
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const alphaLocation = this.gl.getAttribLocation(this.program, 'a_alpha');

    // Render static lines
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.staticLinesBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(alphaLocation);
    
    // Fix: Each vertex has 3 floats (x, y, alpha), stride = 12 bytes
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 12, 0);
    this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 12, 8);
    
    // Fix: Each vertex is 3 floats, so vertex count = length / 3
    this.gl.drawArrays(this.gl.LINES, 0, this.staticVertices.length / 3);

    // Render animated grid
    this.updateGridVertices(frameCount, animationSpeed, width, height);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.gridVertices, this.gl.DYNAMIC_DRAW);
    
    // Fix: Grid vertices also have 3 floats per vertex (x, y, alpha)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 12, 0);
    this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 12, 8);
    
    // Fix: Count only non-zero vertices to avoid rendering invalid data
    let vertexCount = 0;
    for (let i = 0; i < this.gridVertices.length; i += 3) {
      if (this.gridVertices[i] !== 0 || this.gridVertices[i + 1] !== 0) {
        vertexCount++;
      }
    }
    this.gl.drawArrays(this.gl.LINES, 0, vertexCount);
  }

  private updateGridVertices(frameCount: number, animationSpeed: number, width: number, height: number) {
    const horizonWidth = width * 0.1;
    const horizonHeight = height * 0.15;
    const zOffset = frameCount * animationSpeed;
    const segmentLength = 40;
    const totalSegments = 15;

    // Clear the buffer first
    this.gridVertices.fill(0);
    let index = 0;

    for (let i = 0; i < totalSegments; i++) {
      const z = (i * segmentLength + zOffset) % (segmentLength * totalSegments);
      const linearScale = z / (totalSegments * segmentLength);

      if (linearScale > 1 || linearScale < 0) continue;

      const scale = linearScale ** 2.5;
      const alpha = linearScale ** 5;

      // Adjust grid scaling to align with vanishing point
      // At linearScale=0: grid should be at vanishing point size
      // At linearScale=1: grid should be at full screen size
      const vanishingWidth = width * 0.1 * this.vanishingPoint;
      const vanishingHeight = height * 0.15 * this.vanishingPoint;
      
      const rectWidth = vanishingWidth + (width - vanishingWidth) * scale;
      const rectHeight = vanishingHeight + (height - vanishingHeight) * scale;
      const rectX = (width - rectWidth) / 2;
      const rectY = (height - rectHeight) / 2;

      // Create rectangle as 4 lines, each line = 2 vertices * 3 floats
      // Top line
      if (index + 5 < this.gridVertices.length) {
        this.gridVertices[index++] = rectX; // x1
        this.gridVertices[index++] = rectY; // y1
        this.gridVertices[index++] = alpha; // alpha1
        this.gridVertices[index++] = rectX + rectWidth; // x2
        this.gridVertices[index++] = rectY; // y2
        this.gridVertices[index++] = alpha; // alpha2
      }

      // Right line
      if (index + 5 < this.gridVertices.length) {
        this.gridVertices[index++] = rectX + rectWidth; // x1
        this.gridVertices[index++] = rectY; // y1
        this.gridVertices[index++] = alpha; // alpha1
        this.gridVertices[index++] = rectX + rectWidth; // x2
        this.gridVertices[index++] = rectY + rectHeight; // y2
        this.gridVertices[index++] = alpha; // alpha2
      }

      // Bottom line
      if (index + 5 < this.gridVertices.length) {
        this.gridVertices[index++] = rectX + rectWidth; // x1
        this.gridVertices[index++] = rectY + rectHeight; // y1
        this.gridVertices[index++] = alpha; // alpha1
        this.gridVertices[index++] = rectX; // x2
        this.gridVertices[index++] = rectY + rectHeight; // y2
        this.gridVertices[index++] = alpha; // alpha2
      }

      // Left line
      if (index + 5 < this.gridVertices.length) {
        this.gridVertices[index++] = rectX; // x1
        this.gridVertices[index++] = rectY + rectHeight; // y1
        this.gridVertices[index++] = alpha; // alpha1
        this.gridVertices[index++] = rectX; // x2
        this.gridVertices[index++] = rectY; // y2
        this.gridVertices[index++] = alpha; // alpha2
      }
    }
  }

  dispose() {
    if (this.isDisposed) return;
    
    // Delete WebGL buffers
    if (this.staticLinesBuffer) {
      this.gl.deleteBuffer(this.staticLinesBuffer);
      this.staticLinesBuffer = null;
    }
    
    if (this.gridBuffer) {
      this.gl.deleteBuffer(this.gridBuffer);
      this.gridBuffer = null;
    }
    
    // Delete shader program
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    
    this.isDisposed = true;
  }
}

const PerspectiveGridTunnel: React.FC<PerspectiveGridTunnelProps> = ({
  numLines = 20,
  lineColor = '#00ff00',
  animationSpeed = 1,
  maxOpacity = 1,
  vanishingPoint = 0.75,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCount = useRef(0);
  const rendererRef = useRef<WebGLGridRenderer | null>(null);
  
  const opacity = maxOpacity;


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      return;
    }

    let width: number, height: number;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      if (rendererRef.current) {
        rendererRef.current.resize(width, height);
      }
    };

    // Initialize WebGL renderer
    rendererRef.current = new WebGLGridRenderer(gl as WebGLRenderingContext, numLines, lineColor, vanishingPoint);
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const animate = () => {
      if (rendererRef.current) {
        frameCount.current++;
        rendererRef.current.render(frameCount.current, animationSpeed, width, height);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Always animate - this is just a background animation
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [numLines, lineColor, animationSpeed, maxOpacity, vanishingPoint]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen bg-transparent -z-10"
      style={{ opacity: opacity }}
    />
  );
};

export default PerspectiveGridTunnel;