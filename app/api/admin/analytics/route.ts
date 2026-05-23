import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required.' },
                { status: 401 }
            );
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Admin privileges required.' },
                { status: 403 }
            );
        }

        // 1. Total active rooms
        const { count: totalRooms } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // 2. Active bookings (today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count: activeBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'approved'])
            .gte('start_time', todayStart.toISOString())
            .lte('start_time', todayEnd.toISOString());

        // 3. Total resources
        const { count: totalResources } = await supabase
            .from('resources')
            .select('*', { count: 'exact', head: true });

        // 4. Utilization by room (calculate booking count per room)
        const { data: roomUtilization } = await supabase
            .from('bookings')
            .select('room_id, rooms!inner(name)');

        // Aggregate utilization by room
        const roomCounts: Record<string, { name: string; count: number }> = {};
        if (roomUtilization) {
            for (const b of roomUtilization) {
                const roomData = b.rooms as unknown as { name: string };
                const roomName = roomData?.name || 'Unknown';
                if (!roomCounts[b.room_id]) {
                    roomCounts[b.room_id] = { name: roomName, count: 0 };
                }
                roomCounts[b.room_id].count++;
            }
        }

        const utilizationByRoom = Object.values(roomCounts).map((r) => ({
            name: r.name,
            value: Math.min(Math.round((r.count / Math.max(totalRooms || 1, 1)) * 100), 100),
        }));

        // 5. Peak hours (distribution of booking start times by hour)
        const { data: peakData } = await supabase
            .from('bookings')
            .select('start_time')
            .in('status', ['approved', 'pending']);

        const hourBuckets: Record<string, number> = {};
        if (peakData) {
            for (const b of peakData) {
                const hour = new Date(b.start_time).getHours().toString().padStart(2, '0') + ':00';
                hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
            }
        }

        const peakHours = Object.entries(hourBuckets)
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.localeCompare(b.hour));

        // 6. Resource popularity
        const { data: resourcePop } = await supabase
            .from('booking_resources')
            .select('resource_id, quantity, resources!inner(name)');

        const resourceCounts: Record<string, { name: string; quantity: number }> = {};
        if (resourcePop) {
            for (const r of resourcePop) {
                const resData = r.resources as unknown as { name: string };
                const resName = resData?.name || 'Unknown';
                if (!resourceCounts[r.resource_id]) {
                    resourceCounts[r.resource_id] = { name: resName, quantity: 0 };
                }
                resourceCounts[r.resource_id].quantity += r.quantity;
            }
        }

        const resourcePopularity = Object.values(resourceCounts)
            .map((r) => ({ name: r.name, quantity: r.quantity }))
            .sort((a, b) => b.quantity - a.quantity);

        // 7. Utilization rate (average occupancy across all rooms)
        const totalCapacity = totalRooms || 1;
        const utilizationRate = Math.min(
            Math.round(((activeBookings || 0) / totalCapacity) * 100),
            100
        );

        return NextResponse.json({
            stats: {
                totalRooms: totalRooms || 0,
                activeBookings: activeBookings || 0,
                totalResources: totalResources || 0,
                utilizationRate,
            },
            utilizationByRoom,
            peakHours,
            resourcePopularity,
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}