/**
 * Geometry Utilities - Pure functions for position/size calculations
 * 
 * These replace imperative constraint logic scattered throughout components.
 */

import { WINDOW } from '../constants.js';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Constraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Constrain a value to be within min/max bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Snap a value to an edge if within threshold
 */
export function snapToEdge(value: number, edge: number, threshold: number = WINDOW.SNAP_THRESHOLD): number {
  return Math.abs(value - edge) < threshold ? edge : value;
}

/**
 * Constrain window bounds to fit within screen
 */
export function constrainBounds(
  bounds: Bounds,
  screenWidth: number,
  screenHeight: number,
  padding: number = WINDOW.PADDING
): Bounds {
  const maxWidth = screenWidth - padding * 2;
  const maxHeight = screenHeight - padding * 2;
  
  const width = Math.min(bounds.width, maxWidth);
  const height = Math.min(bounds.height, maxHeight);
  
  const x = clamp(bounds.x, padding, screenWidth - width - padding);
  const y = clamp(bounds.y, padding, screenHeight - height - padding);
  
  return { x, y, width, height };
}

/**
 * Apply edge snapping to a position during window move
 */
export function snapPosition(
  x: number,
  y: number,
  windowWidth: number,
  windowHeight: number,
  screenWidth: number,
  screenHeight: number,
  threshold: number = WINDOW.SNAP_THRESHOLD
): { x: number; y: number } {
  let snappedX = x;
  let snappedY = y;

  // Snap to left edge
  if (x < threshold) {
    snappedX = 0;
  }
  // Snap to right edge
  if (x + windowWidth > screenWidth - threshold) {
    snappedX = screenWidth - windowWidth;
  }
  // Snap to top edge
  if (y < threshold) {
    snappedY = 0;
  }
  // Snap to bottom edge
  if (y + windowHeight > screenHeight - threshold) {
    snappedY = screenHeight - windowHeight;
  }

  return {
    x: Math.max(0, snappedX),
    y: Math.max(0, snappedY),
  };
}

/**
 * Apply edge snapping to window resize
 */
export function snapResize(
  x: number,
  y: number,
  width: number,
  height: number,
  screenWidth: number,
  screenHeight: number,
  threshold: number = WINDOW.SNAP_THRESHOLD
): { width: number; height: number } {
  let snappedWidth = Math.max(WINDOW.MIN_WIDTH, width);
  let snappedHeight = Math.max(WINDOW.MIN_HEIGHT, height);

  // Snap width to right edge
  if (x + width > screenWidth - threshold) {
    snappedWidth = screenWidth - x;
  }
  // Snap height to bottom edge
  if (y + height > screenHeight - threshold) {
    snappedHeight = screenHeight - y;
  }

  return { width: snappedWidth, height: snappedHeight };
}
