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
# findings — prefer an npm `overrides` bump every time one is available (see the
# `nanoid` override in package.json, added instead of allowlisting).
set -euo pipefail

# High/critical advisories accepted because no patched version exists upstream.
# Remove an entry the moment its package ships a fix and bump via `overrides`.
ALLOWLISTED_ADVISORIES=(
  # image-size <=2.0.2: crafted ICNS/JXL/HEIF inputs cause an infinite-loop DoS.
  # No patched version exists (latest published image-size is 2.0.2, and the
  # GHSA range is <=2.0.2). Used directly by
  # .vitepress/theme/utils/markdownImageHints.ts to read dimensions of the
  # blog's own committed post images at build time — never fed untrusted or
  # attacker-controlled bytes at runtime. Drop both ids once image-size
  # publishes a fix.
  "GHSA-w3rx-r6r6-pgpr" # image-size: ICNS parser DoS
  "GHSA-5p2g-fcmc-qvqq" # image-size: JXL/HEIF parser DoS
  # vite <=6.4.2 (vitepress's bundled copy at
  # node_modules/vitepress/node_modules/vite, currently 5.4.21): `server.fs.deny`
  # bypass on Windows alternate paths. No fix available — vitepress pins its own
  # vite range. Windows-only dev-server bypass; this project's dev server never
  # runs on Windows or is exposed to untrusted clients (CI runs on
  # ubuntu-latest, deploys are static builds). Drop once vitepress bumps its
  # bundled vite past the vulnerable range.
  "GHSA-fx2h-pf6j-xcff" # vite: server.fs.deny bypass on Windows
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

# Reads a JSON string on stdin through jq so each id pipeline is a single call.
jq_on() {
  printf '%s' "$1" | jq "${@:2}"
}

# Build the allowlist as a JSON array — safe even when the array is emptied
# (removing every entry is the documented next step once fixes ship).
allow_json="$(jq -cn '$ARGS.positional' --args ${ALLOWLISTED_ADVISORIES[@]+"${ALLOWLISTED_ADVISORIES[@]}"})"

# Distinct high/critical advisory ids in the report: the GHSA id when the
# advisory carries one, otherwise a source-<n>:<pkg> fallback that stays unique
# so two url-less advisories never collapse. `(.via // [])` tolerates a
# vulnerability object without a `via` array instead of aborting under set -e.
all_ids="$(jq_on "$report" -c '
  [ .vulnerabilities[]
    | (.via // [])[]
    | select(type == "object" and (.severity == "high" or .severity == "critical"))
    | (((.url // "") | capture("(?<id>GHSA-[-0-9a-z]+)").id)? )
      // ("source-" + ((.source // 0) | tostring) + ":" + (.name // .title // "unknown"))
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

stale_ids="$(jq_on "$all_ids" -r --argjson allow "$allow_json" '$allow - . | .[]')"
if [ -n "$stale_ids" ]; then
  echo "Allowlist entries no longer present in the audit — safe to remove from ALLOWLISTED_ADVISORIES:" >&2
  printf '%s\n' "$stale_ids" >&2
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
