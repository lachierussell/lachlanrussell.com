import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

@customElement('x-browser')
export class XBrowser extends LitElement {
  @property({ type: String }) initialUrl = 'https://en.wikipedia.org/wiki/Main_Page';
  
  @state() private currentUrl = '';
  @state() private inputUrl = '';
  @state() private isLoading = false;
  @state() private history: string[] = [];
  @state() private historyIndex = -1;

  @query('iframe') private iframe!: HTMLIFrameElement;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--x11-window-bg, #c0c4cc);
      font-family: var(--x11-font-family, sans-serif);
      font-size: var(--x11-font-size, 12px);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: var(--x11-window-bg, #c0c4cc);
      border-bottom: 1px solid var(--x11-border-dark, #606468);
    }

    .nav-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--x11-window-bg, #c0c4cc);
      border: 1px solid var(--x11-border-dark, #606468);
      border-radius: 2px;
      cursor: pointer;
      font-size: 14px;
      color: var(--x11-text, #000);
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--x11-border-light, #e0e4ec);
    }

    .nav-btn:active:not(:disabled) {
      background: var(--x11-border-dark, #606468);
      color: #fff;
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .url-bar {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--x11-input-bg, #fffff0);
      border: 1px solid var(--x11-border-dark, #606468);
      border-radius: 2px;
      padding: 2px 6px;
      height: 24px;
    }

    .url-input {
      flex: 1;
      border: none;
      background: transparent;
      font-family: var(--x11-font-mono, monospace);
      font-size: 11px;
      outline: none;
      color: var(--x11-text, #000);
    }

    .url-input::placeholder {
      color: var(--x11-text-disabled, #606468);
    }

    .go-btn {
      padding: 2px 8px;
      background: var(--x11-window-bg, #c0c4cc);
      border: 1px solid var(--x11-border-dark, #606468);
      border-radius: 2px;
      cursor: pointer;
      font-size: 11px;
      color: var(--x11-text, #000);
    }

    .go-btn:hover {
      background: var(--x11-border-light, #e0e4ec);
    }

    .go-btn:active {
      background: var(--x11-border-dark, #606468);
      color: #fff;
    }

    .browser-content {
      flex: 1;
      background: #fff;
      border: 1px solid var(--x11-border-dark, #606468);
      margin: 4px;
      position: relative;
      overflow: hidden;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--x11-text, #000);
    }

    .error-message {
      padding: 20px;
      text-align: center;
      color: var(--x11-text, #000);
    }

    .error-message h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }

    .error-message p {
      margin: 0;
      font-size: 11px;
      color: var(--x11-text-disabled, #606468);
    }

    .notice-bar {
      padding: 4px 8px;
      background: #fff8e0;
      border-bottom: 1px solid #e0d080;
      font-size: 10px;
      color: #665500;
      text-align: center;
    }

    .status-bar {
      display: flex;
      align-items: center;
      padding: 2px 6px;
      background: var(--x11-window-bg, #c0c4cc);
      border-top: 1px solid var(--x11-border-light, #e0e4ec);
      font-size: 10px;
      color: var(--x11-text, #000);
    }

    .status-bar .url {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bookmarks {
      display: flex;
      gap: 2px;
      padding: 2px 4px;
      background: var(--x11-window-bg, #c0c4cc);
      border-bottom: 1px solid var(--x11-border-dark, #606468);
      overflow-x: auto;
    }

    .bookmark-btn {
      padding: 2px 8px;
      background: var(--x11-window-bg, #c0c4cc);
      border: 1px solid var(--x11-border-dark, #606468);
      border-radius: 2px;
      cursor: pointer;
      font-size: 10px;
      color: var(--x11-text, #000);
      white-space: nowrap;
    }

    .bookmark-btn:hover {
      background: var(--x11-border-light, #e0e4ec);
    }
  `;

  private bookmarks = [
    { name: 'FreeBSD', url: 'https://www.freebsd.org/' },
    { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/FreeBSD' },
    { name: 'Archive.org', url: 'https://archive.org/' },
    { name: 'Handbook', url: 'https://docs.freebsd.org/en/books/handbook/' },
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.currentUrl = this.initialUrl;
    this.inputUrl = this.initialUrl;
    this.navigateTo(this.initialUrl);
  }

  private navigateTo(url: string): void {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    this.currentUrl = url;
    this.inputUrl = url;
    this.isLoading = true;

    // Add to history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
  }

  private handleUrlKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.navigateTo(this.inputUrl);
    }
  }

  private handleUrlInput(e: Event): void {
    this.inputUrl = (e.target as HTMLInputElement).value;
  }

  private goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      this.currentUrl = url;
      this.inputUrl = url;
      this.isLoading = true;
    }
  }

  private goForward(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const url = this.history[this.historyIndex];
      this.currentUrl = url;
      this.inputUrl = url;
      this.isLoading = true;
    }
  }

  private reload(): void {
    this.isLoading = true;
    if (this.iframe) {
      this.iframe.src = this.currentUrl;
    }
  }

  private handleIframeLoad(): void {
    this.isLoading = false;
  }

  private handleBookmarkClick(url: string): void {
    this.inputUrl = url;
    this.navigateTo(url);
  }

  render() {
    return html`
      <div class="toolbar">
        <button 
          class="nav-btn" 
          @click=${this.goBack}
          ?disabled=${this.historyIndex <= 0}
          title="Back"
        >◀</button>
        <button 
          class="nav-btn" 
          @click=${this.goForward}
          ?disabled=${this.historyIndex >= this.history.length - 1}
          title="Forward"
        >▶</button>
        <button 
          class="nav-btn" 
          @click=${this.reload}
          title="Reload"
        >↻</button>
        
        <div class="url-bar">
          <input 
            class="url-input" 
            type="text"
            .value=${this.inputUrl}
            @input=${this.handleUrlInput}
            @keydown=${this.handleUrlKeydown}
            placeholder="Enter URL..."
          />
        </div>
        
        <button class="go-btn" @click=${() => this.navigateTo(this.inputUrl)}>Go</button>
      </div>

      <div class="bookmarks">
        ${this.bookmarks.map(b => html`
          <button 
            class="bookmark-btn"
            @click=${() => this.handleBookmarkClick(b.url)}
          >${b.name}</button>
        `)}
      </div>

      <div class="notice-bar">
        ⚠ Many sites block iframe embedding for security. Try the bookmarks above.
      </div>

      <div class="browser-content">
        ${this.isLoading ? html`
          <div class="loading-overlay">Loading...</div>
        ` : ''}
        <iframe 
          src=${this.currentUrl}
          @load=${this.handleIframeLoad}
          referrerpolicy="no-referrer"
          allow="fullscreen"
        ></iframe>
      </div>

      <div class="status-bar">
        <span class="url">${this.currentUrl}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-browser': XBrowser;
  }
}
