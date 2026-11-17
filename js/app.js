/**
 * Compiler Visualization Tool - Main Application Controller
 * Wires the compiler pipeline, stepper, D3 AST visualizer, table visualizers,
 * theme manager, presets, and export utilities.
 */

import { tokenize } from "./compiler/lexer.js";
import { Parser, astToD3Hierarchy } from "./compiler/parser.js";
import { SemanticAnalyzer } from "./compiler/semantic.js";
import { TACGenerator } from "./compiler/tac.js";
import { Optimizer } from "./compiler/optimizer.js";
import { CodeGenerator } from "./compiler/codegen.js";

import { ASTVisualizer } from "./visualizers/tree-visualizer.js";
import { TableVisualizer } from "./visualizers/table-visualizer.js";
import { Stepper, PHASES } from "./visualizers/stepper.js";
import { PRESETS } from "./utils/presets.js";
import { copyToClipboard, exportSvgAsSvg, exportSvgAsPng } from "./utils/exporter.js";

class App {
  constructor() {
    this.astVisualizer = null;
    this.stepper = null;
    this.compilationState = {
      code: "",
      tokens: [],
      lexerErrors: [],
      ast: null,
      d3Hierarchy: null,
      symbolTable: [],
      diagnostics: [],
      tacData: null,
      optResult: null,
      codegenResult: null
    };

    this.init();
  }

  init() {
    this.initPresets();
    this.initVisualizers();
    this.initEvents();

    // Load first preset by default
    this.loadPreset(PRESETS[0].id);
    this.compileAll();
  }

  initPresets() {
    const presetSelect = document.getElementById("presetSelect");
    if (!presetSelect) return;

    presetSelect.innerHTML = PRESETS.map(p => `
      <option value="${p.id}">${p.title}</option>
    `).join("");

    presetSelect.addEventListener("change", (e) => {
      this.loadPreset(e.target.value);
      this.compileAll();
    });
  }

  loadPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    const codeInput = document.getElementById("codeInput");
    if (codeInput) {
      codeInput.value = preset.code;
      this.updateLineNumbers();
    }
    const presetDesc = document.getElementById("presetDescription");
    if (presetDesc) {
      presetDesc.innerText = preset.description;
    }
  }

  initVisualizers() {
    this.astVisualizer = new ASTVisualizer("#astSvg", "#astTooltip");

    this.stepper = new Stepper({
      onStepChange: (stepIndex, phase) => {
        // Redraw or center tree if entering AST tab
        if (phase.id === "parser" && this.compilationState.d3Hierarchy) {
          setTimeout(() => {
            this.astVisualizer.render(this.compilationState.d3Hierarchy);
          }, 50);
        }
      }
    });
  }

  initEvents() {
    // Compile / Run button
    const runBtn = document.getElementById("runBtn");
    if (runBtn) {
      runBtn.addEventListener("click", () => this.compileAll());
    }

    // Clear button
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearAll());
    }

    // Code input typing / line numbers
    const codeInput = document.getElementById("codeInput");
    if (codeInput) {
      codeInput.addEventListener("input", () => this.updateLineNumbers());
      codeInput.addEventListener("scroll", () => {
        const lineNums = document.getElementById("lineNumbers");
        if (lineNums) lineNums.scrollTop = codeInput.scrollTop;
      });
    }

    // AST Controls
    const zoomInBtn = document.getElementById("astZoomIn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => this.astVisualizer.zoomIn());

    const zoomOutBtn = document.getElementById("astZoomOut");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => this.astVisualizer.zoomOut());

    const zoomResetBtn = document.getElementById("astZoomReset");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => this.astVisualizer.resetZoom());

    const exportSvgBtn = document.getElementById("exportAstSvg");
    if (exportSvgBtn) {
      exportSvgBtn.addEventListener("click", () => {
        const svgEl = document.getElementById("astSvg");
        exportSvgAsSvg(svgEl, "compiler-ast.svg");
      });
    }

    const exportPngBtn = document.getElementById("exportAstPng");
    if (exportPngBtn) {
      exportPngBtn.addEventListener("click", () => {
        const svgEl = document.getElementById("astSvg");
        exportSvgAsPng(svgEl, "compiler-ast.png");
      });
    }

    // Copy Buttons
    const copyTacBtn = document.getElementById("copyTacBtn");
    if (copyTacBtn) {
      copyTacBtn.addEventListener("click", () => {
        const text = (this.compilationState.tacData?.instructions || []).join("\n");
        copyToClipboard(text, copyTacBtn);
      });
    }

    const copyAsmBtn = document.getElementById("copyAsmBtn");
    if (copyAsmBtn) {
      copyAsmBtn.addEventListener("click", () => {
        const text = this.compilationState.codegenResult?.formatted || "";
        copyToClipboard(text, copyAsmBtn);
      });
    }
  }

  updateLineNumbers() {
    const codeInput = document.getElementById("codeInput");
    const lineNumbers = document.getElementById("lineNumbers");
    if (!codeInput || !lineNumbers) return;

    const lines = codeInput.value.split("\n").length;
    let numbersHtml = "";
    for (let i = 1; i <= Math.max(lines, 1); i++) {
      numbersHtml += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  compileAll() {
    const codeInput = document.getElementById("codeInput");
    const code = codeInput ? codeInput.value : "";
    if (!code.trim()) {
      this.showStatusNotification("Please enter some source code or choose a preset.", "warning");
      return;
    }

    this.compilationState.code = code;

    try {
      // 1. Lexical Analysis
      const { tokens, errors: lexErrors } = tokenize(code);
      this.compilationState.tokens = tokens;
      this.compilationState.lexerErrors = lexErrors;
      TableVisualizer.renderTokens(document.getElementById("tokensDisplayContainer"), tokens, lexErrors);

      // 2. Syntax Analysis (Parser)
      const parser = new Parser(tokens);
      const ast = parser.parse();
      this.compilationState.ast = ast;
      const d3Hierarchy = astToD3Hierarchy(ast);
      this.compilationState.d3Hierarchy = d3Hierarchy;
      this.astVisualizer.render(d3Hierarchy);

      // 3. Semantic Analysis
      const semanticAnalyzer = new SemanticAnalyzer();
      const { symbolTable, diagnostics } = semanticAnalyzer.analyze(ast);
      this.compilationState.symbolTable = symbolTable;
      this.compilationState.diagnostics = diagnostics;
      TableVisualizer.renderDiagnostics(document.getElementById("semanticDiagnosticsContainer"), diagnostics);
      TableVisualizer.renderSymbolTable(document.getElementById("symbolTableContainer"), symbolTable);

      // 4. Intermediate Code Generation (TAC)
      const tacGenerator = new TACGenerator();
      const tacData = tacGenerator.generate(ast);
      this.compilationState.tacData = tacData;
      TableVisualizer.renderTAC(document.getElementById("tacDisplayContainer"), tacData);

      // 5. Code Optimization
      const optimizer = new Optimizer();
      const optResult = optimizer.optimize(tacData.quadruples);
      this.compilationState.optResult = optResult;
      TableVisualizer.renderOptimization(document.getElementById("optimizerDisplayContainer"), optResult);

      // 6. Target Code Generation
      const codeGenerator = new CodeGenerator();
      const codegenResult = codeGenerator.generate(optResult.optimizedQuadruples);
      this.compilationState.codegenResult = codegenResult;
      TableVisualizer.renderAssembly(document.getElementById("codegenDisplayContainer"), codegenResult);

      this.showStatusNotification("Compilation completed successfully across all 6 phases!", "success");
    } catch (err) {
      console.error(err);
      this.handleCompilationError(err);
    }
  }

  handleCompilationError(err) {
    const errorBox = document.getElementById("errorBanner");
    if (errorBox) {
      errorBox.style.display = "block";
      errorBox.innerHTML = `
        <div class="error-banner-content">
          <span class="error-banner-icon">⚠️</span>
          <div class="error-banner-text">
            <strong>${err.name || 'Compilation Error'}:</strong> ${err.message}
          </div>
          <button class="error-banner-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
        </div>
      `;
    }
    this.showStatusNotification(err.message, "error");
  }

  showStatusNotification(message, type = "info") {
    const banner = document.getElementById("statusNotification");
    if (!banner) return;
    banner.className = `status-toast toast-${type}`;
    banner.innerText = message;
    banner.style.opacity = "1";
    setTimeout(() => {
      banner.style.opacity = "0";
    }, 3500);
  }

  clearAll() {
    const codeInput = document.getElementById("codeInput");
    if (codeInput) codeInput.value = "";
    this.updateLineNumbers();

    document.getElementById("tokensDisplayContainer").innerHTML = "";
    d3.select("#astSvg").select(".tree-container").selectAll("*").remove();
    document.getElementById("semanticDiagnosticsContainer").innerHTML = "";
    document.getElementById("symbolTableContainer").innerHTML = "";
    document.getElementById("tacDisplayContainer").innerHTML = "";
    document.getElementById("optimizerDisplayContainer").innerHTML = "";
    document.getElementById("codegenDisplayContainer").innerHTML = "";

    const errorBox = document.getElementById("errorBanner");
    if (errorBox) errorBox.style.display = "none";

    this.stepper.reset();
    this.showStatusNotification("Workspace cleared.", "info");
  }
}

// Instantiate application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.compilerApp = new App();
});
