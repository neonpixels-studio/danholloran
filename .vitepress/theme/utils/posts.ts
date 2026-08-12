import { loadDatedPosts } from "./loadPublishedPosts";

// The image of the newest published, dated post that has one — used for the
// site's default social image. Shares the one post loader so the read/parse/
// filter/sort policy stays in a single place.
export function getLatestPostImage(): string | undefined {
  const latestWithImage = loadDatedPosts().find((post) => post.image);
  return latestWithImage?.image as string | undefined;
}
