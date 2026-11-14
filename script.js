let currentInput = "0";
let shouldResetDisplay = false;
let lastOperator = null;
let lastOperand = null;
let isRadianMode = true;

const display = document.getElementById("display");

function initializeTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach((b) => b.classList.remove("active"));
            tabContents.forEach((c) => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(targetTab).classList.add("active");

            const calculator = document.querySelector(".calculator");
            if (targetTab === "units") {
                calculator.classList.add("units-active");
            } else {
                calculator.classList.remove("units-active");
            }

            if (targetTab === "units") {
                updateUnits();
            }

            setTimeout(() => manageFocus(), 100);
        });
    });
}

function updateDisplay(value) {
    let displayValue = value
        .replace(/\*/g, "×")
        .replace(/\//g, "÷")
        .replace(/sqrt\(/g, "√(")
        .replace(/cbrt\(/g, "∛(")
        .replace(/pi/g, "π")
        .replace(/3\.14159/g, "π")
        .replace(/2\.71828/g, "e");

    display.value = displayValue;
}

function appendToDisplay(value) {
    if (shouldResetDisplay) {
        if (isOperator(value)) {
            shouldResetDisplay = false;
        } else {
            currentInput = "0";
            shouldResetDisplay = false;
        }
    }

    if (value === ".") {
        const parts = currentInput.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes(".")) {
            return;
        }
        if (currentInput === "0" || isOperator(currentInput.slice(-1))) {
            currentInput += currentInput === "0" ? "." : "0.";
        } else {
            currentInput += ".";
        }
    } else if (isOperator(value)) {
        if (isOperator(currentInput.slice(-1))) {
            currentInput = currentInput.slice(0, -1) + value;
        } else {
            currentInput += value;
        }
    } else {
        if (currentInput === "0") {
            currentInput = value;
        } else {
            currentInput += value;
        }
    }

    updateDisplay(currentInput);
}

function insertFunction(func) {
    if (shouldResetDisplay) {
        currentInput = "0";
        shouldResetDisplay = false;
    }

    if (currentInput === "0") {
        currentInput = func;
    } else {
        currentInput += func;
    }

    updateDisplay(currentInput);
}

function isOperator(char) {
    return ["+", "-", "*", "/", "<", ">", ">=", "<=", "="].includes(char);
}

function clearDisplay() {
    currentInput = "0";
    shouldResetDisplay = false;
    lastOperator = null;
    lastOperand = null;
    updateDisplay(currentInput);
}

function deleteLast() {
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }
    updateDisplay(currentInput);
}

function toggleRadDeg() {
    isRadianMode = !isRadianMode;
    const radButton = document.querySelector('[onclick="toggleRadDeg()"]');
    if (radButton) {
        radButton.textContent = isRadianMode ? "RAD" : "DEG";
    }
}

function calculateResult() {
    try {
        if (isOperator(currentInput.slice(-1))) {
            updateDisplay("Error: Expression incomplete");
            shouldResetDisplay = true;
            return;
        }

        if (!currentInput || currentInput === "0") {
            return;
        }

        const expression = currentInput;

        const openParens = (expression.match(/\(/g) || []).length;
        const closeParens = (expression.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            updateDisplay("Error: Unmatched parentheses");
            shouldResetDisplay = true;
            return;
        }

        let result = evaluateExpression(expression);

        if (isNaN(result)) {
            updateDisplay("Error: Invalid calculation");
            shouldResetDisplay = true;
            return;
        }

        if (!isFinite(result)) {
            if (result === Infinity) {
                updateDisplay("Error: Division by zero");
            } else {
                updateDisplay("Error: Result too large");
            }
            shouldResetDisplay = true;
            return;
        }

        if (Math.abs(result) < 1e-10) {
            result = 0;
        } else {
            result = parseFloat(result.toPrecision(12));
        }

        lastOperator = getLastOperator(expression);
        lastOperand = getLastOperand(expression);

        currentInput = result.toString();
        updateDisplay(currentInput);
        shouldResetDisplay = true;
    } catch (error) {
        updateDisplay("Error: Invalid expression");
        shouldResetDisplay = true;
    }
}

function evaluateExpression(expression) {
    expression = expression.replace(/\s/g, "");

    expression = expression
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/cbrt\(/g, "Math.cbrt(")
        .replace(/pow\(/g, "Math.pow(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/log10\(/g, "Math.log10(")
        .replace(/exp\(/g, "Math.exp(")
        .replace(/abs\(/g, "Math.abs(")
        .replace(/floor\(/g, "Math.floor(")
        .replace(/ceil\(/g, "Math.ceil(")
        .replace(
            /sin\(/g,
            isRadianMode ? "Math.sin(" : "(Math.sin(Math.PI/180*",
        )
        .replace(
            /cos\(/g,
            isRadianMode ? "Math.cos(" : "(Math.cos(Math.PI/180*",
        )
        .replace(
            /tan\(/g,
            isRadianMode ? "Math.tan(" : "(Math.tan(Math.PI/180*",
        )
        .replace(
            /asin\(/g,
            isRadianMode ? "Math.asin(" : "(180/Math.PI*Math.asin(",
        )
        .replace(
            /acos\(/g,
            isRadianMode ? "Math.acos(" : "(180/Math.PI*Math.acos(",
        )
        .replace(
            /atan\(/g,
            isRadianMode ? "Math.atan(" : "(180/Math.PI*Math.atan(",
        )
        .replace(/sinh\(/g, "Math.sinh(")
        .replace(/cosh\(/g, "Math.cosh(")
        .replace(/tanh\(/g, "Math.tanh(")
        .replace(/factorial\(/g, "factorial(");

    if (!isRadianMode) {
        let openParens = (expression.match(/\(/g) || []).length;
        let closeParens = (expression.match(/\)/g) || []).length;
        expression += ")".repeat(Math.max(0, openParens - closeParens));
    }

    if (expression.includes("/0") && !expression.includes("/0.")) {
        const divByZeroPattern = /\/0(?![0-9.])/;
        if (divByZeroPattern.test(expression)) {
            return Infinity;
        }
    }

    return Function('"use strict"; return (' + expression + ")")();
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function getLastOperator(expression) {
    const operators = ["+", "-", "*", "/"];
    for (let i = expression.length - 1; i >= 0; i--) {
        if (operators.includes(expression[i])) {
            return expression[i];
        }
    }
    return null;
}

function getLastOperand(expression) {
    const operators = ["+", "-", "*", "/"];
    let operand = "";

    for (let i = expression.length - 1; i >= 0; i--) {
        if (operators.includes(expression[i])) {
            break;
        }
        operand = expression[i] + operand;
    }

    return operand || null;
}

const unitConversions = {
    length: {
        units: {
            mm: "Millimeters",
            cm: "Centimeters",
            m: "Meters",
            km: "Kilometers",
            in: "Inches",
            ft: "Feet",
            yd: "Yards",
            mi: "Miles",
        },
        toMeter: {
            mm: 0.001,
            cm: 0.01,
            m: 1,
            km: 1000,
            in: 0.0254,
            ft: 0.3048,
            yd: 0.9144,
            mi: 1609.344,
        },
    },
    weight: {
        units: {
            mg: "Milligrams",
            g: "Grams",
            kg: "Kilograms",
            t: "Tonnes",
            oz: "Ounces",
            lb: "Pounds",
            st: "Stones",
        },
        toKg: {
            mg: 0.000001,
            g: 0.001,
            kg: 1,
            t: 1000,
            oz: 0.0283495,
            lb: 0.453592,
            st: 6.35029,
        },
    },
    temperature: {
        units: {
            c: "Celsius",
            f: "Fahrenheit",
            k: "Kelvin",
        },
    },
    area: {
        units: {
            mm2: "Square Millimeters",
            cm2: "Square Centimeters",
            m2: "Square Meters",
            km2: "Square Kilometers",
            in2: "Square Inches",
            ft2: "Square Feet",
            yd2: "Square Yards",
            ac: "Acres",
            ha: "Hectares",
        },
        toM2: {
            mm2: 0.000001,
            cm2: 0.0001,
            m2: 1,
            km2: 1000000,
            in2: 0.00064516,
            ft2: 0.092903,
            yd2: 0.836127,
            ac: 4046.86,
            ha: 10000,
        },
    },
    volume: {
        units: {
            ml: "Milliliters",
            l: "Liters",
            m3: "Cubic Meters",
            in3: "Cubic Inches",
            ft3: "Cubic Feet",
            gal: "Gallons (US)",
            pt: "Pints (US)",
            qt: "Quarts (US)",
        },
        toLiter: {
            ml: 0.001,
            l: 1,
            m3: 1000,
            in3: 0.0163871,
            ft3: 28.3168,
            gal: 3.78541,
            pt: 0.473176,
            qt: 0.946353,
        },
    },
    time: {
        units: {
            ms: "Milliseconds",
            s: "Seconds",
            min: "Minutes",
            h: "Hours",
            d: "Days",
            wk: "Weeks",
            mo: "Months",
            yr: "Years",
        },
        toSecond: {
            ms: 0.001,
            s: 1,
            min: 60,
            h: 3600,
            d: 86400,
            wk: 604800,
            mo: 2629746,
            yr: 31556952,
        },
    },
    speed: {
        units: {
            mps: "Meters/Second",
            kph: "Kilometers/Hour",
            mph: "Miles/Hour",
            fps: "Feet/Second",
            kn: "Knots",
        },
        toMps: {
            mps: 1,
            kph: 0.277778,
            mph: 0.44704,
            fps: 0.3048,
            kn: 0.514444,
        },
    },
    energy: {
        units: {
            j: "Joules",
            kj: "Kilojoules",
            cal: "Calories",
            kcal: "Kilocalories",
            wh: "Watt Hours",
            kwh: "Kilowatt Hours",
            btu: "BTU",
        },
        toJoule: {
            j: 1,
            kj: 1000,
            cal: 4.184,
            kcal: 4184,
            wh: 3600,
            kwh: 3600000,
            btu: 1055.06,
        },
    },
    power: {
        units: {
            w: "Watts",
            kw: "Kilowatts",
            mw: "Megawatts",
            hp: "Horsepower",
            "btu/h": "BTU/Hour",
        },
        toWatt: {
            w: 1,
            kw: 1000,
            mw: 1000000,
            hp: 745.7,
            "btu/h": 0.293071,
        },
    },
    pressure: {
        units: {
            pa: "Pascals",
            kpa: "Kilopascals",
            mpa: "Megapascals",
            bar: "Bar",
            psi: "PSI",
            atm: "Atmosphere",
            mmhg: "mmHg",
        },
        toPascal: {
            pa: 1,
            kpa: 1000,
            mpa: 1000000,
            bar: 100000,
            psi: 6894.76,
            atm: 101325,
            mmhg: 133.322,
        },
    },
    data: {
        units: {
            b: "Bytes",
            kb: "Kilobytes",
            mb: "Megabytes",
            gb: "Gigabytes",
            tb: "Terabytes",
            pb: "Petabytes",
        },
        toByte: {
            b: 1,
            kb: 1024,
            mb: 1048576,
            gb: 1073741824,
            tb: 1099511627776,
            pb: 1125899906842624,
        },
    },
};

function updateUnits() {
    const category = document.getElementById("categorySelect").value;
    const fromUnit = document.getElementById("fromUnit");
    const toUnit = document.getElementById("toUnit");

    fromUnit.innerHTML = "";
    toUnit.innerHTML = "";

    if (unitConversions[category]) {
        const units = unitConversions[category].units;

        Object.entries(units).forEach(([key, value]) => {
            const option1 = new Option(value, key);
            const option2 = new Option(value, key);
            fromUnit.add(option1);
            toUnit.add(option2);
        });

        if (fromUnit.options.length > 0) {
            fromUnit.selectedIndex = 0;
            toUnit.selectedIndex = Math.min(1, toUnit.options.length - 1);
        }

        updateQuickConversions(category);
    }

    convertUnits();
}

function convertUnits() {
    const category = document.getElementById("categorySelect").value;
    const fromValue = parseFloat(document.getElementById("fromValue").value);
    const fromUnit = document.getElementById("fromUnit").value;
    const toUnit = document.getElementById("toUnit").value;
    const toValueInput = document.getElementById("toValue");

    if (!fromValue || !fromUnit || !toUnit || !unitConversions[category]) {
        toValueInput.value = "";
        return;
    }

    let result;

    if (category === "temperature") {
        result = convertTemperature(fromValue, fromUnit, toUnit);
    } else {
        const conversionData = unitConversions[category];
        const baseUnit = Object.keys(conversionData)[1];
        const conversionRates = conversionData[baseUnit];

        const baseValue = fromValue * conversionRates[fromUnit];
        result = baseValue / conversionRates[toUnit];
    }

    toValueInput.value = result.toPrecision(8);
}

function convertTemperature(value, from, to) {
    let celsius;

    switch (from) {
        case "c":
            celsius = value;
            break;
        case "f":
            celsius = ((value - 32) * 5) / 9;
            break;
        case "k":
            celsius = value - 273.15;
            break;
    }

    switch (to) {
        case "c":
            return celsius;
        case "f":
            return (celsius * 9) / 5 + 32;
        case "k":
            return celsius + 273.15;
    }
}

function updateQuickConversions(category) {
    const quickDiv = document.getElementById("quickConversions");

    const quickRefs = {
        length: "1 m = 100 cm = 1000 mm\n1 ft = 12 in\n1 yd = 3 ft\n1 mi = 5280 ft",
        weight: "1 kg = 1000 g\n1 lb = 16 oz\n1 st = 14 lb\n1 t = 1000 kg",
        temperature: "0°C = 32°F = 273.15K\n100°C = 212°F = 373.15K",
        area: "1 m² = 10,000 cm²\n1 ac = 43,560 ft²\n1 ha = 10,000 m²",
        volume: "1 L = 1000 mL\n1 gal = 4 qt = 8 pt\n1 m³ = 1000 L",
        time: "1 min = 60 s\n1 h = 60 min\n1 d = 24 h\n1 yr ≈ 365.25 d",
        speed: "1 m/s = 3.6 km/h\n1 mph ≈ 1.61 km/h\n1 kn ≈ 1.85 km/h",
        energy: "1 kJ = 1000 J\n1 kcal = 4.184 kJ\n1 kWh = 3.6 MJ",
        power: "1 kW = 1000 W\n1 hp ≈ 746 W",
        pressure: "1 bar = 100 kPa\n1 atm = 101.325 kPa\n1 psi ≈ 6.9 kPa",
        data: "1 KB = 1024 B\n1 MB = 1024 KB\n1 GB = 1024 MB",
    };

    quickDiv.textContent = quickRefs[category] || "";
}

function handleKeyboardInput(event) {
    // Let users type formulas and numerical bounds into Calculus inputs.
    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) &&
        event.target !== display) return;
    const activeTab = document.querySelector(".tab-content.active").id;
    if (activeTab === "units") {
        return;
    }

    const key = event.key;

    if (
        "0123456789+-*/.=".includes(key) ||
        key === "Enter" ||
        key === "Escape" ||
        key === "Backspace"
    ) {
        event.preventDefault();
    }

    if ("0123456789".includes(key)) {
        appendToDisplay(key);
    } else if ("+-*/".includes(key)) {
        appendToDisplay(key);
    } else if (key === ".") {
        appendToDisplay(".");
    } else if (key === "Enter" || key === "=") {
        calculateResult();
    } else if (key === "Escape" || key === "c" || key === "C") {
        clearDisplay();
    } else if (key === "Backspace") {
        deleteLast();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    initializeTabs();

    document.addEventListener("keydown", handleKeyboardInput);

    document.addEventListener("keydown", function (event) {
        const key = event.key;
        let button = null;

        if (key === "Enter") {
            button = document.querySelector('[data-key="Enter"]');
        } else if (key === "Escape" || key === "c" || key === "C") {
            button = document.querySelector(".clear");
        } else if (key === "Backspace") {
            button = document.querySelector('[onclick="deleteLast()"]');
        } else {
            button = document.querySelector(`[data-key="${key}"]`);
        }

        if (button) {
            button.style.transform = "scale(0.95)";

            setTimeout(() => {
                button.style.transform = "";
            }, 150);
        }
    });

    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
    if (activeTab !== "units") {
        display.focus();
    }

    display.addEventListener("input", function (e) {
        currentInput = display.value.replace(/×/g, "*").replace(/÷/g, "/");
    });
});

function manageFocus() {
    const activeTab = document.querySelector(".tab-content.active").id;
    if (activeTab === "calculus") {
        document.getElementById("calculusExpression").focus();
    } else if (activeTab === "units") {
        const fromValue = document.getElementById("fromValue");
        if (fromValue) {
            fromValue.focus();
        }
    } else {
        display.focus();
    }
}
