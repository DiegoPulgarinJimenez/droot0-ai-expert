import { z } from "zod";
import { isoDateTimeSchema, messageRoleSchema, uuidSchema } from "./common";

export const conversationTitleSchema = z.string().trim().min(1).max(120);
export const messageContentSchema = z.string().trim().min(1).max(8000);
export const storedMessageContentSchema = z.string().min(1).max(50000);

export const messageSchema = z.object({
  id: uuidSchema,
  role: messageRoleSchema,
  content: storedMessageContentSchema,
  createdAt: isoDateTimeSchema,
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSummarySchema = z.object({
  id: uuidSchema,
  title: z.string().min(1).max(120),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  messageCount: z.number().int().nonnegative(),
});
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export const conversationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;

export const conversationListResponseSchema = z.object({
  conversations: z.array(conversationSummarySchema),
});
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

export const conversationDetailResponseSchema = z.object({
  conversation: conversationSummarySchema,
  messages: z.array(messageSchema),
});
export type ConversationDetailResponse = z.infer<typeof conversationDetailResponseSchema>;

export const renameConversationRequestSchema = z.object({
  title: conversationTitleSchema,
});
export type RenameConversationRequest = z.infer<typeof renameConversationRequestSchema>;

export const renameConversationResponseSchema = z.object({
  conversation: conversationSummarySchema,
});
export type RenameConversationResponse = z.infer<typeof renameConversationResponseSchema>;

export const deleteConversationResponseSchema = z.object({
  success: z.literal(true),
});
export type DeleteConversationResponse = z.infer<typeof deleteConversationResponseSchema>;
