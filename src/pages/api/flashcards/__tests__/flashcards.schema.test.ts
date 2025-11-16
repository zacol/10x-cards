import { describe, it, expect, expectTypeOf } from "vitest";
import {
  getFlashcardsQuerySchema,
  getFlashcardParamsSchema,
  flashcardUpsertSchema,
  getDueFlashcardsQuerySchema,
  type GetFlashcardsQuery,
  type FlashcardUpsert,
  type GetDueFlashcardsQuery,
} from "../flashcards.schema";

describe("getFlashcardsQuerySchema", () => {
  describe("valid data with defaults", () => {
    it("should accept empty query", () => {
      const emptyQuery = {};

      const result = getFlashcardsQuerySchema.safeParse(emptyQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        // Optional fields with defaults return undefined when not provided
        expect(result.data.limit).toBeUndefined();
        expect(result.data.offset).toBeUndefined();
        expect(result.data.sort).toBeUndefined();
        expect(result.data.order).toBeUndefined();
      }
    });

    it("should accept undefined query parameters", () => {
      const query = {
        limit: undefined,
        offset: undefined,
      };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });
  });

  describe("pagination - limit", () => {
    it("should accept valid limit", () => {
      const query = { limit: 25 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("should coerce string limit to number", () => {
      const query = { limit: "25" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("should accept limit of 1", () => {
      const query = { limit: 1 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should accept limit of 100 (maximum)", () => {
      const query = { limit: 100 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject limit exceeding 100", () => {
      const query = { limit: 101 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Limit cannot exceed 100");
      }
    });

    it("should reject zero limit", () => {
      const query = { limit: 0 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject negative limit", () => {
      const query = { limit: -10 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject non-integer limit", () => {
      const query = { limit: 10.5 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("pagination - offset", () => {
    it("should accept valid offset", () => {
      const query = { offset: 10 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(10);
      }
    });

    it("should coerce string offset to number", () => {
      const query = { offset: "10" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(10);
      }
    });

    it("should accept offset of 0", () => {
      const query = { offset: 0 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should accept large offset", () => {
      const query = { offset: 1000 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject negative offset", () => {
      const query = { offset: -1 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject non-integer offset", () => {
      const query = { offset: 10.5 };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("sorting - sort", () => {
    it("should accept 'created_at' sort field", () => {
      const query = { sort: "created_at" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("should accept 'updated_at' sort field", () => {
      const query = { sort: "updated_at" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should accept 'due_date' sort field", () => {
      const query = { sort: "due_date" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject invalid sort field", () => {
      const query = { sort: "invalid_field" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject empty string sort field", () => {
      const query = { sort: "" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("sorting - order", () => {
    it("should accept 'asc' order", () => {
      const query = { order: "asc" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("asc");
      }
    });

    it("should accept 'desc' order", () => {
      const query = { order: "desc" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject invalid order", () => {
      const query = { order: "ascending" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject empty string order", () => {
      const query = { order: "" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("filtering - created_by_ai", () => {
    it("should transform 'true' string to boolean true", () => {
      const query = { created_by_ai: "true" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_by_ai).toBe(true);
      }
    });

    it("should transform 'false' string to boolean false", () => {
      const query = { created_by_ai: "false" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_by_ai).toBe(false);
      }
    });

    it("should accept undefined created_by_ai", () => {
      const query = { created_by_ai: undefined };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should transform any non-'true' string to false", () => {
      const query = { created_by_ai: "yes" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_by_ai).toBe(false);
      }
    });

    it("should transform empty string to false", () => {
      const query = { created_by_ai: "" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_by_ai).toBe(false);
      }
    });
  });

  describe("filtering - generation_id", () => {
    it("should accept valid UUID", () => {
      const query = { generation_id: "123e4567-e89b-12d3-a456-426614174000" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generation_id).toBe("123e4567-e89b-12d3-a456-426614174000");
      }
    });

    it("should accept undefined generation_id", () => {
      const query = { generation_id: undefined };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const query = { generation_id: "not-a-uuid" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid generation_id format");
      }
    });

    it("should reject empty string", () => {
      const query = { generation_id: "" };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("combined parameters", () => {
    it("should accept all valid parameters together", () => {
      const query = {
        limit: 20,
        offset: 10,
        sort: "updated_at",
        order: "asc",
        created_by_ai: "true",
        generation_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should handle partial parameters", () => {
      const query = {
        limit: 10,
        created_by_ai: "false",
      };

      const result = getFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.created_by_ai).toBe(false);
        // Optional fields not provided will be undefined
        expect(result.data.offset).toBeUndefined();
        expect(result.data.sort).toBeUndefined();
        expect(result.data.order).toBeUndefined();
      }
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: GetFlashcardsQuery = {
        limit: 50,
        offset: 0,
        sort: "created_at",
        order: "desc",
      };

      expectTypeOf(data).toMatchTypeOf<GetFlashcardsQuery>();
    });
  });
});

describe("getFlashcardParamsSchema", () => {
  describe("valid data", () => {
    it("should accept valid UUID", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = getFlashcardParamsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      }
    });

    it("should accept UUID with uppercase letters", () => {
      const validData = {
        id: "123E4567-E89B-12D3-A456-426614174000",
      };

      const result = getFlashcardParamsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept nil UUID", () => {
      const validData = {
        id: "00000000-0000-0000-0000-000000000000",
      };

      const result = getFlashcardParamsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject invalid UUID format", () => {
      const invalidData = {
        id: "not-a-uuid",
      };

      const result = getFlashcardParamsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid flashcard ID format");
      }
    });

    it("should reject empty string", () => {
      const invalidData = {
        id: "",
      };

      const result = getFlashcardParamsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject UUID without dashes", () => {
      const invalidData = {
        id: "123e4567e89b12d3a456426614174000",
      };

      const result = getFlashcardParamsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing id field", () => {
      const invalidData = {};

      const result = getFlashcardParamsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});

describe("flashcardUpsertSchema", () => {
  describe("valid data", () => {
    it("should accept valid flashcard data", () => {
      const validData = {
        front: "What is TypeScript?",
        back: "TypeScript is a typed superset of JavaScript.",
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept single character front and back", () => {
      const validData = {
        front: "Q",
        back: "A",
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept front at maximum length (200 characters)", () => {
      const validData = {
        front: "a".repeat(200),
        back: "Valid back content",
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept back at maximum length (400 characters)", () => {
      const validData = {
        front: "Valid front content",
        back: "b".repeat(400),
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept both front and back at maximum lengths", () => {
      const validData = {
        front: "a".repeat(200),
        back: "b".repeat(400),
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept content with special characters", () => {
      const validData = {
        front: "What is 2 + 2? (Easy math)",
        back: "The answer is 4! 🎉 @#$%^&*()",
      };

      const result = flashcardUpsertSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("front validation", () => {
    it("should reject empty front content", () => {
      const invalidData = {
        front: "",
        back: "Valid back content",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Front content cannot be empty.");
      }
    });

    it("should reject front content exceeding 200 characters", () => {
      const invalidData = {
        front: "a".repeat(201),
        back: "Valid back content",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Front content cannot exceed 200 characters.");
      }
    });

    it("should reject missing front field", () => {
      const invalidData = {
        back: "Valid back content",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("back validation", () => {
    it("should reject empty back content", () => {
      const invalidData = {
        front: "Valid front content",
        back: "",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Back content cannot be empty.");
      }
    });

    it("should reject back content exceeding 400 characters", () => {
      const invalidData = {
        front: "Valid front content",
        back: "b".repeat(401),
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Back content cannot exceed 400 characters.");
      }
    });

    it("should reject missing back field", () => {
      const invalidData = {
        front: "Valid front content",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("combined validation", () => {
    it("should reject both empty front and back", () => {
      const invalidData = {
        front: "",
        back: "",
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should reject both front and back exceeding limits", () => {
      const invalidData = {
        front: "a".repeat(201),
        back: "b".repeat(401),
      };

      const result = flashcardUpsertSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2);
      }
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: FlashcardUpsert = {
        front: "Question",
        back: "Answer",
      };

      expectTypeOf(data).toMatchTypeOf<FlashcardUpsert>();
    });
  });
});

describe("getDueFlashcardsQuerySchema", () => {
  describe("valid data with default", () => {
    it("should apply default limit of 20", () => {
      const emptyQuery = {};

      const result = getDueFlashcardsQuerySchema.safeParse(emptyQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe("limit validation", () => {
    it("should accept valid limit", () => {
      const query = { limit: 50 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("should coerce string limit to number", () => {
      const query = { limit: "30" };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(30);
      }
    });

    it("should accept limit of 1 (minimum)", () => {
      const query = { limit: 1 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should accept limit of 100 (maximum)", () => {
      const query = { limit: 100 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it("should reject limit of 0", () => {
      const query = { limit: 0 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Limit must be at least 1");
      }
    });

    it("should reject negative limit", () => {
      const query = { limit: -5 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject limit exceeding 100", () => {
      const query = { limit: 101 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Limit cannot exceed 100");
      }
    });

    it("should reject non-integer limit", () => {
      const query = { limit: 10.5 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });

    it("should reject very large limit", () => {
      const query = { limit: 1000 };

      const result = getDueFlashcardsQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: GetDueFlashcardsQuery = {
        limit: 20,
      };

      expectTypeOf(data).toMatchTypeOf<GetDueFlashcardsQuery>();
    });
  });
});
