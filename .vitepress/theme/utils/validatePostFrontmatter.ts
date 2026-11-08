import { TOPIC_SECTIONS } from "./generateLlmsTxt";

export const KNOWN_TOPICS: string[] = TOPIC_SECTIONS.map(
  (section) => section.topic,
);

const REQUIRED_STRING_KEYS = ["title", "description", "date", "image", "topic"];
const DATE_KEYS = ["date", "created_at"];
const OPTIONAL_STRING_KEYS = [
  "alert_message",
  "canonical",
  "travel_location",
  "created_at",
];

export const ALLOWED_KEYS: string[] = [
  ...REQUIRED_STRING_KEYS,
  ...OPTIONAL_STRING_KEYS,
  "tags",
  "draft",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function requiredStringProblems(data: Record<string, unknown>): string[] {
  return REQUIRED_STRING_KEYS.filter((key) => !isNonEmptyString(data[key])).map(
    (key) => `"${key}" must be a non-empty string`,
  );
}

function optionalStringProblems(data: Record<string, unknown>): string[] {
  return OPTIONAL_STRING_KEYS.filter(
    (key) => key in data && !isNonEmptyString(data[key]),
  ).map((key) => `"${key}" must be a non-empty string when present`);
}

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

// Date.parse rolls day overflow (Feb 30) into the next month instead of rejecting it.
function isRealCalendarDay(value: string): boolean {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDate() === day;
}

function isIsoDate(value: string): boolean {
  return (
    ISO_DATE_PATTERN.test(value) &&
    isRealCalendarDay(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function imageProblems(data: Record<string, unknown>): string[] {
  const { image } = data;
  if (!isNonEmptyString(image) || image.startsWith("/")) {
    return [];
  }
  return ['"image" must be a root-relative path starting with "/"'];
}

function dateProblem(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "" || isIsoDate(value)) {
    return [];
  }
  return [`"${key}" is not an ISO 8601 date-time: ${value}`];
}

function dateProblems(data: Record<string, unknown>): string[] {
  return DATE_KEYS.flatMap((key) => dateProblem(data, key));
}

function topicProblems(data: Record<string, unknown>): string[] {
  const { topic } = data;
  if (!isNonEmptyString(topic) || KNOWN_TOPICS.includes(topic)) {
    return [];
  }
  return [`"topic" ${topic} is not one of: ${KNOWN_TOPICS.join(", ")}`];
}

function tagsProblems(data: Record<string, unknown>): string[] {
  const { tags } = data;
  if (Array.isArray(tags) && tags.every((tag) => typeof tag === "string")) {
    return [];
  }
  return ['"tags" must be an array of strings (use [] for none)'];
}

function draftProblems(data: Record<string, unknown>): string[] {
  return typeof data.draft === "boolean" ? [] : ['"draft" must be a boolean'];
}

function unknownKeyProblems(data: Record<string, unknown>): string[] {
  return Object.keys(data)
    .filter((key) => !ALLOWED_KEYS.includes(key))
    .map((key) => `unknown key "${key}"`);
}

/** Schema problems for one post's frontmatter; empty when valid. */
export function validatePostFrontmatter(
  data: Record<string, unknown>,
): string[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return ["frontmatter must be a YAML mapping"];
  }
  return [
    ...requiredStringProblems(data),
    ...optionalStringProblems(data),
    ...dateProblems(data),
    ...imageProblems(data),
    ...topicProblems(data),
    ...tagsProblems(data),
    ...draftProblems(data),
    ...unknownKeyProblems(data),
  ];
}
