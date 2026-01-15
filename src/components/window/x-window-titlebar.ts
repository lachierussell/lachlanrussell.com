import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('x-window-titlebar')
export class XWindowTitlebar extends LitElement {
  @property({ type: String }) title = 'Window';
  @property({ type: String }) icon = '📋';
  @property({ type: Boolean }) isFocused = false;

  static styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .titlebar {
      display: flex;
      align-items: center;
      height: var(--x11-titlebar-height, 18px);
      padding: 0 6px;
      cursor: move;
      font-family: var(--x11-title-font, 'Helvetica', sans-serif);
      font-size: 11px;
      font-weight: bold;
      gap: 6px;
      position: relative;
    }

    /* FVWM titlebar - flat, minimal */
    .titlebar.active {
      background: var(--x11-titlebar-active, #506070);
      color: var(--x11-titlebar-text-active, #ffffff);
    }

    .titlebar.inactive {
      background: var(--x11-titlebar-inactive, #a0a4ac);
      color: var(--x11-titlebar-text-inactive, #404040);
    }

    .title {
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 11px;
      pointer-events: none;
    }

    /* Simple monochrome window buttons */
    .btn {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--x11-border-dark, #606468);
      border-radius: 2px;
      background: var(--x11-window-bg, #c0c4cc);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      font-size: 11px;
      font-weight: bold;
      color: var(--x11-text, #000);
      line-height: 1;
    }

    .btn:hover {
      background: var(--x11-border-light, #e0e4ec);
    }

    .btn:active {
      background: var(--x11-border-dark, #606468);
      color: #fff;
    }

    .btn-close::after {
      content: '×';
    }

    .btn-minimize::after {
      content: '−';
    }

    .btn-maximize::after {
      content: '□';
      font-size: 9px;
    }
  `;

  private handleMinimize(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('titlebar-minimize', { bubbles: true, composed: true }));
  }

  private handleMaximize(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('titlebar-maximize', { bubbles: true, composed: true }));
  }

  private handleClose(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('titlebar-close', { bubbles: true, composed: true }));
  }

  private handleDoubleClick(e: Event): void {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('titlebar-maximize', { bubbles: true, composed: true }));
  }

  private handlePointerDown(e: PointerEvent): void {
    // Don't initiate drag if clicking on a button
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    // Forward the pointer event to parent for drag handling
    this.dispatchEvent(new CustomEvent('titlebar-dragstart', { 
      bubbles: true, 
      composed: true,
      detail: {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
      }
    }));
  }

  render() {
    return html`
      <div 
        class="titlebar ${this.isFocused ? 'active' : 'inactive'}"
        @dblclick=${this.handleDoubleClick}
        @pointerdown=${this.handlePointerDown}
      >
        <!-- macOS style: close, minimize, maximize on left -->
        <button class="btn btn-close" @click=${this.handleClose} title="Close"></button>
        <button class="btn btn-minimize" @click=${this.handleMinimize} title="Minimize"></button>
        <button class="btn btn-maximize" @click=${this.handleMaximize} title="Maximize"></button>
        <span class="title">${this.title}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-window-titlebar': XWindowTitlebar;
  }
}
