import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;
        const { reason } = await request.json();

        // Fetch the booking to reject
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('user_id, title, status')
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found.' },
                { status: 404 }
            );
        }

        if (booking.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: 'Booking is not in pending status.' },
                { status: 400 }
            );
        }

        // Reject: update status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'rejected',
                approved_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: `Failed to reject: ${updateError.message}` },
                { status: 500 }
            );
        }

        // Send notification with rejection reason
        const rejectionMessage = reason
            ? `Your booking "${booking.title}" has been rejected. Reason: ${reason}`
            : `Your booking "${booking.title}" has been rejected.`;

        await createNotification(
            supabase,
            booking.user_id,
            'booking_rejected',
            'Booking Rejected',
            rejectionMessage
        );

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}