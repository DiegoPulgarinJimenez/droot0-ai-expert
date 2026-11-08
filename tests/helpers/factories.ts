import type { AssistantConfig, Conversation, Message, User } from "@prisma/client";

const createdAt = new Date("2026-11-08T10:00:00.000Z");
const updatedAt = new Date("2026-11-08T10:05:00.000Z");

export const testIds = {
  user: "7d444840-9dc0-41d1-b245-5ffdce74fad2",
  admin: "9f555951-aed1-42e2-c356-6aaedf85abed",
  conversation: "b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  message: "c4f2d3e5-6a7b-4c8d-9e0f-1a2b3c4d5e6f",
};

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: testIds.user,
    email: "user@example.com",
    name: "Test User",
    role: "USER",
    createdAt,
    updatedAt,
    ...overrides,
  };
}

export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: testIds.conversation,
    userId: testIds.user,
    title: "Test conversation",
    createdAt,
    updatedAt,
    ...overrides,
  };
}

export function makeConversationWithCount(
  overrides: Partial<Conversation> & { _count?: { messages: number } } = {},
): Conversation & { _count: { messages: number } } {
  const { _count = { messages: 2 }, ...conversationOverrides } = overrides;

  return {
    ...makeConversation(conversationOverrides),
    _count,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: testIds.message,
    conversationId: testIds.conversation,
    role: "USER",
    content: "Test message",
    createdAt,
    ...overrides,
  };
}

export function makeAssistantConfig(overrides: Partial<AssistantConfig> = {}): AssistantConfig {
  return {
    id: "default",
    name: "Programming Expert",
    systemPrompt: "You are a programming assistant.",
    model: "deepseek-chat",
    temperature: 0.3,
    maxTokens: 2048,
    updatedAt,
    updatedById: null,
    ...overrides,
  };
}
