# REST API Plan for 10xCards

## 1. Resources

### 1.1. Flashcards

- **Database Table**: `public.flashcards`
- **Description**: Individual flashcard entities with front/back content and spaced repetition metadata
- **Ownership**: User-scoped via RLS policies

### 1.2. Generations

- **Database Table**: `public.generations`
- **Description**: Immutable records of AI flashcard generation events with metadata
- **Ownership**: User-scoped via RLS policies

### 1.3. Authentication

- **Database Table**: `auth.users` (Supabase managed)
- **Description**: User accounts and session management
- **Provider**: Supabase Auth

## 2. Endpoints

### 2.1. Authentication

#### Register User

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Description**: Create a new user account with email and password
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

- **Success Response** (201 Created):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid email format or password too short
  - `409 Conflict`: Email already registered

#### Login User

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Description**: Authenticate user and create session
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

- **Success Response** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Missing credentials
  - `401 Unauthorized`: Invalid credentials

#### Logout User

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Description**: Invalidate current session
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token

### 2.2. Flashcards - Manual Management

#### Create Flashcard

- **Method**: `POST`
- **Path**: `/api/flashcards`
- **Description**: Create a new flashcard manually
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```

- **Success Response** (201 Created):

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "created_by_ai": false,
  "generation_id": null,
  "repetition": 0,
  "interval": 0,
  "efactor": 2.5,
  "due_date": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation failed (front > 200 chars, back > 400 chars, empty fields)
  - `401 Unauthorized`: Not authenticated

#### List Flashcards

- **Method**: `GET`
- **Path**: `/api/flashcards`
- **Description**: Get paginated list of user's flashcards
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `limit` (optional, default: 50, max: 100): Number of items per page
  - `offset` (optional, default: 0): Number of items to skip
  - `sort` (optional, default: "created_at", values: "created_at", "updated_at", "due_date"): Sort field
  - `order` (optional, default: "desc", values: "asc", "desc"): Sort order
  - `created_by_ai` (optional, values: "true", "false"): Filter by AI-generated flag
  - `generation_id` (optional): Filter by specific generation
- **Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is the capital of France?",
      "back": "Paris",
      "created_by_ai": false,
      "generation_id": null,
      "repetition": 2,
      "interval": 3,
      "efactor": 2.6,
      "due_date": "2024-01-05T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-03T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

#### Get Single Flashcard

- **Method**: `GET`
- **Path**: `/api/flashcards/{id}`
- **Description**: Get details of a specific flashcard
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):

```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "created_by_ai": false,
  "generation_id": null,
  "repetition": 2,
  "interval": 3,
  "efactor": 2.6,
  "due_date": "2024-01-05T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T00:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found or not owned by user

#### Update Flashcard

- **Method**: `PATCH`
- **Path**: `/api/flashcards/{id}`
- **Description**: Update flashcard content (front/back only, not SM-2 fields)
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris, the City of Light"
}
```

- **Success Response** (200 OK):

```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris, the City of Light",
  "created_by_ai": false,
  "generation_id": null,
  "repetition": 2,
  "interval": 3,
  "efactor": 2.6,
  "due_date": "2024-01-05T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-03T10:30:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found or not owned by user

#### Delete Flashcard

- **Method**: `DELETE`
- **Path**: `/api/flashcards/{id}`
- **Description**: Permanently delete a flashcard
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found or not owned by user

### 2.3. Flashcards - Learning Session

#### Get Due Flashcards

- **Method**: `GET`
- **Path**: `/api/flashcards/due`
- **Description**: Get flashcards due for review (due_date <= now)
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `limit` (optional, default: 20, max: 100): Maximum number of cards to return
- **Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is the capital of France?",
      "back": "Paris",
      "repetition": 2,
      "interval": 3,
      "efactor": 2.6,
      "due_date": "2024-01-03T00:00:00Z"
    }
  ],
  "total_due": 15
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

#### Submit Review

