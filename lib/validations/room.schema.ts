import { z } from 'zod';

export const roomTypeEnum = z.enum(['classroom', 'lab', 'seminar_hall', 'smart_room']);

export const roomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters').max(50, 'Room name cannot exceed 50 characters'),
  building: z.string().min(2, 'Building name must be at least 2 characters').max(50).optional().nullable(),
  floor: z.number().int().min(0, 'Floor must be 0 (ground) or higher').max(50).optional().nullable(),
  capacity: z.number().int().positive('Capacity must be at least 1 person'),
  room_type: roomTypeEnum,
  is_active: z.boolean().default(true),
});

export type RoomSchemaType = z.infer<typeof roomSchema>;
