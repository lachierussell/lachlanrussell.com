import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './x-window-titlebar.js';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

@customElement('x-window')
export class XWindow extends LitElement {
  @property({ type: String }) windowId = '';
  @property({ type: String }) title = 'Window';
  @property({ type: String }) icon = '📋';
  @property({ type: Number }) x = 100;
  @property({ type: Number }) y = 100;
  @property({ type: Number }) width = 400;
  @property({ type: Number }) height = 300;
  @property({ type: Number }) zIndex = 100;
  @property({ type: Boolean }) isMinimized = false;
  @property({ type: Boolean }) isMaximized = false;
  @property({ type: Boolean }) isFocused = false;
  @property({ type: Boolean }) resizable = true;

  @state() private isDragging = false;
  @state() private isResizing = false;
  @state() private resizeDirection: ResizeDirection = null;

  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartWindowX = 0;
  private dragStartWindowY = 0;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeStartWindowX = 0;
  private resizeStartWindowY = 0;

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* FVWM style window frame - cleaner, simpler */
    .window {
      display: flex;
      flex-direction: column;
      background: var(--x11-window-bg, #c0c4cc);
      width: 100%;
      height: 100%;
      
      /* Simple black border */
      border: 1px solid var(--x11-border-darker, #000000);
    }

    /* Inner frame - FVWM uses thinner bevels */
    .window-frame {
      display: flex;
      flex-direction: column;
      flex: 1;
      border-style: solid;
      border-width: 3px;
      border-color: var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468) var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec);
      padding: 1px;
    }

