#!/usr/bin/env node

/**
 * Add Responsive CSS Script
 *
 * Automatically adds responsive.css link to all algorithm HTML files
 * that don't already have it.
 *
 * Usage: node scripts/add-responsive-css.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ALGORITHMS_DIR = path.join(REPO_ROOT, 'pen-plotter', 'algorithms');

/**
 * Calculate correct relative path to responsive.css
 */
function getResponsiveCSSPath(filePath) {
  const depth = path.relative(ALGORITHMS_DIR, path.dirname(filePath)).split(path.sep).length;
  return '../'.repeat(depth + 1) + 'pen-plotter/shared/responsive.css';
}

/**
 * Find all HTML files recursively
 */
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

/**
 * Check if file already has responsive.css
 */
function hasResponsiveCSS(content) {
  return content.includes('responsive.css');
}

/**
 * Add responsive.css link to HTML file
 */
function addResponsiveCSS(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has responsive.css
  if (hasResponsiveCSS(content)) {
    return false;
  }

  const responsivePath = getResponsiveCSSPath(filePath);
  const linkTag = `  <link rel="stylesheet" href="${responsivePath}">`;

  // Try to add after the last <link> or <style> tag in <head>
  const headMatch = content.match(/<head>[\s\S]*?<\/head>/);

  if (!headMatch) {
    console.warn(`⚠️  No <head> found in ${path.relative(REPO_ROOT, filePath)}`);
    return false;
  }

  const head = headMatch[0];

  // Find the last stylesheet link or style tag
  const lastStyleMatch = [...head.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*>|<style[^>]*>/g)].pop();

  if (lastStyleMatch) {
    // Add after the last style-related tag
    const insertPos = headMatch.index + lastStyleMatch.index + lastStyleMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + linkTag + content.slice(insertPos);
  } else {
    // No existing styles, add before </head>
    content = content.replace('</head>', `${linkTag}\n</head>`);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for HTML files...\n');

  const htmlFiles = findHTMLFiles(ALGORITHMS_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  console.log('📱 Adding responsive CSS...\n');

  let addedCount = 0;
  let skippedCount = 0;

  htmlFiles.forEach(filePath => {
    const relativePath = path.relative(REPO_ROOT, filePath);

    if (addResponsiveCSS(filePath)) {
      addedCount++;
      console.log(`✓ Added: ${relativePath}`);
    } else {
      skippedCount++;
    }
  });

  console.log(`\n✅ Added responsive CSS to ${addedCount} files`);
  console.log(`⏭️  Skipped ${skippedCount} files (already have responsive.css)\n`);

  if (addedCount > 0) {
    console.log('📱 All algorithm pages are now mobile-responsive!');
    console.log('   Test on mobile by visiting any algorithm page.\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addResponsiveCSS, findHTMLFiles };
