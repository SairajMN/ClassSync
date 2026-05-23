import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityCheckRequest, AvailabilityCheckResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required.' },
                { status: 401 }
            );
        }

        const params: AvailabilityCheckRequest = await request.json();
        const { start_time, end_time, capacity } = params;

        if (!start_time || !end_time) {
            return NextResponse.json(
                { success: false, error: 'Start time and end time are required.' },
                { status: 400 }
            );
        }

        // Query rooms that are active
        let query = supabase
            .from('rooms')
            .select('id, name, capacity, room_type, building, floor')
            .eq('is_active', true);

        // Filter by capacity if specified
        if (capacity) {
            query = query.gte('capacity', capacity);
        }

        const { data: rooms, error: roomsError } = await query;

        if (roomsError) {
            return NextResponse.json(
                { success: false, error: `Database error: ${roomsError.message}` },
                { status: 500 }
            );
        }

        // Check each room for conflicts during the requested time
        const availabilityResults: AvailabilityCheckResponse[] = [];

        for (const room of rooms) {
            const { data: conflicts } = await supabase
                .from('bookings')
                .select('id')
                .eq('room_id', room.id)
                .in('status', ['pending', 'approved'])
                .lt('start_time', end_time)
                .gt('end_time', start_time);

            const hasConflict = conflicts && conflicts.length > 0;

            availabilityResults.push({
                room_id: room.id,
                room_name: room.name,
                is_available: !hasConflict,
                reason: hasConflict ? 'Room is already booked during this time.' : undefined,
            });
        }

        return NextResponse.json({
            success: true,
            rooms: availabilityResults,
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}