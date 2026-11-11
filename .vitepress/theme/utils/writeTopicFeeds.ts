import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { topicFeedHref } from "./archive";
import type { TopicFeed } from "./generateFeed";

// Writes each topic feed to the same path the archive head links to
// (`<outDir>/topic/<slug>/feed.xml`). `topicFeedHref` is the single source of
// that path so the written files and the advertised URLs cannot drift.
export function writeTopicFeeds(outDir: string, feeds: TopicFeed[]): void {
  for (const feed of feeds) {
    const feedFile = join(outDir, topicFeedHref(feed.slug));
    mkdirSync(dirname(feedFile), { recursive: true });
    writeFileSync(feedFile, feed.xml);
  }
}
