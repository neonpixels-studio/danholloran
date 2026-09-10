#!/usr/bin/env bash
# Dependency vulnerability gate for CI.
# Runs `npm audit`, prints a severity summary, and fails the build when there is
# at least one high or critical *advisory* that is not on the accepted allowlist
# below. Moderate and low are reported but never fail the build.
# Dev dependencies are intentionally in scope: build/test tooling runs in CI
# and on developer machines, so its advisories matter here.
#
# Blocking is measured per distinct advisory (GHSA id), not per affected package.
# npm's package-level counts inflate a single root advisory into every package
# that pulls it in transitively. Counting advisories keeps the gate honest about
# how many real, un-remediated flaws exist.
#
# ALLOWLIST POLICY: only advisories with no upstream fix belong here, each with a
# justification and a trigger to remove it. This is NOT a way to silence fixable
# findings — prefer `npm update <pkg>` (or an `overrides` bump if the parent's
# declared range excludes the patched version) every time a fix is available.
#
# KNOWN LIMITATION: entries are keyed "<GHSA-id>@<node_modules path>", pairing
# every advisory on a package with every one of that package's install paths.
# A package with multiple advisories AND multiple install paths could produce
# a pair that doesn't actually apply (advisory X doesn't affect the version at
# path Y) — npm audit's JSON doesn't cleanly separate that on its own. Today
# every affected package here has exactly one install path, so this doesn't
# bite; re-verify if that ever changes.
set -euo pipefail

# High/critical advisories accepted because no patched version exists upstream.
# Keyed as "<GHSA-id>@<node_modules path>" (not just the id) so the exemption
# only covers the exact install location it was justified for — if the same
# advisory ID ever shows up at a different path (e.g. a top-level `vite` from
# vitest/@tailwindcss/vite resolving into the vulnerable range), it is NOT
# covered and correctly fails the gate. Remove an entry the moment its package
# ships a fix.
ALLOWLISTED_ADVISORIES=(
  # image-size <=2.0.2: crafted ICNS/JXL/HEIF inputs cause an infinite-loop DoS.
  # No patched version exists (latest published image-size is 2.0.2, and the
  # GHSA range is <=2.0.2). Used directly by
  # .vitepress/theme/utils/markdownImageHints.ts to read dimensions of the
  # blog's own committed post images at build time — never fed untrusted or
  # attacker-controlled bytes at runtime. Drop both ids once image-size
  # publishes a fix.
  "GHSA-w3rx-r6r6-pgpr@node_modules/image-size" # image-size: ICNS parser DoS
  "GHSA-5p2g-fcmc-qvqq@node_modules/image-size" # image-size: JXL/HEIF parser DoS
  # vite <=6.4.2, specifically vitepress's own bundled copy at
  # node_modules/vitepress/node_modules/vite (currently 5.4.21): `server.fs.deny`
  # bypass on Windows alternate paths. No fix available — vitepress pins its own
  # vite range. Windows-only dev-server bypass; this project's dev server never
  # runs on Windows or is exposed to untrusted clients (CI runs on
  # ubuntu-latest, deploys are static builds). Drop once vitepress bumps its
  # bundled vite past the vulnerable range. Any OTHER vite copy (e.g. the
  # top-level one used by vitest/@tailwindcss/vite) hitting this same GHSA id
  # is intentionally NOT covered by this entry.
  "GHSA-fx2h-pf6j-xcff@node_modules/vitepress/node_modules/vite" # vite: server.fs.deny bypass on Windows
)

report="$(npm audit --json || true)"

if ! printf '%s' "$report" | jq -e '.metadata.vulnerabilities' >/dev/null 2>&1; then
  echo "npm audit produced no vulnerability metadata (audit failed) — failing the build." >&2
  exit 1
fi

read_count() {
  local severity="$1"
  printf '%s' "$report" | jq -r --arg severity "$severity" \
    '.metadata.vulnerabilities[$severity] // 0'
}

critical="$(read_count critical)"
high="$(read_count high)"
moderate="$(read_count moderate)"
low="$(read_count low)"

