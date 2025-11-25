#!/usr/bin/env node

/**
 * Fix Responsive CSS Placement
 *
 * Fixes incorrectly placed responsive.css links that ended up inside <style> tags
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ALGORITHMS_DIR = path.join(REPO_ROOT, 'pen-plotter', 'algorithms');

function findHTMLFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Find any responsive.css link inside a <style> tag
  const badPattern = /(<style[^>]*>)\s*(<link[^>]*responsive\.css[^>]*>)/g;

  if (badPattern.test(content)) {
    // Extract the link tag
    content = original.replace(badPattern, (match, styleTag, linkTag) => {
      // Remove the link from inside style
      return styleTag;
    });

    // Find where to insert the link (before <style>)
    const linkMatch = original.match(/<link[^>]*responsive\.css[^>]*>/);
    if (linkMatch) {
      const linkTag = linkMatch[0];

      // Insert before first <style> tag
      content = content.replace(/<style/, `${linkTag}\n  <style`);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing responsive CSS placement...\n');

  const htmlFiles = findHTMLFiles(ALGORITHMS_DIR);
  let fixedCount = 0;

  htmlFiles.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
      const relativePath = path.relative(REPO_ROOT, filePath);
      console.log(`✓ Fixed: ${relativePath}`);
    }
  });

  if (fixedCount === 0) {
    console.log('✅ No files needed fixing!\n');
  } else {
    console.log(`\n✅ Fixed ${fixedCount} files\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
