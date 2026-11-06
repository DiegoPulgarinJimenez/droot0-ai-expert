import { z } from "zod";
import { uuidSchema } from "./common";
import { conversationSummarySchema, messageContentSchema, messageSchema } from "./conversations";

export const chatRequestSchema = z.object({
  conversationId: uuidSchema.optional().nullable(),
  content: messageContentSchema,
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  conversation: conversationSummarySchema,
  userMessage: messageSchema,
  assistantMessage: messageSchema,
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;
