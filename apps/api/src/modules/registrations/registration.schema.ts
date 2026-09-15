import { z } from 'zod';

export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

export const registrationIdParamSchema = z.object({
  id: z.string().uuid('Invalid registration ID format'),
});
