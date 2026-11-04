import { crc32, deflateRawSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Reads and builds the "download all" zip bundles in public/grimicorn-themes
// and public/grimicorn-neon-themes. Built on Node built-ins only (zlib), so
// no zip dependency is needed. The test and `npm run grimicorn:zips` share
// this module so what the test checks is exactly what the script writes.

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;
const CENTRAL_DIRECTORY_HEADER_SIZE = 46;
const LOCAL_FILE_HEADER_SIZE = 30;
const VERSION_NEEDED = 20;
const UTF8_FLAG = 0x0800;
const METHOD_DEFLATE = 8;
const DEFLATE_LEVEL = 9;
// Fixed DOS timestamp (1980-01-01 00:00:00) so rebuilding unchanged files
// yields byte-identical zips and no noisy git diffs.
const DOS_TIME = 0;
const DOS_DATE = 0x0021;
const ZIP_EXTENSION = ".zip";

export interface ZipEntryChecksum {
  name: string;
  crc32: number;
}

function findEndOfCentralDirectory(zipBuffer: Buffer): number {
  const signature = Buffer.alloc(4);
  signature.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  const endOffset = zipBuffer.lastIndexOf(signature);
  if (
    endOffset < 0 ||
    endOffset + END_OF_CENTRAL_DIRECTORY_SIZE > zipBuffer.length
  ) {
    throw new Error("Not a valid zip: end of central directory not found");
  }
  return endOffset;
}

function readCentralEntry(
  zipBuffer: Buffer,
  offset: number,
): { entry: ZipEntryChecksum; nextOffset: number } {
  if (offset + CENTRAL_DIRECTORY_HEADER_SIZE > zipBuffer.length) {
    throw new Error("Not a valid zip: central directory out of bounds");
  }
  if (zipBuffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
    throw new Error("Not a valid zip: bad central directory entry");
  }
  const nameLength = zipBuffer.readUInt16LE(offset + 28);
  const extraLength = zipBuffer.readUInt16LE(offset + 30);
  const commentLength = zipBuffer.readUInt16LE(offset + 32);
  const nameStart = offset + CENTRAL_DIRECTORY_HEADER_SIZE;
  if (nameStart + nameLength > zipBuffer.length) {
    throw new Error("Not a valid zip: entry name out of bounds");
  }
  return {
    entry: {
      name: zipBuffer.toString("utf8", nameStart, nameStart + nameLength),
      crc32: zipBuffer.readUInt32LE(offset + 16),
    },
    nextOffset: nameStart + nameLength + extraLength + commentLength,
  };
}

/** Reads file entry names and CRC32s from the zip's central directory. */
export function readZipChecksums(zipBuffer: Buffer): ZipEntryChecksum[] {
  const endOffset = findEndOfCentralDirectory(zipBuffer);
  const entryCount = zipBuffer.readUInt16LE(endOffset + 10);
  let offset = zipBuffer.readUInt32LE(endOffset + 16);
  const entries: ZipEntryChecksum[] = [];
  for (let index = 0; index < entryCount; index++) {
    const { entry, nextOffset } = readCentralEntry(zipBuffer, offset);
    entries.push(entry);
    offset = nextOffset;
  }
  return entries.filter((entry) => !entry.name.endsWith("/"));
}

/** Every non-zip, non-hidden file under `directory`, as "/"-separated relative paths, sorted. */
export function listBundleFiles(directory: string, prefix = ""): string[] {
  const found = readdirSync(directory, { withFileTypes: true }).flatMap(
    (dirent) => {
      if (dirent.name.startsWith(".")) {
        return [];
      }
      const relativePath = prefix ? `${prefix}/${dirent.name}` : dirent.name;
      if (dirent.isDirectory()) {
        return listBundleFiles(join(directory, dirent.name), relativePath);
      }
      return dirent.name.endsWith(ZIP_EXTENSION) ? [] : [relativePath];
    },
  );
  return found.sort();
}

/**
 * Builds a zip whose entries are every file in `themeDirectory`, rooted
 * under a folder named `rootName`. Deterministic: sorted entries, fixed
 * timestamp, no extra fields.
 */
export function buildZip(themeDirectory: string, rootName: string): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const files = listBundleFiles(themeDirectory);
  for (const relativePath of files) {
    const content = readFileSync(
      join(themeDirectory, ...relativePath.split("/")),
    );
    const name = Buffer.from(`${rootName}/${relativePath}`, "utf8");
    const compressed = deflateRawSync(content, { level: DEFLATE_LEVEL });
    const checksum = crc32(content);
    const local = localHeader(
      name,
      checksum,
      compressed.length,
      content.length,
    );
    localParts.push(local, name, compressed);
    centralParts.push(
      centralHeader(name, checksum, compressed.length, content.length, offset),
      name,
    );
    offset += local.length + name.length + compressed.length;
  }
  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    ...localParts,
    central,
    endHeader(files.length, central.length, offset),
  ]);
}

