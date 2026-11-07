import "server-only";
import type { Message } from "@prisma/client";
import type { ChatRequest, ChatResponse } from "@/lib/contracts/chat";
import { DEFAULT_ASSISTANT_CONFIG, DEFAULT_ASSISTANT_CONFIG_ID } from "@/server/ai/defaults";
import { generateAssistantReply, type DeepSeekMessage } from "@/server/ai/deepseek";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
import { getOwnedConversation, toConversationSummary, toMessageDto } from "./conversations";

const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_CHARS = 24_000;
const MAX_TITLE_LENGTH = 80;

function buildConversationTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "New conversation";
  }

  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_TITLE_LENGTH - 3).trimEnd()}...`;
}

function toProviderMessage(message: Message): DeepSeekMessage {
  return {
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
  };
}

async function getAssistantConfig() {
  const config = await prisma.assistantConfig.findUnique({
    where: { id: DEFAULT_ASSISTANT_CONFIG_ID },
  });

  return config ?? DEFAULT_ASSISTANT_CONFIG;
}

async function getRecentContext(conversationId: string): Promise<DeepSeekMessage[]> {
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_CONTEXT_MESSAGES,
  });

  const context: DeepSeekMessage[] = [];
  let characterCount = 0;

  for (const message of recentMessages) {
    if (context.length > 0 && characterCount + message.content.length > MAX_CONTEXT_CHARS) {
      break;
    }

    context.unshift(toProviderMessage(message));
    characterCount += message.content.length;
  }

  return context;
}

export async function sendChatMessage(userId: string, input: ChatRequest): Promise<ChatResponse> {
  let context: DeepSeekMessage[] = [];

  if (input.conversationId) {
    await getOwnedConversation(userId, input.conversationId);
    context = await getRecentContext(input.conversationId);
  }

  const config = await getAssistantConfig();
  const assistantContent = await generateAssistantReply({
    messages: [
      { role: "system", content: config.systemPrompt },
      ...context,
      { role: "user", content: input.content },
    ],
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });

  const result = await prisma.$transaction(async (transaction) => {
    let conversationId: string;

    if (input.conversationId) {
      conversationId = input.conversationId;
    } else {
      const conversation = await transaction.conversation.create({
        data: {
          userId,
          title: buildConversationTitle(input.content),
        },
      });

      conversationId = conversation.id;
    }

    const userMessage = await transaction.message.create({
      data: {
        conversationId,
        role: "USER",
        content: input.content,
      },
    });

    const assistantMessage = await transaction.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: assistantContent,
      },
    });

    const updated = await transaction.conversation.updateMany({
      where: {
        id: conversationId,
        userId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
    }

    const conversation = await transaction.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return {
      conversation,
      userMessage,
      assistantMessage,
    };
  });

  return {
    conversation: toConversationSummary(result.conversation),
    userMessage: toMessageDto(result.userMessage),
    assistantMessage: toMessageDto(result.assistantMessage),
  };
}
