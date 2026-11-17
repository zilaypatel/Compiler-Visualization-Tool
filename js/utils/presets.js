/**
 * Compiler Visualization Tool - Code Presets & Examples
 */

export const PRESETS = [
  {
    id: "variables",
    title: "Variables & Expressions",
    description: "Multi-statement variable declarations, assignments, and arithmetic.",
    code: `let x = 15;
let y = x * 2 + 5;
let z = (y - x) / 5;
total = x + y + z;`
  },
  {
    id: "arithmetic",
    title: "Basic Arithmetic",
    description: "Nested arithmetic expression demonstrating operator precedence and associativity.",
    code: `(10 + 20) * 3 - (50 / 2) ^ 2;`
  },
  {
    id: "optimization",
    title: "Constant Folding & Propagation Demo",
    description: "Contains constant expressions and algebraic identities for the optimizer to simplify.",
    code: `let a = 100 * 2 + 50;
let b = a + (4 * 0);
let c = b * 1 + (10 - 10);`
  },
  {
    id: "semantic-error",
    title: "Semantic Diagnostics Demo",
    description: "Demonstrates division by zero and undeclared identifier warnings/errors.",
    code: `let val = 42;
let err1 = val / 0;
let err2 = undeclaredVariable + 10;
let unused = 99;`
  }
];
