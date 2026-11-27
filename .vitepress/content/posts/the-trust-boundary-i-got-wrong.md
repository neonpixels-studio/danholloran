---
date: "2026-12-29T09:00:00.000-08:00"
tags: ["ai", "agents", "security", "prompt-injection"]
draft: false
title: "The Trust Boundary I Got Wrong"
image: "/images/posts/the-trust-boundary-i-got-wrong.jpg"
topic: "ai"
description: "My agent fleet once acted on any stranger's PR comment and leaked tokens into its own transcripts. Where the trust boundary was wrong, and what fixed it."
series: "Lessons from an agent fleet"
series_part: 9
---

For the first few months of running my agent fleet, anyone on the internet could give it instructions. Four of the eight target repos are public. One item in the orchestrator's task queue was "address review comments on open PRs," and it didn't check who had written the comment. The workers run headless with permission prompts disabled, since there's nobody at the keyboard at 1 a.m. to click Allow. And my own GitHub token was sitting in plaintext on the same machine.

Put those together and a stranger's PR comment could steer a worker that had a shell, and a hijacked worker could have approved and merged as me. Nothing like that happened, as far as I can tell. It was still the most serious design mistake in the project, and I only saw it clearly when I started preparing the repo to go public.

I've written before that [prompt injection is an architecture problem, not a prompt problem](/posts/prompt-injection-is-an-architecture-problem-not-a-prompt-problem). This is the post where I found out I hadn't followed my own advice.

## Hole one: the public comment

The fix wasn't a better prompt telling the agent to ignore suspicious comments. It was cutting off what untrusted text can reach.

**Filter by author before the model sees anything.** Every comment from all three GitHub comment endpoints, paginated, now goes through a `jq` filter on `author_association`. Only comments from accounts with a real relationship to the repo get through. No bots are trusted, not even the review bots. A simplified version:

```bash
gh api --paginate "repos/$OWNER/$REPO/issues/$PR/comments" \
  | jq '[.[] | select(.author_association == "OWNER" or .author_association == "MEMBER" or .author_association == "COLLABORATOR")]'
```

**Treat untrusted-origin work differently.** Some work has to start from untrusted input anyway: an issue filed by a stranger, or one filed by a GitHub Action (scheduled Lighthouse and link-check issues come from `github-actions` with no association, so they count as untrusted). Those tasks get a restricted scope, and their workers **never push**. The orchestrator checks the diff against a list of protected paths (workflows, hooks, config) and does the push itself. The classifier that decides what a piece of feedback is even asking for runs with read-only tools: `claude -p --tools "Read,Grep,Glob" --permission-mode dontAsk`.

That design created its own small trap. Because untrusted workers don't push, the repo's pre-push hook never ran on their work until the orchestrator pushed. The first time the hook failed, the same shell command went on to delete the clone, and the only copy of the commit was lost. Now untrusted workers run `sh .husky/pre-push` themselves and report the exit code, and the orchestrator only cleans up after a successful push.

## Hole two: tokens in transcripts

Every worker's tool calls and outputs are logged. That makes anything a worker prints part of a transcript that lives on disk. I found six different ways secrets ended up there:

1. **Token in the remote URL.** Cloning with `https://x-access-token:$TOKEN@github.com/...` stores the token in `origin`, and any `git remote -v` or verbose error prints it.
2. **Other agents' environments.** A worker ran `pgrep -fl` to find stray test processes, and the output included sibling agents' environment variables, tokens included.
3. **Connection strings.** A worker echoed `E2E_DATABASE_URL` while debugging. Another ran `neonctl branches create`, which prints the new branch's connection string, password and all, to stdout by default.
4. **A typo.** Two workers mistyped a git command that had `$GITHUB_TOKEN` inline in a config flag, and the shell's error message printed the expanded token.
5. **The secret scanner.** A worker's custom redaction regex missed a key, and gitleaks printed it in full.
6. **Inherited credentials.** Workers inherited the orchestrator's Sentry token, which they never needed and which broke builds that change behavior when it's set.

The transcripts never left the machine, the database credentials died with their branches, and the scanner's find was a key already in public history. That was luck, not design. The fixes:

- Git auth goes through the `gitnet` helper from Part 4. The token is supplied inside a credential helper with single quotes, so it never appears on a command line, in a URL, or in an error message.
- Secrets are only assigned, never printed: `export VAR=$(...)`. `neonctl` output goes to `/dev/null`, and the connection string is fetched separately into a variable.
- Process checks use `pgrep -x <name>` or a port check, never `pgrep -fl` or `ps eww`.
- gitleaks always runs with `--redact`.
- Every worker command starts with `unset SENTRY_AUTH_TOKEN;`. The prefix goes on every call because each tool call starts a fresh shell, and a single `unset` at the top doesn't carry over.

## Hole three: my own credentials

The worst one was the simplest. My personal GitHub CLI login was stored in plaintext on the agent machine. The fleet uses its own bot account for everything, but a worker that could read files could have read mine.

I logged it out on November 13th. The machine now holds only the bot account's credentials. The bot can open PRs and request my review, but it can't approve or merge, and approval stays with an account that isn't on that machine.

## What's still true

None of this solves prompt injection. A trusted collaborator's comment can still contain something a model misreads, and a dependency's README could still say something strange. What changed is how far a bad instruction can go. Untrusted text can't reach a worker that can push. A worker that's misled can't find a credential worth stealing. And the only account that can merge isn't on the box.

That's the takeaway for the whole series. The model is the part I changed least in five months. The code around it, meaning what it can reach, what it prints, what it remembers, and who it listens to, is where all the actual engineering went. If you're building your own fleet, start there.
