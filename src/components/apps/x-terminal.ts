import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

interface TerminalLine {
  type: 'input' | 'output';
  content: string;
}

@customElement('x-terminal')
export class XTerminal extends LitElement {
  @state() private lines: TerminalLine[] = [];
  @state() private currentInput = '';
  @state() private commandHistory: string[] = [];
  @state() private historyIndex = -1;

  @query('.terminal-content') private terminalContent!: HTMLElement;
  @query('input') private inputEl!: HTMLInputElement;

  private cwd = '/home';
  private env = {
    USER: 'user',
    HOME: '/home',
    HOSTNAME: 'openbsd',
    SHELL: '/bin/ksh',
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #000;
      font-family: var(--x11-font-mono, 'DejaVu Sans Mono', monospace);
      font-size: 13px;
    }

    .terminal-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      color: #00ff00;
    }

    .line {
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.3;
    }

    .line.input {
      color: #00ff00;
    }

    .line.output {
      color: #cccccc;
    }

    .line.error {
      color: #ff6666;
    }

    .input-line {
      display: flex;
      padding: 0 8px 8px 8px;
      color: #00ff00;
    }

    .prompt {
      white-space: pre;
    }

    input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #00ff00;
      font-family: inherit;
      font-size: inherit;
      padding: 0;
      margin: 0;
    }

    /* Scrollbar styling */
    .terminal-content::-webkit-scrollbar {
      width: 12px;
    }

    .terminal-content::-webkit-scrollbar-track {
      background: #222;
    }

    .terminal-content::-webkit-scrollbar-thumb {
      background: #444;
      border: 1px solid #666;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.printWelcome();
  }

  private printWelcome(): void {
    this.lines = [
      { type: 'output', content: 'OpenBSD 7.4 (GENERIC.MP) #0: Mon Oct  9 14:28:54 MDT 2023' },
      { type: 'output', content: '' },
      { type: 'output', content: 'Welcome to OpenBSD: The proactively secure Unix-like operating system.' },
      { type: 'output', content: '' },
      { type: 'output', content: 'Type "help" for available commands.' },
      { type: 'output', content: '' },
    ];
  }

  private getPrompt(): string {
    const shortCwd = this.cwd === this.env.HOME ? '~' : this.cwd;
    return `${this.env.USER}@${this.env.HOSTNAME}:${shortCwd}$ `;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.navigateHistory(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion could go here
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      this.lines = [...this.lines, { type: 'input', content: this.getPrompt() + this.currentInput + '^C' }];
      this.currentInput = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.lines = [];
    }
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;
    
    const newIndex = this.historyIndex + direction;
    if (newIndex >= -1 && newIndex < this.commandHistory.length) {
      this.historyIndex = newIndex;
      if (newIndex === -1) {
        this.currentInput = '';
      } else {
        this.currentInput = this.commandHistory[this.commandHistory.length - 1 - newIndex];
      }
    }
  }

  private executeCommand(): void {
    const cmd = this.currentInput.trim();
    this.lines = [...this.lines, { type: 'input', content: this.getPrompt() + cmd }];
    
    if (cmd) {
      this.commandHistory.push(cmd);
      this.historyIndex = -1;
    }
    
    this.currentInput = '';
    
    if (cmd) {
      const output = this.processCommand(cmd);
      if (output) {
        this.lines = [...this.lines, ...output.map(o => ({ type: 'output' as const, content: o }))];
      }
    }

    this.scrollToBottom();
  }

  private processCommand(cmd: string): string[] {
    const parts = cmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        return [
          'Available commands:',
          '  help      - Show this help message',
          '  ls        - List directory contents',
          '  pwd       - Print working directory',
          '  cd        - Change directory',
          '  cat       - Display file contents',
          '  echo      - Display text',
          '  whoami    - Display current user',
          '  hostname  - Display hostname',
          '  date      - Display current date/time',
          '  uname     - Display system information',
          '  clear     - Clear the terminal',
          '  env       - Display environment variables',
          '  fortune   - Display a random fortune',
          '',
        ];

      case 'ls':
        return this.cmdLs(args);

      case 'pwd':
        return [this.cwd];

      case 'cd':
        return this.cmdCd(args);

      case 'cat':
        return this.cmdCat(args);

      case 'echo':
        return [args.join(' ')];

      case 'whoami':
        return [this.env.USER];

      case 'hostname':
        return [this.env.HOSTNAME];

      case 'date':
        return [new Date().toString()];

      case 'uname':
        if (args.includes('-a')) {
          return ['OpenBSD openbsd 7.4 GENERIC.MP#0 amd64'];
        }
        return ['OpenBSD'];

      case 'clear':
        this.lines = [];
        return [];

      case 'env':
        return Object.entries(this.env).map(([k, v]) => `${k}=${v}`);

      case 'fortune':
        const fortunes = [
          '"Be conservative in what you send, liberal in what you accept." - Postel\'s Law',
          'Today is a good day to read the manpages.',
          'Remember: /etc/examples exists for a reason.',
          'Languid: you have no langstrings.',
          'PUFFER SAYS: Why are strstrsting?',
          'OpenBSD: Free, Functional, and Secure.',
          'Have you read your daily CVS changelog?',
          'theo says: audit the code.',
        ];
        return [fortunes[Math.floor(Math.random() * fortunes.length)]];

      case '':
        return [];

      default:
        return [`ksh: ${command}: not found`];
    }
  }

  private cmdLs(_args: string[]): string[] {
    // Simulated filesystem
    const dirs: Record<string, string[]> = {
      '/': ['bin', 'etc', 'home', 'tmp', 'usr', 'var'],
      '/home': ['user'],
      '/home/user': ['.profile', '.kshrc', 'Documents', 'Downloads'],
      '/etc': ['examples', 'hosts', 'passwd', 'rc.conf'],
    };
    
    const contents = dirs[this.cwd] || ['(empty)'];
    return [contents.join('  ')];
  }

  private cmdCd(args: string[]): string[] {
    const target = args[0] || this.env.HOME;
    
    if (target === '~') {
      this.cwd = this.env.HOME;
    } else if (target === '..') {
      const parts = this.cwd.split('/').filter(Boolean);
      parts.pop();
      this.cwd = '/' + parts.join('/') || '/';
    } else if (target.startsWith('/')) {
      this.cwd = target;
    } else {
      this.cwd = this.cwd === '/' ? '/' + target : this.cwd + '/' + target;
    }
    
    return [];
  }

  private cmdCat(args: string[]): string[] {
    if (args.length === 0) {
      return ['usage: cat file ...'];
    }
    
    const files: Record<string, string[]> = {
      '.profile': ['export ENV=$HOME/.kshrc'],
      '.kshrc': ['PS1="\\u@\\h:\\w$ "', 'alias ll="ls -la"'],
    };
    
    const filename = args[0];
    if (files[filename]) {
      return files[filename];
    }
    return [`cat: ${filename}: No such file or directory`];
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      if (this.terminalContent) {
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
      }
      if (this.inputEl) {
        this.inputEl.focus();
      }
    });
  }

  private handleClick(): void {
    this.inputEl?.focus();
  }

  render() {
    return html`
      <div class="terminal-content" @click=${this.handleClick}>
        ${this.lines.map(line => html`
          <div class="line ${line.type}">${line.content}</div>
        `)}
      </div>
      <div class="input-line">
        <span class="prompt">${this.getPrompt()}</span>
        <input 
          type="text" 
          .value=${this.currentInput}
          @input=${(e: Event) => this.currentInput = (e.target as HTMLInputElement).value}
          @keydown=${this.handleKeyDown}
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-terminal': XTerminal;
  }
}