- **Method**: `POST`
- **Path**: `/api/flashcards/{id}/review`
- **Description**: Submit review rating and update SM-2 algorithm fields
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "rating": "easy"
}
```

- **Rating Values**:
  - `"again"`: Don't know (quality: 0-1)
  - `"good"`: Know (quality: 3-4)
  - `"easy"`: Very easy (quality: 5)
- **Success Response** (200 OK):

```json
{
  "id": "uuid",
  "repetition": 3,
  "interval": 7,
  "efactor": 2.7,
  "due_date": "2024-01-10T00:00:00Z",
  "updated_at": "2024-01-03T10:30:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid rating value
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Flashcard not found or not owned by user

### 2.4. AI Generation

#### Generate Flashcards

- **Method**: `POST`
- **Path**: `/api/generations`
- **Description**: Generate flashcard proposals using AI
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "source_text": "Long text content here... (1000-10000 characters)",
  "context": "History of France"
}
```

- **Success Response** (201 Created):

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "source_text": "Long text content...",
  "context": "History of France",
  "ai_model": "gpt-4",
  "generation_time_ms": 3500,
  "flashcards_generated_count": 12,
  "cost": 0.025,
  "created_at": "2024-01-01T00:00:00Z",
  "proposals": [
    {
      "index": 0,
      "front": "What is the capital of France?",
      "back": "Paris"
    },
    {
      "index": 1,
      "front": "When was the French Revolution?",
      "back": "1789-1799"
    }
  ]
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation failed (source_text length invalid)
  - `401 Unauthorized`: Not authenticated
  - `429 Too Many Requests`: Rate limit exceeded
  - `500 Internal Server Error`: AI API error
  - `503 Service Unavailable`: AI service temporarily unavailable

#### Edit Generation Proposal

- **Method**: `PATCH`
- **Path**: `/api/generations/{id}/proposals/{index}`
- **Description**: Edit a flashcard proposal before accepting
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "front": "What is the capital city of France?",
  "back": "Paris, the City of Light"
}
```

- **Success Response** (200 OK):

```json
{
  "index": 0,
  "front": "What is the capital city of France?",
  "back": "Paris, the City of Light"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation or proposal not found
  - `409 Conflict`: Generation already accepted

#### Delete Generation Proposal

- **Method**: `DELETE`
- **Path**: `/api/generations/{id}/proposals/{index}`
- **Description**: Remove a flashcard proposal before accepting
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation or proposal not found
  - `409 Conflict`: Generation already accepted

#### Accept Generation

- **Method**: `POST`
- **Path**: `/api/generations/{id}/accept`
- **Description**: Save all remaining proposals as flashcards
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):

```json
{
  "generation_id": "uuid",
  "flashcards_created": 10,
  "flashcard_ids": ["uuid1", "uuid2", "uuid3"]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation not found
  - `409 Conflict`: Generation already accepted

#### List Generations

- **Method**: `GET`
- **Path**: `/api/generations`
- **Description**: Get user's generation history
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `limit` (optional, default: 20, max: 100): Number of items per page
  - `offset` (optional, default: 0): Number of items to skip
- **Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "source_text": "Long text...",
      "context": "History of France",
      "ai_model": "gpt-4",
      "generation_time_ms": 3500,
      "flashcards_generated_count": 12,
      "cost": 0.025,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

#### Get Single Generation

- **Method**: `GET`
- **Path**: `/api/generations/{id}`
- **Description**: Get details of a specific generation event
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):

