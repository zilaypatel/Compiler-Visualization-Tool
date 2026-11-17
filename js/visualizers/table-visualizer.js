/**
 * Compiler Visualization Tool - Table & Section Visualizers
 * Renders tokens, diagnostics, symbol table, TAC quadruples, optimizer diffs, and assembly.
 */

export class TableVisualizer {
  // --- TOKENS ---
  static renderTokens(container, tokens, errors = []) {
    if (!container) return;
    if (!tokens || tokens.length === 0) {
      container.innerHTML = `<div class="empty-state">No tokens generated.</div>`;
      return;
    }

    // Filter out EOF for the stream chips
    const visibleTokens = tokens.filter(t => t.type !== "EOF");

    const chipsHtml = visibleTokens.map((t, idx) => {
      const typeClass = `token-${t.type.toLowerCase()}`;
      return `
        <span class="token-chip ${typeClass}" title="Line ${t.line}, Col ${t.col}">
          <span class="token-type">${t.type}</span>
          <span class="token-val">${escapeHtml(t.value)}</span>
        </span>
      `;
    }).join("");

    const rowsHtml = visibleTokens.map((t, idx) => {
      return `
        <tr>
          <td><span class="badge-idx">${idx}</span></td>
          <td><span class="token-badge token-${t.type.toLowerCase()}">${t.type}</span></td>
          <td><code>${escapeHtml(t.value)}</code></td>
          <td>${t.line}</td>
          <td>${t.col}</td>
        </tr>
      `;
    }).join("");

    let errorHtml = "";
    if (errors && errors.length > 0) {
      errorHtml = `
        <div class="diagnostic-box error mb-3">
          <strong>Lexical Errors:</strong>
          <ul>
            ${errors.map(e => `<li>Line ${e.line}, Col ${e.col}: ${escapeHtml(e.message)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    container.innerHTML = `
      ${errorHtml}
      <div class="token-stream-container mb-3">
        <h6>Token Stream (${visibleTokens.length} tokens):</h6>
        <div class="token-chips-wrapper">${chipsHtml}</div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Lexeme / Value</th>
              <th>Line</th>
              <th>Column</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- DIAGNOSTICS ---
  static renderDiagnostics(container, diagnostics) {
    if (!container) return;
    if (!diagnostics || diagnostics.length === 0) {
      container.innerHTML = `
        <div class="diagnostic-box success">
          <span class="diag-icon">✓</span> Semantic check passed! No errors or warnings detected.
        </div>
      `;
      return;
    }

    const itemsHtml = diagnostics.map(d => {
      const isError = d.severity === "error";
      const icon = isError ? "⚠" : "ℹ";
      const badgeClass = isError ? "badge-danger" : "badge-warning";
      return `
        <div class="diagnostic-item ${d.severity}">
          <span class="diag-icon">${icon}</span>
          <span class="diag-badge ${badgeClass}">${d.severity.toUpperCase()}</span>
          <span class="diag-msg">${escapeHtml(d.message)}</span>
          <span class="diag-loc">Line ${d.line}, Col ${d.col}</span>
        </div>
      `;
    }).join("");

    container.innerHTML = `<div class="diagnostics-list">${itemsHtml}</div>`;
  }

  // --- SYMBOL TABLE ---
  static renderSymbolTable(container, symbols) {
    if (!container) return;
    if (!symbols || symbols.length === 0) {
      container.innerHTML = `<div class="empty-state">No symbols recorded in this scope.</div>`;
      return;
    }

    const rowsHtml = symbols.map(s => {
      const valDisplay = s.currentValue !== null && s.currentValue !== undefined
        ? `<code>${escapeHtml(String(s.currentValue))}</code>`
        : `<span class="text-muted">uninitialized</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td><span class="badge-kind">${escapeHtml(s.kind)}</span></td>
          <td><code>${escapeHtml(s.type)}</code></td>
          <td>${valDisplay}</td>
          <td>Line ${s.line}</td>
          <td>${s.readCount} time(s)</td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Kind</th>
              <th>Type</th>
              <th>Value</th>
              <th>Declared</th>
              <th>Usages</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- TAC & QUADRUPLES ---
  static renderTAC(container, tacData) {
    if (!container) return;
    const { quadruples, instructions, rpn } = tacData;

    if (!quadruples || quadruples.length === 0) {
      container.innerHTML = `<div class="empty-state">No intermediate code generated.</div>`;
      return;
    }

    const quadRowsHtml = quadruples.map(q => {
      return `
        <tr>
          <td><span class="badge-idx">${q.index}</span></td>
          <td><span class="badge-op">${escapeHtml(q.op)}</span></td>
          <td><code>${escapeHtml(q.arg1)}</code></td>
          <td><code>${escapeHtml(q.arg2)}</code></td>
          <td><strong>${escapeHtml(q.result)}</strong></td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="tac-grid">
        <div class="tac-column">
          <h6>Linear Three-Address Code (TAC):</h6>
          <pre class="code-block"><code>${instructions.map((ins, i) => `<span class="line-num">${i + 1}</span>  ${escapeHtml(ins)}`).join("\n")}</code></pre>
          
          <h6 class="mt-3">Reverse Polish Notation (RPN):</h6>
          <div class="rpn-box"><code>${escapeHtml(rpn || "(none)")}</code></div>
        </div>

        <div class="tac-column">
          <h6>Quadruples Table (Op, Arg1, Arg2, Result):</h6>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Op</th>
                  <th>Arg 1</th>
                  <th>Arg 2</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${quadRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- OPTIMIZATION ---
  static renderOptimization(container, optResult) {
    if (!container) return;
    const { originalTAC, optimizedTAC, transformations, stats } = optResult;

    if (!originalTAC || originalTAC.length === 0) {
      container.innerHTML = `<div class="empty-state">No intermediate instructions to optimize.</div>`;
      return;
    }

    const transformListHtml = transformations.length > 0
      ? transformations.map(t => `
          <div class="opt-transform-item">
            <span class="opt-pill opt-${t.type.toLowerCase()}">${t.type}</span>
            <span class="opt-desc">${escapeHtml(t.description)}</span>
          </div>
        `).join("")
      : `<div class="empty-state">Code is already in minimal form. No constant expressions folded.</div>`;

    container.innerHTML = `
      <div class="opt-stats-bar mb-3">
        <div class="stat-card">
          <span class="stat-val">${stats.originalCount}</span>
          <span class="stat-lbl">Original TAC Instructions</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">${stats.optimizedCount}</span>
          <span class="stat-lbl">Optimized Instructions</span>
        </div>
        <div class="stat-card">
          <span class="stat-val highlight">${stats.transformationsCount}</span>
          <span class="stat-lbl">Optimizations Applied</span>
        </div>
      </div>

      <div class="diff-grid mb-3">
        <div class="diff-pane">
          <h6>Before Optimization (Original TAC)</h6>
          <pre class="code-block"><code>${originalTAC.map((ins, i) => `<span class="line-num">${i + 1}</span>  ${escapeHtml(ins)}`).join("\n")}</code></pre>
        </div>
        <div class="diff-pane">
          <h6>After Optimization (Folded & Propagated)</h6>
          <pre class="code-block code-optimized"><code>${optimizedTAC.map((ins, i) => `<span class="line-num">${i + 1}</span>  ${escapeHtml(ins)}`).join("\n")}</code></pre>
        </div>
      </div>

      <h6>Applied Transformations:</h6>
      <div class="opt-transforms-wrapper">${transformListHtml}</div>
    `;
  }

  // --- ASSEMBLY ---
  static renderAssembly(container, codegenResult) {
    if (!container) return;
    const { instructions, formatted } = codegenResult;

    if (!instructions || instructions.length === 0) {
      container.innerHTML = `<div class="empty-state">No assembly generated.</div>`;
      return;
    }

    const rowsHtml = instructions.map(ins => {
      const isStartHalt = ins.opcode === "START" || ins.opcode === "HALT";
      const opcodeClass = isStartHalt ? "asm-ctrl" : "asm-op";
      return `
        <tr>
          <td><code>${String(ins.address).padStart(4, "0")}</code></td>
          <td><span class="${opcodeClass}">${escapeHtml(ins.opcode)}</span></td>
          <td><code>${escapeHtml(ins.operands)}</code></td>
          <td class="asm-comment">; ${escapeHtml(ins.comment)}</td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table asm-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Opcode</th>
              <th>Operands</th>
              <th>Instruction Meaning</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