function localHeader(
  name: Buffer,
  checksum: number,
  compressedSize: number,
  size: number,
): Buffer {
  const header = Buffer.alloc(LOCAL_FILE_HEADER_SIZE);
  header.writeUInt32LE(LOCAL_FILE_SIGNATURE, 0);
  header.writeUInt16LE(VERSION_NEEDED, 4);
  header.writeUInt16LE(UTF8_FLAG, 6);
  header.writeUInt16LE(METHOD_DEFLATE, 8);
  header.writeUInt16LE(DOS_TIME, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(compressedSize, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(name.length, 26);
  return header;
}

function centralHeader(
  name: Buffer,
  checksum: number,
  compressedSize: number,
  size: number,
  localOffset: number,
): Buffer {
  const header = Buffer.alloc(CENTRAL_DIRECTORY_HEADER_SIZE);
  header.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
  header.writeUInt16LE(VERSION_NEEDED, 4);
  header.writeUInt16LE(VERSION_NEEDED, 6);
  header.writeUInt16LE(UTF8_FLAG, 8);
  header.writeUInt16LE(METHOD_DEFLATE, 10);
  header.writeUInt16LE(DOS_TIME, 12);
  header.writeUInt16LE(DOS_DATE, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(compressedSize, 20);
  header.writeUInt32LE(size, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(localOffset, 42);
  return header;
}

function endHeader(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
): Buffer {
  const header = Buffer.alloc(END_OF_CENTRAL_DIRECTORY_SIZE);
  header.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  header.writeUInt16LE(entryCount, 8);
  header.writeUInt16LE(entryCount, 10);
  header.writeUInt32LE(centralSize, 12);
  header.writeUInt32LE(centralOffset, 16);
  return header;
}

/**
 * Compares the zip's recorded CRC32s with the current files in
 * `themeDirectory`. Returns one message per file that is missing from the
 * zip, changed since it was zipped, or zipped but no longer on disk.
 */
export function findStaleEntries(
  zipBuffer: Buffer,
  themeDirectory: string,
  rootName: string,
): string[] {
  const zipped = new Map(
    readZipChecksums(zipBuffer).map((entry) => [entry.name, entry.crc32]),
  );
  const bundleFiles = listBundleFiles(themeDirectory);
  const changedOrMissing = bundleFiles.flatMap((relativePath) => {
    const entryName = `${rootName}/${relativePath}`;
    if (!zipped.has(entryName)) {
      return [`${entryName}: missing from zip`];
    }
    const current = crc32(
      readFileSync(join(themeDirectory, ...relativePath.split("/"))),
    );
    return zipped.get(entryName) === current
      ? []
      : [`${entryName}: zipped content differs from the current file`];
  });
  const expectedNames = new Set(
    bundleFiles.map((relativePath) => `${rootName}/${relativePath}`),
  );
  const orphaned = [...zipped.keys()]
    .filter((entryName) => !expectedNames.has(entryName))
    .map((entryName) => `${entryName}: in zip but no longer in public/`);
  return [...changedOrMissing, ...orphaned];
}
