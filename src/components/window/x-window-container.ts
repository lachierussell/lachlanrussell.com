import { LitElement, html, css } from 'lit';
import type { TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { WindowState, AppType } from '../../types/index.js';
import { windowManager } from '../../services/window-manager.js';
import './x-window.js';

// Import all app components
import '../apps/x-file-manager.js';
import '../apps/x-text-viewer.js';
import '../apps/x-image-viewer.js';
import '../apps/x-clock.js';
import '../apps/x-calculator.js';
import '../apps/x-terminal.js';
import '../apps/x-eyes.js';
import '../apps/x-browser.js';

/**
 * App content renderers - maps app types to their render functions
 * This is declarative and driven by the app registry
 */
type AppRenderer = (win: WindowState) => TemplateResult;

const APP_RENDERERS: Record<AppType, AppRenderer> = {
  'file-manager': (win) => html`
    <x-file-manager 
      .currentPath=${(win.appData?.path as string) || '/'}
      .windowId=${win.id}
    ></x-file-manager>`,
  
  'text-viewer': (win) => html`
    <x-text-viewer
      .filePath=${(win.appData?.path as string) || ''}
      .fileName=${(win.appData?.name as string) || 'Untitled'}
      .content=${(win.appData?.content as string) || ''}
    ></x-text-viewer>`,
  
  'image-viewer': (win) => html`
    <x-image-viewer
      .filePath=${(win.appData?.path as string) || ''}
      .fileName=${(win.appData?.name as string) || 'Image'}
      .src=${(win.appData?.src as string) || ''}
    ></x-image-viewer>`,
  
  'about': (win) => html`
    <x-text-viewer
      .filePath="/about"
      .fileName="About"
      .content=${(win.appData?.content as string) || 'About this website'}
    ></x-text-viewer>`,

  'clock': () => html`<x-clock></x-clock>`,
  'calculator': () => html`<x-calculator></x-calculator>`,
  'terminal': () => html`<x-terminal></x-terminal>`,
  'xeyes': () => html`<x-eyes></x-eyes>`,
  
  'browser': (win) => html`
    <x-browser
      .initialUrl=${(win.appData?.url as string) || 'https://www.wikipedia.org/'}
    ></x-browser>`,
};

@customElement('x-window-container')
export class XWindowContainer extends LitElement {
  @state() private windows: WindowState[] = [];

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: var(--x11-taskbar-height, 32px);
      overflow: hidden;
      pointer-events: none;
    }

    x-window {
      pointer-events: auto;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateWindows();
    window.addEventListener('windows-changed', this.handleWindowsChanged);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('windows-changed', this.handleWindowsChanged);
  }

  private handleWindowsChanged = (): void => {
    this.updateWindows();
  };

  private updateWindows(): void {
    this.windows = [...windowManager.getWindows()];
  }

  private handleWindowFocus(e: CustomEvent): void {
    windowManager.focusWindow(e.detail.windowId);
  }

  private handleWindowMove(e: CustomEvent): void {
    const { windowId, x, y } = e.detail;
    windowManager.moveWindow(windowId, x, y);
  }

  private handleWindowResize(e: CustomEvent): void {
    const { windowId, width, height, x, y } = e.detail;
    const win = windowManager.getWindow(windowId);
    if (!win) return;

    // Handle position changes from north/west edge resizing
    if (x !== undefined || y !== undefined) {
      windowManager.moveWindow(windowId, x ?? win.x, y ?? win.y);
    }
    windowManager.resizeWindow(windowId, width, height);
  }

  private handleWindowMinimize(e: CustomEvent): void {
    windowManager.minimizeWindow(e.detail.windowId);
  }

  private handleWindowMaximize(e: CustomEvent): void {
    windowManager.toggleMaximize(e.detail.windowId);
  }

  private handleWindowClose(e: CustomEvent): void {
    windowManager.closeWindow(e.detail.windowId);
  }

  /** Render app content using the declarative renderer map */
  private renderAppContent(win: WindowState): TemplateResult {
    const renderer = APP_RENDERERS[win.appType];
    if (renderer) {
      return renderer(win);
    }
    // Fallback for unknown app types
    return html`<div style="padding: 16px;">Unknown application: ${win.appType}</div>`;
  }

  render() {
    return html`
      ${this.windows.map(win => html`
        <x-window
          .windowId=${win.id}
          .title=${win.title}
          .icon=${win.icon}
          .x=${win.x}
          .y=${win.y}
          .width=${win.width}
          .height=${win.height}
          .zIndex=${win.zIndex}
          .isMinimized=${win.isMinimized}
          .isMaximized=${win.isMaximized}
          .isFocused=${win.isFocused}
          @window-focus=${this.handleWindowFocus}
          @window-move=${this.handleWindowMove}
          @window-resize=${this.handleWindowResize}
          @window-minimize=${this.handleWindowMinimize}
          @window-maximize=${this.handleWindowMaximize}
          @window-close=${this.handleWindowClose}
        >
          ${this.renderAppContent(win)}
        </x-window>
      `)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-window-container': XWindowContainer;
  }
}
