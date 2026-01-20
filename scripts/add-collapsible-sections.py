#!/usr/bin/env python3
"""
Integration script to add collapsible sections to all algorithm HTML files.

This script:
1. Finds all HTML files in the algorithms/ directory
2. Adds the collapsible-sections.js script tag if not present
3. Adds initialization code after DOMContentLoaded
4. Preserves existing functionality
"""

import os
import re
from pathlib import Path


def find_algorithm_html_files(base_path):
    """Find all HTML files in the algorithms directory."""
    algorithms_path = Path(base_path) / "algorithms"
    html_files = []

    for root, _, files in os.walk(algorithms_path):
        for file in files:
            if file.endswith('.html') and not file.startswith('.'):
                html_files.append(Path(root) / file)

    return sorted(html_files)


def get_relative_path_to_collapsible_sections(html_file_path, base_path):
    """Calculate the relative path from the HTML file to collapsible-sections.js."""
    # Get relative path from html file to base directory
    html_file = Path(html_file_path)
    base = Path(base_path)

    # Count directory depth
    relative_parts = html_file.relative_to(base).parts[:-1]  # Exclude filename
    depth = len(relative_parts)

    # Build relative path
    return "../" * depth + "collapsible-sections.js"


def extract_algorithm_name(html_file_path):
    """Extract algorithm name from file path for storage key."""
    file_name = Path(html_file_path).stem
    # Convert filename to kebab-case if not already
    name = file_name.replace('_', '-').replace(' ', '-').lower()
    # Remove -gui suffix if present
    name = re.sub(r'-gui$', '', name)
    return name


def has_collapsible_sections_script(content, script_path):
    """Check if the collapsible-sections.js script is already included."""
    # Check for various forms of the script tag
    patterns = [
        r'<script[^>]*src=["\'].*collapsible-sections\.js["\']',
        r'<script[^>]*src=["\']' + re.escape(script_path) + r'["\']'
    ]

    for pattern in patterns:
        if re.search(pattern, content):
            return True

    return False


def has_initialization_code(content):
    """Check if CollapsibleSections initialization code is already present."""
    return 'new CollapsibleSections' in content or 'CollapsibleSections(' in content


def add_collapsible_sections(html_file_path, base_path, dry_run=False):
    """Add collapsible sections to an HTML file."""
    with open(html_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Calculate relative path to collapsible-sections.js
    script_path = get_relative_path_to_collapsible_sections(html_file_path, base_path)

    # Check if already integrated
    has_script = has_collapsible_sections_script(content, script_path)
    has_init = has_initialization_code(content)

    if has_script and has_init:
        return 'already_integrated', None

    modified = False
    new_content = content

    # Add script tag if not present
    if not has_script:
        # Find the last script tag in the head or before </head>
        script_tag = f'  <script src="{script_path}"></script>\n'

        # Try to insert before </head>
        if '</head>' in new_content:
            new_content = new_content.replace('</head>', f'{script_tag}</head>', 1)
            modified = True
        # Otherwise try to insert before first <script> in body
        elif '<script>' in new_content or '<script ' in new_content:
            # Find first script tag
            match = re.search(r'(<script[^>]*>)', new_content)
            if match:
                insert_pos = match.start()
                new_content = new_content[:insert_pos] + script_tag + new_content[insert_pos:]
                modified = True

    # Add initialization code if not present
    if not has_init:
        algorithm_name = extract_algorithm_name(html_file_path)
        storage_key = f'{algorithm_name}-sections'

        init_code = f'''
  <script>
    // Initialize collapsible sections
    document.addEventListener('DOMContentLoaded', function() {{
      const sections = new CollapsibleSections({{
        container: '#controls',
        storageKey: '{storage_key}',
        defaultState: 'expanded'
      }});
      sections.convertFlatStructure();
      sections.addGlobalControls({{ position: 'top' }});
    }});
  </script>
'''

        # Find the best place to insert initialization code
        # Option 1: Before closing </body> tag
        if '</body>' in new_content:
            new_content = new_content.replace('</body>', f'{init_code}</body>', 1)
            modified = True
        # Option 2: After the last </script> tag
        elif '</script>' in new_content:
            last_script_pos = new_content.rfind('</script>')
            insert_pos = last_script_pos + len('</script>')
            new_content = new_content[:insert_pos] + '\n' + init_code + new_content[insert_pos:]
            modified = True

    if not modified:
        return 'no_changes', None

    # Write back to file if not dry run
    if not dry_run:
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return 'success', new_content
    else:
        return 'would_modify', new_content


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Add collapsible sections to algorithm HTML files'
    )
    parser.add_argument(
        '--base-path',
        default='/Users/djm/claude-projects/pen-plotter-art',
        help='Base path to the pen-plotter-art directory'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output'
    )
    parser.add_argument(
        '--file',
        help='Process only a specific file'
    )

    args = parser.parse_args()

    base_path = args.base_path

    # Get list of files to process
    if args.file:
        html_files = [Path(args.file)]
    else:
        html_files = find_algorithm_html_files(base_path)

    print(f"Found {len(html_files)} HTML files to process")
    if args.dry_run:
        print("DRY RUN MODE - No files will be modified\n")

    # Statistics
    stats = {
        'success': 0,
        'already_integrated': 0,
        'no_changes': 0,
        'would_modify': 0,
        'error': 0
    }

    # Process each file
    for html_file in html_files:
        relative_path = html_file.relative_to(base_path)

        try:
            status, _ = add_collapsible_sections(html_file, base_path, dry_run=args.dry_run)
            stats[status] += 1

            if args.verbose or status in ['success', 'would_modify']:
                status_symbol = {
                    'success': '✓',
                    'already_integrated': '⊚',
                    'no_changes': '○',
                    'would_modify': '→',
                    'error': '✗'
                }
                print(f"{status_symbol.get(status, '?')} {relative_path}")

        except Exception as e:
            stats['error'] += 1
            print(f"✗ {relative_path}: {str(e)}")

    # Print summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Total files processed: {len(html_files)}")
    print(f"Successfully modified: {stats['success']}")
    print(f"Already integrated: {stats['already_integrated']}")
    print(f"No changes needed: {stats['no_changes']}")
    if args.dry_run:
        print(f"Would modify: {stats['would_modify']}")
    print(f"Errors: {stats['error']}")
    print(f"{'='*60}")

    if args.dry_run and stats['would_modify'] > 0:
        print("\nRun without --dry-run to apply changes")


if __name__ == '__main__':
    main()
