# AI Expert Chat

AI Expert Chat is a full-stack conversational web application built around an AI assistant specialized in programming. It is a university Web Engineering project designed to help users understand programming concepts, explain and debug code, reason about algorithms and data structures, and improve software development practices.

## Project overview

The application provides a focused programming assistant rather than a general-purpose chatbot. Users can ask technical questions, work through code problems, and maintain a persistent conversation history.

The assistant is designed to:

- Explain programming concepts clearly.
- Help interpret errors and debug code.
- Discuss algorithms and data structures.
- Suggest improvements and development practices.
- Acknowledge uncertainty instead of inventing technical facts.
- Recognize questions outside programming and redirect the conversation.

## Main features

- AI-powered programming chat.
- Secure authentication and persistent sessions.
- Personal conversation history.
- Conversation creation, continuation, renaming, and deletion.
- ADMIN user management and role control.
- Assistant configuration for the system prompt, model, temperature, and token limit.
- Application statistics for administrators.
- Responsive and accessible interfaces.
- Automated backend tests.

## Application roles

### USER

- Use the programming assistant.
- Create and manage personal conversations.
- View personal conversation history.
- Delete personal conversations.

### ADMIN

- Use all USER features.
- View users and manage roles.
- Configure the assistant.
- View application statistics.

## Tech stack

| Layer       | Technology             |
| ----------- | ---------------------- |
| Framework   | Next.js App Router     |
| UI          | React                  |
| Language    | TypeScript             |
| Styling     | Tailwind CSS           |
| Backend     | Next.js Route Handlers |
| Database    | Supabase PostgreSQL    |
| ORM         | Prisma                 |
| Validation  | Zod                    |
| AI provider | DeepSeek API           |

## Architecture

```text
Browser
  │
  ▼
Next.js App Router
React + TypeScript + Tailwind CSS
  │
  ▼
Next.js Route Handlers
  │
  ├─ Authentication and authorization
  ├─ Request validation
  ├─ Conversation ownership
  ├─ Prisma
  │    └─ Supabase PostgreSQL
  └─ DeepSeek API
```

Design principles:

- The browser never calls DeepSeek directly.
- Authentication and authorization are enforced on the server.
- Users can only access their own conversations.
- API keys remain server-side.
- AI responses are treated as untrusted content.

## Project status

The backend foundation is complete: authentication, conversation management, AI chat, administration APIs, and automated tests.

The frontend is in progress. The landing page is currently a foundation placeholder, and the main application interfaces are being developed incrementally.

## Team

### Developer 1 — Frontend and integration

- Landing page.
- Authentication interfaces.
- Application shell and navigation.
- Chat interface.
- Conversation history.
- Administration interfaces.
- Responsive design, accessibility, and frontend tests.

### Developer 2 — Backend and AI

- Supabase and Prisma data layer.
- Authentication and session infrastructure.
- API route handlers.
- Authorization and ownership enforcement.
- DeepSeek integration and assistant configuration.
- Statistics queries.
- Backend tests and security.

## License

This project is developed for educational purposes.
