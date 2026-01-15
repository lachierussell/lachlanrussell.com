/**
 * Shared Styles - Reusable CSS for Lit components
 * 
 * This centralizes common styling patterns that were duplicated across:
 * - x-file-manager.ts
 * - x-text-viewer.ts
 * - x-image-viewer.ts
 * - and other app components
 */

import { css } from 'lit';

/**
 * Base app container styles - flex column layout with X11 styling
 */
export const appContainerStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--x11-window-bg, #b4b4b4);
    font-family: var(--x11-font-family, sans-serif);
    font-size: var(--x11-font-size, 12px);
    overflow: hidden;
  }
`;

/**
 * Toolbar styles - horizontal bar with buttons
 */
export const toolbarStyles = css`
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px 6px;
    background: var(--x11-window-bg, #b4b4b4);
    border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
    font-size: 11px;
    flex-shrink: 0;
  }

  .toolbar-btn {
    padding: 1px 6px;
    background: var(--x11-window-bg, #b4b4b4);
    border-style: solid;
    border-width: 1px;
    border-color: var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e) var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc);
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
  }

  .toolbar-btn:active,
  .toolbar-btn.active {
    border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
    background: #9a9a9a;
  }

  .toolbar-btn:disabled {
    color: var(--x11-text-disabled, #6e6e6e);
    cursor: default;
  }
`;

/**
 * Status bar styles - bottom info bar
 */
export const statusBarStyles = css`
  .status-bar {
    padding: 2px 6px;
    background: var(--x11-window-bg, #b4b4b4);
    border-top: 1px solid var(--x11-border-light, #dcdcdc);
    font-size: 10px;
    color: var(--x11-text, #000000);
    flex-shrink: 0;
  }
`;

/**
 * Content area styles - sunken inner container (3D inset effect)
 */
export const contentAreaStyles = css`
  .content-area {
    flex: 1;
    overflow: auto;
    background: var(--x11-input-bg, #ffffff);
    border-style: solid;
    border-width: 1px;
    border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
    margin: 2px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
`;

/**
 * Input field styles - text inputs with 3D inset effect
 */
export const inputStyles = css`
  .input-field {
    padding: 1px 4px;
    background: var(--x11-input-bg, #ffffff);
    border-style: solid;
    border-width: 1px;
    border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
    font-family: var(--x11-font-mono, monospace);
    font-size: 11px;
  }
`;

/**
 * Filename/title display in toolbar
 */
export const filenameLabelStyles = css`
  .filename {
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filepath {
    margin-left: 8px;
    color: var(--x11-text-disabled, #6e6e6e);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
