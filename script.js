// Calculator state variables
let currentInput = '0';
let shouldResetDisplay = false;
let lastOperator = null;
let lastOperand = null;

// Get the display element
const display = document.getElementById('display');

/**
 * Updates the calculator display
 * @param {string} value - The value to display
 */
function updateDisplay(value) {
    display.value = value;
}

/**
 * Appends a character to the current display
 * @param {string} value - The character to append (number, operator, or decimal)
 */
function appendToDisplay(value) {
    // If we should reset the display (after calculation or error)
    if (shouldResetDisplay) {
        if (isOperator(value)) {
            // If it's an operator, keep the current result and continue
            shouldResetDisplay = false;
        } else {
            // If it's a number or decimal, start fresh
            currentInput = '0';
            shouldResetDisplay = false;
        }
    }

    // Handle decimal point input
    if (value === '.') {
        // Don't add decimal if one already exists in the current number
        const parts = currentInput.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
            return;
        }
        // If the display is empty or ends with an operator, add "0."
        if (currentInput === '0' || isOperator(currentInput.slice(-1))) {
            currentInput += currentInput === '0' ? '.' : '0.';
        } else {
            currentInput += '.';
        }
    }
    // Handle operator input
    else if (isOperator(value)) {
        // Don't add operator if the last character is already an operator
        if (isOperator(currentInput.slice(-1))) {
            // Replace the last operator with the new one
            currentInput = currentInput.slice(0, -1) + value;
        } else {
            currentInput += value;
        }
    }
    // Handle number input
    else {
        if (currentInput === '0') {
            currentInput = value;
        } else {
            currentInput += value;
        }
    }

    updateDisplay(currentInput);
}

/**
 * Checks if a character is an operator
 * @param {string} char - The character to check
 * @returns {boolean} - True if the character is an operator
 */
function isOperator(char) {
    return ['+', '-', '*', '/'].includes(char);
}

/**
 * Clears the calculator display and resets state
 */
function clearDisplay() {
    currentInput = '0';
    shouldResetDisplay = false;
    lastOperator = null;
    lastOperand = null;
    updateDisplay(currentInput);
}

/**
 * Deletes the last entered character
 */
function deleteLast() {
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateDisplay(currentInput);
}

/**
 * Performs the calculation and displays the result
 */
function calculateResult() {
    try {
        // Don't calculate if the expression ends with an operator
        if (isOperator(currentInput.slice(-1))) {
            return;
        }

        // Store the current expression for repeat calculations
        const expression = currentInput;
        
        // Evaluate the expression safely
        let result = evaluateExpression(expression);
        
        // Handle division by zero
        if (!isFinite(result)) {
            updateDisplay('Error: Cannot divide by zero');
            shouldResetDisplay = true;
            return;
        }

        // Format the result to avoid floating point precision issues
        result = parseFloat(result.toPrecision(12));
        
        // Store for potential repeat calculations
        lastOperator = getLastOperator(expression);
        lastOperand = getLastOperand(expression);
        
        currentInput = result.toString();
        updateDisplay(currentInput);
        shouldResetDisplay = true;

    } catch (error) {
        updateDisplay('Error: Invalid expression');
        shouldResetDisplay = true;
    }
}

/**
 * Safely evaluates a mathematical expression
 * @param {string} expression - The mathematical expression to evaluate
 * @returns {number} - The result of the calculation
 */
function evaluateExpression(expression) {
    // Remove any whitespace
    expression = expression.replace(/\s/g, '');
    
    // Check for division by zero before evaluation
    if (expression.includes('/0') && !expression.includes('/0.')) {
        const divByZeroPattern = /\/0(?![0-9.])/;
        if (divByZeroPattern.test(expression)) {
            return Infinity;
        }
    }
    
    // Use Function constructor for safe evaluation (safer than eval)
    // This only allows mathematical expressions
    return Function('"use strict"; return (' + expression + ')')();
}

/**
 * Gets the last operator from an expression
 * @param {string} expression - The mathematical expression
 * @returns {string|null} - The last operator or null
 */
function getLastOperator(expression) {
    const operators = ['+', '-', '*', '/'];
    for (let i = expression.length - 1; i >= 0; i--) {
        if (operators.includes(expression[i])) {
            return expression[i];
        }
    }
    return null;
}

/**
 * Gets the last operand from an expression
 * @param {string} expression - The mathematical expression
 * @returns {string|null} - The last operand or null
 */
function getLastOperand(expression) {
    const operators = ['+', '-', '*', '/'];
    let operand = '';
    
    for (let i = expression.length - 1; i >= 0; i--) {
        if (operators.includes(expression[i])) {
            break;
        }
        operand = expression[i] + operand;
    }
    
    return operand || null;
}

/**
 * Handles keyboard input for the calculator
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboardInput(event) {
    const key = event.key;
    
    // Prevent default behavior for calculator keys
    if ('0123456789+-*/.='.includes(key) || key === 'Enter' || key === 'Escape' || key === 'Backspace') {
        event.preventDefault();
    }
    
    // Handle number and operator keys
    if ('0123456789'.includes(key)) {
        appendToDisplay(key);
    } else if ('+-*/'.includes(key)) {
        appendToDisplay(key);
    } else if (key === '.') {
        appendToDisplay('.');
    } else if (key === 'Enter' || key === '=') {
        calculateResult();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    } else if (key === 'Backspace') {
        deleteLast();
    }
}

// Add keyboard event listener when the page loads
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Add visual feedback for button presses via keyboard
    document.addEventListener('keydown', function(event) {
        const key = event.key;
        let button = null;
        
        // Find the corresponding button
        if (key === 'Enter') {
            button = document.querySelector('[data-key="Enter"]');
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            button = document.querySelector('.clear');
        } else if (key === 'Backspace') {
            button = document.querySelector('.operator:nth-child(2)'); // Delete button
        } else {
            button = document.querySelector(`[data-key="${key}"]`);
        }
        
        // Add visual feedback
        if (button) {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px hsla(220 43% 11% / 0.1)';
            
            setTimeout(() => {
                button.style.transform = '';
                button.style.boxShadow = '';
            }, 150);
        }
    });
    
    // Focus the display to ensure keyboard events are captured
    display.focus();
});

// Ensure the display stays focused for keyboard input
display.addEventListener('blur', function() {
    setTimeout(() => display.focus(), 0);
});
