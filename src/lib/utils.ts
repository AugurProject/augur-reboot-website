import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to construct URLs with the correct base path
 * Works with Cloudflare (no base), GitHub Pages (with base path), and custom domain (no base)
 */
export function withBase(path: string): string {
  let base = import.meta.env.BASE_URL || '/';
  
  // Ensure base ends with slash for proper concatenation
  if (base !== '/' && !base.endsWith('/')) {
    base = `${base}/`;
  }
  
  // Handle empty path
  if (!path) return base;
  
  // Handle query strings and fragments
  if (path.startsWith('?') || path.startsWith('#')) {
    return base === '/' ? path : base.replace(/\/$/, '') + path;
  }
  
  // Handle absolute paths
  if (path.startsWith('/')) {
    return base === '/' ? path : base + path.slice(1);
  }
  
  // Handle relative paths
  return base + path;
}
