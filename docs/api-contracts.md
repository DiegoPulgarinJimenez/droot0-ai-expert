# AI Expert Chat — API Contract v1

**Status:** Agreed contract for the first implementation phase.
**Version:** `v1`
**Audience:** Developer 1 (frontend) and Developer 2 (backend).
**Source of truth:** This document and the shared schemas in `src/lib/contracts/`.

The backend and frontend must not invent endpoint behavior outside this contract. Any breaking change requires a coordinated update to this document, the shared schemas, and the frontend API client.

---

## 1. General conventions

### Base path

All application endpoints are relative to the application origin:

```text
/api/...
```

### Authentication

Authentication uses a server-side session stored in an HttpOnly cookie.

- The frontend does not receive or store access tokens.
- The frontend must call `GET /api/auth/me` to obtain the current user.
- The frontend must never trust a role stored in client-side editable state.
- Protected endpoints return `401 UNAUTHENTICATED` when there is no valid session.
- ADMIN endpoints return `403 FORBIDDEN` when the session user is not an ADMIN.

### Identifiers

All entity identifiers are UUID strings.

### Dates

All timestamps are ISO 8601 strings in UTC, for example:

```text
2026-11-06T09:05:00.000Z
```

### Content types

Request and response bodies use:

```text
Content-Type: application/json
```

### Success envelope

All successful JSON responses use:

```json
{
  "data": {}
}
```

### Error envelope

All error responses use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "fieldErrors": {
      "content": ["Message cannot be empty."]
    }
  }
}
```

`fieldErrors` is optional and is intended for form and input validation.

### Error codes

| Code                | HTTP status | Meaning                                             |
| ------------------- | ----------: | --------------------------------------------------- |
| `VALIDATION_ERROR`  |         422 | Request body or query parameters are invalid        |
| `UNAUTHENTICATED`   |         401 | No valid session                                    |
| `FORBIDDEN`         |         403 | Session exists but the role is insufficient         |
| `NOT_FOUND`         |         404 | Resource does not exist or is not owned by the user |
| `CONFLICT`          |         409 | Request conflicts with current state                |
| `RATE_LIMITED`      |         429 | Too many requests or provider rate limit            |
| `AI_PROVIDER_ERROR` |         502 | DeepSeek returned an error                          |
| `AI_TIMEOUT`        |         504 | DeepSeek did not respond in time                    |
| `INTERNAL_ERROR`    |         500 | Unexpected server failure                           |

Ownership failures return `404`, not `403`, to avoid revealing whether another user's conversation exists.

### Validation

- Shared Zod schemas live in `src/lib/contracts/`.
- Shared TypeScript types are inferred from those schemas.
- Unknown request fields are stripped by default.
- Request limits are documented with each endpoint.

### Content limits

| Field                  | Limit                  |
| ---------------------- | ---------------------- |
| Display name           | 2–80 characters        |
| Email                  | 254 characters maximum |
| Password               | 8–128 characters       |
| Conversation title     | 1–120 characters       |
| Chat input             | 1–8,000 characters     |
| Stored message content | 1–50,000 characters    |
| System prompt          | 1–20,000 characters    |
| Model name             | 1–100 characters       |
| Temperature            | 0–2                    |
| Max tokens             | 1–8,192                |

---

## 2. Authentication endpoints

### `POST /api/auth/register`

Creates an account and a public user profile.

**Auth:** Public.

**Request:**

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct-horse-battery-staple"
}
```

**Success — `201`:**

```json
{
  "data": {
    "user": {
      "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "USER",
      "createdAt": "2026-11-06T09:00:00.000Z"
    },
    "requiresEmailConfirmation": false
  }
}
```

**Behavior:**

- New accounts always receive the `USER` role.
- If email confirmation is enabled, `requiresEmailConfirmation` is `true` and the user must confirm before signing in.
- The demo environment may disable email confirmation.
- Duplicate email addresses return `409 CONFLICT`.
- Invalid input returns `422 VALIDATION_ERROR`.

---

### `POST /api/auth/login`

Creates a session for an existing user.

**Auth:** Public.

**Request:**

```json
{
  "email": "ada@example.com",
  "password": "correct-horse-battery-staple"
}
```

**Success — `200`:**

