#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'algorithm-catalog.json');
const penPlotterRoot = path.join(repoRoot, 'pen-plotter');
const includeMarker = 'algorithm-page-chrome.js';

function resolveAlgorithmFile(relativePath) {
  // Catalog paths are relative to the repo root; older entries were
  // relative to pen-plotter/, so fall back there for compatibility.
  const candidates = [
    path.join(repoRoot, relativePath),
    path.join(penPlotterRoot, relativePath),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function getIncludePath(filePath) {
  const chromeScript = path.join(penPlotterRoot, 'shared', 'algorithm-page-chrome.js');
  return path.relative(path.dirname(filePath), chromeScript).split(path.sep).join('/');
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let updatedCount = 0;

  catalog.algorithms.forEach((algo) => {
    const filePath = resolveAlgorithmFile(algo.path);
    if (!filePath) {
      return;
    }

    const includePath = getIncludePath(filePath);
    const includeTag = `  <script src="${includePath}"></script>\n`;
    const html = fs.readFileSync(filePath, 'utf8');

    if (html.includes(includeMarker)) {
      return;
    }

    const bodyCloseIndex = html.toLowerCase().lastIndexOf('</body>');
    if (bodyCloseIndex === -1) {
      return;
    }

    const nextHtml = `${html.slice(0, bodyCloseIndex)}${includeTag}${html.slice(bodyCloseIndex)}`;
    if (nextHtml !== html) {
      fs.writeFileSync(filePath, nextHtml);
      updatedCount += 1;
    }
  });

  console.log(`Attached algorithm page chrome to ${updatedCount} files.`);
}

main();
