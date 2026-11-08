import { TOPIC_SECTIONS } from "./generateLlmsTxt";

export const KNOWN_TOPICS: string[] = TOPIC_SECTIONS.map(
  (section) => section.topic,
);

const REQUIRED_STRING_KEYS = ["title", "description", "date", "image", "topic"];
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

function dateProblems(data: Record<string, unknown>): string[] {
  const { date } = data;
  if (!isNonEmptyString(date) || Number.isFinite(Date.parse(date as string))) {
    return [];
  }
  return [`"date" is not a parseable date: ${date}`];
}

function topicProblems(data: Record<string, unknown>): string[] {
  const { topic } = data;
  if (!isNonEmptyString(topic) || KNOWN_TOPICS.includes(topic as string)) {
    return [];
  }
  return [`"topic" ${topic} is not one of: ${KNOWN_TOPICS.join(", ")}`];
}

function tagsAndDraftProblems(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const { tags, draft } = data;
  const tagsValid =
    Array.isArray(tags) && tags.every((tag) => typeof tag === "string");
  if (!tagsValid) {
    problems.push('"tags" must be an array of strings (use [] for none)');
  }
  if (typeof draft !== "boolean") {
    problems.push('"draft" must be a boolean');
  }
  return problems;
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
    ...tagsAndDraftProblems(data),
    ...unknownKeyProblems(data),
  ];
}
