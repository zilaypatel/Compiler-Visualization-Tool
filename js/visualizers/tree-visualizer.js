/**
 * Compiler Visualization Tool - D3.js AST Visualizer
 * Renders an interactive, zoomable, pannable, and collapsible Abstract Syntax Tree.
 */

export class ASTVisualizer {
  constructor(svgSelector, tooltipSelector) {
    this.svg = d3.select(svgSelector);
    this.tooltip = d3.select(tooltipSelector);
    this.container = this.svg.append("g").attr("class", "tree-container");
    this.zoomBehavior = null;
    this.rootNode = null;
    this.initZoom();
  }

  initZoom() {
    this.zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        this.container.attr("transform", event.transform);
      });

    this.svg.call(this.zoomBehavior);
  }

  resetZoom() {
    if (!this.svg || !this.zoomBehavior) return;
    const svgElement = this.svg.node();
    const width = svgElement.clientWidth || 800;
    this.svg.transition().duration(500).call(
      this.zoomBehavior.transform,
      d3.zoomIdentity.translate(width / 2, 60).scale(1)
    );
  }

  zoomIn() {
    this.svg.transition().duration(300).call(this.zoomBehavior.scaleBy, 1.25);
  }

  zoomOut() {
    this.svg.transition().duration(300).call(this.zoomBehavior.scaleBy, 0.8);
  }

  render(hierarchyData) {
    this.container.selectAll("*").remove();
    if (!hierarchyData) return;

    const svgElement = this.svg.node();
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 500;

    this.rootNode = d3.hierarchy(hierarchyData, d => d.children);
    this.rootNode.x0 = width / 2;
    this.rootNode.y0 = 0;

    // Define tree layout: depth distance y, sibling distance x
    const treeLayout = d3.tree().nodeSize([85, 75]);
    this.update(this.rootNode, treeLayout);

    // Initial positioning: center root horizontally near top
    this.svg.call(
      this.zoomBehavior.transform,
      d3.zoomIdentity.translate(width / 2, 50).scale(0.95)
    );
  }

  update(source, treeLayout) {
    const treeData = treeLayout(this.rootNode);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Node category colors
    const getNodeColor = (d) => {
      const badge = d.data.badge;
      switch (badge) {
        case "Root": return "#6366f1"; // Indigo
        case "VarDecl": return "#0ea5e9"; // Sky
        case "Assign": return "#06b6d4"; // Cyan
        case "Stmt": return "#8b5cf6"; // Purple
        case "BinaryOp": return "#f59e0b"; // Amber
        case "UnaryOp": return "#f97316"; // Orange
        case "Literal": return "#10b981"; // Emerald green
        case "Identifier": return "#3b82f6"; // Blue
        default: return "#64748b"; // Slate
      }
    };

    // --- LINKS ---
    const link = this.container.selectAll("path.tree-link")
      .data(links, d => d.target.id || (d.target.id = Math.random()));

    link.enter()
      .append("path")
      .attr("class", "tree-link")
      .attr("fill", "none")
      .attr("stroke", "var(--border-color, #cbd5e1)")
      .attr("stroke-width", 2)
      .attr("d", d => {
        return `M${d.source.x},${d.source.y}
                C${d.source.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${d.target.y}`;
      });

    // --- NODES ---
    const node = this.container.selectAll("g.tree-node")
      .data(nodes, d => d.id || (d.id = Math.random()));

    const nodeEnter = node.enter()
      .append("g")
      .attr("class", "tree-node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", d => (d._children || d.children ? "pointer" : "default"))
      .on("click", (event, d) => {
        // Toggle children on click
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else if (d._children) {
          d.children = d._children;
          d._children = null;
        }
        this.update(d, treeLayout);
      })
      .on("mouseenter", (event, d) => {
        this.tooltip
          .style("opacity", 1)
          .html(`
            <div class="tooltip-badge" style="background:${getNodeColor(d)}">${d.data.badge || 'AST Node'}</div>
            <div class="tooltip-title">${d.data.name}</div>
            <div class="tooltip-detail">${d.data.details || ''}</div>
          `);
      })
      .on("mousemove", (event) => {
        const [x, y] = d3.pointer(event, document.body);
        this.tooltip
          .style("left", `${x + 15}px`)
          .style("top", `${y - 15}px`);
      })
      .on("mouseleave", () => {
        this.tooltip.style("opacity", 0);
      });

    // Node outer pill / circle
    nodeEnter.append("circle")
      .attr("r", 20)
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2.5)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))");

    // Collapsed child indicator dot
    nodeEnter.append("circle")
      .attr("class", "collapse-dot")
      .attr("r", 4)
      .attr("cy", 22)
      .attr("fill", "#ef4444")
      .style("display", d => (d._children ? "block" : "none"));

    // Node label
    nodeEnter.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(d => {
        const name = String(d.data.name);
        return name.length > 7 ? name.substring(0, 6) + "…" : name;
      });

    // Secondary sub-label below node
    nodeEnter.append("text")
      .attr("dy", "32px")
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-secondary, #64748b)")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .text(d => d.data.badge || "");
  }
}
