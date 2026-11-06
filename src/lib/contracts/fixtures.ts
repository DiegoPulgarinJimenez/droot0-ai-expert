/**
 * Contract fixtures for UI development and tests.
 *
 * These values are examples only. Never use them as production data and never
 * present them as real application records.
 */
import type { AdminStats, AssistantConfig } from "./admin";
import type { AuthUser } from "./auth";
import type { ChatResponse } from "./chat";
import type { ConversationDetailResponse, ConversationSummary, Message } from "./conversations";

export const authUserFixture: AuthUser = {
  id: "7d444840-9dc0-41d1-b245-5ffdce74fad2",
  email: "ada@example.com",
  name: "Ada Lovelace",
  role: "USER",
  createdAt: "2026-11-06T09:00:00.000Z",
};

export const adminUserFixture: AuthUser = {
  ...authUserFixture,
  id: "9f555951-aed1-42e2-c356-6aaedf85abed",
  email: "admin@example.com",
  name: "Grace Hopper",
  role: "ADMIN",
  createdAt: "2026-11-05T08:00:00.000Z",
};

export const conversationSummaryFixture: ConversationSummary = {
  id: "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  title: "Explain JavaScript closures",
  createdAt: "2026-11-06T09:05:00.000Z",
  updatedAt: "2026-11-06T09:06:00.000Z",
  messageCount: 2,
};

export const userMessageFixture: Message = {
  id: "c4f2d3e5-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
  role: "USER",
  content: "Can you explain JavaScript closures with a small example?",
  createdAt: "2026-11-06T09:05:00.000Z",
};

export const assistantMessageFixture: Message = {
  id: "d5a3e4f6-7b8c-4d9e-af10-2b3c4d5e6f70",
  role: "ASSISTANT",
  content:
    "A closure is a function that keeps access to variables from the scope where it was created, even after that outer function has returned.",
  createdAt: "2026-11-06T09:06:00.000Z",
};

export const conversationDetailFixture: ConversationDetailResponse = {
  conversation: conversationSummaryFixture,
  messages: [userMessageFixture, assistantMessageFixture],
};

export const chatResponseFixture: ChatResponse = {
  conversation: conversationSummaryFixture,
  userMessage: userMessageFixture,
  assistantMessage: assistantMessageFixture,
};

export const assistantConfigFixture: AssistantConfig = {
  id: "default",
  name: "Programming Expert",
  systemPrompt:
    "You are AI Expert Chat, a programming assistant. Explain concepts clearly, acknowledge uncertainty, and redirect non-programming questions.",
  model: "deepseek-chat",
  temperature: 0.3,
  maxTokens: 2048,
  updatedAt: "2026-11-06T09:00:00.000Z",
  updatedById: null,
};

export const adminStatsFixture: AdminStats = {
  totalUsers: 2,
  totalConversations: 1,
  totalMessages: 2,
  usersByRole: {
    USER: 1,
    ADMIN: 1,
  },
  recentUsers: [adminUserFixture, authUserFixture],
  recentConversations: [
    {
      id: conversationSummaryFixture.id,
      title: conversationSummaryFixture.title,
      userEmail: authUserFixture.email,
      createdAt: conversationSummaryFixture.createdAt,
      updatedAt: conversationSummaryFixture.updatedAt,
    },
  ],
};
