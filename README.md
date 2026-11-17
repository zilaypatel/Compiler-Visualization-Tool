# ⚡ Compiler Visualization Tool v2.0

An interactive, modern educational platform designed to visualize every stage of a multi-phase compiler. From raw source code to lexical tokens, interactive Abstract Syntax Trees (AST), Symbol Tables, Three-Address Code (TAC), compile-time optimizations, and virtual RISC assembly.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6%2B%20Modules-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![D3.js v7](https://img.shields.io/badge/D3.js-v7-orange.svg)](https://d3js.org/)
[![Tests](https://img.shields.io/badge/Tests-28%20Passed-success.svg)](tests/compiler.test.js)
[![Zero Build](https://img.shields.io/badge/Build-Zero%20Configuration-brightgreen.svg)](#quick-start)

---

## 🌟 Overview & Highlights

Most introductory compiler textbooks (such as the Dragon Book) explain compiler theory through static diagrams. The **Compiler Visualization Tool (CVT 2.0)** turns those abstract concepts into an interactive, step-by-step visual sandbox:

- **6 End-to-End Compilation Phases**: Complete visibility into the full compilation pipeline.
- **Interactive Phase Stepper**: Walk step-by-step or compile instantly across all phases with contextual educational explanations.
- **Rich Language Support**: Supports arithmetic expressions (`+`, `-`, `*`, `/`, `%`, `^`), parenthesized grouping, variable declarations (`let`, `var`), multi-line assignments, and identifiers.
- **Interactive D3.js AST Visualizer**: Smooth drag-and-pan, zoom in/out, hover inspection tooltips, and collapsible branch nodes.
- **Symbol Table & Semantic Diagnostics**: Tracks variable bindings, inferred types, usage counts, and live compile-time error detection (e.g. constant division by zero, undeclared variables).
- **Three-Address Code (TAC) & Quadruples**: Emits linearized intermediate representation, quadruples table `(Op, Arg1, Arg2, Result)`, and Reverse Polish Notation (RPN).
- **Machine-Independent Optimizer**: Side-by-side Before/After diff visualizing constant folding, constant propagation, and algebraic identity reductions.
- **Target RISC Assembly Generation**: Translates optimized TAC into readable virtual register machine instructions annotated with execution comments.
- **Export & Share**: One-click download of the AST as high-resolution SVG or PNG, and copy buttons for TAC and Assembly.
- **Modern Responsive Design**: Dark and Light themes with glassmorphism UI, JetBrains Mono typography, and line-numbered source editor.
- **Zero Build / Zero Dependencies**: Pure client-side modern ES6+ modules. Works directly out-of-the-box in any web browser or GitHub Pages with zero installation.

---

## 🏗️ Compiler Architecture

```
                       +-----------------------------+
                       |         Source Code         |
                       |  let x = 15; y = x * 2 + 5; |
                       +--------------+--------------+
                                      |
                                      v
  [Phase 1]            +-----------------------------+
  Lexical Analysis     |      Lexer / Tokenizer      |
                       +--------------+--------------+
                                      | Token Stream
                                      v
  [Phase 2]            +-----------------------------+
  Syntax Analysis      |   Recursive Descent Parser  |
                       +--------------+--------------+
                                      | Abstract Syntax Tree (AST)
                                      v
  [Phase 3]            +-----------------------------+
  Semantic Analysis    | Type Checker & Symbol Table |
                       +--------------+--------------+
                                      | Validated AST & Diagnostics
                                      v
  [Phase 4]            +-----------------------------+
  Intermediate Code    |   TAC & Quadruple Generator |
                       +--------------+--------------+
                                      | Linear TAC & Quadruples
                                      v
  [Phase 5]            +-----------------------------+
  Optimization         | Constant Folding Optimizer  |
                       +--------------+--------------+
                                      | Optimized TAC & Metrics
                                      v
  [Phase 6]            +-----------------------------+
  Code Generation      |    RISC Assembly Generator  |
                       +--------------+--------------+
                                      |
                                      v
                       +-----------------------------+
                       |    Virtual RISC Assembly    |
                       |   LOADI, STORE, ADD, etc.   |
                       +-----------------------------+
```

---

## 📜 Formal Grammar (EBNF)

The language recognized by the parser is defined by the following Context-Free Grammar:

```ebnf
Program        ::= Statement*
Statement      ::= ( "let" | "var" | "const" )? IDENTIFIER "=" Expression ( ";" )?
                 | Expression ( ";" )?
Expression     ::= Term ( ( "+" | "-" ) Term )*
Term           ::= Power ( ( "*" | "/" | "%" ) Power )*
Power          ::= Factor ( "^" Power )?       (* Right-associative exponentiation *)
Factor         ::= ( "+" | "-" ) Factor        (* Unary plus / negation *)
                 | Primary
Primary        ::= NUMBER | IDENTIFIER | "(" Expression ")"
```

### Precedence & Associativity Table

| Operator | Description | Associativity | Precedence |
| :--- | :--- | :--- | :--- |
| `( )` | Parentheses / Grouping | N/A | Highest (Level 5) |
| `^` | Exponentiation | Right-to-Left | Level 4 |
| `+`, `-` (unary) | Unary positive / negation | Right-to-Left | Level 3 |
| `*`, `/`, `%` | Multiplication, Division, Modulo | Left-to-Right | Level 2 |
| `+`, `-` (binary) | Addition, Subtraction | Left-to-Right | Level 1 |
| `=` | Variable Assignment | Right-to-Left | Lowest (Level 0) |

---

## 🔍 In-Depth Walkthrough of Compiler Phases

### Phase 1: Lexical Analysis (Scanning)
- Reads the raw input stream character-by-character.
- Groups characters into tokens:
  - `KEYWORD`: `let`, `var`, `const`
  - `IDENTIFIER`: `[a-zA-Z_][a-zA-Z0-9_]*`
  - `NUMBER`: Integers and floating-point literals (`15`, `3.1415`)
  - `OPERATOR`: `+`, `-`, `*`, `/`, `%`, `^`
  - `ASSIGN`: `=`
  - `PAREN` & `SEMICOLON`: `(`, `)`, `;`
- Tracks source coordinates (`line`, `column`) for error diagnostics and displays both a visual chip-stream and structured token table.

### Phase 2: Syntax Analysis (Parsing)
- Implements a deterministic **Recursive Descent Parser** ensuring strict adherence to operator precedence.
- Emits a clean hierarchical AST nodes: `Program`, `VariableDeclaration`, `Assignment`, `BinaryExpression`, `UnaryExpression`, `Literal`, and `Identifier`.
- Rendered via **D3.js v7** with pan-zoom navigation, interactive collapsible subtrees, and instant SVG/PNG export.

### Phase 3: Semantic Analysis & Symbol Table
- Builds a scoped **Symbol Table** tracking identifier names, declarations, variable kinds, inferred types, and reference/usage counts.
- Performs compile-time diagnostics:
  - **Division by Zero Detection**: Catches static division/modulo where the denominator evaluates to zero.
  - **Undeclared Variables**: Alerts when an identifier is used in an expression without prior declaration.
  - **Unused Variables**: Flags variables that are declared but never referenced.

### Phase 4: Intermediate Code Generation (IR)
- Deconstructs nested tree expressions into linearized **Three-Address Code (TAC)** where each instruction has at most one operator and three addresses.
- Populates an explicit **Quadruples Table** (`#`, `Op`, `Arg1`, `Arg2`, `Result`).
- Produces **Reverse Polish Notation (RPN)** representation.

### Phase 5: Code Optimization
- **Constant Folding**: Statically computes numeric expressions at compile-time (e.g., `100 * 2 + 50` simplifies directly to `250`).
- **Constant Propagation**: Substitutes known constant values through intermediate temporaries.
- **Algebraic Identities**:
  - `x * 0` $\rightarrow$ `0`
  - `x * 1` $\rightarrow$ `x`
  - `x + 0` $\rightarrow$ `x`
- Visualizes transformations with a side-by-side **Before vs After diff** and performance metrics (instruction reduction percentage).

### Phase 6: Target Code Generation
- Translates optimized TAC into a clean, educational RISC-style instruction set:
  - `START` / `HALT`: Execution boundaries.
  - `LOADI R0, #val`: Load immediate constant into register.
  - `LOAD R0, [var]`: Load variable from memory into register.
  - `STORE [var], R0`: Write register result to memory variable.
  - `ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `POW`, `NEG`: Arithmetic ALU operations.
- Annotated with plain-English execution explanations for each instruction.

---

## 🚀 Quick Start

### 1. Direct Browser Opening (No Setup Required)
Because the project is built with standard ES6+ modules and zero build dependencies:
1. Clone or download the repository.
2. Double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### 2. Local Development Server
For the optimal developer experience with live reloading:

Using **Node.js**:
```bash
# Serve current directory using npx
npx serve .
```

Or using **Python 3**:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/`.

### 3. Running Automated Tests
The repository includes a comprehensive 28-point automated test suite validating all compiler modules:
```bash
npm test
```
Sample test output:
```
=== Testing Compiler Visualization Tool v2 ===

[1] Lexer Tests:
  ✓ No lexer errors for valid code
  ✓ Recognizes 'let' keyword
  ✓ Recognizes identifier 'x'
  ✓ Recognizes number '15'
  ✓ Recognizes operator '*'
  ✓ Recognizes semicolon

[2] Parser Tests:
  ✓ AST root is Program
  ✓ Program has 2 statements
  ✓ Statement 1 is declaration of 'x'
  ✓ Statement 2 is declaration of 'y'
  ✓ Root operator of '2 + 3 * 4' is '+'
  ✓ Right child is '*' (higher precedence)
  ✓ D3 Hierarchy generated root
  ✓ D3 Hierarchy has 2 children

[3] Semantic Analyzer Tests:
  ✓ Symbol Table contains 'x'
  ✓ Symbol Table contains 'y'
  ✓ Detects division by zero error
  ✓ Detects undeclared variable error

[4] TAC Generator Tests:
  ✓ Generated Quadruples
  ✓ Generated Linear TAC Instructions
  ✓ Generated RPN expression string

[5] Optimizer Tests (Constant Folding & Propagation):
  ✓ Optimizer applied transformations
  ✓ Applied Constant Folding

[6] Target Code Generator Tests:
  ✓ Generated Assembly Instructions
  ✓ Assembly starts with START
  ✓ Assembly ends with HALT
  ✓ Emitted LOAD/LOADI instructions
  ✓ Emitted STORE instructions

=== Test Results: 28 Passed, 0 Failed ===
```

---

## 📁 Repository Structure

```
Compiler-Visualization-Tool/
├── index.html                  # Main responsive web interface with phase stepper
├── style.css                   # Glassmorphic UI styling, CSS variables & themes
├── script.js                   # Entry point (delegates to ES6 modular architecture)
├── package.json                # Project metadata and test runner script
├── README.md                   # Comprehensive technical documentation
│
├── js/
│   ├── app.js                  # Main controller, event dispatching & theme manager
│   │
│   ├── compiler/
│   │   ├── lexer.js            # Lexical analyzer (tokenizer & position tracker)
│   │   ├── parser.js           # Recursive descent parser & AST builder
│   │   ├── semantic.js         # Symbol table manager & semantic diagnostics
│   │   ├── tac.js              # Three-Address Code & Quadruples generator
│   │   ├── optimizer.js        # Constant folding & algebraic simplification
│   │   └── codegen.js          # Target RISC assembly generator
│   │
│   ├── visualizers/
│   │   ├── tree-visualizer.js  # D3.js v7 zoom, pan, tooltip & collapsible AST
│   │   ├── table-visualizer.js # Data tables for tokens, symbol table, TAC, & assembly
│   │   └── stepper.js          # 6-phase stepper state machine & explanations
│   │
│   └── utils/
│       ├── presets.js          # Preloaded code snippets for quick demonstration
│       └── exporter.js         # High-DPI SVG/PNG exporter & clipboard manager
│
└── tests/
    └── compiler.test.js        # Automated test suite for all compiler phases
```

---

## 💡 Preloaded Examples

Use the **Example** dropdown in the navigation header to explore presets:
1. **Variables & Expressions**: Multi-statement declarations, calculations, and intermediate variables.
2. **Basic Arithmetic**: Nested parenthesized expressions demonstrating operator precedence.
3. **Constant Folding Demo**: Showcases compile-time evaluation and algebraic simplification in the optimizer.
4. **Semantic Diagnostics Demo**: Triggers compile-time warnings and errors (division by zero, undeclared variables, unused variables).

---

## 🛠️ Tech Stack

- **Core Logic**: Modern Vanilla JavaScript (ES6+ Modules, Object-Oriented Compiler Architecture)
- **Visualization**: [D3.js v7](https://d3js.org/) for vector tree graph layout, zooming, and panning
- **Styling**: Pure CSS3 with custom properties (CSS variables), Flexbox, CSS Grid, and responsive dark/light themes
- **Typography**: Inter & JetBrains Mono via Google Fonts
- **Testing**: Node.js built-in assertion runner

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
