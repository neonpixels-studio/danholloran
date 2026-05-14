#!/bin/bash
# Exit 0 = skip build, exit 1 = proceed with build.
# Skips the build only when every changed file is a .md with "draft: true" in its frontmatter.

changed_files=$(git diff --name-only HEAD^ HEAD 2>/dev/null)

if [ -z "$changed_files" ]; then
  echo "No changed files detected, skipping build."
  exit 0
fi

while IFS= read -r file; do
  if [[ "$file" != *.md ]]; then
    echo "Non-markdown file changed: $file — proceeding with build."
    exit 1
  fi

  if [ ! -f "$file" ]; then
    echo "Markdown file deleted: $file — proceeding with build."
    exit 1
  fi

  if ! grep -qE "^draft:\s*true\s*$" "$file"; then
    echo "Non-draft markdown file changed: $file — proceeding with build."
    exit 1
  fi
done <<< "$changed_files"

echo "Only draft markdown files changed — skipping build."
exit 0
