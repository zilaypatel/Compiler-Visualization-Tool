/**
 * Compiler Visualization Tool - Code Optimizer
 * Performs Constant Folding, Constant Propagation, and Algebraic Simplification
 * on Three-Address Code / Quadruples, reporting step-by-step transformations.
 */

import { Quadruple } from "./tac.js";

export class Optimizer {
  optimize(originalQuadruples) {
    if (!originalQuadruples || originalQuadruples.length === 0) {
      return {
        originalTAC: [],
        optimizedTAC: [],
        optimizedQuadruples: [],
        transformations: [],
        stats: { originalCount: 0, optimizedCount: 0, savings: 0 }
      };
    }

    const transformations = [];
    const constantMap = new Map(); // tracks temp/variable -> numeric constant
    const optimized = [];

    for (const q of originalQuadruples) {
      let arg1 = q.arg1;
      let arg2 = q.arg2;
      const op = q.op;
      const result = q.result;

      // 1. Constant Propagation: replace args if known constant
      if (constantMap.has(arg1)) {
        const val = constantMap.get(arg1);
        transformations.push({
          type: "Propagation",
          description: `Constant Propagation: Replaced '${arg1}' with '${val}' in '${result} = ${arg1} ${op} ${arg2}'`
        });
        arg1 = String(val);
      }

      if (constantMap.has(arg2)) {
        const val = constantMap.get(arg2);
        transformations.push({
          type: "Propagation",
          description: `Constant Propagation: Replaced '${arg2}' with '${val}' in '${result} = ${arg1} ${op} ${arg2}'`
        });
        arg2 = String(val);
      }

      // Check if both args are numeric
      const isNum1 = !isNaN(parseFloat(arg1)) && isFinite(arg1);
      const isNum2 = !isNaN(parseFloat(arg2)) && isFinite(arg2);

      // 2. Unary Constant Folding
      if (op.startsWith("unary_") && isNum1) {
        const num1 = parseFloat(arg1);
        const realOp = op.replace("unary_", "");
        let folded = num1;
        if (realOp === "-") folded = -num1;
        
        constantMap.set(result, folded);
        transformations.push({
          type: "Folding",
          description: `Constant Folding: Evaluated unary '${realOp} ${num1}' -> ${folded}`
        });

        optimized.push(new Quadruple(optimized.length, "=", String(folded), null, result));
        continue;
      }

      // 3. Binary Constant Folding
      if (isNum1 && isNum2 && op !== "=") {
        const num1 = parseFloat(arg1);
        const num2 = parseFloat(arg2);
        let foldedVal = null;

        switch (op) {
          case "+": foldedVal = num1 + num2; break;
          case "-": foldedVal = num1 - num2; break;
          case "*": foldedVal = num1 * num2; break;
          case "/": foldedVal = num2 !== 0 ? num1 / num2 : null; break;
          case "%": foldedVal = num2 !== 0 ? num1 % num2 : null; break;
          case "^": foldedVal = Math.pow(num1, num2); break;
        }

        if (foldedVal !== null && !isNaN(foldedVal) && isFinite(foldedVal)) {
          // Round clean floating numbers if very close
          const rounded = Math.round(foldedVal * 1e8) / 1e8;
          constantMap.set(result, rounded);
          transformations.push({
            type: "Folding",
            description: `Constant Folding: Evaluated '${num1} ${op} ${num2}' -> ${rounded}`
          });

          optimized.push(new Quadruple(optimized.length, "=", String(rounded), null, result));
          continue;
        }
      }

      // 4. Algebraic Identities
      // x * 0 = 0, 0 * x = 0
      if (op === "*" && ((isNum1 && parseFloat(arg1) === 0) || (isNum2 && parseFloat(arg2) === 0))) {
        constantMap.set(result, 0);
        transformations.push({
          type: "Algebraic",
          description: `Algebraic Identity: Multiplication by zero '${arg1} * ${arg2}' -> 0`
        });
        optimized.push(new Quadruple(optimized.length, "=", "0", null, result));
        continue;
      }

      // x + 0 = x
      if (op === "+" && isNum2 && parseFloat(arg2) === 0) {
        transformations.push({
          type: "Algebraic",
          description: `Algebraic Identity: '${arg1} + 0' -> '${arg1}'`
        });
        optimized.push(new Quadruple(optimized.length, "=", arg1, null, result));
        continue;
      }

      // x * 1 = x
      if (op === "*" && isNum2 && parseFloat(arg2) === 1) {
        transformations.push({
          type: "Algebraic",
          description: `Algebraic Identity: '${arg1} * 1' -> '${arg1}'`
        });
        optimized.push(new Quadruple(optimized.length, "=", arg1, null, result));
        continue;
      }

      // 5. Assignment propagation
      if (op === "=" && isNum1) {
        constantMap.set(result, parseFloat(arg1));
      }

      // Otherwise retain quadruple with propagated values
      optimized.push(new Quadruple(optimized.length, op, arg1, arg2, result));
    }

    const originalTAC = originalQuadruples.map(q => q.toString());
    const optimizedTAC = optimized.map(q => q.toString());

    return {
      originalTAC,
      optimizedTAC,
      optimizedQuadruples: optimized,
      transformations,
      stats: {
        originalCount: originalTAC.length,
        optimizedCount: optimizedTAC.length,
        transformationsCount: transformations.length
      }
    };
  }
}
