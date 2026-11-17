/**
 * Compiler Visualization Tool - Semantic Analyzer
 * Validates semantics, tracks scopes & variables in a Symbol Table,
 * and detects semantic errors (division by zero, undeclared variables, duplicate declarations).
 */

export class SemanticAnalyzer {
  constructor() {
    this.symbolTable = new Map();
    this.diagnostics = [];
  }

  analyze(ast) {
    this.symbolTable.clear();
    this.diagnostics = [];

    if (!ast || ast.type !== "Program") {
      this.diagnostics.push({
        severity: "error",
        message: "Invalid AST root node",
        line: 1,
        col: 1
      });
      return { symbolTable: [], diagnostics: this.diagnostics };
    }

    for (const stmt of ast.body) {
      this.visitStatement(stmt);
    }

    // Convert symbolTable map to array for display
    const symbolsArray = Array.from(this.symbolTable.values());

    // Check for unused variables (warnings)
    for (const sym of symbolsArray) {
      if (sym.readCount === 0) {
        this.diagnostics.push({
          severity: "warning",
          message: `Variable '${sym.name}' declared at line ${sym.line} is never used`,
          line: sym.line,
          col: sym.col
        });
      }
    }

    return {
      symbolTable: symbolsArray,
      diagnostics: this.diagnostics
    };
  }

  visitStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case "VariableDeclaration": {
        const { id, kind, init, line, col } = stmt;

        if (this.symbolTable.has(id)) {
          const prev = this.symbolTable.get(id);
          this.diagnostics.push({
            severity: "error",
            message: `Identifier '${id}' has already been declared at line ${prev.line}`,
            line,
            col
          });
        }

        let evaluatedValue = null;
        let isConstant = false;
        if (init) {
          evaluatedValue = this.visitExpression(init);
          isConstant = evaluatedValue !== null && typeof evaluatedValue === "number";
        }

        this.symbolTable.set(id, {
          name: id,
          kind: kind || "let",
          type: "number",
          line,
          col,
          initialized: !!init,
          currentValue: isConstant ? evaluatedValue : "runtime value",
          readCount: 0
        });
        break;
      }

      case "Assignment": {
        const { id, value, line, col } = stmt;

        let sym = this.symbolTable.get(id);
        if (!sym) {
          // Implicit declaration or undeclared warning
          sym = {
            name: id,
            kind: "implicit",
            type: "number",
            line,
            col,
            initialized: true,
            currentValue: null,
            readCount: 0
          };
          this.symbolTable.set(id, sym);
          this.diagnostics.push({
            severity: "warning",
            message: `Variable '${id}' assigned without explicit declaration (implicit variable)`,
            line,
            col
          });
        } else if (sym.kind === "const" && sym.initialized) {
          this.diagnostics.push({
            severity: "error",
            message: `Assignment to constant variable '${id}'`,
            line,
            col
          });
        }

        const evaluatedValue = this.visitExpression(value);
        sym.initialized = true;
        sym.currentValue = (typeof evaluatedValue === "number") ? evaluatedValue : "runtime value";
        break;
      }

      case "ExpressionStatement": {
        this.visitExpression(stmt.expression);
        break;
      }

      default:
        break;
    }
  }

  visitExpression(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case "Literal":
        return expr.value;

      case "Identifier": {
        const sym = this.symbolTable.get(expr.name);
        if (!sym) {
          this.diagnostics.push({
            severity: "error",
            message: `Use of undeclared variable '${expr.name}'`,
            line: expr.line,
            col: expr.col
          });
          return null;
        }
        if (!sym.initialized) {
          this.diagnostics.push({
            severity: "warning",
            message: `Variable '${expr.name}' used before being assigned a value`,
            line: expr.line,
            col: expr.col
          });
        }
        sym.readCount++;
        return typeof sym.currentValue === "number" ? sym.currentValue : null;
      }

      case "UnaryExpression": {
        const val = this.visitExpression(expr.argument);
        if (typeof val === "number") {
          return expr.operator === "-" ? -val : val;
        }
        return null;
      }

      case "BinaryExpression": {
        const leftVal = this.visitExpression(expr.left);
        const rightVal = this.visitExpression(expr.right);

        // Division by zero check
        if (expr.operator === "/" || expr.operator === "%") {
          if (rightVal === 0) {
            this.diagnostics.push({
              severity: "error",
              message: `Division or modulo by zero detected`,
              line: expr.line,
              col: expr.col
            });
          }
        }

        // Static evaluation if both are numbers
        if (typeof leftVal === "number" && typeof rightVal === "number") {
          switch (expr.operator) {
            case "+": return leftVal + rightVal;
            case "-": return leftVal - rightVal;
            case "*": return leftVal * rightVal;
            case "/": return rightVal !== 0 ? leftVal / rightVal : null;
            case "%": return rightVal !== 0 ? leftVal % rightVal : null;
            case "^": return Math.pow(leftVal, rightVal);
            default: return null;
          }
        }
        return null;
      }

      default:
        return null;
    }
  }
}
