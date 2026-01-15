import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { WindowState, AppType } from '../../types/index.js';
import { windowManager } from '../../services/window-manager.js';
import './x-window.js';
import '../apps/x-file-manager.js';
import '../apps/x-text-viewer.js';
import '../apps/x-image-viewer.js';
import '../apps/x-clock.js';
import '../apps/x-calculator.js';
import '../apps/x-terminal.js';
import '../apps/x-eyes.js';

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
    const { windowId } = e.detail;
    windowManager.focusWindow(windowId);
  }

  private handleWindowMove(e: CustomEvent): void {
    const { windowId, x, y } = e.detail;
    windowManager.moveWindow(windowId, x, y);
  }

  private handleWindowResize(e: CustomEvent): void {
    const { windowId, width, height, x, y } = e.detail;
    if (x !== undefined && y !== undefined) {
      windowManager.moveWindow(windowId, x, y);
    }
    windowManager.resizeWindow(windowId, width, height);
  }

  private handleWindowMinimize(e: CustomEvent): void {
    const { windowId } = e.detail;
    windowManager.minimizeWindow(windowId);
  }

  private handleWindowMaximize(e: CustomEvent): void {
    const { windowId } = e.detail;
    windowManager.toggleMaximize(windowId);
  }

  private handleWindowClose(e: CustomEvent): void {
    const { windowId } = e.detail;
    windowManager.closeWindow(windowId);
  }

  private renderAppContent(win: WindowState) {
    const appType = win.appType as AppType;
    const appData = win.appData || {};

    switch (appType) {
      case 'file-manager':
        return html`<x-file-manager 
          .currentPath=${(appData.path as string) || '/'}
          .windowId=${win.id}
        ></x-file-manager>`;
      
      case 'text-viewer':
        return html`<x-text-viewer
          .filePath=${(appData.path as string) || ''}
          .fileName=${(appData.name as string) || 'Untitled'}
          .content=${(appData.content as string) || ''}
        ></x-text-viewer>`;
      
      case 'image-viewer':
        return html`<x-image-viewer
          .filePath=${(appData.path as string) || ''}
          .fileName=${(appData.name as string) || 'Image'}
          .src=${(appData.src as string) || ''}
        ></x-image-viewer>`;
      
      case 'about':
        return html`<x-text-viewer
          .filePath="/about"
          .fileName="About"
          .content=${(appData.content as string) || 'About this website'}
        ></x-text-viewer>`;

      case 'clock':
        return html`<x-clock></x-clock>`;

      case 'calculator':
        return html`<x-calculator></x-calculator>`;

      case 'terminal':
        return html`<x-terminal></x-terminal>`;

      case 'xeyes':
        return html`<x-eyes></x-eyes>`;
      
      default:
        return html`<div style="padding: 16px;">Unknown application type</div>`;
    }
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
