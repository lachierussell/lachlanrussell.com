import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('x-image-viewer')
export class XImageViewer extends LitElement {
  @property({ type: String }) filePath = '';
  @property({ type: String }) fileName = 'Image';
  @property({ type: String }) src = '';

  @state() private fitToWindow = true;
  @state() private imageLoaded = false;
  @state() private imageError = false;
  @state() private naturalWidth = 0;
  @state() private naturalHeight = 0;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--x11-window-bg, #b4b4b4);
      font-family: var(--x11-font-family, sans-serif);
      font-size: var(--x11-font-size, 12px);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
      font-size: 11px;
    }

    .filename {
      flex: 1;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .image-container {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #404040;
      margin: 2px;
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
    }

    .image-container.fit img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .image-container:not(.fit) {
      align-items: flex-start;
      justify-content: flex-start;
    }

    img {
      display: block;
    }

    .loading,
    .error {
      color: #aaa;
      font-size: 12px;
      text-align: center;
      padding: 30px;
    }

    .error {
      color: #ff8888;
    }

    .status-bar {
      padding: 2px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-top: 1px solid var(--x11-border-light, #dcdcdc);
      font-size: 10px;
      color: var(--x11-text, #000000);
    }
  `;

  private handleImageLoad(e: Event): void {
    const img = e.target as HTMLImageElement;
    this.imageLoaded = true;
    this.imageError = false;
    this.naturalWidth = img.naturalWidth;
    this.naturalHeight = img.naturalHeight;
  }

  private handleImageError(): void {
    this.imageLoaded = false;
    this.imageError = true;
  }

  private toggleFit(): void {
    this.fitToWindow = !this.fitToWindow;
  }

  render() {
    return html`
      <div class="toolbar">
        <span class="filename">${this.fileName}</span>
        <button 
          class="toolbar-btn ${this.fitToWindow ? 'active' : ''}"
          @click=${this.toggleFit}
          title="${this.fitToWindow ? 'Show actual size' : 'Fit to window'}"
        >
          ${this.fitToWindow ? 'Fit' : '1:1'}
        </button>
      </div>

      <div class="image-container ${this.fitToWindow ? 'fit' : ''}">
        ${this.src ? html`
          ${!this.imageLoaded && !this.imageError ? html`
            <div class="loading">Loading image...</div>
          ` : ''}
          ${this.imageError ? html`
            <div class="error">Failed to load image</div>
          ` : ''}
          <img 
            src=${this.src} 
            alt=${this.fileName}
            @load=${this.handleImageLoad}
            @error=${this.handleImageError}
            style="display: ${this.imageLoaded ? 'block' : 'none'}"
          />
        ` : html`
          <div class="error">No image source</div>
        `}
      </div>

      <div class="status-bar">
        ${this.imageLoaded 
          ? `${this.naturalWidth} × ${this.naturalHeight} pixels`
          : this.imageError 
            ? 'Error loading image'
            : 'Loading...'
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-image-viewer': XImageViewer;
  }
}
