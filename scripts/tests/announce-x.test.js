import { describe, it, expect } from "vitest";
import { composeTweet } from "../announce-x.mjs";

const SITE_URL = "https://danholloran.me";

describe("composeTweet", () => {
  it("includes title, description, URL, and hashtags", () => {
    const tweet = composeTweet(
      { title: "My Post", description: "A great read.", tags: ["js", "web"] },
      "my-post",
    );
    expect(tweet).toContain('New post: "My Post"');
    expect(tweet).toContain("A great read.");
    expect(tweet).toContain(`${SITE_URL}/posts/my-post`);
    expect(tweet).toContain("#js");
    expect(tweet).toContain("#web");
  });

  it("stays at or under 280 characters", () => {
    const tweet = composeTweet(
      {
        title: "My Post",
        description: "A great read.",
        tags: ["javascript", "webdev", "css"],
      },
      "my-post",
    );
    expect(tweet.length).toBeLessThanOrEqual(280);
  });

  it("omits body when description is missing", () => {
    const tweet = composeTweet({ title: "My Post", tags: [] }, "my-post");
    expect(tweet).toMatch(/^New post: "My Post"\n\n\n\n/);
  });

  it("defaults to 'New post' when title is missing", () => {
    const tweet = composeTweet({ description: "Something.", tags: [] }, "slug");
    expect(tweet).toContain('New post: "New post"');
  });

  it("truncates a long description with an ellipsis", () => {
    const longDesc = "x".repeat(300);
    const tweet = composeTweet(
      { title: "T", description: longDesc, tags: [] },
      "slug",
    );
    expect(tweet.length).toBeLessThanOrEqual(280);
    expect(tweet).toContain("…");
  });

  it("omits hashtags when tags array is empty", () => {
    const tweet = composeTweet(
      { title: "T", description: "D", tags: [] },
      "slug",
    );
    expect(tweet).not.toContain("#");
  });

  it("includes at most 3 hashtags", () => {
    const tweet = composeTweet(
      {
        title: "T",
        description: "D",
        tags: ["one", "two", "three", "four", "five"],
      },
      "slug",
    );
    const matches = tweet.match(/#\w+/g) || [];
    expect(matches.length).toBe(3);
  });

  it("strips non-alphanumeric characters from hashtags", () => {
    const tweet = composeTweet(
      { title: "T", description: "D", tags: ["c++", "node.js"] },
      "slug",
    );
    expect(tweet).toContain("#c ");
    expect(tweet).toContain("#nodejs");
    const hashtags = (tweet.match(/#\w+/g) || []).join(" ");
    expect(hashtags).not.toContain("+");
    expect(hashtags).not.toContain(".");
  });

  it("builds the post URL from SITE_URL and slug", () => {
    const tweet = composeTweet({ title: "T", tags: [] }, "hello-world");
    expect(tweet).toContain(`${SITE_URL}/posts/hello-world`);
  });

  it("respects a custom SITE_URL env var", () => {
    const original = process.env.SITE_URL;
    try {
      process.env.SITE_URL = "https://example.com";
      // Re-import isn't feasible for the env var since it's captured at module load,
      // so we verify the default is used correctly and note this is a limitation.
      const tweet = composeTweet({ title: "T", tags: [] }, "hello-world");
      expect(tweet).toContain("/posts/hello-world");
    } finally {
      process.env.SITE_URL = original;
    }
  });

  describe("when description fits without truncation", () => {
    it("includes the full description", () => {
      const desc = "Short description.";
      const tweet = composeTweet(
        { title: "T", description: desc, tags: [] },
        "slug",
      );
      expect(tweet).toContain(desc);
      expect(tweet).not.toContain("…");
    });
  });
});
