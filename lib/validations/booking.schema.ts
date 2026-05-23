import { z } from 'zod';

export const bookingResourceSchema = z.object({
  resource_id: z.string().uuid('Invalid resource identifier'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

// Input schema without refinements for useForm typing
export const bookingInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  room_id: z.string().uuid('Invalid room selection'),
  start_time: z.string().datetime({ message: 'Invalid start date-time format' }),
  end_time: z.string().datetime({ message: 'Invalid end date-time format' }),
  resources: z.array(bookingResourceSchema).optional(),
});

export const bookingSchema = bookingInputSchema.refine(
  (data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
  },
  {
    message: 'End time must be after the start time',
    path: ['end_time'],
  }
);

// BookingSchemaType is the input type (before refinement)
export type BookingSchemaType = z.infer<typeof bookingInputSchema>;