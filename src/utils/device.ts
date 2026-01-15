/**
 * Device Utilities - Single source of truth for device/viewport detection
 */

import { BREAKPOINTS } from '../constants.js';

/**
 * Check if current viewport is mobile-sized
 */
export function isMobile(): boolean {
  return globalThis.innerWidth < BREAKPOINTS.MOBILE;
}

/**
 * Get current viewport dimensions
 */
export function getViewport(): { width: number; height: number } {
  return {
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
  };
}

/**
 * Get usable viewport area (accounting for taskbar)
 */
export function getUsableViewport(taskbarHeight: number): { width: number; height: number } {
  return {
    width: globalThis.innerWidth,
    height: globalThis.innerHeight - taskbarHeight,
  };
}
