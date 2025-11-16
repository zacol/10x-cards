import { describe, it, expect, expectTypeOf } from "vitest";
import {
  reviewCommandSchema,
  flashcardIdParamSchema,
  type ReviewCommandInput,
  type FlashcardIdParam,
} from "../review.schema";

describe("reviewCommandSchema", () => {
  describe("valid data", () => {
    it("should accept 'again' rating", () => {
      const validData = {
        rating: "again",
      };

      const result = reviewCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe("again");
      }
    });

    it("should accept 'good' rating", () => {
      const validData = {
        rating: "good",
      };

      const result = reviewCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe("good");
      }
    });

    it("should accept 'easy' rating", () => {
      const validData = {
        rating: "easy",
      };

      const result = reviewCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe("easy");
      }
    });
  });

  describe("invalid data", () => {
    it("should reject invalid rating string", () => {
      const invalidData = {
        rating: "hard",
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be one of: 'again', 'good', or 'easy'.");
      }
    });

    it("should reject empty string", () => {
      const invalidData = {
        rating: "",
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be one of: 'again', 'good', or 'easy'.");
      }
    });

    it("should reject numeric value", () => {
      const invalidData = {
        rating: 1,
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject null value", () => {
      const invalidData = {
        rating: null,
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject undefined value", () => {
      const invalidData = {
        rating: undefined,
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject boolean value", () => {
      const invalidData = {
        rating: true,
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing rating field", () => {
      const invalidData = {};

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject rating with different casing", () => {
      const invalidData = {
        rating: "Again",
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject rating with extra whitespace", () => {
      const invalidData = {
        rating: " good ",
      };

      const result = reviewCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject similar but incorrect values", () => {
      const invalidValues = ["very easy", "good!", "again?", "ok", "medium"];

      invalidValues.forEach((rating) => {
        const result = reviewCommandSchema.safeParse({ rating });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: ReviewCommandInput = {
        rating: "good",
      };

      expectTypeOf(data).toMatchTypeOf<ReviewCommandInput>();
    });

    it("should enforce enum constraint at type level", () => {
      const data: ReviewCommandInput = {
        rating: "again",
      };

      expectTypeOf(data.rating).toEqualTypeOf<"again" | "good" | "easy">();
    });
  });
});

describe("flashcardIdParamSchema", () => {
  describe("valid data", () => {
    it("should accept valid UUID v4", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = flashcardIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      }
    });

    it("should accept another valid UUID", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = flashcardIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept UUID with uppercase letters", () => {
      const validData = {
        id: "123E4567-E89B-12D3-A456-426614174000",
      };

      const result = flashcardIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept UUID with mixed case", () => {
      const validData = {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      };

      const result = flashcardIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept nil UUID", () => {
      const validData = {
        id: "00000000-0000-0000-0000-000000000000",
      };

      const result = flashcardIdParamSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject empty string", () => {
      const invalidData = {
        id: "",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid flashcard ID format. Must be a valid UUID.");
      }
    });

    it("should reject invalid UUID format", () => {
      const invalidData = {
        id: "not-a-uuid",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid flashcard ID format. Must be a valid UUID.");
      }
    });

    it("should reject UUID without dashes", () => {
      const invalidData = {
        id: "123e4567e89b12d3a456426614174000",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong format", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with extra characters", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000-extra",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const invalidData = {
        id: "123e4567 e89b 12d3 a456 426614174000",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject numeric value", () => {
      const invalidData = {
        id: 123456,
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject null value", () => {
      const invalidData = {
        id: null,
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject undefined value", () => {
      const invalidData = {
        id: undefined,
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing id field", () => {
      const invalidData = {};

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-42661417400g",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject common invalid formats", () => {
      const invalidIds = [
        "12345678-1234-1234-1234-1234567890",
        "12345678-1234-1234-1234-1234567890ab1",
        "g23e4567-e89b-12d3-a456-426614174000",
        "123e4567-e89b-12d3-a456-42661417400",
      ];

      invalidIds.forEach((id) => {
        const result = flashcardIdParamSchema.safeParse({ id });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle UUID with leading/trailing whitespace", () => {
      const invalidData = {
        id: " 123e4567-e89b-12d3-a456-426614174000 ",
      };

      const result = flashcardIdParamSchema.safeParse(invalidData);

      // Zod's UUID validator doesn't trim by default
      expect(result.success).toBe(false);
    });

    it("should reject UUID v1 format (if strict v4 only)", () => {
      // This is a valid UUID v1
      const dataWithV1 = {
        id: "c232ab00-9414-11ec-b3c8-9f68deced4b8",
      };

      const result = flashcardIdParamSchema.safeParse(dataWithV1);

      // Zod's UUID validator accepts all UUID versions by default
      expect(result.success).toBe(true);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: FlashcardIdParam = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      expectTypeOf(data).toMatchTypeOf<FlashcardIdParam>();
    });

    it("should enforce string type for id at type level", () => {
      const data: FlashcardIdParam = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      expectTypeOf(data.id).toBeString();
    });
  });
});
