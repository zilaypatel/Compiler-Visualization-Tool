/**
 * Compiler Visualization Tool - Lexer (Lexical Analyzer)
 * Tokenizes the input source string into a stream of structured tokens
 * with position tracking (line, column).
 */

export const TokenType = {
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  OPERATOR: "OPERATOR",
  ASSIGN: "ASSIGN",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  SEMICOLON: "SEMICOLON",
  EOF: "EOF"
};

const KEYWORDS = new Set(["let", "var", "const"]);

export class Token {
  constructor(type, value, line, col, start, end) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.col = col;
    this.start = start;
    this.end = end;
  }
}

export class LexerError extends Error {
  constructor(message, line, col, pos) {
    super(`${message} at line ${line}, col ${col}`);
    this.name = "LexerError";
    this.line = line;
    this.col = col;
    this.pos = pos;
  }
}

export function tokenize(input) {
  const tokens = [];
  const errors = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < input.length) {
    const char = input[pos];

    // Handle newlines
    if (char === "\n") {
      line++;
      col = 1;
      pos++;
      continue;
    }

    // Skip carriage returns and tabs/spaces
    if (/\s/.test(char)) {
      pos++;
      col++;
      continue;
    }

    // Skip single-line comments // ...
    if (char === "/" && input[pos + 1] === "/") {
      while (pos < input.length && input[pos] !== "\n") {
        pos++;
      }
      continue;
    }

    // Numbers: integer or float
    if (/\d/.test(char)) {
      const startCol = col;
      const startPos = pos;
      let numStr = "";
      while (pos < input.length && /[\d.]/.test(input[pos])) {
        // Prevent multiple decimal points
        if (input[pos] === "." && numStr.includes(".")) break;
        numStr += input[pos];
        pos++;
        col++;
      }
      tokens.push(new Token(TokenType.NUMBER, numStr, line, startCol, startPos, pos));
      continue;
    }

    // Identifiers or keywords: [a-zA-Z_][a-zA-Z0-9_]*
    if (/[a-zA-Z_]/.test(char)) {
      const startCol = col;
      const startPos = pos;
      let idStr = "";
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
        idStr += input[pos];
        pos++;
        col++;
      }
      const type = KEYWORDS.has(idStr) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
      tokens.push(new Token(type, idStr, line, startCol, startPos, pos));
      continue;
    }

    // Multi-char / Single-char operators & symbols
    if (char === "=") {
      tokens.push(new Token(TokenType.ASSIGN, "=", line, col, pos, pos + 1));
      pos++;
      col++;
      continue;
    }

    if (char === ";") {
      tokens.push(new Token(TokenType.SEMICOLON, ";", line, col, pos, pos + 1));
      pos++;
      col++;
      continue;
    }

    if (char === "(") {
      tokens.push(new Token(TokenType.LPAREN, "(", line, col, pos, pos + 1));
      pos++;
      col++;
      continue;
    }

    if (char === ")") {
      tokens.push(new Token(TokenType.RPAREN, ")", line, col, pos, pos + 1));
      pos++;
      col++;
      continue;
    }

    if (["+", "-", "*", "/", "%", "^"].includes(char)) {
      tokens.push(new Token(TokenType.OPERATOR, char, line, col, pos, pos + 1));
      pos++;
      col++;
      continue;
    }

    // Unrecognized character
    errors.push(new LexerError(`Unexpected character '${char}'`, line, col, pos));
    pos++;
    col++;
  }

  tokens.push(new Token(TokenType.EOF, "EOF", line, col, pos, pos));
  return { tokens, errors };
}
