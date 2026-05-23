import { create } from 'zustand';
import { Booking, Room, Resource } from '@/types';

interface BookingState {
  bookings: Booking[];
  rooms: Room[];
  resources: Resource[];
  selectedRoomId: string | null;
  selectedRoomType: string | null;
  loading: boolean;
  setBookings: (bookings: Booking[]) => void;
  setRooms: (rooms: Room[]) => void;
  setResources: (resources: Resource[]) => void;
  setSelectedRoomId: (roomId: string | null) => void;
  setSelectedRoomType: (roomType: string | null) => void;
  setLoading: (loading: boolean) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
  removeBooking: (bookingId: string) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  rooms: [],
  resources: [],
  selectedRoomId: null,
  selectedRoomType: null,
  loading: false,
  setBookings: (bookings) => set({ bookings }),
  setRooms: (rooms) => set({ rooms }),
  setResources: (resources) => set({ resources }),
  setSelectedRoomId: (selectedRoomId) => set({ selectedRoomId }),
  setSelectedRoomType: (selectedRoomType) => set({ selectedRoomType }),
  setLoading: (loading) => set({ loading }),
  addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
  updateBooking: (booking) =>
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === booking.id ? booking : b)),
    })),
  removeBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== bookingId),
    })),
}));
