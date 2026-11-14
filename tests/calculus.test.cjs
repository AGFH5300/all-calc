const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '..', 'calculus.js'), 'utf8');
const dom = {
  calculusExpression: {value:'x^2'},
  calculusPoint:{value:'2'},
  calculusStart:{value:'0'},
  calculusEnd:{value:'2'},
  calculusStatus:{textContent:'',dataset:{}},
  display:{value:''}
};
const sandbox = {
 document:{getElementById(id){ assert.ok(dom[id],id);return dom[id];}},
 updateDisplay(value){dom.display.value=value;},
 currentInput:'0',
 shouldResetDisplay:false
};
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:'calculus.js'});
let checks=0;
function eq(actual,want,tolerance=1e-5) {
 assert.ok(Math.abs(actual-want)<=tolerance,'Expected '+want+', got '+actual);checks++;
}
function throws(fn,pattern){assert.throws(fn,pattern);checks++;}
function check(name,expr,point,a,b,want,tolerance=1e-5) {
 eq(sandbox.computeCalculus(name,expr,point,a,b),want,tolerance)
}
check('derivative','x^2',2,0,2,4);
check('derivative','x^3',3,0,2,27);
check('derivative','sin(x)',0,0,0,1);
check('derivative','ln(x)',1,0,0,1);
check('integral','x^2',0,0,2,8/3);
check('integral','sin(x)',0,0,Math.PI,2);
check('integral','x',0,2,0,-2);
check('integral','1',0,2,2,0);
check('limit','(x^2-4)/(x-2)',2,0,2,4);
check('limit','sin(x)/x',0,0,0,1,5e-6);
check('limit','x^2',2,0,0,4);
check('sum','x^2',0,1,3,14);
check('sum','x',0,-2,2,0);
check('sum','2*x+1',0,0,3,16);
check('sum','1',0,1,1,1);
eq(sandbox.compileCalculusExpression('-x^2')(3),-9);
eq(sandbox.compileCalculusExpression('2^3^2')(0),512);
eq(sandbox.compileCalculusExpression('pow(2,3)+pi')(0),8+Math.PI);
eq(sandbox.compileCalculusExpression('log(100)+sqrt(9)')(0),5);
throws(()=>sandbox.compileCalculusExpression('window.alert(1)'),/Unsupported|Unknown/);
throws(()=>sandbox.compileCalculusExpression('x;console.log(1)'),/Unsupported/);
throws(()=>sandbox.compileCalculusExpression('constructor(1)'),/Unknown/);
throws(()=>sandbox.compileCalculusExpression('2x'),/Unexpected/);
throws(()=>sandbox.compileCalculusExpression(''),/Enter/);
throws(()=>sandbox.computeCalculus('sum','x',0,1.5,3),/integer/);
throws(()=>sandbox.computeCalculus('sum','x',0,0,10001),/at most/);
throws(()=>sandbox.computeCalculus('limit','1/x',0,0,0),/No stable finite/);
throws(()=>sandbox.computeCalculus('integral','sqrt(x)',0,-1,2),/undefined/);
throws(()=>sandbox.computeCalculus('derivative','x^2',NaN,0,0),/finite/);
dom.calculusExpression.value='x^2';
eq(sandbox.calculateCalculus('derivative'),4);
assert.equal(dom.calculusStatus.dataset.state,'success');
assert.equal(dom.display.value,'4');
dom.calculusExpression.value='x;alert(1)';
assert.equal(sandbox.calculateCalculus('derivative'),null);
assert.equal(dom.calculusStatus.dataset.state,'error');
assert.equal(dom.display.value,'Error');
checks+=5;
console.log('PASS',checks,'calculations, UI actions, invalid inputs, and malicious expression checks');
