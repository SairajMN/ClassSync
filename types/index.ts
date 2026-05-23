export type UserRole = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RoomType = 'classroom' | 'lab' | 'seminar_hall' | 'smart_room';

export interface Room {
  id: string;
  name: string;
  building: string | null;
  floor: number | null;
  capacity: number;
  room_type: RoomType;
  is_active: boolean;
  created_at: string;
  room_resources?: RoomResource[];
}

export type ResourceType =
  | 'projector'
  | 'smart_board'
  | 'microphone'
  | 'internet'
  | 'ac'
  | 'lab_equipment';

export interface Resource {
  id: string;
  name: string;
  resource_type: ResourceType;
  quantity: number;
  is_shared: boolean;
  created_at: string;
}

export interface RoomResource {
  id: string;
  room_id: string;
  resource_id: string;
  quantity: number;
  resources?: Resource;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  approval_required: boolean;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  rooms?: Room;
  booking_resources?: BookingResource[];
}

export interface BookingResource {
  id: string;
  booking_id: string;
  resource_id: string;
  quantity: number;
  resources?: Resource;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface BookingFormData {
  title: string;
  description: string;
  room_id: string;
  start_time: string;
  end_time: string;
  resources: { resource_id: string; quantity: number }[];
}

export interface AvailabilityCheckRequest {
  start_time: string;
  end_time: string;
  capacity?: number;
  resource_ids?: string[];
}

export interface AvailabilityCheckResponse {
  room_id: string;
  room_name: string;
  is_available: boolean;
  reason?: string;
}

export interface ConflictError {
  conflict: boolean;
  message: string;
  conflictingBooking?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
}
