#!/usr/bin/env node

/**
 * Fix Relative Paths Script
 *
 * Scans all algorithm HTML files and fixes relative paths to shared resources
 * (preset-manager.js, preset-manager.css) based on actual file depth.
 *
 * Usage: node scripts/fix-relative-paths.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ALGORITHMS_DIR = path.join(REPO_ROOT, 'pen-plotter', 'algorithms');

// Shared resources that need correct paths
const SHARED_RESOURCES = [
  'preset-manager.js',
  'preset-manager.css',
  'path-optimizer.js'
];

/**
 * Calculate correct relative path from file to repo root
 */
function getRelativePathToRoot(filePath) {
  const relativePath = path.relative(path.dirname(filePath), REPO_ROOT);
  return relativePath || '.';
}

/**
 * Count directory depth from algorithms dir
 */
function getDepth(filePath) {
  const rel = path.relative(ALGORITHMS_DIR, filePath);
  return rel.split(path.sep).length - 1;
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
 * Fix paths in a single HTML file
 */
function fixPathsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  const depth = getDepth(filePath);
  const correctPrefix = '../'.repeat(depth + 2); // +2 for pen-plotter/algorithms

  // Fix each shared resource
  SHARED_RESOURCES.forEach(resource => {
    // Match various path patterns
    const patterns = [
      new RegExp(`(src|href)=["'](\\.\\./)*(${resource})["']`, 'g'),
    ];

    patterns.forEach(pattern => {
      const newPath = `$1="${correctPrefix}${resource}"`;
      const originalContent = content;
      content = content.replace(pattern, newPath);

      if (content !== originalContent) {
        modified = true;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Validate a file's paths
 */
function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const depth = getDepth(filePath);
  const expectedPrefix = '../'.repeat(depth + 2);

  const issues = [];

  SHARED_RESOURCES.forEach(resource => {
    const regex = new RegExp(`(src|href)=["']((?:\\.\\./)*)(${resource})["']`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const actualPrefix = match[2];
      if (actualPrefix !== expectedPrefix) {
        issues.push({
          resource,
          expected: expectedPrefix + resource,
          actual: actualPrefix + resource,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
  });

  return issues;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for HTML files...\n');

  const htmlFiles = findHTMLFiles(ALGORITHMS_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  let fixedCount = 0;
  let issuesFound = 0;
  const filesWithIssues = [];

  // First, validate all files
  console.log('📋 Validating paths...\n');

  htmlFiles.forEach(filePath => {
    const issues = validateFile(filePath);
    if (issues.length > 0) {
      issuesFound += issues.length;
      filesWithIssues.push({ filePath, issues });
    }
  });

  if (issuesFound === 0) {
    console.log('✅ All paths are correct!\n');
    return;
  }

  console.log(`⚠️  Found ${issuesFound} path issues in ${filesWithIssues.length} files\n`);

  // Show first few issues
  filesWithIssues.slice(0, 5).forEach(({ filePath, issues }) => {
    const relativePath = path.relative(REPO_ROOT, filePath);
    console.log(`📄 ${relativePath}`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.resource}`);
      console.log(`   Expected: ${issue.expected}`);
      console.log(`   Actual:   ${issue.actual}`);
    });
    console.log('');
  });

  if (filesWithIssues.length > 5) {
    console.log(`   ... and ${filesWithIssues.length - 5} more files\n`);
  }

  // Ask for confirmation (in real use, you'd prompt here)
  console.log('🔧 Fixing paths...\n');

  htmlFiles.forEach(filePath => {
    if (fixPathsInFile(filePath)) {
      fixedCount++;
      const relativePath = path.relative(REPO_ROOT, filePath);
      console.log(`✓ Fixed: ${relativePath}`);
    }
  });

  console.log(`\n✅ Fixed ${fixedCount} files`);

  // Validate again
  console.log('\n🔍 Re-validating...\n');

  let remainingIssues = 0;
  htmlFiles.forEach(filePath => {
    const issues = validateFile(filePath);
    remainingIssues += issues.length;
  });

  if (remainingIssues === 0) {
    console.log('✅ All paths are now correct!\n');
  } else {
    console.log(`⚠️  ${remainingIssues} issues remaining (may need manual fixing)\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixPathsInFile, validateFile, findHTMLFiles };
