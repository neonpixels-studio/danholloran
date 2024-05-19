import { expect, test, describe, vi } from "vitest";
import useWebhookPoster from "@/composables/useWebhookPoster.js";
import slugify from "slugify";

describe("useWebhookPoster", () => {
  test("handleWebhook", async () => {
    const expectedCreatedAt = "2024-05-11T19:58:53Z";
    const expectedResponse = { test: true };
    const githubApiMock = {
      commitFile: vi.fn().mockResolvedValue(expectedResponse),
    };
    const payload = {
      title: "My Awesome Blog Post",
      content: "My awesome blog post content!",
      tags: ["Tag 1", "Tag 2", "Tag 3"],
      metadata: {
        original_url: "https://test.com",
      },
      group: "posts",
      published: true,
      created_at: expectedCreatedAt,
    };

    const { handleWebhook } = useWebhookPoster({
      token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      githubApi: githubApiMock,
    });

    const response = await handleWebhook(payload);

    expect(githubApiMock.commitFile).toHaveBeenCalledWith({
      filePath: `content/posts/${slugify(payload.title, { lower: true, strict: true })}.md`,
      content:
        "---\n" +
        `title: ${payload.title}\n` +
        `tags: ${payload.tags.join(",")}\n` +
        `published: ${payload.published}\n` +
        `created_at: ${payload.created_at}\n` +
        `original_url: ${payload.metadata.original_url}\n` +
        "---\n" +
        "My awesome blog post content!",
      message: "[Webhook Poster] posts/my-awesome-blog-post.md",
    });
    expect(response).toEqual(expectedResponse);
  });
});