```json
{
  "data": {
    "user": {
      "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "USER",
      "createdAt": "2026-11-06T09:00:00.000Z"
    }
  }
}
```

**Behavior:**

- Invalid credentials return `401 UNAUTHENTICATED` with a generic message.
- The session cookie is set by the backend.
- The frontend redirects only to a validated internal `returnTo` path.
- Rate-limited login attempts return `429 RATE_LIMITED`.

---

### `POST /api/auth/logout`

Clears the current session.

**Auth:** Authenticated.

**Success — `200`:**

```json
{
  "data": {
    "success": true
  }
}
```

---

### `GET /api/auth/me`

Returns the current authenticated user.

**Auth:** Authenticated.

**Success — `200`:**

```json
{
  "data": {
    "user": {
      "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "USER",
      "createdAt": "2026-11-06T09:00:00.000Z"
    }
  }
}
```

**Errors:**

- `401 UNAUTHENTICATED` when there is no valid session.

---

## 3. Conversation endpoints

### `GET /api/conversations`

Returns the authenticated user's conversations.

**Auth:** Authenticated.

**Query parameters:**

| Name    | Type    | Default | Limit |
| ------- | ------- | ------: | ----- |
| `limit` | integer |    `20` | 1–100 |

**Success — `200`:**

```json
{
  "data": {
    "conversations": [
      {
        "id": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
        "title": "Explain JavaScript closures",
        "createdAt": "2026-11-06T09:05:00.000Z",
        "updatedAt": "2026-11-06T09:06:00.000Z",
        "messageCount": 2
      }
    ]
  }
}
```

**Behavior:**

- Only conversations owned by the authenticated user are returned.
- Conversations are ordered by `updatedAt` descending.
- Cursor pagination is not part of v1. The `limit` parameter is the bounded page size.

---

### `GET /api/conversations/:id`

Returns one owned conversation and its messages.

**Auth:** Authenticated, owner only.

**Success — `200`:**

```json
{
  "data": {
    "conversation": {
      "id": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
      "title": "Explain JavaScript closures",
      "createdAt": "2026-11-06T09:05:00.000Z",
      "updatedAt": "2026-11-06T09:06:00.000Z",
      "messageCount": 2
    },
    "messages": [
      {
        "id": "c4f2d3e5-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
        "role": "USER",
        "content": "Can you explain JavaScript closures with a small example?",
        "createdAt": "2026-11-06T09:05:00.000Z"
      },
      {
        "id": "d5a3e4f6-7b8c-4d9e-af10-2b3c4d5e6f70",
        "role": "ASSISTANT",
        "content": "A closure is a function that keeps access to variables from the scope where it was created...",
        "createdAt": "2026-11-06T09:06:00.000Z"
      }
    ]
  }
}
```

**Behavior:**

- Messages are ordered by `createdAt` ascending.
- V1 returns a maximum of the most recent 200 messages.
- If the conversation does not exist or belongs to another user, return `404 NOT_FOUND`.
- Older-message pagination is a documented future enhancement.

---

### `PATCH /api/conversations/:id`

Renames an owned conversation.

**Auth:** Authenticated, owner only.

**Request:**

```json
{
  "title": "JavaScript closures and scope"
}
```

**Success — `200`:**

```json
{
  "data": {
    "conversation": {
      "id": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
      "title": "JavaScript closures and scope",
      "createdAt": "2026-11-06T09:05:00.000Z",
      "updatedAt": "2026-11-06T09:10:00.000Z",
      "messageCount": 2
    }
  }
}
```

**Errors:**

- `422 VALIDATION_ERROR` for an invalid title.
- `404 NOT_FOUND` when the conversation is missing or not owned.

---

### `DELETE /api/conversations/:id`

Deletes an owned conversation and all of its messages.

**Auth:** Authenticated, owner only.

**Success — `200`:**

```json
{
  "data": {
    "success": true
  }
}
```

**Behavior:**

- Deletes the conversation and its messages.
- Returns `404 NOT_FOUND` when the conversation is missing or not owned.

---

## 4. Chat endpoint

### `POST /api/chat`

Sends a user message and returns the persisted user message plus the assistant response.

**Auth:** Authenticated.

**Request:**

```json
{
  "conversationId": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  "content": "Explain the difference between let and const."
}
```

To create a new conversation, omit `conversationId` or send `null`:

