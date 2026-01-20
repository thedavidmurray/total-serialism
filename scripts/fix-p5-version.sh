#!/bin/bash

###############################################################################
# fix-p5-version.sh - Downgrade p5.js from 1.7.0 to 1.6.0
#
# Purpose: Replace broken p5.js 1.7.0 CDN links with stable 1.6.0 version
#          across all HTML files in the algorithms directory
#
# Usage: ./scripts/fix-p5-version.sh
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ALGORITHMS_DIR="/Users/djm/claude-projects/pen-plotter-art/algorithms"
OLD_VERSION="1.7.0"
NEW_VERSION="1.6.0"
BACKUP_DIR="/Users/djm/claude-projects/pen-plotter-art/.backups/p5-version-fix-$(date +%Y%m%d-%H%M%S)"

# Counters
files_found=0
files_updated=0
files_skipped=0

###############################################################################
# Main execution
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}p5.js Version Fix Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Target directory: ${YELLOW}${ALGORITHMS_DIR}${NC}"
echo -e "Old version: ${RED}${OLD_VERSION}${NC}"
echo -e "New version: ${GREEN}${NEW_VERSION}${NC}"
echo ""

# Verify algorithms directory exists
if [ ! -d "$ALGORITHMS_DIR" ]; then
    echo -e "${RED}Error: Algorithms directory not found at ${ALGORITHMS_DIR}${NC}"
    exit 1
fi

# Create backup directory
echo -e "${BLUE}Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Backup directory: ${BACKUP_DIR}${NC}"
echo ""

# Find all HTML files in algorithms directory
echo -e "${BLUE}Scanning for HTML files...${NC}"
while IFS= read -r -d '' file; do
    ((files_found++))

    # Check if file contains the old version
    if grep -q "p5.js/${OLD_VERSION}" "$file"; then
        echo -e "${YELLOW}Processing: $(basename "$file")${NC}"

        # Create backup
        cp "$file" "$BACKUP_DIR/"

        # Replace version string
        sed -i '' "s|p5.js/${OLD_VERSION}|p5.js/${NEW_VERSION}|g" "$file"

        # Verify replacement
        if grep -q "p5.js/${NEW_VERSION}" "$file"; then
            echo -e "${GREEN}  ✓ Updated successfully${NC}"
            ((files_updated++))
        else
            echo -e "${RED}  ✗ Update failed${NC}"
        fi
    else
        echo -e "Skipping: $(basename "$file") (no old version found)"
        ((files_skipped++))
    fi
done < <(find "$ALGORITHMS_DIR" -type f -name "*.html" -print0)

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Files found:    ${YELLOW}${files_found}${NC}"
echo -e "Files updated:  ${GREEN}${files_updated}${NC}"
echo -e "Files skipped:  ${files_skipped}"
echo ""

if [ $files_updated -gt 0 ]; then
    echo -e "${GREEN}✓ Version fix completed successfully${NC}"
    echo -e "Backups saved to: ${BACKUP_DIR}"
    exit 0
else
    echo -e "${YELLOW}⚠ No files were updated${NC}"
    exit 0
fi
