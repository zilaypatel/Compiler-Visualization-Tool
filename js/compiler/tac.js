/**
 * Compiler Visualization Tool - Intermediate Code Generator (Three-Address Code & Quadruples)
 * Generates linearized TAC instructions, Quadruple tables (op, arg1, arg2, res),
 * and Postfix (RPN) representations.
 */

export class Quadruple {
  constructor(index, op, arg1, arg2, result) {
    this.index = index;
    this.op = op;
    this.arg1 = arg1 !== null && arg1 !== undefined ? String(arg1) : "-";
    this.arg2 = arg2 !== null && arg2 !== undefined ? String(arg2) : "-";
    this.result = String(result);
  }

  toString() {
    if (this.op === "=") {
      return `${this.result} = ${this.arg1}`;
    }
    if (this.op.startsWith("unary_")) {
      const realOp = this.op.replace("unary_", "");
      return `${this.result} = ${realOp} ${this.arg1}`;
    }
    return `${this.result} = ${this.arg1} ${this.op} ${this.arg2}`;
  }
}

export class TACGenerator {
  constructor() {
    this.tempCounter = 0;
    this.quadruples = [];
    this.instructions = [];
    this.postfixTokens = [];
  }

  newTemp() {
    return `t${this.tempCounter++}`;
  }

  generate(ast) {
    this.tempCounter = 0;
    this.quadruples = [];
    this.instructions = [];
    this.postfixTokens = [];

    if (!ast || ast.type !== "Program") {
      return { quadruples: [], instructions: [], rpn: "" };
    }

    for (const stmt of ast.body) {
      this.generateStatement(stmt);
    }

    return {
      quadruples: this.quadruples,
      instructions: this.quadruples.map(q => q.toString()),
      rpn: this.postfixTokens.join(" ")
    };
  }

  generateStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case "VariableDeclaration": {
        if (stmt.init) {
          const res = this.generateExpression(stmt.init);
          const quad = new Quadruple(this.quadruples.length, "=", res, null, stmt.id);
          this.quadruples.push(quad);
          this.postfixTokens.push(`${stmt.id} =`);
        }
        break;
      }

      case "Assignment": {
        const res = this.generateExpression(stmt.value);
        const quad = new Quadruple(this.quadruples.length, "=", res, null, stmt.id);
        this.quadruples.push(quad);
        this.postfixTokens.push(`${stmt.id} =`);
        break;
      }

      case "ExpressionStatement": {
        this.generateExpression(stmt.expression);
        break;
      }

      default:
        break;
    }
  }

  generateExpression(expr) {
    if (!expr) return "";

    switch (expr.type) {
      case "Literal":
        this.postfixTokens.push(String(expr.value));
        return String(expr.value);

      case "Identifier":
        this.postfixTokens.push(expr.name);
        return expr.name;

      case "UnaryExpression": {
        const arg = this.generateExpression(expr.argument);
        const temp = this.newTemp();
        const quad = new Quadruple(
          this.quadruples.length,
          `unary_${expr.operator}`,
          arg,
          null,
          temp
        );
        this.quadruples.push(quad);
        this.postfixTokens.push(`u${expr.operator}`);
        return temp;
      }

      case "BinaryExpression": {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        const temp = this.newTemp();
        const quad = new Quadruple(
          this.quadruples.length,
          expr.operator,
          left,
          right,
          temp
        );
        this.quadruples.push(quad);
        this.postfixTokens.push(expr.operator);
        return temp;
      }

      default:
        return "";
    }
  }
}