```json
{
  "conversationId": null,
  "content": "Explain the difference between let and const."
}
```

**Success — `200`:**

```json
{
  "data": {
    "conversation": {
      "id": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
      "title": "Explain the difference between let and const",
      "createdAt": "2026-11-06T09:05:00.000Z",
      "updatedAt": "2026-11-06T09:06:00.000Z",
      "messageCount": 2
    },
    "userMessage": {
      "id": "c4f2d3e5-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
      "role": "USER",
      "content": "Explain the difference between let and const.",
      "createdAt": "2026-11-06T09:05:00.000Z"
    },
    "assistantMessage": {
      "id": "d5a3e4f6-7b8c-4d9e-af10-2b3c4d5e6f70",
      "role": "ASSISTANT",
      "content": "...",
      "createdAt": "2026-11-06T09:06:00.000Z"
    }
  }
}
```

**Behavior:**

- The backend verifies the session and conversation ownership.
- If `conversationId` is missing or `null`, a new conversation is created.
- The title is generated from the first message.
- The title is the trimmed first message truncated to 80 characters, with an ellipsis when truncated.
- The backend loads a bounded recent context, prepends the server-side system prompt, and calls DeepSeek.
- The user message and assistant message are persisted together after a successful AI response.
- If the AI call fails, no partial assistant message is persisted.
- The conversation `updatedAt` is refreshed after messages are stored.
- The DeepSeek API key, system prompt, and provider payloads are never returned to the client.
- The frontend prevents duplicate submissions; the backend also validates input before calling the provider.

**Errors:**

- `401 UNAUTHENTICATED` — no session.
- `404 NOT_FOUND` — conversation missing or not owned.
- `422 VALIDATION_ERROR` — invalid content or conversation ID.
- `429 RATE_LIMITED` — application or provider rate limit.
- `502 AI_PROVIDER_ERROR` — DeepSeek returned an error.
- `504 AI_TIMEOUT` — DeepSeek did not respond in time.

### AI failure semantics

- A failed attempt does not create a user message or an assistant message.
- The frontend may restore the failed input and offer retry.
- Provider error details are logged server-side without secrets and returned only as safe user-facing messages.

---

## 5. Administration endpoints

All administration endpoints require an authenticated user with the `ADMIN` role.

### `GET /api/admin/users`

Returns all users.

**Success — `200`:**

```json
{
  "data": {
    "users": [
      {
        "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
        "email": "ada@example.com",
        "name": "Ada Lovelace",
        "role": "USER",
        "createdAt": "2026-11-06T09:00:00.000Z"
      }
    ]
  }
}
```

**Ordering:** newest accounts first.

---

### `PATCH /api/admin/users/:id/role`

Changes another user's role.

**Request:**

```json
{
  "role": "ADMIN"
}
```

**Success — `200`:**

```json
{
  "data": {
    "user": {
      "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "ADMIN",
      "createdAt": "2026-11-06T09:00:00.000Z"
    }
  }
}
```

**Rules:**

- An ADMIN cannot change their own role.
- The last remaining ADMIN cannot be demoted.
- Role changes take effect on the target user's next authenticated request.
- Invalid roles return `422 VALIDATION_ERROR`.
- Self-role changes and last-admin conflicts return `409 CONFLICT`.
- Missing users return `404 NOT_FOUND`.

---

### `GET /api/admin/assistant`

Returns the assistant configuration.

**Success — `200`:**

```json
{
  "data": {
    "config": {
      "id": "default",
      "name": "Programming Expert",
      "systemPrompt": "You are AI Expert Chat, a programming assistant...",
      "model": "deepseek-chat",
      "temperature": 0.3,
      "maxTokens": 2048,
      "updatedAt": "2026-11-06T09:00:00.000Z",
      "updatedById": null
    }
  }
}
```

---

### `PUT /api/admin/assistant`

Updates the assistant configuration.

**Request:**

```json
{
  "name": "Programming Expert",
  "systemPrompt": "You are AI Expert Chat, a programming assistant...",
  "model": "deepseek-chat",
  "temperature": 0.3,
  "maxTokens": 2048
}
```

**Success — `200`:**

