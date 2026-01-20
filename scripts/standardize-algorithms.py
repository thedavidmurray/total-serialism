#!/usr/bin/env python3
"""
Standardize Total Serialism algorithms with common controls and layout.

This script:
1. Adds standard position controls (centerX, centerY, rotation, scale) to algorithms missing them
2. Sets autoRegenerate: true as default where applicable
3. Moves preset-container div to top of controls panel for better UX
4. Ensures consistent control panel structure
"""

import os
import re
from pathlib import Path
from typing import List, Tuple


ALGORITHMS_DIR = Path(__file__).parent.parent / "algorithms"


def find_html_files() -> List[Path]:
    """Find all HTML algorithm files."""
    html_files = []
    for root, _, files in os.walk(ALGORITHMS_DIR):
        # Skip tools directory
        if "tools" in root:
            continue
        for file in files:
            if file.endswith(".html") and not file.startswith("test-"):
                html_files.append(Path(root) / file)
    return html_files


def has_position_controls(content: str) -> bool:
    """Check if file already has position controls."""
    has_center_x = "centerX" in content or "center-x" in content
    has_center_y = "centerY" in content or "center-y" in content
    has_rotation = 'id="rotation"' in content or 'id="rotate"' in content
    has_scale = 'id="scale"' in content

    return has_center_x and has_center_y and (has_rotation or has_scale)


def has_preset_container(content: str) -> bool:
    """Check if file has a preset container."""
    return "preset-container" in content or "preset-btn" in content


def get_controls_section(content: str) -> Tuple[int, int]:
    """Find the controls div section."""
    # Find <div id="controls">
    controls_start = content.find('<div id="controls">')
    if controls_start == -1:
        return -1, -1

    # Find the first control-group after controls
    first_group = content.find('<div class="control-group">', controls_start)
    if first_group == -1:
        return -1, -1

    return controls_start, first_group


def add_position_controls(content: str) -> str:
    """Add standard position controls to the controls panel."""
    if has_position_controls(content):
        return content

    controls_start, first_group = get_controls_section(content)
    if controls_start == -1:
        print("  ⚠️  Could not find controls section")
        return content

    # Position controls template
    position_controls = '''
    <div class="control-group">
      <h3>Position & Transform</h3>
      <div class="control">
        <label>Center X: <span class="value" id="centerX-val">0</span></label>
        <input type="range" id="centerX" min="-200" max="200" value="0" step="1">
      </div>
      <div class="control">
        <label>Center Y: <span class="value" id="centerY-val">0</span></label>
        <input type="range" id="centerY" min="-200" max="200" value="0" step="1">
      </div>
      <div class="control">
        <label>Rotation: <span class="value" id="rotation-val">0</span>°</label>
        <input type="range" id="rotation" min="0" max="360" value="0" step="1">
      </div>
      <div class="control">
        <label>Scale: <span class="value" id="scale-val">1.0</span></label>
        <input type="range" id="scale" min="0.1" max="3" value="1.0" step="0.05">
      </div>
    </div>
    '''

    # Insert after the opening controls div and title
    insert_point = first_group
    new_content = content[:insert_point] + position_controls + "\n    " + content[insert_point:]

    print("  ✓ Added position controls")
    return new_content


def move_presets_to_top(content: str) -> str:
    """Move preset container to the top of the controls panel."""
    if not has_preset_container(content):
        return content

    # Find preset-container div
    preset_start = content.find('<div class="preset-container')
    if preset_start == -1:
        preset_start = content.find('<div id="preset-container')

    if preset_start == -1:
        return content

    # Find the end of preset container
    div_count = 1
    i = preset_start + 10
    while i < len(content) and div_count > 0:
        if content[i:i+4] == "<div":
            div_count += 1
        elif content[i:i+6] == "</div>":
            div_count -= 1
        i += 1

    preset_end = i
    preset_html = content[preset_start:preset_end]

    # Remove from current position
    content_without_preset = content[:preset_start] + content[preset_end:]

    # Find insertion point (after title, before first control-group)
    controls_start, _ = get_controls_section(content_without_preset)
    if controls_start == -1:
        return content

    # Find h2 title
    title_end = content_without_preset.find("</h2>", controls_start)
    if title_end == -1:
        return content

    insert_point = title_end + 5  # After </h2>

    # Insert preset container
    new_content = (
        content_without_preset[:insert_point] +
        "\n    " + preset_html + "\n    " +
        content_without_preset[insert_point:]
    )

    print("  ✓ Moved presets to top")
    return new_content


def enable_auto_regenerate(content: str) -> str:
    """Set autoRegenerate to true for interactive controls."""
    # Look for event listeners that call regenerate()
    if "addEventListener('input'" in content and "regenerate()" in content:
        # Check if autoRegenerate is already defined
        if "autoRegenerate" not in content:
            # Add autoRegenerate flag to params
            params_match = re.search(r"(let params = \{[^}]+)", content)
            if params_match:
                params_section = params_match.group(1)
                if "autoRegenerate" not in params_section:
                    # Add autoRegenerate: true to params object
                    new_params = params_section.rstrip() + ",\n      autoRegenerate: true"
                    content = content.replace(params_section, new_params)
                    print("  ✓ Enabled autoRegenerate")

    return content


def standardize_file(file_path: Path) -> bool:
    """Standardize a single algorithm file."""
    print(f"\n📄 Processing: {file_path.name}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply standardizations
        content = add_position_controls(content)
        content = move_presets_to_top(content)
        content = enable_auto_regenerate(content)

        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("  ✅ File updated")
            return True
        else:
            print("  ℹ️  No changes needed")
            return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    """Main standardization routine."""
    print("=" * 60)
    print("Total Serialism Algorithm Standardization")
    print("=" * 60)

    html_files = find_html_files()
    print(f"\nFound {len(html_files)} algorithm files\n")

    updated_count = 0
    skipped_count = 0

    for file_path in sorted(html_files):
        if standardize_file(file_path):
            updated_count += 1
        else:
            skipped_count += 1

    print("\n" + "=" * 60)
    print(f"✅ Standardization complete!")
    print(f"   Updated: {updated_count} files")
    print(f"   Skipped: {skipped_count} files")
    print("=" * 60)


if __name__ == "__main__":
    main()
