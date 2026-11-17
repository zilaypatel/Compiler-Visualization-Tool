/**
 * Compiler Visualization Tool - Exporter & Clipboard Utilities
 */

export function copyToClipboard(text, triggerButton) {
  if (!navigator.clipboard) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showCopyToast(triggerButton, "Copied!");
    } catch (err) {
      showCopyToast(triggerButton, "Failed");
    }
    document.body.removeChild(textArea);
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showCopyToast(triggerButton, "Copied!");
  }).catch(() => {
    showCopyToast(triggerButton, "Failed to copy");
  });
}

function showCopyToast(button, msg) {
  if (!button) return;
  const originalText = button.innerHTML;
  button.innerHTML = `<span class="copy-success">${msg}</span>`;
  setTimeout(() => {
    button.innerHTML = originalText;
  }, 1800);
}

export function exportSvgAsSvg(svgElement, filename = "compiler-ast.svg") {
  if (!svgElement) return;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

export function exportSvgAsPng(svgElement, filename = "compiler-ast.png") {
  if (!svgElement) return;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const bbox = svgElement.getBoundingClientRect();
  const width = bbox.width || 800;
  const height = bbox.height || 600;

  const canvas = document.createElement("canvas");
  canvas.width = width * 2; // High-DPI 2x scaling
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // Fill white or theme background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const img = new Image();
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  img.src = url;
}