```json
{
  "id": "uuid",
  "source_text": "Long text...",
  "context": "History of France",
  "ai_model": "gpt-4",
  "generation_time_ms": 3500,
  "flashcards_generated_count": 12,
  "cost": 0.025,
  "created_at": "2024-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation not found

#### Get Generation Flashcards

- **Method**: `GET`
- **Path**: `/api/generations/{id}/flashcards`
- **Description**: Get all flashcards created from a specific generation
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):

```json
{
  "generation_id": "uuid",
  "data": [
    {
      "id": "uuid",
      "front": "What is the capital of France?",
      "back": "Paris",
      "created_by_ai": true,
      "repetition": 0,
      "interval": 0,
      "efactor": 2.5,
      "due_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 12
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Generation not found

### 2.5. Statistics and Analytics

#### Get User Statistics

- **Method**: `GET`
- **Path**: `/api/stats`
- **Description**: Get aggregate statistics for the authenticated user
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):

```json
{
  "flashcards": {
    "total": 150,
    "ai_generated": 112,
    "manual": 38,
    "ai_utilization_rate": 0.747
  },
  "learning": {
    "total_reviews": 450,
    "cards_due_today": 15,
    "cards_mastered": 45
  },
  "generations": {
    "total_generations": 25,
    "total_cost": 0.625,
    "average_generation_time_ms": 3200,
    "ai_acceptance_rate": 0.783
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

- **Provider**: Supabase Auth
- **Method**: JWT-based authentication
- **Token Type**: Bearer tokens
- **Token Lifetime**: Configurable (default: 1 hour for access token)
- **Refresh Mechanism**: Refresh tokens with longer lifetime (default: 30 days)

### 3.2. Authorization Implementation

- **Row-Level Security (RLS)**: Enabled on all tables
- **Policy Enforcement**: Database-level via PostgreSQL RLS policies
- **User Context**: Passed via Supabase client with authenticated session
- **Ownership Validation**: `auth.uid() = user_id` condition in all policies

### 3.3. API Security Headers

All API endpoints require:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 3.4. Anonymous Access

- All endpoints except `/api/auth/register` and `/api/auth/login` require authentication
- Anonymous users receive `401 Unauthorized` for protected endpoints
- RLS policies deny all operations for `anon` role

## 4. Validation and Business Logic

### 4.1. Flashcard Validation Rules

#### Front Field

- **Required**: Yes
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 200 characters
- **Validation**: Non-empty, trimmed

#### Back Field

- **Required**: Yes
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 400 characters
- **Validation**: Non-empty, trimmed

#### Created By AI Flag

- **Type**: Boolean
- **Default**: `false` for manual creation
- **Immutable**: Cannot be changed after creation
- **Auto-set**: `true` when created via generation acceptance

#### Generation ID

- **Type**: UUID or null
- **Validation**: Must exist in `generations` table if provided
- **Auto-set**: Populated when created via generation acceptance
- **Nullable**: `true` for manually created flashcards

### 4.2. Generation Validation Rules

#### Source Text

- **Required**: Yes
- **Type**: String
- **Min Length**: 1000 characters
- **Max Length**: 10000 characters
- **Validation**: Character count within range

#### Context

- **Required**: No
- **Type**: String
- **Max Length**: No limit (reasonable limit: 500 characters)
- **Validation**: Optional field for improving AI quality

#### AI Model

- **Required**: Yes (auto-populated by system)
- **Type**: String
- **Values**: System-defined (e.g., "gpt-4", "claude-3")
- **Fallback**: Secondary model if primary fails

### 4.3. Review Rating Validation

#### Rating Values

- **Type**: Enum
- **Allowed Values**:
  - `"again"`: Maps to SM-2 quality 0-1 (failed recall)
  - `"good"`: Maps to SM-2 quality 3-4 (successful recall with effort)
  - `"easy"`: Maps to SM-2 quality 5 (perfect recall)
- **Validation**: Must be one of the allowed values

### 4.4. SM-2 Algorithm Business Logic

#### Algorithm Implementation

- **Library**: Use open-source SM-2 implementation (e.g., `supermemo2` npm package)
- **Fields Updated**: `repetition`, `interval`, `efactor`, `due_date`
- **Trigger**: On review submission via `POST /api/flashcards/{id}/review`

#### Field Updates

- **Repetition**: Incremented on successful recall, reset to 0 on failure
- **Interval**: Calculated based on repetition and efactor
- **Efactor**: Adjusted based on recall quality (min: 1.3)
- **Due Date**: Current date + interval (in days)

### 4.5. Generation Acceptance Logic

#### Workflow

1. User generates flashcards → proposals stored in memory/cache
2. User edits/deletes proposals → modifications tracked
3. User accepts → remaining proposals saved to `flashcards` table
4. Generation record created in `generations` table with final count

#### Proposal State Management

- **Storage**: Server-side session or Redis cache (temporary)
- **Lifetime**: 1 hour (auto-expire if not accepted)
- **Modifications**: Tracked until acceptance
- **Atomicity**: All remaining proposals saved in single transaction

### 4.6. Error Handling Standards

#### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front field exceeds maximum length of 200 characters",
    "details": {
      "field": "front",
      "constraint": "max_length",
      "value": 200
    }
  }
}
```

#### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication failed or missing
- `AUTHORIZATION_ERROR`: User not authorized for resource
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource state conflict
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AI_SERVICE_ERROR`: AI generation failed
- `INTERNAL_ERROR`: Unexpected server error

### 4.7. Rate Limiting

#### Generation Endpoint

- **Limit**: 10 requests per hour per user
- **Reason**: Prevent abuse of expensive AI API calls
- **Response**: `429 Too Many Requests` with `Retry-After` header

#### Other Endpoints

- **Limit**: 100 requests per minute per user
- **Reason**: General API protection
- **Response**: `429 Too Many Requests` with `Retry-After` header

### 4.8. Pagination Standards

#### Query Parameters

- `limit`: Number of items (default: 20-50, max: 100)
- `offset`: Number of items to skip (default: 0)

#### Response Format

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### 4.9. Sorting and Filtering

#### Flashcards Sorting

- **Fields**: `created_at`, `updated_at`, `due_date`
- **Order**: `asc`, `desc`
- **Default**: `created_at desc`

#### Flashcards Filtering

- **created_by_ai**: Boolean filter
- **generation_id**: UUID filter
- **due_date**: Date range filter (for learning session)

### 4.10. Data Integrity

#### Cascade Deletion

- User deleted → All flashcards and generations deleted (via RLS)
- Generation deleted → Flashcards remain, `generation_id` set to NULL

#### Immutability

- Generations table: No updates allowed after creation
- Flashcard SM-2 fields: Only updated via review endpoint
- `created_by_ai` flag: Immutable after creation

### 4.11. Analytics Calculations

#### AI Acceptance Rate

```
(flashcards_generated_count - edited_count - deleted_count) / flashcards_generated_count
```

- Tracked per generation
- "Edited" defined as modified within 5 minutes of creation
- Target: 75% acceptance rate

#### AI Utilization Rate

```
COUNT(flashcards WHERE created_by_ai = true) / COUNT(all flashcards)
```

- Global metric across all users
- Target: 75% of flashcards AI-generated

## 5. Implementation Notes

### 5.1. Technology Stack Alignment

- **Astro 5**: API routes in `src/pages/api/`
- **TypeScript 5**: Strict typing for request/response schemas
- **Supabase**: Client initialization with user context
- **Zod**: Input validation schemas
- **OpenRouter.ai**: AI generation service integration

### 5.2. API Route Structure

```
src/pages/api/
├── auth/
│   ├── register.ts
│   ├── login.ts
│   └── logout.ts
├── flashcards/
│   ├── index.ts (GET, POST)
│   ├── [id].ts (GET, PATCH, DELETE)
│   ├── due.ts (GET)
│   └── [id]/review.ts (POST)
├── generations/
│   ├── index.ts (GET, POST)
│   ├── [id].ts (GET)
│   ├── [id]/proposals/[index].ts (PATCH, DELETE)
│   ├── [id]/accept.ts (POST)
│   └── [id]/flashcards.ts (GET)
└── stats.ts (GET)
```

### 5.3. Service Layer Organization

```
src/lib/services/
├── auth.service.ts
├── flashcards.service.ts
├── generations.service.ts
├── learning.service.ts
├── sm2.service.ts
└── stats.service.ts
```

### 5.4. Type Definitions

```
src/types.ts
├── Flashcard (entity)
├── Generation (entity)
├── FlashcardDTO (data transfer)
├── GenerationDTO (data transfer)
├── ReviewRequest
├── GenerateRequest
└── Error responses
```

### 5.5. Middleware

```
src/middleware/index.ts
├── Authentication check
├── Rate limiting
├── Request validation
└── Error handling
```
