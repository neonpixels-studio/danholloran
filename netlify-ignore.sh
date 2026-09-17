#!/bin/bash
# Exit 0 = skip build, exit 1 = proceed with build.
# Skips the build only when the diff was computed successfully AND every
# changed file is a .md with "draft: true" in its YAML frontmatter. Any
# failure or ambiguity in computing the diff (shallow clone, first commit,
# squash, etc.) fails safe and builds — we'd rather build unnecessarily than
# silently skip a real deploy.

diff_stdout_file=$(mktemp) || {
  echo "Could not create a temp file to capture git's stdout — proceeding with build."
  exit 1
}
diff_stderr_file=$(mktemp) || {
  echo "Could not create a temp file to capture git's stderr — proceeding with build."
  exit 1
}
trap 'rm -f "$diff_stdout_file" "$diff_stderr_file"' EXIT

# -z NUL-delimits the output instead of one-per-line, which also stops git
# from quoting/octal-escaping paths it otherwise would (non-ASCII bytes,
# embedded quotes/backslashes, control characters). Without it, e.g. an
# accented filename comes back as "posts/caf\303\251.md" (with a literal
# trailing quote) and fails the *.md glob check below even though the real
# file does end in .md. The NUL-delimited output is written straight to a
# file rather than captured into a shell variable, since bash command
# substitution silently truncates at the first NUL byte.
git diff -z --name-only HEAD^ HEAD >"$diff_stdout_file" 2>"$diff_stderr_file"
diff_exit_code=$?
diff_stderr=$(cat "$diff_stderr_file")

if [ "$diff_exit_code" -ne 0 ]; then
  echo "Could not compute diff (git diff exited $diff_exit_code: $diff_stderr) — proceeding with build."
  exit 1
fi

if [ ! -s "$diff_stdout_file" ]; then
  echo "Diff computed successfully but no changed files were reported — proceeding with build."
  exit 1
fi

while IFS= read -r -d '' file; do
  if [[ "$file" != *.md ]]; then
    echo "Non-markdown file changed: $file — proceeding with build."
    exit 1
  fi

  if [ ! -f "$file" ]; then
    echo "Markdown file deleted: $file — proceeding with build."
    exit 1
  fi

  # Only the leading YAML frontmatter block (between the first pair of "---"
  # delimiters) counts — a "draft: true" line appearing in the post body
  # (e.g. a code sample) must never be mistaken for the post's own status.
  frontmatter=$(awk 'NR == 1 && $0 != "---" { exit } NR == 1 { next } $0 == "---" { exit } { print }' "$file")

  if ! printf '%s\n' "$frontmatter" | grep -qE '^draft:[[:space:]]*true[[:space:]]*$'; then
    echo "Non-draft markdown file changed: $file — proceeding with build."
    exit 1
  fi
done < "$diff_stdout_file"

echo "Only draft markdown files changed — skipping build."
exit 0
