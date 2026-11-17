/**
 * Automated Test Suite for Compiler Visualization Tool v2
 * Runs via Node.js: node tests/compiler.test.js
 */

import { tokenize } from "../js/compiler/lexer.js";
import { Parser, astToD3Hierarchy } from "../js/compiler/parser.js";
import { SemanticAnalyzer } from "../js/compiler/semantic.js";
import { TACGenerator } from "../js/compiler/tac.js";
import { Optimizer } from "../js/compiler/optimizer.js";
import { CodeGenerator } from "../js/compiler/codegen.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("=== Testing Compiler Visualization Tool v2 ===\n");

// 1. Lexer Tests
console.log("[1] Lexer Tests:");
const input1 = "let x = 15;\nlet y = x * 2 + 5;";
const { tokens, errors } = tokenize(input1);
assert(errors.length === 0, "No lexer errors for valid code");
assert(tokens.some(t => t.type === "KEYWORD" && t.value === "let"), "Recognizes 'let' keyword");
assert(tokens.some(t => t.type === "IDENTIFIER" && t.value === "x"), "Recognizes identifier 'x'");
assert(tokens.some(t => t.type === "NUMBER" && t.value === "15"), "Recognizes number '15'");
assert(tokens.some(t => t.type === "OPERATOR" && t.value === "*"), "Recognizes operator '*'");
assert(tokens.some(t => t.type === "SEMICOLON"), "Recognizes semicolon");

// 2. Parser Tests
console.log("\n[2] Parser Tests:");
const parser = new Parser(tokens);
const ast = parser.parse();
assert(ast.type === "Program", "AST root is Program");
assert(ast.body.length === 2, "Program has 2 statements");
assert(ast.body[0].type === "VariableDeclaration" && ast.body[0].id === "x", "Statement 1 is declaration of 'x'");
assert(ast.body[1].type === "VariableDeclaration" && ast.body[1].id === "y", "Statement 2 is declaration of 'y'");

// Precedence test: 2 + 3 * 4 -> '+' root with 2 and '*' (3, 4)
const precTokens = tokenize("2 + 3 * 4;").tokens;
const precAst = new Parser(precTokens).parse();
const expr = precAst.body[0].expression;
assert(expr.operator === "+", "Root operator of '2 + 3 * 4' is '+'");
assert(expr.right.operator === "*", "Right child is '*' (higher precedence)");

// D3 hierarchy test
const hierarchy = astToD3Hierarchy(ast);
assert(hierarchy.name === "Program", "D3 Hierarchy generated root");
assert(hierarchy.children.length === 2, "D3 Hierarchy has 2 children");

// 3. Semantic Analyzer Tests
console.log("\n[3] Semantic Analyzer Tests:");
const semantic = new SemanticAnalyzer();
const { symbolTable, diagnostics } = semantic.analyze(ast);
assert(symbolTable.some(s => s.name === "x"), "Symbol Table contains 'x'");
assert(symbolTable.some(s => s.name === "y"), "Symbol Table contains 'y'");

// Error detection tests: division by zero & undeclared var
const errInput = "let a = 10 / 0; let b = unknownVar + 5;";
const errAst = new Parser(tokenize(errInput).tokens).parse();
const errSemantic = new SemanticAnalyzer().analyze(errAst);
assert(errSemantic.diagnostics.some(d => d.message.includes("Division or modulo by zero")), "Detects division by zero error");
assert(errSemantic.diagnostics.some(d => d.message.includes("undeclared variable 'unknownVar'")), "Detects undeclared variable error");

// 4. TAC Generator Tests
console.log("\n[4] TAC Generator Tests:");
const tac = new TACGenerator().generate(ast);
assert(tac.quadruples.length > 0, "Generated Quadruples");
assert(tac.instructions.length > 0, "Generated Linear TAC Instructions");
assert(tac.rpn.length > 0, "Generated RPN expression string");
console.log(`   Sample TAC: ${tac.instructions.slice(0, 2).join("; ")}`);

// 5. Optimizer Tests
console.log("\n[5] Optimizer Tests (Constant Folding & Propagation):");
const optInput = "let result = 100 * 2 + 50;";
const optAst = new Parser(tokenize(optInput).tokens).parse();
const optTac = new TACGenerator().generate(optAst);
const optResult = new Optimizer().optimize(optTac.quadruples);
assert(optResult.transformations.length > 0, "Optimizer applied transformations");
assert(optResult.transformations.some(t => t.type === "Folding"), "Applied Constant Folding");
console.log(`   Transformations: ${optResult.transformations.map(t => t.description).join("; ")}`);

// 6. Code Generator Tests
console.log("\n[6] Target Code Generator Tests:");
const codegen = new CodeGenerator().generate(optResult.optimizedQuadruples);
assert(codegen.instructions.length > 0, "Generated Assembly Instructions");
assert(codegen.instructions[0].opcode === "START", "Assembly starts with START");
assert(codegen.instructions[codegen.instructions.length - 1].opcode === "HALT", "Assembly ends with HALT");
assert(codegen.instructions.some(i => i.opcode === "LOADI" || i.opcode === "LOAD"), "Emitted LOAD/LOADI instructions");
assert(codegen.instructions.some(i => i.opcode === "STORE"), "Emitted STORE instructions");

console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
if (failed > 0) {
  process.exit(1);
}
