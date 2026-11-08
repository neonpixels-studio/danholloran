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

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function requiredStringProblems(data: Record<string, unknown>): string[] {
  return REQUIRED_STRING_KEYS.filter((key) => !isNonEmptyString(data[key])).map(
    (key) => `"${key}" must be a non-empty string`,
  );
}

function optionalStringProblems(data: Record<string, unknown>): string[] {
  return OPTIONAL_STRING_KEYS.filter(
    (key) => key in data && typeof data[key] !== "string",
  ).map((key) => `"${key}" must be a string when present`);
}

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

function isIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && Number.isFinite(Date.parse(value));
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
  if (!isNonEmptyString(topic) || KNOWN_TOPICS.includes(topic as string)) {
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
  return [
    ...requiredStringProblems(data),
    ...optionalStringProblems(data),
    ...dateProblems(data),
    ...topicProblems(data),
    ...tagsProblems(data),
    ...draftProblems(data),
    ...unknownKeyProblems(data),
  ];
}
