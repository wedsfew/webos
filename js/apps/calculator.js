// 计算器应用
class Calculator extends Application {
    constructor() {
        super('计算器', 'fas fa-calculator');
        
        this.display = '0';
        this.previousOperand = '';
        this.operation = null;
        this.waitingForNewOperand = false;
        this.memory = 0;
        this.history = [];
    }

    render() {
        return `
            <div class="calculator">
                <div class="calculator-display-container">
                    <div class="calculator-history" id="calc-history"></div>
                    <input type="text" class="calculator-display" id="calc-display" value="${this.display}" readonly>
                </div>
                <div class="calculator-buttons">
                    <!-- 第一行 -->
                    <button class="calculator-button clear" data-action="clear">C</button>
                    <button class="calculator-button clear" data-action="clear-entry">CE</button>
                    <button class="calculator-button" data-action="backspace">⌫</button>
                    <button class="calculator-button operator" data-operation="/">÷</button>
                    
                    <!-- 第二行 -->
                    <button class="calculator-button" data-number="7">7</button>
                    <button class="calculator-button" data-number="8">8</button>
                    <button class="calculator-button" data-number="9">9</button>
                    <button class="calculator-button operator" data-operation="*">×</button>
                    
                    <!-- 第三行 -->
                    <button class="calculator-button" data-number="4">4</button>
                    <button class="calculator-button" data-number="5">5</button>
                    <button class="calculator-button" data-number="6">6</button>
                    <button class="calculator-button operator" data-operation="-">−</button>
                    
                    <!-- 第四行 -->
                    <button class="calculator-button" data-number="1">1</button>
                    <button class="calculator-button" data-number="2">2</button>
                    <button class="calculator-button" data-number="3">3</button>
                    <button class="calculator-button operator" data-operation="+">+</button>
                    
                    <!-- 第五行 -->
                    <button class="calculator-button" data-action="negate">±</button>
                    <button class="calculator-button" data-number="0">0</button>
                    <button class="calculator-button" data-action="decimal">.</button>
                    <button class="calculator-button equals" data-action="equals">=</button>
                </div>
                <div class="calculator-advanced" id="calc-advanced" style="display: none;">
                    <div class="advanced-row">
                        <button class="calculator-button" data-function="sqrt">√</button>
                        <button class="calculator-button" data-function="square">x²</button>
                        <button class="calculator-button" data-function="power">xʸ</button>
                        <button class="calculator-button" data-function="factorial">x!</button>
                    </div>
                    <div class="advanced-row">
                        <button class="calculator-button" data-function="sin">sin</button>
                        <button class="calculator-button" data-function="cos">cos</button>
                        <button class="calculator-button" data-function="tan">tan</button>
                        <button class="calculator-button" data-function="log">log</button>
                    </div>
                    <div class="advanced-row">
                        <button class="calculator-button" data-action="memory-clear">MC</button>
                        <button class="calculator-button" data-action="memory-recall">MR</button>
                        <button class="calculator-button" data-action="memory-add">M+</button>
                        <button class="calculator-button" data-action="memory-subtract">M-</button>
                    </div>
                </div>
                <div class="calculator-footer">
                    <button class="toggle-advanced" id="toggle-advanced">科学模式</button>
                    <button class="show-history" id="show-history">历史记录</button>
                </div>
            </div>
        `;
    }

