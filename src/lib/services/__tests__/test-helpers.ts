/**
 * Test helpers and type definitions for service tests
 */

import { vi } from "vitest";

/**
 * Type-safe mock for Supabase query builder chain
 */
export interface MockQueryBuilder {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

/**
 * Creates a chainable mock query builder with fluent API support
 */
export function createMockQueryBuilder(): MockQueryBuilder {
  return {
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
  };
}

/**
 * Type for mock context used in chained calls
 */
export type MockContext = Record<string, unknown>;

/**
 * Helper to create a function that returns its context (for chaining)
 */
export function createChainableFunction() {
  return vi.fn(function (this: MockContext) {
    return this;
  });
}
