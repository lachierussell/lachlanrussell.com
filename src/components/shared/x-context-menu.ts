import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}

@customElement('x-context-menu')
export class XContextMenu extends LitElement {
  @property({ type: Array }) items: MenuItem[] = [];
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean, reflect: true }) visible = false;

  @state() private adjustedX = 0;
  @state() private adjustedY = 0;

  static styles = css`
    :host {
      display: none;
      position: fixed;
      z-index: 100000;
    }

    :host([visible]) {
      display: block;
    }

    .menu {
      background: var(--x11-window-bg, #b4b4b4);
      border: 1px solid var(--x11-border-darker, #000);
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      min-width: 150px;
      padding: 2px 0;
    }

    /* Motif-style 3D inner border */
    .menu-inner {
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e) var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc);
      padding: 2px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      cursor: pointer;
      font-family: var(--x11-font-family, sans-serif);
      font-size: 11px;
      color: var(--x11-text, #000);
      gap: 8px;
      user-select: none;
    }

    .menu-item:hover:not(.disabled) {
      background: var(--x11-selection-bg, #4a6984);
      color: var(--x11-selection-text, #fff);
    }

    .menu-item.disabled {
      color: var(--x11-text-disabled, #6e6e6e);
      cursor: default;
    }

    .menu-item-icon {
      width: 16px;
      text-align: center;
      font-size: 12px;
    }

    .menu-item-label {
      flex: 1;
    }

    .separator {
      height: 1px;
      margin: 4px 8px;
      border-top: 1px solid var(--x11-border-dark, #6e6e6e);
      border-bottom: 1px solid var(--x11-border-light, #dcdcdc);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('contextmenu', this.handleDocumentContextMenu);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('contextmenu', this.handleDocumentContextMenu);
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('x') || changedProperties.has('y') || changedProperties.has('visible')) {
      if (this.visible) {
        this.adjustPosition();
      }
    }
  }

  private adjustPosition(): void {
    // Adjust position to keep menu on screen
    const menuWidth = 180;
    const menuHeight = (this.items.length * 28) + 10;
    
    let newX = this.x;
    let newY = this.y;

    if (newX + menuWidth > window.innerWidth) {
      newX = window.innerWidth - menuWidth - 5;
    }
    if (newY + menuHeight > window.innerHeight) {
      newY = window.innerHeight - menuHeight - 5;
    }

    this.adjustedX = Math.max(5, newX);
    this.adjustedY = Math.max(5, newY);
  }

  private handleDocumentClick = (): void => {
    this.hide();
  };

  private handleDocumentContextMenu = (): void => {
    // Will be re-shown by the desktop component if needed
  };

  private handleItemClick(item: MenuItem, e: Event): void {
    e.stopPropagation();
    if (item.disabled || item.separator) return;

    this.dispatchEvent(new CustomEvent('menu-select', {
      bubbles: true,
      composed: true,
      detail: { itemId: item.id, item },
    }));
    this.hide();
  }

  show(x: number, y: number, items: MenuItem[]): void {
    this.x = x;
    this.y = y;
    this.items = items;
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  render() {
    return html`
      <div class="menu" style="left: ${this.adjustedX}px; top: ${this.adjustedY}px;">
        <div class="menu-inner">
          ${this.items.map(item => 
            item.separator 
              ? html`<div class="separator"></div>`
              : html`
                <div 
                  class="menu-item ${item.disabled ? 'disabled' : ''}"
                  @click=${(e: Event) => this.handleItemClick(item, e)}
                >
                  <span class="menu-item-icon">${item.icon || ''}</span>
                  <span class="menu-item-label">${item.label}</span>
                </div>
              `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-context-menu': XContextMenu;
  }
}
