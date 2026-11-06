import { z } from "zod";
import { isoDateTimeSchema, roleSchema, uuidSchema } from "./common";

export const emailSchema = z.email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const displayNameSchema = z.string().trim().min(2).max(80);

export const authUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1).max(80),
  role: roleSchema,
  createdAt: isoDateTimeSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const registerRequestSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerResponseSchema = z.object({
  user: authUserSchema,
  requiresEmailConfirmation: z.boolean(),
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const logoutResponseSchema = z.object({
  success: z.literal(true),
});
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

export const meResponseSchema = z.object({
  user: authUserSchema,
});
export type MeResponse = z.infer<typeof meResponseSchema>;
