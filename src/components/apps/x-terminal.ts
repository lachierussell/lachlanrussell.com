import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { fileSystemService } from '../../services/file-system.js';
import { openNode } from '../../services/file-opener.js';
import type { FileSystemNode } from '../../types/index.js';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
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

  private cwd = '/';
  private env = {
    USER: 'user',
    HOME: '/',
    HOSTNAME: 'webos',
    SHELL: '/bin/sh',
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
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
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
      { type: 'output', content: 'WebOS Terminal v1.0' },
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
          '  help       - Show this help message',
          '  ls [path]  - List directory contents',
          '  pwd        - Print working directory',
          '  cd <path>  - Change directory',
          '  cat <file> - Display file contents',
          '  open <path>- Open file or folder in viewer',
          '  echo       - Display text',
          '  whoami     - Display current user',
          '  hostname   - Display hostname',
          '  date       - Display current date/time',
          '  clear      - Clear the terminal',
          '  env        - Display environment variables',
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

      case 'open':
        return this.cmdOpen(args);

      case 'echo':
        return [args.join(' ')];

      case 'whoami':
        return [this.env.USER];

      case 'hostname':
        return [this.env.HOSTNAME];

      case 'date':
        return [new Date().toString()];

      case 'clear':
        this.lines = [];
        return [];

      case 'env':
        return Object.entries(this.env).map(([k, v]) => `${k}=${v}`);

      case '':
        return [];

      default:
        return [`sh: ${command}: not found`];
    }
  }

  /** Resolve a path argument to an absolute path */
  private resolvePath(target: string): string {
    if (target === '~') {
      return this.env.HOME;
    }
    return fileSystemService.resolvePath(this.cwd, target);
  }

  /** Get a node from a path argument, with error handling */
  private getNodeFromArg(pathArg: string): FileSystemNode | { error: string } {
    const resolvedPath = this.resolvePath(pathArg);
    const node = fileSystemService.getNode(resolvedPath);
    if (!node) {
      return { error: `${pathArg}: No such file or directory` };
    }
    return node;
  }

  private cmdLs(args: string[]): string[] {
    const targetPath = args[0] ? this.resolvePath(args[0]) : this.cwd;
    const node = fileSystemService.getNode(targetPath);

    if (!node) {
      return [`ls: ${args[0] || targetPath}: No such file or directory`];
    }

    if (node.type !== 'folder') {
      return [node.name];
    }

    const children = fileSystemService.getChildren(targetPath);
    if (children.length === 0) {
      return ['(empty directory)'];
    }

    // Format output: folders with trailing /, sorted alphabetically
    const items = children
      .map(child => child.type === 'folder' ? `${child.name}/` : child.name)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return [items.join('  ')];
  }

  private cmdCd(args: string[]): string[] {
    const target = args[0] || this.env.HOME;
    const resolvedPath = this.resolvePath(target);
    const node = fileSystemService.getNode(resolvedPath);

    if (!node) {
      return [`cd: ${target}: No such file or directory`];
    }

    if (node.type !== 'folder') {
      return [`cd: ${target}: Not a directory`];
    }

    this.cwd = resolvedPath;
    return [];
  }

  private cmdCat(args: string[]): string[] {
    if (args.length === 0) {
      return ['usage: cat <file>'];
    }

    const result = this.getNodeFromArg(args[0]);
    if ('error' in result) {
      return [`cat: ${result.error}`];
    }

    const node = result;
    if (node.type === 'folder') {
      return [`cat: ${args[0]}: Is a directory`];
    }

    if (!node.content) {
      return [`cat: ${args[0]}: Empty file`];
    }

    // Split content into lines for display
    return node.content.split('\n');
  }

  private cmdOpen(args: string[]): string[] {
    if (args.length === 0) {
      return ['usage: open <path>'];
    }

    const result = this.getNodeFromArg(args[0]);
    if ('error' in result) {
      return [`open: ${result.error}`];
    }

    // Use the centralized file opener service
    openNode(result);
    return [`Opening ${result.name}...`];
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
