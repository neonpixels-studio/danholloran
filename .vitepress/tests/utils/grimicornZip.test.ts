import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { inflateRawSync, crc32 } from "node:zlib";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildZip,
  findStaleEntries,
  listBundleFiles,
  readZipChecksums,
} from "@utils/grimicornZip";

const LOCAL_HEADER_SIZE = 30;

describe("grimicornZip", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "grimicorn-zip-"));
    mkdirSync(join(directory, "vscode"));
    writeFileSync(
      join(directory, "vscode", "theme.json"),
      '{"a":1}\n'.repeat(50),
    );
    writeFileSync(join(directory, "palette.md"), "# palette\n");
    writeFileSync(join(directory, ".DS_Store"), "junk");
    writeFileSync(join(directory, "bundle.zip"), "old zip");
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("lists files sorted, skipping hidden files and zips", () => {
    expect(listBundleFiles(directory)).toEqual([
      "palette.md",
      "vscode/theme.json",
    ]);
  });

  it("round-trips: checksums match and entry data inflates to the source", () => {
    const zip = buildZip(directory, "root");
    const checksums = readZipChecksums(zip);

    expect(checksums.map((entry) => entry.name)).toEqual([
      "root/palette.md",
      "root/vscode/theme.json",
    ]);
    expect(checksums[0].crc32).toBe(crc32(Buffer.from("# palette\n")));

    // First entry's local data sits right after its header and name.
    const nameLength = zip.readUInt16LE(26);
    const compressedSize = zip.readUInt32LE(18);
    const data = zip.subarray(
      LOCAL_HEADER_SIZE + nameLength,
      LOCAL_HEADER_SIZE + nameLength + compressedSize,
    );
    expect(inflateRawSync(data).toString()).toBe("# palette\n");
  });

  it("uses a fixed timestamp so rebuilds are deterministic", () => {
    const zip = buildZip(directory, "root");

    expect(zip.readUInt16LE(10)).toBe(0);
    expect(zip.readUInt16LE(12)).toBe(0x0021);
    expect(zip.equals(buildZip(directory, "root"))).toBe(true);
  });

  it("reports no stale entries for a fresh zip", () => {
    const zip = buildZip(directory, "root");

    expect(findStaleEntries(zip, directory, "root")).toEqual([]);
  });

  it("reports an entry whose file changed after zipping", () => {
    const zip = buildZip(directory, "root");
    writeFileSync(join(directory, "palette.md"), "# changed\n");

    expect(findStaleEntries(zip, directory, "root")).toEqual([
      "root/palette.md: zipped content differs from the current file",
    ]);
  });

  it("reports a file added after zipping", () => {
    const zip = buildZip(directory, "root");
    writeFileSync(join(directory, "new.txt"), "new");

    expect(findStaleEntries(zip, directory, "root")).toEqual([
      "root/new.txt: missing from zip",
    ]);
  });

  it("reports a file deleted after zipping", () => {
    const zip = buildZip(directory, "root");
    unlinkSync(join(directory, "palette.md"));

    expect(findStaleEntries(zip, directory, "root")).toEqual([
      "root/palette.md: in zip but no longer in public/",
    ]);
  });

  it("throws on something that is not a zip", () => {
    const truncated = Buffer.from([0x50, 0x4b, 0x05, 0x06, 1, 2]);

    expect(() => readZipChecksums(truncated)).toThrow(/not a valid zip/i);
    expect(() => readZipChecksums(Buffer.from("nope"))).toThrow(
      /not a valid zip/i,
    );
  });
});
