#!/usr/bin/env python3
"""
Batch apply Total Serialism design system to all algorithm HTML files.
Adds: meta tags, font imports, and design system CSS link.
"""

import os
import re
from pathlib import Path

ALGORITHMS_DIR = Path(__file__).parent / "algorithms"

# Design system additions
FONT_PRECONNECT = '''  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">'''

def get_css_path(html_file):
    """Calculate relative path to shared/algorithm.css"""
    rel = html_file.relative_to(ALGORITHMS_DIR)
    depth = len(rel.parts) - 1  # subtract filename
    prefix = "../" * depth
    return f"{prefix}../shared/algorithm.css"

def process_file(filepath):
    """Add design system to a single HTML file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changes = []

    # Skip if already has design system
    if 'algorithm.css' in content:
        return None

    # Add meta charset if missing
    if '<meta charset' not in content.lower():
        content = content.replace('<head>', '<head>\n  <meta charset="UTF-8">', 1)
        changes.append("Added meta charset")

    # Add viewport if missing
    if 'viewport' not in content.lower():
        # Insert after charset or at start of head
        if '<meta charset' in content.lower():
            content = re.sub(
                r'(<meta charset[^>]*>)',
                r'\1\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                content,
                count=1,
                flags=re.IGNORECASE
            )
        else:
            content = content.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">', 1)
        changes.append("Added viewport meta")

    # Add font preconnect if not present
    if 'fonts.googleapis.com' not in content:
        # Insert after viewport or charset
        if '<meta name="viewport"' in content:
            content = re.sub(
                r'(<meta name="viewport"[^>]*>)',
                r'\1\n' + FONT_PRECONNECT,
                content,
                count=1
            )
        else:
            content = content.replace('<head>', '<head>\n' + FONT_PRECONNECT, 1)
        changes.append("Added JetBrains Mono font")

    # Add design system CSS link
    css_path = get_css_path(filepath)
    css_link = f'\n  <!-- Total Serialism Design System -->\n  <link rel="stylesheet" href="{css_path}">'

    # Insert before </head> or before <style>
    if '<style>' in content:
        content = content.replace('<style>', css_link + '\n  <style>', 1)
    elif '</head>' in content:
        content = content.replace('</head>', css_link + '\n</head>', 1)
    changes.append(f"Added design system CSS ({css_path})")

    # Update title to include Total Serialism
    if '- Total Serialism' not in content:
        content = re.sub(
            r'<title>([^<]+)</title>',
            r'<title>\1 - Total Serialism</title>',
            content,
            count=1
        )
        changes.append("Updated title")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes

    return None

def main():
    processed = 0
    skipped = 0

    html_files = list(ALGORITHMS_DIR.rglob("*.html"))
    print(f"Found {len(html_files)} HTML files in algorithms/\n")

    for filepath in sorted(html_files):
        rel_path = filepath.relative_to(ALGORITHMS_DIR.parent)
        changes = process_file(filepath)

        if changes:
            print(f"✓ {rel_path}")
            for change in changes:
                print(f"    - {change}")
            processed += 1
        else:
            print(f"○ {rel_path} (already has design system)")
            skipped += 1

    print(f"\n{'='*50}")
    print(f"Processed: {processed} files")
    print(f"Skipped: {skipped} files")
    print(f"Total: {processed + skipped} files")

if __name__ == "__main__":
    main()
