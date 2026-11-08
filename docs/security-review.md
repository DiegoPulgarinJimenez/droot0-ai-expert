# Security and Performance Review

**Project:** AI Expert Chat
**Review date:** 2026-11-08
**Scope:** Backend API, authentication, authorization, database access, AI integration, configuration, and production readiness.
**Status:** Initial review completed.

---

## 1. Executive summary

The backend follows a server-side security model:

- The browser never receives the Supabase service-role key or DeepSeek API key.
- Authentication uses Supabase sessions stored in HttpOnly cookies.
- Every protected API route verifies the session server-side.
- Admin routes require the database role to be `ADMIN`.
- Conversation ownership is enforced in Prisma queries.
- The AI provider is called only from the server.
- Mutating cookie-authenticated requests validate the request origin.
- API errors do not expose internal details to clients.

No critical code-level vulnerabilities were found in the application routes or services.

One high-severity advisory is reported by the dependency audit for a Prisma configuration transitive dependency. It is not on an untrusted runtime path in this application and is documented below.

---

## 2. Authentication and session security

| Control                          | Status      | Notes                                          |
| -------------------------------- | ----------- | ---------------------------------------------- |
| Supabase Auth                    | Implemented | Email/password authentication                  |
| Server-side session verification | Implemented | `getClaims()` used in proxy and server helpers |
| Role source                      | Implemented | Loaded from `public.users`, not client state   |
| Session cookie access            | Implemented | `HttpOnly`                                     |
| Cookie transport                 | Implemented | `Secure` in production                         |
| Cross-site cookie behavior       | Implemented | `SameSite=Lax`                                 |
| Logout                           | Implemented | Clears the session cookie                      |
| Password storage                 | Delegated   | Supabase Auth manages credentials              |
| Client-side role trust           | Avoided     | Routes use `requireAdmin()`                    |
| Protected page redirects         | Implemented | `src/proxy.ts`                                 |

### Notes

- An already-issued JWT access token remains valid until expiry after logout. This is standard stateless JWT behavior. The browser clears the cookie, but a copied token can remain valid until expiry. For immediate revocation, a server-side session check or shorter token lifetime would be required.
- Email confirmation is supported by the contract. The demo environment may disable it to avoid email rate limits.

---

## 3. Authorization and ownership

| Area                    | Control                                                    |
| ----------------------- | ---------------------------------------------------------- |
| Conversation list       | Filtered by authenticated `userId`                         |
| Conversation detail     | `findFirst` with `id` and `userId`                         |
| Conversation rename     | `updateMany` with `id` and `userId`                        |
| Conversation delete     | `deleteMany` with `id` and `userId`                        |
| Chat continuation       | Ownership checked before provider call                     |
| Admin users             | `requireAdmin()`                                           |
| Role updates            | `requireAdmin()` plus self-role and last-admin protections |
| Assistant configuration | `requireAdmin()`                                           |
| Statistics              | `requireAdmin()`                                           |

Foreign or missing conversations return `404`, preventing resource-existence disclosure.

---

## 4. Secret handling

Verified:

- `.env` is ignored.
- `.env.example` contains placeholders only.
- No tracked cookie jar exists.
- `SUPABASE_SERVICE_ROLE_KEY` is referenced only by the seed script.
- `DEEPSEEK_API_KEY` is read only by server-side AI code.
- No secret uses a `NEXT_PUBLIC_` variable.
- The DeepSeek API key is never returned in API responses or logs.

The service-role key must remain limited to trusted scripts. It is not used by application route handlers.

---

## 5. Input validation and injection

- Request bodies and query parameters are validated with Zod.
- Prisma uses parameterized queries; no raw SQL is used in application code.
- Conversation and user IDs are validated as UUIDs.
- Chat content is limited to 8,000 characters.
- Titles, names, prompts, model names, temperatures, and token limits have explicit bounds.
- Unknown request fields are stripped by the shared schemas.
- Error responses use safe messages and do not expose stack traces or SQL details.

---

## 6. CSRF and request-origin protection

Mutating cookie-authenticated routes call `assertSameOrigin`:

- Registration.
- Login.
- Logout.
- Chat.
- Conversation rename and delete.
- Admin role updates.
- Assistant configuration updates.

