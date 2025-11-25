#!/usr/bin/env node

/**
 * Add Back Navigation to All Algorithm Pages
 *
 * This script adds a "Back to Browser" link to all algorithm HTML pages.
 * Run with: node scripts/add-back-navigation.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ALGORITHMS_DIR = path.join(REPO_ROOT, 'pen-plotter', 'algorithms');
const ROOT_DIR = REPO_ROOT;

// Back link HTML - calculate relative path based on depth
function getBackLink(depth) {
  const relativePath = depth === 0 ? 'index.html' : '../'.repeat(depth) + 'index.html';
  return `
  <a href="${relativePath}" class="back-link"
     style="position: fixed; top: 15px; left: 15px; z-index: 1000;
            color: #4CAF50; text-decoration: none; font-size: 14px;
            background: rgba(0,0,0,0.8); padding: 8px 15px; border-radius: 20px;
            transition: all 0.2s ease; border: 1px solid #4CAF50;"
     onmouseover="this.style.background='rgba(76,175,80,0.3)'"
     onmouseout="this.style.background='rgba(0,0,0,0.8)'">
    ← Back to Browser
  </a>`;
}

function findHTMLFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        // Skip index.html and browse.html
        if (entry.name !== 'index.html' && entry.name !== 'browse.html') {
          files.push(fullPath);
        }
      }
    }
  }

  scan(dir);
  return files;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already has back-link
    if (content.includes('class="back-link"')) {
      return { skipped: true, reason: 'already has back link' };
    }

    // Calculate depth - from repo root
    const relativePath = path.relative(REPO_ROOT, filePath);
    const depth = relativePath.split(path.sep).length - 1;

    // Find <body> tag and add back link after it
    const bodyMatch = content.match(/<body[^>]*>/i);
    if (!bodyMatch) {
      return { skipped: true, reason: 'no <body> tag found' };
    }

    const backLink = getBackLink(depth);
    const newContent = content.replace(
      bodyMatch[0],
      bodyMatch[0] + backLink
    );

    fs.writeFileSync(filePath, newContent, 'utf-8');
    return { modified: true };

  } catch (error) {
    return { error: error.message };
  }
}

function main() {
  console.log('🔧 Adding Back Navigation to Algorithm Pages\n');
  console.log('='.repeat(60));

  const htmlFiles = findHTMLFiles(ALGORITHMS_DIR);
  console.log(`\nFound ${htmlFiles.length} HTML files\n`);

  let modified = 0;
  let skipped = 0;
  let errors = 0;

  htmlFiles.forEach(filePath => {
    const relativePath = path.relative(REPO_ROOT, filePath);
    const result = processFile(filePath);

    if (result.modified) {
      console.log(`  ✅ Added: ${relativePath}`);
      modified++;
    } else if (result.skipped) {
      console.log(`  ⏭  Skipped: ${relativePath} (${result.reason})`);
      skipped++;
    } else if (result.error) {
      console.log(`  ❌ Error: ${relativePath} - ${result.error}`);
      errors++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Summary:`);
  console.log(`   Modified: ${modified}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}\n`);

  if (modified > 0) {
    console.log('To verify, check any algorithm page for the back link.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findHTMLFiles };
