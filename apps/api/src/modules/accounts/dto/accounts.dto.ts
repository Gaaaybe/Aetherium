import { z } from 'zod';

export const registerUserBodySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  masterConfirm: z.boolean().optional(),
});

export type RegisterUserBodySchema = z.infer<typeof registerUserBodySchema>;

export const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;