Requests without an `Origin` header are allowed for non-browser clients. Cross-origin browser requests are rejected with `403`.

---

## 7. AI security

- DeepSeek is called only from server-side code.
- The system prompt is sent as a separate `system` message, not concatenated into user content.
- The system prompt is not returned by public endpoints.
- Context is bounded by message count and character count.
- Provider responses are parsed and validated.
- Provider errors, rate limits, and timeouts are mapped to safe application errors.
- AI output is returned as text and must be rendered safely by the frontend.

### Remaining risks

- Prompt injection cannot be fully prevented. The assistant may still be persuaded to ignore some instructions.
- The frontend must not render raw HTML from AI responses.
- Code returned by the AI must never be executed.
- A per-user application-level chat rate limit is not implemented. Provider `429` responses and Supabase Auth rate limits are handled, but there is no local quota or cost-control layer.

---

## 8. Security headers

The Next.js configuration now sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

The `X-Powered-By` header is disabled.

A Content Security Policy is not yet configured. It should be added during frontend hardening once the final script and style requirements are known.

---

## 9. Dependency audit

Command:

```bash
pnpm audit --prod
```

Result:

```text
1 high-severity advisory
Package: deepmerge-ts <8.0.0
Path: @prisma/client > prisma > @prisma/config > deepmerge-ts
```

Assessment:

- The vulnerable package is part of Prisma’s configuration tooling.
- The application does not pass untrusted recursive objects into Prisma configuration merging.
- The path is not used by the runtime chat or authentication request flow.
- The issue should be resolved when upgrading Prisma or when Prisma updates its dependency.

Risk: **Accepted for the current course scope**, with a recommendation to upgrade Prisma when a compatible release is available.

Do not use `pnpm audit fix --force`; it can introduce breaking major-version changes.

---

## 10. Performance review

### Good practices

- Prisma client is a server-side singleton in development.
- Conversation list uses a single query with message counts.
- Conversation detail uses two bounded queries.
- Chat context is limited to 20 messages and 24,000 characters.
- Statistics use parallel queries.
- Recent-activity queries are limited to five records.
- Indexes exist for conversation ownership/activity and message ordering.

### Future optimizations

| Area                        | Observation                     | Recommendation                                                        |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| Admin user list             | Returns all users               | Add pagination when the user base grows                               |
| Global recent conversations | Orders across all conversations | Add an index on `conversations.updatedAt` if data volume grows        |
| Chat rate limiting          | No application-level quota      | Add a per-user limit or managed rate limiter before public deployment |
| Message detail              | Returns up to 200 messages      | Add cursor pagination if long conversations become common             |
| Statistics                  | Recomputed on each request      | Consider caching for large datasets                                   |

The current dataset is small, so these are scalability improvements rather than current defects.

---

## 11. Error handling and logging

- Known errors use stable error codes and safe messages.
- Validation errors include field-specific messages.
- Unknown errors return a generic `500` response.
- Server logs may contain stack traces for unexpected errors, but secrets are not included in API responses.
- Provider logging records status codes and safe error messages only.

---

## 12. Verification checklist

Executed or reviewed:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm format:check`
- `pnpm build`
- `pnpm audit --prod`
- Tracked-secret search
- `.env` and cookie-jar ignore checks
- Route authorization review
- Ownership-query review
- Cookie configuration review
- Request-origin review
- Security-header verification
- Database index review

---

## 13. Recommendations before public deployment

1. Add application-level rate limiting for chat.
2. Add a Content Security Policy after frontend implementation.
3. Configure Supabase Auth email confirmation and rate-limit settings.
4. Add pagination to the admin user list.
5. Add a global conversation activity index if data volume grows.
6. Re-run the dependency audit after the Prisma upgrade.
7. Keep the service-role key limited to seed and trusted administrative scripts.
8. Review Markdown rendering and link handling in the frontend.
9. Confirm production cookies are served over HTTPS only.
10. Add monitoring for repeated `429`, `502`, and `504` responses.

---

## 14. Conclusion

The backend is suitable for the course project and demo environment with the documented limitations. The most important remaining security work is chat rate limiting, frontend Markdown sanitization, and a Content Security Policy. The Prisma transitive advisory is accepted temporarily because it is outside the runtime request path.