```json
{
  "data": {
    "config": {
      "id": "default",
      "name": "Programming Expert",
      "systemPrompt": "You are AI Expert Chat, a programming assistant...",
      "model": "deepseek-chat",
      "temperature": 0.3,
      "maxTokens": 2048,
      "updatedAt": "2026-11-06T10:00:00.000Z",
      "updatedById": "9f555951-aed1-42e2-c356-6aaedf85abed"
    }
  }
}
```

**Rules:**

- Changes affect future chat requests only.
- Existing conversations are not rewritten.
- Invalid values return `422 VALIDATION_ERROR`.
- The system prompt is never exposed on public endpoints.

---

### `GET /api/admin/stats`

Returns real application statistics.

**Success — `200`:**

```json
{
  "data": {
    "stats": {
      "totalUsers": 2,
      "totalConversations": 1,
      "totalMessages": 2,
      "usersByRole": {
        "USER": 1,
        "ADMIN": 1
      },
      "recentUsers": [
        {
          "id": "7d444840-9dc0-41d1-b245-5ffdce74fad2",
          "email": "ada@example.com",
          "name": "Ada Lovelace",
          "role": "USER",
          "createdAt": "2026-11-06T09:00:00.000Z"
        }
      ],
      "recentConversations": [
        {
          "id": "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
          "title": "Explain JavaScript closures",
          "userEmail": "ada@example.com",
          "createdAt": "2026-11-06T09:05:00.000Z",
          "updatedAt": "2026-11-06T09:06:00.000Z"
        }
      ]
    }
  }
}
```

**Rules:**

- Statistics are computed from the database.
- No hardcoded or fabricated values are allowed.
- `recentUsers` and `recentConversations` are bounded to the most recent 5 records.

---

## 6. Authorization matrix

| Endpoint                          | Public |     USER |    ADMIN |
| --------------------------------- | -----: | -------: | -------: |
| `POST /api/auth/register`         |    Yes |      Yes |      Yes |
| `POST /api/auth/login`            |    Yes |      Yes |      Yes |
| `POST /api/auth/logout`           |     No |      Yes |      Yes |
| `GET /api/auth/me`                |     No |      Yes |      Yes |
| `GET /api/conversations`          |     No | Own only | Own only |
| `GET /api/conversations/:id`      |     No | Own only | Own only |
| `PATCH /api/conversations/:id`    |     No | Own only | Own only |
| `DELETE /api/conversations/:id`   |     No | Own only | Own only |
| `POST /api/chat`                  |     No |      Yes |      Yes |
| `GET /api/admin/users`            |     No |       No |      Yes |
| `PATCH /api/admin/users/:id/role` |     No |       No |      Yes |
| `GET /api/admin/assistant`        |     No |       No |      Yes |
| `PUT /api/admin/assistant`        |     No |       No |      Yes |
| `GET /api/admin/stats`            |     No |       No |      Yes |

ADMIN users can use the chat and manage their own conversations. They do not automatically gain access to another user's conversations.

---

## 7. Security requirements

- Session cookies are HttpOnly, Secure in production, and SameSite-protected.
- The frontend never receives tokens or API keys.
- The backend verifies authentication and authorization on every protected request.
- The backend verifies conversation ownership before reading or modifying data.
- The backend validates all request bodies and query parameters.
- Error responses do not expose stack traces, SQL details, provider payloads, or secrets.
- DeepSeek is called only from server-side code.
- AI output is rendered as untrusted Markdown; raw HTML is not allowed.
- Mutating cookie-authenticated requests should be protected against cross-site request forgery.
- Roles are loaded from the database, not trusted from client state.

---

## 8. Shared contracts and fixtures

Shared schemas and types:

```text
src/lib/contracts/common.ts
src/lib/contracts/auth.ts
src/lib/contracts/conversations.ts
src/lib/contracts/chat.ts
src/lib/contracts/admin.ts
src/lib/contracts/index.ts
```

Non-production fixtures:

```text
src/lib/contracts/fixtures.ts
```

Fixtures are only for UI development, tests, and MSW handlers. They must never be presented as real application data.

---

## 9. Contract change process

1. Propose the change in the pull request description or a small contract PR.
2. Update this document.
3. Update the Zod schemas and inferred types.
4. Update fixtures if the shape changed.
5. Notify Developer 1 before merging.
6. Update the frontend API client and MSW handlers in the same integration cycle.

Breaking changes must be treated as a new contract version.
