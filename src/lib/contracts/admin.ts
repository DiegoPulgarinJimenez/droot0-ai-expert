import { z } from "zod";
import { authUserSchema } from "./auth";
import { isoDateTimeSchema, roleSchema, uuidSchema } from "./common";
import { conversationTitleSchema } from "./conversations";

export const adminUserListResponseSchema = z.object({
  users: z.array(authUserSchema),
});
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const updateUserRoleRequestSchema = z.object({
  role: roleSchema,
});
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;

export const updateUserRoleResponseSchema = z.object({
  user: authUserSchema,
});
export type UpdateUserRoleResponse = z.infer<typeof updateUserRoleResponseSchema>;

export const assistantConfigInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  systemPrompt: z.string().trim().min(1).max(20000),
  model: z.string().trim().min(1).max(100),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(8192),
});
export type AssistantConfigInput = z.infer<typeof assistantConfigInputSchema>;

export const assistantConfigSchema = assistantConfigInputSchema.extend({
  id: z.string().min(1).max(100),
  updatedAt: isoDateTimeSchema,
  updatedById: uuidSchema.nullable(),
});
export type AssistantConfig = z.infer<typeof assistantConfigSchema>;

export const assistantConfigResponseSchema = z.object({
  config: assistantConfigSchema,
});
export type AssistantConfigResponse = z.infer<typeof assistantConfigResponseSchema>;

export const updateAssistantConfigRequestSchema = assistantConfigInputSchema;
export type UpdateAssistantConfigRequest = z.infer<typeof updateAssistantConfigRequestSchema>;

export const recentConversationSchema = z.object({
  id: uuidSchema,
  title: conversationTitleSchema,
  userEmail: z.email(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type RecentConversation = z.infer<typeof recentConversationSchema>;

export const adminStatsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalConversations: z.number().int().nonnegative(),
  totalMessages: z.number().int().nonnegative(),
  usersByRole: z.object({
    USER: z.number().int().nonnegative(),
    ADMIN: z.number().int().nonnegative(),
  }),
  recentUsers: z.array(authUserSchema),
  recentConversations: z.array(recentConversationSchema),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

export const adminStatsResponseSchema = z.object({
  stats: adminStatsSchema,
});
export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>;
