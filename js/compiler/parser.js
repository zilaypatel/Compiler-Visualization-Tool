/**
 * Compiler Visualization Tool - Parser (Syntax Analysis)
 * Implements a Recursive Descent Parser that produces an Abstract Syntax Tree (AST).
 */

import { TokenType } from "./lexer.js";

export class ParseError extends Error {
  constructor(message, token) {
    const line = token ? token.line : "?";
    const col = token ? token.col : "?";
    super(`${message} (line ${line}, col ${col})`);
    this.name = "ParseError";
    this.token = token;
    this.line = line;
    this.col = col;
  }
}

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.cursor = 0;
  }

  peek() {
    return this.tokens[this.cursor] || { type: TokenType.EOF, value: "EOF" };
  }

  peekNext() {
    return this.tokens[this.cursor + 1] || { type: TokenType.EOF, value: "EOF" };
  }

  match(...types) {
    const current = this.peek();
    for (const type of types) {
      if (current.type === type) {
        return true;
      }
    }
    return false;
  }

  consume(expectedType, message) {
    const current = this.peek();
    if (expectedType && current.type !== expectedType) {
      throw new ParseError(message || `Expected ${expectedType} but found '${current.value}'`, current);
    }
    this.cursor++;
    return current;
  }

  parse() {
    const statements = [];
    while (!this.match(TokenType.EOF)) {
      // Skip redundant semicolons
      if (this.match(TokenType.SEMICOLON)) {
        this.consume(TokenType.SEMICOLON);
        continue;
      }
      statements.push(this.parseStatement());
    }
    return {
      type: "Program",
      body: statements
    };
  }

  parseStatement() {
    const current = this.peek();

    // 1. Keyword Declaration: let / var / const id = expr;
    if (current.type === TokenType.KEYWORD) {
      const kw = this.consume(TokenType.KEYWORD);
      const idToken = this.consume(TokenType.IDENTIFIER, "Expected identifier after variable declaration keyword");
      
      let init = null;
      if (this.match(TokenType.ASSIGN)) {
        this.consume(TokenType.ASSIGN);
        init = this.parseExpression();
      }

      if (this.match(TokenType.SEMICOLON)) {
        this.consume(TokenType.SEMICOLON);
      }

      return {
        type: "VariableDeclaration",
        kind: kw.value,
        id: idToken.value,
        init: init,
        line: kw.line,
        col: kw.col
      };
    }

    // 2. Assignment: id = expr;
    if (current.type === TokenType.IDENTIFIER && this.peekNext().type === TokenType.ASSIGN) {
      const idToken = this.consume(TokenType.IDENTIFIER);
      const assignToken = this.consume(TokenType.ASSIGN);
      const value = this.parseExpression();

      if (this.match(TokenType.SEMICOLON)) {
        this.consume(TokenType.SEMICOLON);
      }

      return {
        type: "Assignment",
        id: idToken.value,
        value: value,
        line: assignToken.line,
        col: assignToken.col
      };
    }

    // 3. Expression Statement: expr;
    const expr = this.parseExpression();
    if (this.match(TokenType.SEMICOLON)) {
      this.consume(TokenType.SEMICOLON);
    }
    return {
      type: "ExpressionStatement",
      expression: expr,
      line: expr.line,
      col: expr.col
    };
  }

  parseExpression() {
    let node = this.parseTerm();

    while (this.match(TokenType.OPERATOR) && (this.peek().value === "+" || this.peek().value === "-")) {
      const opToken = this.consume(TokenType.OPERATOR);
      const right = this.parseTerm();
      node = {
        type: "BinaryExpression",
        operator: opToken.value,
        left: node,
        right: right,
        line: opToken.line,
        col: opToken.col
      };
    }

    return node;
  }

  parseTerm() {
    let node = this.parsePower();

    while (this.match(TokenType.OPERATOR) && (this.peek().value === "*" || this.peek().value === "/" || this.peek().value === "%")) {
      const opToken = this.consume(TokenType.OPERATOR);
      const right = this.parsePower();
      node = {
        type: "BinaryExpression",
        operator: opToken.value,
        left: node,
        right: right,
        line: opToken.line,
        col: opToken.col
      };
    }

    return node;
  }

  parsePower() {
    let node = this.parseFactor();

    if (this.match(TokenType.OPERATOR) && this.peek().value === "^") {
      const opToken = this.consume(TokenType.OPERATOR);
      const right = this.parsePower(); // Right-associative exponentiation
      node = {
        type: "BinaryExpression",
        operator: "^",
        left: node,
        right: right,
        line: opToken.line,
        col: opToken.col
      };
    }

    return node;
  }

  parseFactor() {
    // Unary operators + or -
    if (this.match(TokenType.OPERATOR) && (this.peek().value === "+" || this.peek().value === "-")) {
      const opToken = this.consume(TokenType.OPERATOR);
      const argument = this.parseFactor();
      return {
        type: "UnaryExpression",
        operator: opToken.value,
        argument: argument,
        line: opToken.line,
        col: opToken.col
      };
    }

    return this.parsePrimary();
  }

  parsePrimary() {
    const current = this.peek();

    if (current.type === TokenType.NUMBER) {
      this.consume(TokenType.NUMBER);
      return {
        type: "Literal",
        value: parseFloat(current.value),
        raw: current.value,
        line: current.line,
        col: current.col
      };
    }

    if (current.type === TokenType.IDENTIFIER) {
      this.consume(TokenType.IDENTIFIER);
      return {
        type: "Identifier",
        name: current.value,
        line: current.line,
        col: current.col
      };
    }

    if (current.type === TokenType.LPAREN) {
      this.consume(TokenType.LPAREN);
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected matching ')' for expression");
      return expr;
    }

    throw new ParseError(`Unexpected token '${current.value}' (${current.type})`, current);
  }
}

