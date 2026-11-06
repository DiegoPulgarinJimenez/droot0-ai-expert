import "server-only";
import type { Conversation, Message } from "@prisma/client";
import type { ConversationSummary, Message as MessageDto } from "@/lib/contracts/conversations";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";

type ConversationWithMessageCount = Conversation & {
  _count: {
    messages: number;
  };
};

const MESSAGE_DETAIL_LIMIT = 200;
const DEFAULT_CONVERSATION_LIMIT = 20;

function notFound(): never {
  throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
}

function toConversationSummary(conversation: ConversationWithMessageCount): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messageCount: conversation._count.messages,
  };
}

function toMessageDto(message: Message): MessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function listConversations(
  userId: string,
  limit = DEFAULT_CONVERSATION_LIMIT,
): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  return conversations.map(toConversationSummary);
}

export async function getConversationDetail(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MESSAGE_DETAIL_LIMIT,
  });

  return {
    conversation: toConversationSummary(conversation),
    messages: messages.reverse().map(toMessageDto),
  };
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
): Promise<ConversationSummary> {
  const result = await prisma.conversation.updateMany({
    where: {
      id: conversationId,
      userId,
    },
    data: { title },
  });

  if (result.count === 0) {
    notFound();
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return toConversationSummary(conversation);
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const result = await prisma.conversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (result.count === 0) {
    notFound();
  }
}
