import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import projects from "@data/projects";
import resume from "@data/resume";
import {
  PROFILE_PHOTO_SOURCE,
  STATIC_IMAGE_FORMATS,
  isStaticImageConvertible,
  staticImageFormatSrc,
} from "@utils/staticImageFormats";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("staticImageFormatSrc", () => {
  it("swaps a png extension for the requested format", () => {
    expect(staticImageFormatSrc("/images/profile.png", "avif")).toBe(
      "/images/profile.avif",
    );
  });

  it("swaps jpg/jpeg extensions regardless of case", () => {
    expect(staticImageFormatSrc("/images/a.JPG", "webp")).toBe(
      "/images/a.webp",
    );
    expect(staticImageFormatSrc("/images/b.jpeg", "webp")).toBe(
      "/images/b.webp",
    );
  });
});

describe("isStaticImageConvertible", () => {
  it("accepts png and jpeg sources", () => {
    expect(isStaticImageConvertible("/images/profile.png")).toBe(true);
    expect(isStaticImageConvertible("/images/photo.jpeg")).toBe(true);
  });

  it("rejects formats the generator does not convert", () => {
    expect(isStaticImageConvertible("/images/logo.svg")).toBe(false);
    expect(isStaticImageConvertible("/images/anim.gif")).toBe(false);
  });
});

describe("generated static image formats", () => {
  it("generates the profile photo from resume.photo", () => {
    expect(PROFILE_PHOTO_SOURCE.src).toBe(resume.photo);
  });

  // Fails when a project image is added or the photo is swapped without
  // re-running `npm run images:static`, instead of shipping a broken <source>.
  const sources = [resume.photo, ...projects.map((project) => project.image)];
  const expected = sources.flatMap((src) =>
    STATIC_IMAGE_FORMATS.map((format) => staticImageFormatSrc(src, format)),
  );

  it.each(expected)("%s exists in public/", (src) => {
    expect(existsSync(join(PUBLIC_DIR, src))).toBe(true);
  });
});
