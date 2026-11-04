import {
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const POSTS_DIRECTORY = ".vitepress/content/posts";
const REPORT_PATH = "link-rot-report.md";
const CONCURRENCY = 5;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;
const RUN_DEADLINE_MS = 15 * 60_000;
const MAX_UNKNOWN_RATIO = 0.5;
const USER_AGENT = "danholloran-link-rot-check (+https://danholloran.me)";

export const STATUS = {
  OK: "ok",
  DEAD: "dead",
  UNKNOWN: "unknown",
  RETRY: "retry",
};

const DEAD_HTTP_STATUSES = new Set([404, 410]);
const BOT_BLOCK_STATUSES = new Set([401, 403, 999]);
const RATE_LIMIT_STATUS = 429;
const DEAD_ERROR_CODES = new Set(["ENOTFOUND"]);
const IGNORED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]);
const IGNORED_HOSTNAME_SUFFIXES = [".local", ".test", ".example"];
const IGNORED_DOMAINS = new Set(["example.com", "example.org", "example.net"]);

const FENCED_CODE_PATTERN =
  /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*$|(?![\s\S]))/gm;
const INLINE_CODE_PATTERN = /`[^`\n]*`/g;
const URL_PATTERN = /https?:\/\/[^\s<>"'`\]\\]+/g;
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?*_~]+$/;

function stripCode(markdown) {
  return markdown
    .replace(FENCED_CODE_PATTERN, "")
    .replace(INLINE_CODE_PATTERN, "");
}

function countCharacter(text, character) {
  return text.split(character).length - 1;
}

// A trailing ")" belongs to the URL only when the URL opened a matching "(",
// e.g. wikipedia links; otherwise it closes the surrounding markdown link.
function trimUrlTail(rawUrl) {
  let url = rawUrl;
  let previous;
  do {
    previous = url;
    url = url.replace(TRAILING_PUNCTUATION_PATTERN, "");
    const hasUnmatchedParen =
      url.endsWith(")") && countCharacter(url, ")") > countCharacter(url, "(");
    url = hasUnmatchedParen ? url.slice(0, -1) : url;
  } while (url !== previous);
  return url;
}

export function isCheckableUrl(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return !(
    IGNORED_HOSTNAMES.has(hostname) ||
    [...IGNORED_DOMAINS].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    ) ||
    IGNORED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  );
}

export function extractUrls(markdown) {
  const matches = stripCode(markdown).match(URL_PATTERN) ?? [];
  const urls = matches
    .map((match) => trimUrlTail(match.replaceAll("&amp;", "&")))
    .filter(isCheckableUrl);
  return [...new Set(urls)];
}

export function groupUrlsByPost(posts) {
  const pairs = posts.flatMap(({ slug, markdown }) =>
    extractUrls(markdown).map((url) => [url, slug]),
  );
  const urlToPosts = new Map();
  for (const [url, slug] of pairs) {
    urlToPosts.set(url, [...(urlToPosts.get(url) ?? []), slug]);
  }
  return urlToPosts;
}

function errorCode(error) {
  return error?.cause?.code ?? error?.code ?? null;
}

export function isDeadErrorOutcome(outcome) {
  return (
    Boolean(outcome.error) && DEAD_ERROR_CODES.has(errorCode(outcome.error))
  );
}

// outcome is either { status } for an HTTP response or { error } for a thrown
// fetch failure. RETRY means "inconclusive, try again"; it becomes UNKNOWN once
// attempts run out, so a flaky host is never reported as dead.
export function classifyOutcome(outcome) {
  if (outcome.error) {
    return STATUS.RETRY;
  }
  const { status } = outcome;
  if (status >= 200 && status < 400) {
    return STATUS.OK;
  }
  if (DEAD_HTTP_STATUSES.has(status)) {
    return STATUS.DEAD;
  }
  if (BOT_BLOCK_STATUSES.has(status)) {
    return STATUS.UNKNOWN;
  }
  if (status === RATE_LIMIT_STATUS || status >= 500) {
    return STATUS.RETRY;
  }
  return STATUS.UNKNOWN;
}

