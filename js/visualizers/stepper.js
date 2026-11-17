/**
 * Compiler Visualization Tool - Phase Stepper
 * Orchestrates step-by-step navigation through the 6 compiler pipeline phases,
 * updating active UI panels and explanatory callouts.
 */

export const PHASES = [
  {
    id: "lexer",
    number: 1,
    title: "1. Lexical Analysis",
    shortTitle: "Lexer",
    icon: "🔤",
    description: "The Lexical Analyzer (Tokenizer) breaks raw source text into a stream of categorized tokens (keywords, identifiers, numbers, operators) while stripping whitespace and tracking source line and column numbers."
  },
  {
    id: "parser",
    number: 2,
    title: "2. Syntax Analysis",
    shortTitle: "AST",
    icon: "🌳",
    description: "The Parser uses Recursive Descent to verify grammatical structure according to context-free grammar rules, constructing a hierarchical Abstract Syntax Tree (AST) representing operator precedence and associativity."
  },
  {
    id: "semantic",
    number: 3,
    title: "3. Semantic Analysis",
    shortTitle: "Semantics",
    icon: "🔍",
    description: "The Semantic Analyzer checks logical correctness, populates the Symbol Table (names, types, scopes), and flags compile-time errors such as division by zero, duplicate declarations, and undeclared identifiers."
  },
  {
    id: "tac",
    number: 4,
    title: "4. Intermediate Code",
    shortTitle: "IR / TAC",
    icon: "⚙️",
    description: "Intermediate Representation (IR) translates the AST into linearized Three-Address Code (TAC) and Quadruple tuples (op, arg1, arg2, result), creating a machine-independent abstraction ready for optimization."
  },
  {
    id: "optimizer",
    number: 5,
    title: "5. Code Optimization",
    shortTitle: "Optimizer",
    icon: "⚡",
    description: "The Machine-Independent Optimizer performs Constant Folding (evaluating compile-time math like 4 * 2 -> 8), Constant Propagation, and Algebraic Simplification (e.g. x * 1 -> x) to minimize instructions."
  },
  {
    id: "codegen",
    number: 6,
    title: "6. Target Code Gen",
    shortTitle: "Assembly",
    icon: "💻",
    description: "The Target Code Generator translates the optimized intermediate representation into executable RISC assembly instructions for a virtual register machine, scheduling memory loads, ALU operations, and stores."
  }
];

export class Stepper {
  constructor(options = {}) {
    this.currentStep = 1;
    this.totalSteps = PHASES.length;
    this.onStepChange = options.onStepChange || (() => {});
    this.maxReachedStep = 1;

    this.navContainer = document.getElementById("stepperNav");
    this.calloutContainer = document.getElementById("phaseCallout");
    this.prevBtn = document.getElementById("stepPrevBtn");
    this.nextBtn = document.getElementById("stepNextBtn");

    this.init();
  }

  init() {
    this.renderNav();
    this.updateUI();

    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.next());
    }
  }

  renderNav() {
    if (!this.navContainer) return;
    this.navContainer.innerHTML = PHASES.map((p, idx) => `
      <button class="step-btn ${idx === 0 ? 'active' : ''}" data-step="${idx + 1}" id="stepBtn-${idx + 1}">
        <span class="step-num">${p.number}</span>
        <span class="step-label">${p.shortTitle}</span>
      </button>
    `).join("");

    this.navContainer.querySelectorAll(".step-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const step = parseInt(btn.dataset.step, 10);
        this.goToStep(step);
      });
    });
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    this.currentStep = step;
    if (step > this.maxReachedStep) {
      this.maxReachedStep = step;
    }
    this.updateUI();
    this.onStepChange(this.currentStep, PHASES[this.currentStep - 1]);
  }

  next() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prev() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  reset() {
    this.currentStep = 1;
    this.maxReachedStep = 1;
    this.updateUI();
    this.onStepChange(this.currentStep, PHASES[0]);
  }

  updateUI() {
    // Update stepper tabs
    if (this.navContainer) {
      this.navContainer.querySelectorAll(".step-btn").forEach(btn => {
        const step = parseInt(btn.dataset.step, 10);
        btn.classList.toggle("active", step === this.currentStep);
        btn.classList.toggle("completed", step < this.currentStep);
      });
    }

    // Update buttons
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentStep <= 1;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    // Update phase explanation callout
    if (this.calloutContainer) {
      const phase = PHASES[this.currentStep - 1];
      this.calloutContainer.innerHTML = `
        <div class="phase-callout-header">
          <span class="phase-callout-icon">${phase.icon}</span>
          <span class="phase-callout-title">${phase.title}</span>
        </div>
        <div class="phase-callout-desc">${phase.description}</div>
      `;
    }

    // Switch visible pane
    document.querySelectorAll(".phase-pane").forEach((pane, idx) => {
      pane.classList.toggle("active", idx + 1 === this.currentStep);
    });
  }
}