    .window.focused {
      /* Minimal shadow for depth */
      filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.25));
    }

    .content {
      flex: 1;
      overflow: auto;
      background: var(--x11-window-bg, #c0c4cc);
      /* Sunken content area */
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec) var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468);
    }

    /* Resize handles - positioned on the outer frame */
    .resize-handle {
      position: absolute;
      z-index: 10;
    }

    .resize-n {
      top: 0;
      left: 12px;
      right: 12px;
      height: 5px;
      cursor: n-resize;
    }

    .resize-s {
      bottom: 0;
      left: 12px;
      right: 12px;
      height: 5px;
      cursor: s-resize;
    }

    .resize-e {
      right: 0;
      top: 12px;
      bottom: 12px;
      width: 5px;
      cursor: e-resize;
    }

    .resize-w {
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 5px;
      cursor: w-resize;
    }

    .resize-ne {
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: ne-resize;
    }

    .resize-nw {
      top: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nw-resize;
    }

    .resize-se {
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: se-resize;
    }

    .resize-sw {
      bottom: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: sw-resize;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mousedown', this.handleWindowClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mousedown', this.handleWindowClick);
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
  }

  private handleWindowClick = (): void => {
    if (!this.isFocused) {
      this.dispatchEvent(new CustomEvent('window-focus', {
        bubbles: true,
        composed: true,
        detail: { windowId: this.windowId },
      }));
    }
  };

  private handleDragStart = (e: CustomEvent): void => {
    if (this.isMaximized) return;
    
    const { pointerId, clientX, clientY } = e.detail;
    
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragStartWindowX = this.x;
    this.dragStartWindowY = this.y;

    // Capture pointer on the window element itself for reliable tracking
    this.setPointerCapture(pointerId);
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
  };

  private handleResizeStart = (e: PointerEvent, direction: ResizeDirection): void => {
    if (this.isMaximized || !this.resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    this.resizeDirection = direction;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = this.width;
    this.resizeStartHeight = this.height;
    this.resizeStartWindowX = this.x;
    this.resizeStartWindowY = this.y;

    // Capture pointer on the window element itself
    this.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isDragging) {
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;
      const newX = Math.max(0, this.dragStartWindowX + deltaX);
      const newY = Math.max(0, this.dragStartWindowY + deltaY);

      this.dispatchEvent(new CustomEvent('window-move', {
        bubbles: true,
        composed: true,
        detail: { windowId: this.windowId, x: newX, y: newY },
      }));
    } else if (this.isResizing && this.resizeDirection) {
      const deltaX = e.clientX - this.resizeStartX;
      const deltaY = e.clientY - this.resizeStartY;

      let newWidth = this.resizeStartWidth;
      let newHeight = this.resizeStartHeight;
      let newX = this.resizeStartWindowX;
      let newY = this.resizeStartWindowY;

      const dir = this.resizeDirection;

      if (dir.includes('e')) {
        newWidth = Math.max(200, this.resizeStartWidth + deltaX);
      }
      if (dir.includes('w')) {
        const widthDelta = Math.min(deltaX, this.resizeStartWidth - 200);
        newWidth = this.resizeStartWidth - widthDelta;
        newX = this.resizeStartWindowX + widthDelta;
      }
      if (dir.includes('s')) {
        newHeight = Math.max(150, this.resizeStartHeight + deltaY);
      }
      if (dir.includes('n')) {
        const heightDelta = Math.min(deltaY, this.resizeStartHeight - 150);
        newHeight = this.resizeStartHeight - heightDelta;
        newY = this.resizeStartWindowY + heightDelta;
      }

      this.dispatchEvent(new CustomEvent('window-resize', {
        bubbles: true,
        composed: true,
        detail: { windowId: this.windowId, width: newWidth, height: newHeight, x: newX, y: newY },
      }));
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.isDragging || this.isResizing) {
      this.releasePointerCapture(e.pointerId);
    }
    this.isDragging = false;
    this.isResizing = false;
    this.resizeDirection = null;
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
  };

  private handleMinimize = (): void => {
    this.dispatchEvent(new CustomEvent('window-minimize', {
      bubbles: true,
      composed: true,
      detail: { windowId: this.windowId },
    }));
  };

  private handleMaximize = (): void => {
    this.dispatchEvent(new CustomEvent('window-maximize', {
      bubbles: true,
      composed: true,
      detail: { windowId: this.windowId },
    }));
  };

  private handleClose = (): void => {
    this.dispatchEvent(new CustomEvent('window-close', {
      bubbles: true,
      composed: true,
      detail: { windowId: this.windowId },
    }));
  };

  updated(changedProperties: Map<string, unknown>): void {
    // Apply position styles to the host element
    if (changedProperties.has('x') || changedProperties.has('y') || 
        changedProperties.has('width') || changedProperties.has('height') ||
        changedProperties.has('zIndex') || changedProperties.has('isMinimized')) {
      this.style.left = `${this.x}px`;
      this.style.top = `${this.y}px`;
      this.style.width = `${this.width}px`;
      this.style.height = `${this.height}px`;
      this.style.zIndex = `${this.zIndex}`;
      this.style.display = this.isMinimized ? 'none' : 'block';
    }
  }

  render() {
    return html`
      <div class="window ${this.isFocused ? 'focused' : ''}">
        <div class="window-frame">
          <x-window-titlebar
            .title=${this.title}
            .icon=${this.icon}
            .isFocused=${this.isFocused}
            @titlebar-dragstart=${this.handleDragStart}
            @titlebar-minimize=${this.handleMinimize}
            @titlebar-maximize=${this.handleMaximize}
            @titlebar-close=${this.handleClose}
          ></x-window-titlebar>
          <div class="content">
            <slot></slot>
          </div>
        </div>
        
        ${this.resizable && !this.isMaximized ? html`
          <div class="resize-handle resize-n" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'n')}></div>
          <div class="resize-handle resize-s" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 's')}></div>
          <div class="resize-handle resize-e" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'e')}></div>
          <div class="resize-handle resize-w" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'w')}></div>
          <div class="resize-handle resize-ne" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'ne')}></div>
          <div class="resize-handle resize-nw" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'nw')}></div>
          <div class="resize-handle resize-se" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'se')}></div>
          <div class="resize-handle resize-sw" @pointerdown=${(e: PointerEvent) => this.handleResizeStart(e, 'sw')}></div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-window': XWindow;
  }
}
