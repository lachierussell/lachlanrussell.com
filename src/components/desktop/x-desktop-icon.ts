import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('x-desktop-icon')
export class XDesktopIcon extends LitElement {
  @property({ type: String }) nodeId = '';
  @property({ type: String }) name = '';
  @property({ type: String }) icon = '📄';
  @property({ type: String }) type: 'file' | 'folder' = 'file';
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean, reflect: true }) selected = false;

  @state() private isDragging = false;
  @state() private dragOffsetX = 0;
  @state() private dragOffsetY = 0;

  static styles = css`
    :host {
      display: block;
      position: absolute;
      width: var(--x11-desktop-icon-width, 64px);
      cursor: pointer;
      user-select: none;
    }

    .icon-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px;
    }

    :host([selected]) .icon-wrapper {
      /* X11 style - dashed selection border */
      outline: 1px dashed #fff;
      outline-offset: -1px;
    }

    .icon-image {
      font-size: 32px;
      line-height: 1;
      margin-bottom: 2px;
      /* Classic X11 icon look - sharp with black outline effect */
      filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.7));
    }

    .icon-label {
      font-family: var(--x11-font-family, sans-serif);
      font-size: 10px;
      color: #ffffff;
      text-align: center;
      /* X11 style text shadow - single pixel offset */
      text-shadow: 1px 1px 0 #000;
      word-break: break-word;
      max-width: 100%;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.2;
    }

    :host([selected]) .icon-label {
      background: var(--x11-selection-bg, #4a6984);
      color: var(--x11-selection-text, #ffffff);
      text-shadow: none;
      padding: 0 2px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updatePosition();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('x') || changedProperties.has('y')) {
      this.updatePosition();
    }
  }

  private updatePosition(): void {
    this.style.left = `${this.x}px`;
    this.style.top = `${this.y}px`;
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('icon-click', {
      bubbles: true,
      composed: true,
      detail: { nodeId: this.nodeId },
    }));
  }

  private handleDoubleClick(e: MouseEvent): void {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('icon-dblclick', {
      bubbles: true,
      composed: true,
      detail: { nodeId: this.nodeId, type: this.type },
    }));
  }

  private handlePointerDown = (e: PointerEvent): void => {
    // Only drag on left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    this.isDragging = false;
    this.dragOffsetX = e.clientX - this.x;
    this.dragOffsetY = e.clientY - this.y;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    this.isDragging = true;
    
    // Grid snap (every 20px)
    const gridSize = 20;
    let newX = e.clientX - this.dragOffsetX;
    let newY = e.clientY - this.dragOffsetY;
    
    // Snap to grid
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
    
    // Keep on screen
    newX = Math.max(0, Math.min(newX, window.innerWidth - 64));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 100));

    this.dispatchEvent(new CustomEvent('icon-move', {
      bubbles: true,
      composed: true,
      detail: { nodeId: this.nodeId, x: newX, y: newY },
    }));
  };

  private handlePointerUp = (): void => {
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
    
    // Small delay to prevent click from firing after drag
    setTimeout(() => {
      this.isDragging = false;
    }, 10);
  };

  render() {
    return html`
      <div 
        class="icon-wrapper"
        @click=${this.handleClick}
        @dblclick=${this.handleDoubleClick}
        @pointerdown=${this.handlePointerDown}
      >
        <span class="icon-image">${this.icon}</span>
        <span class="icon-label">${this.name}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-desktop-icon': XDesktopIcon;
  }
}
