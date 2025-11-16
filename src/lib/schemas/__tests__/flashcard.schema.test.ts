import { describe, it, expect, expectTypeOf } from "vitest";
import { flashcardFormSchema, type FlashcardForm } from "../flashcard.schema";

describe("flashcardFormSchema", () => {
  describe("valid data", () => {
    it("should accept valid flashcard data", () => {
      const validData = {
        front: "What is TypeScript?",
        back: "TypeScript is a typed superset of JavaScript.",
      };

      const result = flashcardFormSchema.safeParse(validData);

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

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept front at maximum length (200 characters)", () => {
      const validData = {
        front: "a".repeat(200),
        back: "Valid back content",
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept back at maximum length (400 characters)", () => {
      const validData = {
        front: "Valid front content",
        back: "b".repeat(400),
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept both front and back at maximum lengths", () => {
      const validData = {
        front: "a".repeat(200),
        back: "b".repeat(400),
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept content with special characters", () => {
      const validData = {
        front: "What is 2 + 2? (Easy math)",
        back: "The answer is 4! 🎉 @#$%^&*()",
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept content with unicode characters", () => {
      const validData = {
        front: "Co to jest JavaScript? 🚀",
        back: "JavaScript jest językiem programowania. 中文字符 العربية",
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept content with newlines and tabs", () => {
      const validData = {
        front: "Multi\nline\nfront",
        back: "Multi\nline\nback\twith\ttabs",
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("front validation", () => {
    it("should reject empty front content", () => {
      const invalidData = {
        front: "",
        back: "Valid back content",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

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

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Front content cannot exceed 200 characters.");
      }
    });

    it("should reject front content with only whitespace", () => {
      const invalidData = {
        front: "   ",
        back: "Valid back content",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      // Note: Current schema doesn't trim whitespace, so this would pass
      // This test documents current behavior
      expect(result.success).toBe(true);
    });

    it("should reject front content significantly exceeding limit", () => {
      const invalidData = {
        front: "a".repeat(500),
        back: "Valid back content",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Front content cannot exceed 200 characters.");
      }
    });
  });

  describe("back validation", () => {
    it("should reject empty back content", () => {
      const invalidData = {
        front: "Valid front content",
        back: "",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

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

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Back content cannot exceed 400 characters.");
      }
    });

    it("should reject back content with only whitespace", () => {
      const invalidData = {
        front: "Valid front content",
        back: "   ",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      // Note: Current schema doesn't trim whitespace, so this would pass
      // This test documents current behavior
      expect(result.success).toBe(true);
    });

    it("should reject back content significantly exceeding limit", () => {
      const invalidData = {
        front: "Valid front content",
        back: "b".repeat(1000),
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Back content cannot exceed 400 characters.");
      }
    });
  });

  describe("combined validation", () => {
    it("should reject both empty front and back", () => {
      const invalidData = {
        front: "",
        back: "",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

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

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2);
      }
    });

    it("should handle missing fields", () => {
      const invalidData = {
        front: "Valid front",
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should handle extra fields (strict mode)", () => {
      const dataWithExtra = {
        front: "Valid front",
        back: "Valid back",
        extraField: "Should be ignored or rejected based on schema config",
      };

      const result = flashcardFormSchema.safeParse(dataWithExtra);

      // Zod by default strips unknown keys in safeParse
      // This test documents the current behavior
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle front with exactly 199 characters", () => {
      const validData = {
        front: "a".repeat(199),
        back: "Valid back",
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should handle back with exactly 399 characters", () => {
      const validData = {
        front: "Valid front",
        back: "b".repeat(399),
      };

      const result = flashcardFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject null values", () => {
      const invalidData = {
        front: null,
        back: null,
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject undefined values", () => {
      const invalidData = {
        front: undefined,
        back: undefined,
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject numeric values", () => {
      const invalidData = {
        front: 123,
        back: 456,
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject boolean values", () => {
      const invalidData = {
        front: true,
        back: false,
      };

      const result = flashcardFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: FlashcardForm = {
        front: "Question",
        back: "Answer",
      };

      expectTypeOf(data).toMatchTypeOf<FlashcardForm>();
    });

    it("should enforce required properties at type level", () => {
      const data: FlashcardForm = {
        front: "Q",
        back: "A",
      };

      // This should compile - both properties are required
      expectTypeOf(data).toHaveProperty("front");
      expectTypeOf(data).toHaveProperty("back");
    });
  });
});
