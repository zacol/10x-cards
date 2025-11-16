import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcards,
  getFlashcardById,
  updateFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  FlashcardNotFoundError,
} from "../flashcards.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateFlashcardCommand } from "@/types";
import type { GetFlashcardsQuery, FlashcardUpsert } from "@/pages/api/flashcards/flashcards.schema";
import type { MockContext } from "./test-helpers";

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      delete: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn(),
      update: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    })),
  } as unknown as SupabaseClient;
};

const mockFlashcardData = {
  id: "fc-123",
  user_id: "user-123",
  front: "Question",
  back: "Answer",
  created_by_ai: false,
  generation_id: null,
  repetition: 0,
  interval: 1,
  efactor: 2.5,
  due_date: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("flashcards.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe("FlashcardNotFoundError", () => {
    it("should create error with default message", () => {
      const error = new FlashcardNotFoundError();
      expect(error.name).toBe("FlashcardNotFoundError");
      expect(error.message).toBe("Flashcard not found or access denied");
    });

    it("should create error with custom message", () => {
      const error = new FlashcardNotFoundError("Custom message");
      expect(error.name).toBe("FlashcardNotFoundError");
      expect(error.message).toBe("Custom message");
    });
  });

  describe("createFlashcard", () => {
    it("should create a new flashcard successfully", async () => {
      const cmd: CreateFlashcardCommand = {
        userId: "user-123",
        front: "What is React?",
        back: "A JavaScript library",
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFlashcardData, error: null }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await createFlashcard(cmd, mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: cmd.userId,
        front: cmd.front,
        back: cmd.back,
        created_by_ai: false,
      });
      expect(result).toEqual(mockFlashcardData);
    });

    it("should throw error when insert fails", async () => {
      const cmd: CreateFlashcardCommand = {
        userId: "user-123",
        front: "Test",
        back: "Test answer",
      };

      const mockError = { message: "Database error", code: "DB_ERROR" };
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(createFlashcard(cmd, mockSupabase)).rejects.toEqual(mockError);
    });
  });

  describe("deleteFlashcard", () => {
    it("should delete flashcard successfully", async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null, count: 1 }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      await deleteFlashcard("fc-123", "user-123", mockSupabase);

      expect(mockQuery.delete).toHaveBeenCalledWith({ count: "exact" });
      expect(mockQuery.match).toHaveBeenCalledWith({ id: "fc-123", user_id: "user-123" });
    });

    it("should throw FlashcardNotFoundError when count is 0", async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(deleteFlashcard("fc-123", "user-123", mockSupabase)).rejects.toThrow(FlashcardNotFoundError);
    });

    it("should throw error when database operation fails", async () => {
      const mockError = { message: "DB error", code: "ERROR" };
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: mockError, count: null }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(deleteFlashcard("fc-123", "user-123", mockSupabase)).rejects.toEqual(mockError);
    });
  });

  describe("getFlashcards", () => {
    it("should retrieve flashcards with default pagination", async () => {
      const userId = "user-123";
      const query: GetFlashcardsQuery = {};

      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockFlashcardData], error: null }),
      };

      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
      };

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockDataQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockCountQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await getFlashcards(userId, query, mockSupabase);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty("user_id");
      expect(result.pagination).toEqual({
        total: 1,
        limit: 50,
        offset: 0,
        has_more: false,
      });
    });

    it("should apply filters and sorting", async () => {
      const query: GetFlashcardsQuery = {
        limit: 10,
        offset: 20,
        sort: "updated_at",
        order: "asc",
        created_by_ai: true,
        generation_id: "gen-123",
      };

      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn(function (this: MockContext) {
          return this;
        }),
      };

      // Override the last call to eq to return a resolved promise
      const mockEq = mockCountQuery.eq as ReturnType<typeof vi.fn>;
      mockEq
        .mockImplementationOnce(function (this: MockContext) {
          return this;
        })
        .mockImplementationOnce(function (this: MockContext) {
          return this;
        })
        .mockImplementationOnce(() => {
          return Promise.resolve({ error: null, count: 100 });
        });

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockDataQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockCountQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await getFlashcards("user-123", query, mockSupabase);

      expect(mockDataQuery.eq).toHaveBeenCalledWith("created_by_ai", true);
      expect(mockDataQuery.eq).toHaveBeenCalledWith("generation_id", "gen-123");
      expect(mockDataQuery.order).toHaveBeenCalledWith("updated_at", { ascending: true });
      expect(result.pagination.has_more).toBe(true);
    });
  });

  describe("getFlashcardById", () => {
    it("should retrieve flashcard by id", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFlashcardData, error: null }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await getFlashcardById("fc-123", "user-123", mockSupabase);

      expect(mockQuery.match).toHaveBeenCalledWith({ id: "fc-123", user_id: "user-123" });
      expect(result).toEqual(mockFlashcardData);
    });

    it("should return null when not found (PGRST116)", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows" },
        }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await getFlashcardById("fc-123", "user-123", mockSupabase);

      expect(result).toBeNull();
    });
  });

  describe("updateFlashcard", () => {
    it("should update flashcard successfully", async () => {
      const payload: FlashcardUpsert = { front: "Updated", back: "Updated answer" };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockFlashcardData, ...payload }, error: null }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await updateFlashcard("fc-123", "user-123", payload, mockSupabase);

      expect(mockQuery.update).toHaveBeenCalledWith(payload);
      expect(result?.front).toBe("Updated");
    });
  });

  describe("getDueFlashcards", () => {
    it("should retrieve due flashcards", async () => {
      const now = new Date();
      const mockDueCards = [
        { ...mockFlashcardData, due_date: now.toISOString() },
        { ...mockFlashcardData, id: "fc-2", due_date: now.toISOString() },
      ];

      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ error: null, count: 2 }),
      };

      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockDueCards, error: null }),
      };

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockCountQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockDataQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await getDueFlashcards("user-123", 20, mockSupabase);

      expect(result.data).toHaveLength(2);
      expect(result.total_due).toBe(2);
      expect(mockDataQuery.order).toHaveBeenCalledWith("due_date", { ascending: true });
    });
  });

  describe("reviewFlashcard - SM-2 Algorithm", () => {
    it("should reset progress with 'again' rating (quality 0)", async () => {
      const existingCard = { ...mockFlashcardData, repetition: 5, interval: 30, efactor: 2.8 };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingCard, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fc-123", repetition: 0, interval: 1, efactor: 2.8, due_date: "", updated_at: "" },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockSelectQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockUpdateQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await reviewFlashcard("fc-123", "user-123", "again", mockSupabase);

      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("should calculate SM-2 for 'good' rating - first repetition", async () => {
      const existingCard = { ...mockFlashcardData, repetition: 0, interval: 1, efactor: 2.5 };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingCard, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fc-123", repetition: 1, interval: 1, efactor: 2.36, due_date: "", updated_at: "" },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockSelectQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockUpdateQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await reviewFlashcard("fc-123", "user-123", "good", mockSupabase);

      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1);
    });

    it("should calculate SM-2 for 'easy' rating", async () => {
      const existingCard = { ...mockFlashcardData, repetition: 1, interval: 1, efactor: 2.5 };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingCard, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fc-123", repetition: 2, interval: 6, efactor: 2.6, due_date: "", updated_at: "" },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce(mockSelectQuery as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(mockUpdateQuery as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await reviewFlashcard("fc-123", "user-123", "easy", mockSupabase);

      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(6);
    });

    it("should throw FlashcardNotFoundError when flashcard not found", async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.spyOn(mockSupabase, "from").mockReturnValue(mockSelectQuery as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(reviewFlashcard("fc-123", "user-123", "good", mockSupabase)).rejects.toThrow(FlashcardNotFoundError);
    });
  });
});
