import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('x-calculator')
export class XCalculator extends LitElement {
  @state() private display = '0';
  @state() private currentValue = 0;
  @state() private pendingOperation: string | null = null;
  @state() private waitingForOperand = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--x11-window-bg, #c0c4cc);
      padding: 4px;
      font-family: var(--x11-font-family, sans-serif);
    }

    .display {
      background: #1a2a1a;
      color: #33ff33;
      font-family: var(--x11-font-mono, monospace);
      font-size: 20px;
      text-align: right;
      padding: 8px 12px;
      margin-bottom: 4px;
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec) var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468);
      min-height: 28px;
      overflow: hidden;
    }

    .buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      flex: 1;
    }

    button {
      font-family: var(--x11-font-family, sans-serif);
      font-size: 14px;
      padding: 8px;
      cursor: pointer;
      background: var(--x11-window-bg, #c0c4cc);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468) var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec);
      color: var(--x11-text, #000);
    }

    button:active {
      border-color: var(--x11-border-dark, #606468) var(--x11-border-light, #e0e4ec) var(--x11-border-light, #e0e4ec) var(--x11-border-dark, #606468);
      background: var(--x11-border-dark, #606468);
      color: #fff;
    }

    button.operator {
      background: #a0a4ac;
    }

    button.equals {
      background: var(--x11-titlebar-active, #506070);
      color: #fff;
    }

    button.clear {
      background: #c08080;
    }

    button.zero {
      grid-column: span 2;
    }
  `;

  private inputDigit(digit: string): void {
    if (this.waitingForOperand) {
      this.display = digit;
      this.waitingForOperand = false;
    } else {
      this.display = this.display === '0' ? digit : this.display + digit;
    }
  }

  private inputDecimal(): void {
    if (this.waitingForOperand) {
      this.display = '0.';
      this.waitingForOperand = false;
      return;
    }
    if (!this.display.includes('.')) {
      this.display += '.';
    }
  }

  private clear(): void {
    this.display = '0';
    this.currentValue = 0;
    this.pendingOperation = null;
    this.waitingForOperand = false;
  }

  private performOperation(nextOperation: string): void {
    const inputValue = parseFloat(this.display);

    if (this.pendingOperation && !this.waitingForOperand) {
      const result = this.calculate(this.currentValue, inputValue, this.pendingOperation);
      this.display = String(result);
      this.currentValue = result;
    } else {
      this.currentValue = inputValue;
    }

    this.waitingForOperand = true;
    this.pendingOperation = nextOperation;
  }

  private calculate(left: number, right: number, op: string): number {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      default: return right;
    }
  }

  private equals(): void {
    if (!this.pendingOperation) return;
    
    const inputValue = parseFloat(this.display);
    const result = this.calculate(this.currentValue, inputValue, this.pendingOperation);
    this.display = String(result);
    this.currentValue = result;
    this.pendingOperation = null;
    this.waitingForOperand = true;
  }

  private toggleSign(): void {
    const value = parseFloat(this.display);
    this.display = String(value * -1);
  }

  private percentage(): void {
    const value = parseFloat(this.display);
    this.display = String(value / 100);
  }

  render() {
    return html`
      <div class="display">${this.display}</div>
      <div class="buttons">
        <button class="clear" @click=${this.clear}>C</button>
        <button class="operator" @click=${this.toggleSign}>±</button>
        <button class="operator" @click=${this.percentage}>%</button>
        <button class="operator" @click=${() => this.performOperation('/')}>÷</button>
        
        <button @click=${() => this.inputDigit('7')}>7</button>
        <button @click=${() => this.inputDigit('8')}>8</button>
        <button @click=${() => this.inputDigit('9')}>9</button>
        <button class="operator" @click=${() => this.performOperation('*')}>×</button>
        
        <button @click=${() => this.inputDigit('4')}>4</button>
        <button @click=${() => this.inputDigit('5')}>5</button>
        <button @click=${() => this.inputDigit('6')}>6</button>
        <button class="operator" @click=${() => this.performOperation('-')}>−</button>
        
        <button @click=${() => this.inputDigit('1')}>1</button>
        <button @click=${() => this.inputDigit('2')}>2</button>
        <button @click=${() => this.inputDigit('3')}>3</button>
        <button class="operator" @click=${() => this.performOperation('+')}>+</button>
        
        <button class="zero" @click=${() => this.inputDigit('0')}>0</button>
        <button @click=${this.inputDecimal}>.</button>
        <button class="equals" @click=${this.equals}>=</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-calculator': XCalculator;
  }
}
