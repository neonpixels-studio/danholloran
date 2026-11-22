import {
  appendFileSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePublishTime } from "../.vitepress/theme/utils/publishSchedule.ts";

const NETLIFY_API_BASE_URL = "https://api.netlify.com/api/v1";
const REQUEST_TIMEOUT_MS = 30_000;
const DEPLOYS_PAGE_SIZE = 20;
const READY_STATE = "ready";
const PRODUCTION_CONTEXT = "production";
const AUTH_FAILURE_STATUSES = new Set([401, 403]);
const POSTS_DIRECTORY = ".vitepress/content/posts";
const MARKDOWN_EXTENSION = ".md";

// This runs on a bare runner with no npm install, so it can't use the site's
// YAML parser. Like netlify-ignore.sh it reads only the leading frontmatter
// block and the top-level `draft:`/`date:` lines, which is all the publish rule
// needs; a value it can't read leaves the post undated, so it never comes due.
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---/;
const DRAFT_LINE_PATTERN = /^draft:[ \t]*true[ \t]*$/m;
const DATE_LINE_PATTERN = /^date:[ \t]*(?:"([^"]*)"|'([^']*)'|(.*?))[ \t]*$/m;

export class LastDeployLookupError extends Error {}

// Netlify lists deploys newest first and includes failed and preview deploys, so
// the last successful production deploy is the first ready production entry.
// Returns its commit and when it was created (just before it built, so any post
// dated after that was hidden by it), or null when there is none.
export function findLastDeploy(deploys) {
  const lastReady = deploys.find(
    (deploy) =>
      deploy.state === READY_STATE &&
      deploy.context === PRODUCTION_CONTEXT &&
      deploy.commit_ref,
  );
  if (!lastReady) {
    return null;
  }
  return { sha: lastReady.commit_ref, createdAt: lastReady.created_at };
}

export async function fetchLastDeploy({ siteId, token, fetchImpl = fetch }) {
  const query = `production=true&per_page=${DEPLOYS_PAGE_SIZE}`;
  const response = await fetchImpl(
    `${NETLIFY_API_BASE_URL}/sites/${encodeURIComponent(siteId)}/deploys?${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  if (AUTH_FAILURE_STATUSES.has(response.status)) {
    throw new LastDeployLookupError(
      `Netlify API rejected NETLIFY_AUTH_TOKEN (HTTP ${response.status}).`,
    );
  }
  if (!response.ok) {
    throw new LastDeployLookupError(
      `Netlify API responded with HTTP ${response.status}.`,
    );
  }
  return findLastDeploy(await response.json());
}

function readPublishTime(markdown) {
  const frontmatter = FRONTMATTER_PATTERN.exec(markdown)?.[1];
  if (!frontmatter || DRAFT_LINE_PATTERN.test(frontmatter)) {
    return null;
  }
  const dateMatch = DATE_LINE_PATTERN.exec(frontmatter);
  const date = dateMatch && (dateMatch[1] ?? dateMatch[2] ?? dateMatch[3]);
  return resolvePublishTime(date);
}

// Non-draft posts whose publish time falls after `since` and at or before
// `now`: posts the last deploy hid as scheduled that are now due to go live.
export function findPostsDueSince({
  since,
  now,
  postsDirectory = POSTS_DIRECTORY,
}) {
  return readdirSync(postsDirectory)
    .filter((file) => file.endsWith(MARKDOWN_EXTENSION))
    .filter((file) => {
      const publishTime = readPublishTime(
        readFileSync(join(postsDirectory, file), "utf8"),
      );
      return publishTime !== null && publishTime > since && publishTime <= now;
    });
}

// Main is unchanged since the last deploy, so only a scheduled post coming due
// can make a new build differ. Anything it can't determine deploys.
function decideForUnchangedMain({ lastDeploy, now, postsDirectory, log }) {
  const since = Date.parse(lastDeploy.createdAt);
  if (Number.isNaN(since)) {
    log(
      `main (${lastDeploy.sha}) is live but its deploy time "${lastDeploy.createdAt}" is unreadable; deploying in case a scheduled post is due.`,
    );
    return { deploy: true };
  }
  let duePosts;
  try {
    duePosts = findPostsDueSince({ since, now, postsDirectory });
  } catch (error) {
    log(`Could not check for scheduled posts (${error.message}); deploying.`);
    return { deploy: true };
  }
  if (duePosts.length > 0) {
    log(
      `main (${lastDeploy.sha}) is live, but scheduled posts came due since its deploy at ${lastDeploy.createdAt}: ${duePosts.join(", ")}; deploying.`,
    );
    return { deploy: true };
  }
  log(
    `main (${lastDeploy.sha}) is already live and no scheduled post is due; skipping the deploy.`,
  );
  return { deploy: false };
}

// Returns whether to deploy and why. Every uncertain case deploys: a redundant
// deploy is cheap, a silently skipped one leaves a commit unshipped.
export async function decideDeploy({
  siteId,
  token,
  currentSha,
  fetchImpl = fetch,
  log = console.log,
  now = Date.now(),
  postsDirectory = POSTS_DIRECTORY,
}) {
  if (!siteId || !token) {
    log(
      "NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN is not set; cannot find the last deployed commit, so deploying.",
    );
    return { deploy: true };
  }
  let lastDeploy;
  try {
    lastDeploy = await fetchLastDeploy({ siteId, token, fetchImpl });
  } catch (error) {
    log(`Could not read the last deploy (${error.message}); deploying.`);
    return { deploy: true };
  }
  if (!lastDeploy) {
    log("No successful production deploy found; deploying.");
    return { deploy: true };
  }
  if (lastDeploy.sha === currentSha) {
    return decideForUnchangedMain({ lastDeploy, now, postsDirectory, log });
  }
  log(`Last deployed ${lastDeploy.sha}, main is ${currentSha}; deploying.`);
  return { deploy: true };
}

export async function main(environment = process.env) {
  const { deploy } = await decideDeploy({
    siteId: environment.NETLIFY_SITE_ID,
    token: environment.NETLIFY_AUTH_TOKEN,
    currentSha: environment.CURRENT_SHA,
  });
  if (environment.GITHUB_OUTPUT) {
    appendFileSync(environment.GITHUB_OUTPUT, `skip=${!deploy}\n`);
  }
}

// Same shape as scripts/verify-netlify-deploy.mjs: import.meta.url is bound to the
// defining module, so the helper cannot be shared.
export function isMainModule(argv1 = process.argv[1]) {
  if (argv1 == null) {
    return false;
  }
  let resolvedPath;
  try {
    resolvedPath = realpathSync(argv1);
  } catch {
    resolvedPath = argv1;
  }
  return import.meta.url === pathToFileURL(resolvedPath).href;
}

if (isMainModule()) {
  await main();
}
