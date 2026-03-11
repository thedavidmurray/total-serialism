#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'algorithm-catalog.json');
const penPlotterRoot = path.join(repoRoot, 'pen-plotter');
const includeMarker = 'algorithm-page-chrome.js';

function getIncludePath(relativeAlgorithmPath) {
  if (relativeAlgorithmPath.startsWith('tools/')) {
    return '../shared/algorithm-page-chrome.js';
  }
  return '../../shared/algorithm-page-chrome.js';
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let updatedCount = 0;

  catalog.algorithms.forEach((algo) => {
    const filePath = path.join(penPlotterRoot, algo.path);
    if (!fs.existsSync(filePath)) {
      return;
    }

    const includePath = getIncludePath(algo.path);
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