{
  echo "## Dependency audit"
  echo ""
  echo "| Severity | Affected packages |"
  echo "| -------- | ----------------- |"
  echo "| Critical | ${critical} |"
  echo "| High     | ${high} |"
  echo "| Moderate | ${moderate} |"
  echo "| Low      | ${low} |"
} | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"

# Runs jq over the JSON string passed as $1; remaining args go to jq.
jq_on() {
  printf '%s' "$1" | jq "${@:2}"
}

# Build the allowlist as a JSON array — safe even when the array is emptied
# (removing every entry is the documented next step once fixes ship).
allow_json="$(jq -cn '$ARGS.positional' --args ${ALLOWLISTED_ADVISORIES[@]+"${ALLOWLISTED_ADVISORIES[@]}"})"

# Distinct high/critical "<advisory-id>@<node_modules path>" pairs in the
# report. The id is the GHSA id when the advisory carries one, otherwise a
# source-<n>:<pkg> fallback that stays unique so two url-less advisories never
# collapse. Pairing with the install path (not just the id) means an
# allowlist entry only exempts the exact location it was justified for.
# `(.via // [])` and `(.nodes // [...])` tolerate a vulnerability object
# missing either array instead of aborting under set -e.
all_ids="$(jq_on "$report" -c '
  [ .vulnerabilities[] as $vulnerability
    | ($vulnerability.via // [])[]
    | select(type == "object" and (.severity == "high" or .severity == "critical"))
    | ( (((.url // "") | capture("(?<id>GHSA-[-0-9a-z]+)").id)?)
        // ("source-" + ((.source // 0) | tostring) + ":" + (.name // .title // "unknown"))
      ) as $advisory_id
    | ($vulnerability.nodes // ["unknown-path"])[]
    | "\($advisory_id)@\(.)"
  ] | unique')"

# NOTE on staleness: there is no reliable per-advisory "patched upstream" signal
# in `npm audit --json` — `fixAvailable` is per-package, and its value covers
# breaking tree-surgery (e.g. downgrading a parent) as readily as a clean patch.
# So removal is manual: this gate re-runs `npm audit` every CI run, keeping the
# data fresh; when a maintainer next touches deps and sees one of the entries
# above ship a real fix, drop it and bump it via `overrides`. The warning below
# flags entries that have already fallen out of the report.
blocking_ids="$(jq_on "$all_ids" -c --argjson allow "$allow_json" 'map(select(IN($allow[]) | not))')"
blocking_count="$(jq_on "$blocking_ids" 'length')"

accepted_ids="$(jq_on "$all_ids" -c --argjson allow "$allow_json" 'map(select(IN($allow[])))')"
accepted_present="$(jq_on "$accepted_ids" 'length')"

# `::warning` is a GitHub Actions annotation — it surfaces on the job summary
# and PR Checks tab, not just this buried log line, so a shipped upstream fix
# doesn't sit unnoticed. Built without `mapfile` (bash 4+ only) so the script
# still runs under macOS's default bash 3.2.
stale_ids="$(jq_on "$all_ids" -r --argjson allow "$allow_json" '$allow - . | .[]')"
if [ -n "$stale_ids" ]; then
  stale_summary="${stale_ids//$'\n'/, }"
  echo "::warning title=Stale audit allowlist entries::${stale_summary}"
  {
    echo ""
    echo "Stale allowlist entries (no longer present in the audit — safe to remove from ALLOWLISTED_ADVISORIES):"
    echo "$stale_ids" | sed 's/^/- /'
  } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
fi

if [ "$accepted_present" -gt 0 ]; then
  {
    echo ""
    echo "Accepted (allowlisted, no upstream fix) high/critical advisories:"
    jq_on "$accepted_ids" -r '.[] | "- " + .'
  } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
fi

if [ "$blocking_count" -gt 0 ]; then
  {
    echo ""
    echo "Found ${blocking_count} un-allowlisted high/critical advisories — failing the build:"
    jq_on "$blocking_ids" -r '.[] | "- " + .'
  } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}" >&2
  exit 1
fi

echo "No un-allowlisted high or critical advisories found."
