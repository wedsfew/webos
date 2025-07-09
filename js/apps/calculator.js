// 计算器应用
class CalculatorApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForNewValue = false;
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.updateDisplay();
    }
    
    getHTML() {
        return `
            <div class="calculator-app">
                <div class="calc-display" id="calc-display">0</div>
                <div class="calc-buttons">
                    <button class="calc-button clear" onclick="calculator.clear()">C</button>
                    <button class="calc-button clear" onclick="calculator.clearEntry()">CE</button>
                    <button class="calc-button operator" onclick="calculator.backspace()">⌫</button>
                    <button class="calc-button operator" onclick="calculator.inputOperation('÷')">÷</button>
                    
                    <button class="calc-button number" onclick="calculator.inputNumber('7')">7</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('8')">8</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('9')">9</button>
                    <button class="calc-button operator" onclick="calculator.inputOperation('×')">×</button>
                    
                    <button class="calc-button number" onclick="calculator.inputNumber('4')">4</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('5')">5</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('6')">6</button>
                    <button class="calc-button operator" onclick="calculator.inputOperation('-')">-</button>
                    
                    <button class="calc-button number" onclick="calculator.inputNumber('1')">1</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('2')">2</button>
                    <button class="calc-button number" onclick="calculator.inputNumber('3')">3</button>
                    <button class="calc-button operator" onclick="calculator.inputOperation('+')">+</button>
                    
                    <button class="calc-button number" onclick="calculator.inputNumber('0')" style="grid-column: span 2;">0</button>
                    <button class="calc-button number" onclick="calculator.inputDecimal()">.</button>
                    <button class="calc-button equals" onclick="calculator.calculate()">=</button>
                </div>
            </div>
        `;
    }
    
    setupEvents() {
        // 将计算器实例绑定到全局，供按钮调用
        window.calculator = this;
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }
    
    handleKeyboard(event) {
        // 只有当计算器窗口是活动窗口时才响应键盘事件
        if (WindowManager.getActiveWindow() !== this.windowId) return;
        
        const key = event.key;
        
        if (key >= '0' && key <= '9') {
            this.inputNumber(key);
        } else if (key === '.') {
            this.inputDecimal();
        } else if (key === '+' || key === '-') {
            this.inputOperation(key);
        } else if (key === '*') {
            this.inputOperation('×');
        } else if (key === '/') {
            event.preventDefault();
            this.inputOperation('÷');
        } else if (key === 'Enter' || key === '=') {
            this.calculate();
        } else if (key === 'Escape') {
            this.clear();
        } else if (key === 'Backspace') {
            this.backspace();
        }
    }
    
    inputNumber(num) {
        if (this.waitingForNewValue) {
            this.display = num;
            this.waitingForNewValue = false;
        } else {
            this.display = this.display === '0' ? num : this.display + num;
        }
        this.updateDisplay();
    }
    
    inputDecimal() {
        if (this.waitingForNewValue) {
            this.display = '0.';
            this.waitingForNewValue = false;
        } else if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
        this.updateDisplay();
    }
    
    inputOperation(nextOperation) {
        const inputValue = parseFloat(this.display);
        
        if (this.previousValue === null) {
            this.previousValue = inputValue;
        } else if (this.operation) {
            const currentValue = this.previousValue || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operation);
            
            this.display = String(newValue);
            this.previousValue = newValue;
            this.updateDisplay();
        }
        
        this.waitingForNewValue = true;
        this.operation = nextOperation;
    }
    
    calculate() {
        const inputValue = parseFloat(this.display);
        
        if (this.previousValue !== null && this.operation) {
            const newValue = this.performCalculation(this.previousValue, inputValue, this.operation);
            this.display = String(newValue);
            this.previousValue = null;
            this.operation = null;
            this.waitingForNewValue = true;
            this.updateDisplay();
        }
    }
    
    performCalculation(firstValue, secondValue, operation) {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '×':
                return firstValue * secondValue;
            case '÷':
                if (secondValue === 0) {
                    alert('不能除以零');
                    return firstValue;
                }
                return firstValue / secondValue;
            default:
                return secondValue;
        }
    }
    
    clear() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForNewValue = false;
        this.updateDisplay();
    }
    
    clearEntry() {
        this.display = '0';
        this.updateDisplay();
    }
    
    backspace() {
        if (this.display.length > 1) {
            this.display = this.display.slice(0, -1);
        } else {
            this.display = '0';
        }
        this.updateDisplay();
    }
    
    updateDisplay() {
        const content = WindowManager.getWindowContent(this.windowId);
        const displayElement = content.querySelector('#calc-display');
        
        // 限制显示长度
        let displayValue = this.display;
        if (displayValue.length > 12) {
            // 如果是小数，尝试四舍五入
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
                displayValue = num.toPrecision(12);
            } else {
                displayValue = displayValue.substring(0, 12);
            }
        }
        
        displayElement.textContent = displayValue;
    }
    
    destroy() {
        // 清理全局引用
        if (window.calculator === this) {
            delete window.calculator;
        }
        
        // 移除键盘事件监听器
        document.removeEventListener('keydown', this.handleKeyboard.bind(this));
        
        console.log('计算器应用已销毁');
    }
} 