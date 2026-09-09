import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().min(1, 'Description is required'),
    category: z.string().trim().min(1, 'Category is required'),
    startTime: z.coerce.date({ message: 'Invalid start time' }),
    endTime: z.coerce.date({ message: 'Invalid end time' }),
    venue: z.string().trim().min(1, 'Venue is required'),
    capacity: z.coerce
      .number()
      .int('Capacity must be an integer')
      .positive('Capacity must be greater than 0')
      .nullable()
      .optional(),
    registrationDeadline: z.coerce.date({ message: 'Invalid registration deadline' }),
    eligibility: z.string().trim().min(1, 'Eligibility is required'),
    prize: z.string().trim().nullable().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  })
  .refine((data) => data.registrationDeadline < data.startTime, {
    message: 'Registration deadline must be before start time',
    path: ['registrationDeadline'],
  });

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').optional(),
    description: z.string().trim().min(1, 'Description cannot be empty').optional(),
    category: z.string().trim().min(1, 'Category cannot be empty').optional(),
    startTime: z.coerce.date({ message: 'Invalid start time' }).optional(),
    endTime: z.coerce.date({ message: 'Invalid end time' }).optional(),
    venue: z.string().trim().min(1, 'Venue cannot be empty').optional(),
    capacity: z.coerce
      .number()
      .int('Capacity must be an integer')
      .positive('Capacity must be greater than 0')
      .nullable()
      .optional(),
    registrationDeadline: z.coerce.date({ message: 'Invalid registration deadline' }).optional(),
    eligibility: z.string().trim().min(1, 'Eligibility cannot be empty').optional(),
    prize: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (data.startTime && data.registrationDeadline) {
        return data.registrationDeadline < data.startTime;
      }
      return true;
    },
    {
      message: 'Registration deadline must be before start time',
      path: ['registrationDeadline'],
    }
  );

export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});