export async function fetchOutcome(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    await response.body?.cancel().catch(() => {});
    return { status: response.status };
  } catch (error) {
    return { error };
  }
}

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// A DNS failure is only reported dead when every attempt fails that way, so a
// single resolver blip never lists a live site.
export async function checkUrl(
  url,
  { fetchImpl = fetch, delay = sleep, maxAttempts = MAX_ATTEMPTS } = {},
) {
  let everyAttemptWasDnsFailure = true;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const outcome = await fetchOutcome(url, fetchImpl);
    const classification = classifyOutcome(outcome);
    if (classification !== STATUS.RETRY) {
      return classification;
    }
    everyAttemptWasDnsFailure &&= isDeadErrorOutcome(outcome);
    if (attempt < maxAttempts) {
      await delay(RETRY_DELAY_MS * attempt);
    }
  }
  return everyAttemptWasDnsFailure ? STATUS.DEAD : STATUS.UNKNOWN;
}

export async function checkAll(
  urls,
  check = checkUrl,
  concurrency = CONCURRENCY,
  deadline = Date.now() + RUN_DEADLINE_MS,
) {
  const results = new Map();
  const queue = [...urls];
  async function worker() {
    while (queue.length > 0 && Date.now() < deadline) {
      const url = queue.shift();
      results.set(url, await check(url));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  for (const url of queue) {
    results.set(url, STATUS.UNKNOWN);
  }
  return results;
}

export function findDeadLinksByPost(urlToPosts, results) {
  const pairs = [...urlToPosts]
    .filter(([url]) => results.get(url) === STATUS.DEAD)
    .flatMap(([url, slugs]) => slugs.map((slug) => [slug, url]));
  const deadByPost = new Map();
  for (const [slug, url] of pairs) {
    deadByPost.set(slug, [...(deadByPost.get(slug) ?? []), url]);
  }
  return deadByPost;
}

export function buildReport(deadByPost, { checkedCount, unknownCount }) {
  const sections = [...deadByPost.keys()].sort().map((slug) => {
    const lines = deadByPost.get(slug).map((url) => `- ${url}`);
    return `### ${slug}\n\n${lines.join("\n")}`;
  });
  const summary = `Checked ${checkedCount} unique outbound URLs. ${unknownCount} could not be verified (bot-blocked or flaky) and are not listed.`;
  return `${summary}\n\n${sections.join("\n\n")}\n`;
}

function readPosts(directory = POSTS_DIRECTORY) {
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      slug: fileName.replace(/\.md$/, ""),
      markdown: readFileSync(join(directory, fileName), "utf8"),
    }));
}

function countByStatus(results, status) {
  return [...results.values()].filter((value) => value === status).length;
}

export function isMostlyUnverifiable(results) {
  const unknownCount = countByStatus(results, STATUS.UNKNOWN);
  return results.size > 0 && unknownCount / results.size > MAX_UNKNOWN_RATIO;
}

export async function main() {
  const urlToPosts = groupUrlsByPost(readPosts());
  const results = await checkAll([...urlToPosts.keys()]);
  const deadByPost = findDeadLinksByPost(urlToPosts, results);
  const report = buildReport(deadByPost, {
    checkedCount: results.size,
    unknownCount: countByStatus(results, STATUS.UNKNOWN),
  });
  writeFileSync(REPORT_PATH, report);
  console.log(report);
  // Most links unverifiable means the runner (not the posts) is the problem;
  // fail so the workflow leaves the tracking issue untouched.
  if (isMostlyUnverifiable(results)) {
    console.error(
      "Most URLs could not be verified; treating the run as failed.",
    );
    process.exitCode = 1;
  }
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (isEntrypoint) {
  await main();
}
