const REQUEST_KEYS = new Set(["action", "essay", "language", "interests"]);

const reviewResponseSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "overall_score",
    "clarity_score",
    "strengths",
    "clarity_explanation",
    "grammar_issues",
    "tone_assessment",
    "suggestions",
    "revised_sentences",
  ],
  properties: {
    overall_score: { type: "number", minimum: 1, maximum: 10 },
    clarity_score: { type: "number", minimum: 1, maximum: 10 },
    strengths: { type: "array", minItems: 3, maxItems: 4, items: boundedTextSchema() },
    clarity_explanation: boundedTextSchema(),
    grammar_issues: { type: "array", minItems: 0, maxItems: 12, items: boundedTextSchema() },
    tone_assessment: boundedTextSchema(),
    suggestions: { type: "array", minItems: 4, maxItems: 6, items: boundedTextSchema() },
    revised_sentences: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "improved"],
        properties: {
          original: boundedTextSchema(),
          improved: boundedTextSchema(),
        },
      },
    },
  },
};

const brainstormResponseSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["topic_ideas", "common_prompts"],
  properties: {
    topic_ideas: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "why_it_works", "starting_questions"],
        properties: {
          title: boundedTextSchema(),
          description: boundedTextSchema(),
          why_it_works: boundedTextSchema(),
          starting_questions: {
            type: "array",
            minItems: 2,
            maxItems: 3,
            items: boundedTextSchema(),
          },
        },
      },
    },
    common_prompts: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: boundedTextSchema(),
    },
  },
};

/**
 * JSON Schemas for provider output. Runtime validation is available through
 * validateEssayResponse and does not depend on a schema package.
 */
export const essayResponseSchemas = Object.freeze({
  review: reviewResponseSchema,
  brainstorm: brainstormResponseSchema,
});

/**
 * Validate and reduce an untrusted request to the fields the essay feature uses.
 *
 * @param {unknown} input
 * @returns {{action: "review", essay: string, language: "en" | "ru" | "uz"} | {action: "brainstorm", language: "en" | "ru" | "uz", interests?: string[]}}
 */
export function normalizeEssayRequest(input) {
  if (!isPlainObject(input)) {
    throw new TypeError("Essay request must be a plain object");
  }

  for (const key of Object.keys(input)) {
    if (!REQUEST_KEYS.has(key)) {
      throw new TypeError(`Unexpected essay request field: ${key}`);
    }
  }

  if (input.action !== "review" && input.action !== "brainstorm") {
    throw new TypeError("Essay action must be review or brainstorm");
  }
  if (input.language !== 'en' && input.language !== 'ru' && input.language !== 'uz') {
    throw new TypeError("Essay language must be en, ru, or uz");
  }

  if (input.action === "review") {
    if (Object.hasOwn(input, "interests")) {
      throw new TypeError("Interests are only accepted for brainstorm requests");
    }
    if (typeof input.essay !== "string") {
      throw new TypeError("Review requests require an essay string");
    }
    const essay = input.essay.trim();
    if (essay.length < 50 || essay.length > 12000) {
      throw new TypeError("Essay must contain 50 to 12000 characters after trimming");
    }
    return { action: "review", essay, language: input.language };
  }

  if (Object.hasOwn(input, "essay")) {
    throw new TypeError("Essay text is only accepted for review requests");
  }
  /** @type {{action: "brainstorm", language: "en" | "ru" | "uz", interests?: string[]}} */
  const request = { action: "brainstorm", language: input.language };
  if (Object.hasOwn(input, "interests")) {
    if (!Array.isArray(input.interests) || input.interests.length > 8) {
      throw new TypeError("Brainstorm interests must be an array of at most 8 strings");
    }
    request.interests = input.interests.map((interest) => {
      if (typeof interest !== "string") {
        throw new TypeError("Each brainstorm interest must be a string");
      }
      const trimmed = interest.trim();
      if (trimmed.length < 1 || trimmed.length > 80) {
        throw new TypeError("Each brainstorm interest must contain 1 to 80 characters after trimming");
      }
      return trimmed;
    });
  }
  return request;
}

/**
 * Validate a provider response and return a clean, allowlisted copy.
 *
 * @param {"review" | "brainstorm"} action
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function validateEssayResponse(action, value) {
  if (action !== "review" && action !== "brainstorm") {
    throw new TypeError("Essay action must be review or brainstorm");
  }
  if (!isPlainObject(value)) {
    throw new TypeError("Essay response must be a plain object");
  }

  if (action === "review") {
    exactKeys(value, [
      "overall_score",
      "clarity_score",
      "strengths",
      "clarity_explanation",
      "grammar_issues",
      "tone_assessment",
      "suggestions",
      "revised_sentences",
    ]);
    const revisedSentences = requireArray(value.revised_sentences, 2, 3, "revised_sentences");
    return {
      overall_score: score(value.overall_score, "overall_score"),
      clarity_score: score(value.clarity_score, "clarity_score"),
      strengths: boundedArray(value.strengths, 3, 4, "strengths"),
      clarity_explanation: boundedText(value.clarity_explanation, "clarity_explanation"),
      grammar_issues: boundedArray(value.grammar_issues, 0, 12, "grammar_issues"),
      tone_assessment: boundedText(value.tone_assessment, "tone_assessment"),
      suggestions: boundedArray(value.suggestions, 4, 6, "suggestions"),
      revised_sentences: Array.from(revisedSentences, (sentence, index) => {
        exactKeys(sentence, ["original", "improved"], `revised_sentences[${index}]`);
        return {
          original: boundedText(sentence.original, `revised_sentences[${index}].original`),
          improved: boundedText(sentence.improved, `revised_sentences[${index}].improved`),
        };
      }),
    };
  }

  exactKeys(value, ["topic_ideas", "common_prompts"]);
  const topicIdeas = requireArray(value.topic_ideas, 5, 5, "topic_ideas");
  return {
    topic_ideas: Array.from(topicIdeas, (idea, index) => {
      exactKeys(idea, ["title", "description", "why_it_works", "starting_questions"], `topic_ideas[${index}]`);
      return {
        title: boundedText(idea.title, `topic_ideas[${index}].title`),
        description: boundedText(idea.description, `topic_ideas[${index}].description`),
        why_it_works: boundedText(idea.why_it_works, `topic_ideas[${index}].why_it_works`),
        starting_questions: boundedArray(idea.starting_questions, 2, 3, `topic_ideas[${index}].starting_questions`),
      };
    }),
    common_prompts: boundedArray(value.common_prompts, 3, 3, "common_prompts"),
  };
}

function boundedTextSchema() {
  return { type: "string", minLength: 1, maxLength: 2000, pattern: "\\S" };
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, requiredKeys, label = "Essay response") {
  if (!isPlainObject(value)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== requiredKeys.length || requiredKeys.some((key) => !Object.hasOwn(value, key))) {
    throw new TypeError(`${label} must contain exactly: ${requiredKeys.join(", ")}`);
  }
}

function boundedText(value, label) {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || value.length > 2000) {
    throw new TypeError(`${label} must contain 1 to 2000 characters after trimming`);
  }
  return trimmed;
}

function boundedArray(value, minimum, maximum, label) {
  return Array.from(requireArray(value, minimum, maximum, label), (item, index) =>
    boundedText(item, `${label}[${index}]`));
}

function requireArray(value, minimum, maximum, label) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new TypeError(`${label} must contain ${minimum} to ${maximum} items`);
  }
  return value;
}

function score(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 10) {
    throw new TypeError(`${label} must be a finite number from 1 to 10`);
  }
  return value;
}
