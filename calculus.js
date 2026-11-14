// Numerical calculus operations for the simple web calculator.
// This parser accepts arithmetic, x, pi/e and a small list of math functions.
// It deliberately does NOT evaluate arbitrary JavaScript supplied by the user.
function compileCalculusExpression(input) {
    if (typeof input !== "string" || !input.trim() || input.length > 240) {
        throw new Error("Enter an expression f(x), up to 240 characters.");
    }
    const tokens = [];
    const scanner = /\s*([A-Za-z_][A-Za-z_0-9]*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[+\-*/^(),])/gy;
    let position = 0;
    while (position < input.length) {
        if (!input.slice(position).trim()) break;
        scanner.lastIndex = position;
        const match = scanner.exec(input);
        if (!match) throw new Error("Unsupported symbol in f(x). Use * for multiplication.");
        tokens.push(match[1]);
        position = scanner.lastIndex;
        if (tokens.length > 120) throw new Error("Expression is too long.");
    }

    let index = 0;
    const peek = () => tokens[index];
    const consume = (value) => {
        if (peek() === value) {
            index++;
            return true;
        }
        return false;
    };
    const requireToken = (value) => {
        if (!consume(value)) throw new Error('Expected "' + value + '" in f(x).');
    };
    const unaryFunctions = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        exp: Math.exp,
        ln: Math.log,
        log: Math.log10,
        log10: Math.log10,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil
    };
    const functionArity = { pow: 2 };

    function atom() {
        const token = peek();
        if (consume("(")) {
            const inner = addition();
            requireToken(")");
            return inner;
        }
        if (token === undefined) throw new Error("Expression is incomplete.");
        if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) {
            index++;
            const value = Number(token);
            return () => value;
        }
        if (/^[A-Za-z_][A-Za-z_0-9]*$/.test(token)) {
            index++;
            if (token === "x") return (x) => x;
            if (token === "pi") return () => Math.PI;
            if (token === "e") return () => Math.E;
            if (Object.prototype.hasOwnProperty.call(unaryFunctions, token)) {
                requireToken("(");
                const arg = addition();
                requireToken(")");
                return (x) => unaryFunctions[token](arg(x));
            }
            if (Object.prototype.hasOwnProperty.call(functionArity, token)) {
                requireToken("(");
                const first = addition();
                requireToken(",");
                const second = addition();
                requireToken(")");
                return (x) => Math.pow(first(x), second(x));
            }
            throw new Error('Unknown function or variable "' + token + '".');
        }
        throw new Error('Unexpected symbol "' + token + '".');
    }

    function exponent() {
        const base = atom();
        if (consume("^")) {
            const power = unary();
            return (x) => Math.pow(base(x), power(x));
        }
        return base;
    }

    function unary() {
        if (consume("+")) return unary();
        if (consume("-")) {
            const operand = unary();
            return (x) => -operand(x);
        }
        return exponent();
    }

    function multiplication() {
        let left = unary();
        while (peek() === "*" || peek() === "/") {
            const op = tokens[index++];
            const right = unary();
            const previous = left;
            left = op === "*" ? (x) => previous(x) * right(x) : (x) => previous(x) / right(x);
        }
        return left;
    }

    function addition() {
        let left = multiplication();
        while (peek() === "+" || peek() === "-") {
            const op = tokens[index++];
            const right = multiplication();
            const previous = left;
            left = op === "+" ? (x) => previous(x) + right(x) : (x) => previous(x) - right(x);
        }
        return left;
    }

    const expression = addition();
    if (index !== tokens.length) throw new Error('Unexpected symbol "' + peek() + '".');
    return (x) => {
        const value = expression(x);
        if (!Number.isFinite(value)) {
            throw new Error("f(x) is undefined or too large at a sampled point.");
        }
        return value;
    };
}

function computeCalculus(operation, expression, at, from, to) {
    const f = compileCalculusExpression(expression);
    const validNumber = (value, name) => {
        if (!Number.isFinite(value) || Math.abs(value) > 1e9) {
            throw new Error(name + " must be a finite number within ±1,000,000,000.");
        }
    };
    if (operation === "derivative" || operation === "limit") {
        validNumber(at, "x");
        const scale = Math.max(1, Math.abs(at));
        if (operation === "derivative") {
            const h = Math.max(1e-7, 1e-5 * scale);
            return (f(at + h) - f(at - h)) / (2 * h);
        }
        // A finite two-sided numerical limit: require both sides to agree
        // and be stable as we approach the point. Divergent limits are rejected.
        const h1 = 1e-4 * scale;
        const h2 = 1e-5 * scale;
        const left1 = f(at - h1);
        const right1 = f(at + h1);
        const left2 = f(at - h2);
        const right2 = f(at + h2);
        const avg = (left2 + right2) / 2;
        const tolerance = 0.002 * Math.max(1, Math.abs(avg));
        if (Math.abs(left2 - right2) > tolerance ||
            Math.abs(left1 + right1 - 2 * avg) > tolerance * 10 ||
            Math.abs(avg) > 1e8) {
            throw new Error("No stable finite two-sided limit detected.");
        }
        return avg;
    }
    if (operation === "integral" || operation === "sum") {
        validNumber(from, "a");
        validNumber(to, "b");
        if (operation === "sum") {
            if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) {
                throw new Error("Σ requires integer bounds with b ≥ a.");
            }
            if (to - from > 10000) throw new Error("Σ supports at most 10,001 terms.");
            let total = 0;
            for (let x = from; x <= to; x++) total += f(x);
            return total;
        }
        if (from === to) return 0;
        // Composite Simpson's rule (even number of intervals).
        const count = 1000;
        const step = (to - from) / count;
        let total = f(from) + f(to);
        for (let i = 1; i < count; i++) {
            total += (i % 2 === 0 ? 2 : 4) * f(from + i * step);
        }
        return (total * step) / 3;
    }
    throw new Error("Unknown calculus operation.");
}

function calculateCalculus(operation) {
    const status = document.getElementById("calculusStatus");
    try {
        const expr = document.getElementById("calculusExpression").value.trim();
        const readNumber = (id, label) => {
            const input = document.getElementById(id);
            if (!input.value.trim()) throw new Error("Enter " + label + ".");
            return Number(input.value);
        };
        const at = ["derivative", "limit"].includes(operation)
            ? readNumber("calculusPoint", "x") : 0;
        const from = ["integral", "sum"].includes(operation)
            ? readNumber("calculusStart", "a") : 0;
        const to = ["integral", "sum"].includes(operation)
            ? readNumber("calculusEnd", "b") : 0;
        let result = computeCalculus(operation, expr, at, from, to);
        if (!Number.isFinite(result)) throw new Error("Result is undefined or too large.");
        if (Math.abs(result) < 1e-11) result = 0;
        else result = Number(result.toPrecision(11));
        // Keep the existing calculator display and chaining behavior.
        currentInput = String(result);
        updateDisplay(currentInput);
        shouldResetDisplay = true;
        const label = {
            derivative: "Approximate derivative",
            integral: "Approximate definite integral",
            limit: "Approximate two-sided limit",
            sum: "Finite sum"
        }[operation];
        status.textContent = label + ": " + result;
        status.dataset.state = "success";
        return result;
    } catch (error) {
        status.textContent = error.message || "Could not calculate this expression.";
        status.dataset.state = "error";
        updateDisplay("Error");
        shouldResetDisplay = true;
        return null;
    }
}