    onMount() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        
        // 数字按钮
        window.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputNumber(button.dataset.number);
            });
        });

        // 运算符按钮
        window.querySelectorAll('[data-operation]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputOperation(button.dataset.operation);
            });
        });

        // 功能按钮
        window.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                this.performAction(button.dataset.action);
            });
        });

        // 科学计算函数
        window.querySelectorAll('[data-function]').forEach(button => {
            button.addEventListener('click', () => {
                this.performFunction(button.dataset.function);
            });
        });

        // 切换科学模式
        window.querySelector('#toggle-advanced').addEventListener('click', () => {
            this.toggleAdvancedMode();
        });

        // 显示历史记录
        window.querySelector('#show-history').addEventListener('click', () => {
            this.showHistory();
        });

        // 键盘支持
        document.addEventListener('keydown', (e) => {
            if (desktop.windowManager.activeWindow && 
                desktop.windowManager.activeWindow.dataset.windowId == this.windowId) {
                this.handleKeyboardInput(e);
            }
        });
    }

    inputNumber(number) {
        if (this.waitingForNewOperand) {
            this.display = number;
            this.waitingForNewOperand = false;
        } else {
            this.display = this.display === '0' ? number : this.display + number;
        }
        this.updateDisplay();
    }

    inputOperation(nextOperation) {
        const inputValue = parseFloat(this.display);

        if (this.previousOperand === '') {
            this.previousOperand = inputValue;
        } else if (this.operation) {
            const currentValue = this.previousOperand || 0;
            const result = this.calculate(currentValue, inputValue, this.operation);

            this.display = `${parseFloat(result.toFixed(7))}`;
            this.previousOperand = result;
            this.addToHistory(`${currentValue} ${this.getOperationSymbol(this.operation)} ${inputValue} = ${result}`);
        }

        this.waitingForNewOperand = true;
        this.operation = nextOperation;
        this.updateDisplay();
    }

    performAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'equals':
                this.equals();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'negate':
                this.negate();
                break;
            case 'memory-clear':
                this.memoryClear();
                break;
            case 'memory-recall':
                this.memoryRecall();
                break;
            case 'memory-add':
                this.memoryAdd();
                break;
            case 'memory-subtract':
                this.memorySubtract();
                break;
        }
    }

    performFunction(func) {
        const currentValue = parseFloat(this.display);
        let result;

        switch (func) {
            case 'sqrt':
                result = Math.sqrt(currentValue);
                this.addToHistory(`√${currentValue} = ${result}`);
                break;
            case 'square':
                result = currentValue * currentValue;
                this.addToHistory(`${currentValue}² = ${result}`);
                break;
            case 'power':
                // 需要等待下一个操作数
                this.inputOperation('**');
                return;
            case 'factorial':
                result = this.factorial(currentValue);
                this.addToHistory(`${currentValue}! = ${result}`);
                break;
            case 'sin':
                result = Math.sin(currentValue * Math.PI / 180);
                this.addToHistory(`sin(${currentValue}°) = ${result}`);
                break;
            case 'cos':
                result = Math.cos(currentValue * Math.PI / 180);
                this.addToHistory(`cos(${currentValue}°) = ${result}`);
                break;
            case 'tan':
                result = Math.tan(currentValue * Math.PI / 180);
                this.addToHistory(`tan(${currentValue}°) = ${result}`);
                break;
            case 'log':
                result = Math.log10(currentValue);
                this.addToHistory(`log(${currentValue}) = ${result}`);
                break;
        }

        this.display = `${parseFloat(result.toFixed(7))}`;
        this.waitingForNewOperand = true;
        this.updateDisplay();
    }

    calculate(firstOperand, secondOperand, operation) {
        switch (operation) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '*':
                return firstOperand * secondOperand;
            case '/':
                return firstOperand / secondOperand;
            case '**':
                return Math.pow(firstOperand, secondOperand);
            default:
                return secondOperand;
        }
    }

    clear() {
        this.display = '0';
        this.previousOperand = '';
        this.operation = null;
        this.waitingForNewOperand = false;
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

    equals() {
        const inputValue = parseFloat(this.display);

        if (this.previousOperand !== '' && this.operation) {
            const result = this.calculate(this.previousOperand, inputValue, this.operation);
            this.addToHistory(`${this.previousOperand} ${this.getOperationSymbol(this.operation)} ${inputValue} = ${result}`);
            
            this.display = `${parseFloat(result.toFixed(7))}`;
            this.previousOperand = '';
            this.operation = null;
            this.waitingForNewOperand = true;
            this.updateDisplay();
        }
    }

    inputDecimal() {
        if (this.waitingForNewOperand) {
            this.display = '0.';
            this.waitingForNewOperand = false;
        } else if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
        this.updateDisplay();
    }

    negate() {
        if (this.display !== '0') {
            this.display = this.display.startsWith('-') 
                ? this.display.substring(1) 
                : '-' + this.display;
        }
        this.updateDisplay();
    }

    memoryClear() {
        this.memory = 0;
        this.showNotification('内存已清除');
    }

    memoryRecall() {
        this.display = this.memory.toString();
        this.waitingForNewOperand = true;
        this.updateDisplay();
    }

    memoryAdd() {
        this.memory += parseFloat(this.display);
        this.showNotification(`M = ${this.memory}`);
    }

    memorySubtract() {
        this.memory -= parseFloat(this.display);
        this.showNotification(`M = ${this.memory}`);
    }

    factorial(n) {
        if (n < 0 || n !== Math.floor(n)) {
            throw new Error('阶乘只能计算非负整数');
        }
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    getOperationSymbol(operation) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '**': '^'
        };
        return symbols[operation] || operation;
    }

    addToHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        this.updateHistoryDisplay();
    }

    updateDisplay() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const display = window.querySelector('#calc-display');
        display.value = this.display;
    }

    updateHistoryDisplay() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const historyElement = window.querySelector('#calc-history');
        
        if (this.history.length > 0) {
            historyElement.textContent = this.history[0];
            historyElement.style.display = 'block';
        } else {
            historyElement.style.display = 'none';
        }
    }

    toggleAdvancedMode() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const advanced = window.querySelector('#calc-advanced');
        const button = window.querySelector('#toggle-advanced');
        
        if (advanced.style.display === 'none') {
            advanced.style.display = 'block';
            button.textContent = '基础模式';
            // 调整窗口大小
            window.style.height = '550px';
        } else {
            advanced.style.display = 'none';
            button.textContent = '科学模式';
            window.style.height = '450px';
        }
    }

    showHistory() {
        if (this.history.length === 0) {
            alert('暂无历史记录');
            return;
        }

        const historyText = this.history.join('\n');
        const dialog = document.createElement('div');
        dialog.className = 'history-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            max-width: 400px;
            max-height: 300px;
        `;

        dialog.innerHTML = `
            <h3 style="margin-bottom: 12px;">计算历史</h3>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-line;">${historyText}</div>
            <div style="margin-top: 12px; text-align: right;">
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">关闭</button>
                <button onclick="window.calculator.clearHistory(); this.parentElement.parentElement.remove();" style="padding: 6px 12px; border: none; background: #dc3545; color: white; border-radius: 4px; cursor: pointer; margin-left: 8px;">清除历史</button>
            </div>
        `;

        document.body.appendChild(dialog);
        window.calculator = this; // 临时引用
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    handleKeyboardInput(e) {
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            this.inputNumber(e.key);
        } else {
            switch (e.key) {
                case '+':
                    this.inputOperation('+');
                    break;
                case '-':
                    this.inputOperation('-');
                    break;
                case '*':
                    this.inputOperation('*');
                    break;
                case '/':
                    this.inputOperation('/');
                    break;
                case 'Enter':
                case '=':
                    this.equals();
                    break;
                case '.':
                    this.inputDecimal();
                    break;
                case 'Backspace':
                    this.backspace();
                    break;
                case 'Delete':
                case 'c':
                case 'C':
                    this.clear();
                    break;
                case 'Escape':
                    this.clearEntry();
                    break;
            }
        }
    }
}

// 添加计算器专用样式
const calculatorStyle = document.createElement('style');
calculatorStyle.textContent = `
    .calculator-display-container {
        margin-bottom: 16px;
    }
    
    .calculator-history {
        height: 20px;
        padding: 4px 16px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        font-size: 12px;
        color: #666;
        display: none;
    }
    
    .calculator-display {
        border-radius: 0 0 8px 8px;
    }
    
    .calculator-history + .calculator-display {
        border-radius: 0 0 8px 8px;
    }
    
    .calculator-advanced {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #eee;
    }
    
    .advanced-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .calculator-footer {
        margin-top: 16px;
        display: flex;
        gap: 8px;
    }
    
    .toggle-advanced,
    .show-history {
        flex: 1;
        padding: 8px;
        border: 1px solid #dee2e6;
        background: #f8f9fa;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
    }
    
    .toggle-advanced:hover,
    .show-history:hover {
        background: #e9ecef;
    }
`;
document.head.appendChild(calculatorStyle); 