import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { WindowState } from '../../types/index.js';
import { windowManager } from '../../services/window-manager.js';
import { EVENTS, TIMING } from '../../constants.js';

@customElement('x-taskbar')
export class XTaskbar extends LitElement {
  @state() private windows: WindowState[] = [];
  @state() private currentTime = '';

  private timeInterval?: number;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 24px;
      z-index: 10000;
    }

    /* FVWM-style minimal panel */
    .taskbar {
      display: flex;
      align-items: center;
      height: 100%;
      background: var(--x11-window-bg, #c0c4cc);
      border-style: solid;
      border-width: 1px 0 0 0;
      border-color: var(--x11-border-light, #e0e4ec);
      padding: 1px 4px;
      gap: 2px;
    }

    .window-buttons {
      display: flex;
      flex: 1;
      gap: 2px;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .window-btn {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 1px 5px;
      min-width: 80px;
      max-width: 150px;
      height: 18px;
      background: var(--x11-window-bg, #c0c4cc);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468) var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec);
      cursor: pointer;
      font-family: var(--x11-font-family, sans-serif);
      font-size: 10px;
      color: var(--x11-text, #000000);
      text-align: left;
    }

    .window-btn:hover {
      background: #d0d4dc;
    }

    .window-btn.active {
      border-color: var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec) var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468);
      background: var(--x11-titlebar-active, #506070);
      color: #fff;
    }

    .window-btn.minimized {
      color: var(--x11-text-disabled, #606468);
    }

    .window-btn.minimized.active {
      color: #ccc;
    }

    .window-btn-icon {
      font-size: 12px;
      flex-shrink: 0;
    }

    .window-btn-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .clock {
      display: flex;
      align-items: center;
      padding: 1px 8px;
      height: 20px;
      background: var(--x11-window-bg, #b4b4b4);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
      font-family: var(--x11-font-mono, monospace);
      font-size: 11px;
      color: var(--x11-text, #000000);
    }

    .divider {
      width: 2px;
      height: 20px;
      margin: 0 2px;
      border-left: 1px solid var(--x11-border-dark, #6e6e6e);
      border-right: 1px solid var(--x11-border-light, #dcdcdc);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateWindows();
    this.updateTime();
    window.addEventListener(EVENTS.WINDOWS_CHANGED, this.handleWindowsChanged);
    this.timeInterval = window.setInterval(() => this.updateTime(), TIMING.CLOCK_INTERVAL);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(EVENTS.WINDOWS_CHANGED, this.handleWindowsChanged);
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private handleWindowsChanged = (): void => {
    this.updateWindows();
  };

  private updateWindows(): void {
    this.windows = [...windowManager.getWindows()];
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private handleWindowClick(win: WindowState): void {
    if (win.isMinimized) {
      windowManager.restoreWindow(win.id);
    } else if (win.isFocused) {
      windowManager.minimizeWindow(win.id);
    } else {
      windowManager.focusWindow(win.id);
    }
  }

  render() {
    return html`
      <div class="taskbar">
        <div class="window-buttons">
          ${this.windows.map(win => html`
            <button 
              class="window-btn ${win.isFocused ? 'active' : ''} ${win.isMinimized ? 'minimized' : ''}"
              @click=${() => this.handleWindowClick(win)}
              title=${win.title}
            >
              <span class="window-btn-icon">${win.icon}</span>
              <span class="window-btn-title">${win.title}</span>
            </button>
          `)}
        </div>
        <div class="divider"></div>
        <div class="clock">${this.currentTime}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-taskbar': XTaskbar;
  }
}