/**
 * Converts the AST into a D3 hierarchy-ready format:
 * { name: "...", details: "...", children: [...] }
 */
export function astToD3Hierarchy(node) {
  if (!node) return null;

  switch (node.type) {
    case "Program":
      return {
        name: "Program",
        details: `${node.body.length} Statement(s)`,
        badge: "Root",
        children: node.body.map(stmt => astToD3Hierarchy(stmt)).filter(Boolean)
      };

    case "VariableDeclaration":
      return {
        name: `${node.kind} ${node.id}`,
        details: "Declaration",
        badge: "VarDecl",
        children: node.init ? [astToD3Hierarchy(node.init)] : []
      };

    case "Assignment":
      return {
        name: `${node.id} =`,
        details: "Assignment",
        badge: "Assign",
        children: [astToD3Hierarchy(node.value)].filter(Boolean)
      };

    case "ExpressionStatement":
      return {
        name: "ExprStmt",
        details: "Statement",
        badge: "Stmt",
        children: [astToD3Hierarchy(node.expression)].filter(Boolean)
      };

    case "BinaryExpression":
      return {
        name: `Op (${node.operator})`,
        details: `Binary '${node.operator}'`,
        badge: "BinaryOp",
        children: [
          astToD3Hierarchy(node.left),
          astToD3Hierarchy(node.right)
        ].filter(Boolean)
      };

    case "UnaryExpression":
      return {
        name: `Unary (${node.operator})`,
        details: `Unary '${node.operator}'`,
        badge: "UnaryOp",
        children: [astToD3Hierarchy(node.argument)].filter(Boolean)
      };

    case "Literal":
      return {
        name: `${node.value}`,
        details: "Number Literal",
        badge: "Literal"
      };

    case "Identifier":
      return {
        name: `${node.name}`,
        details: "Identifier",
        badge: "Identifier"
      };

    default:
      return {
        name: node.type || "Node",
        details: JSON.stringify(node)
      };
  }
}
