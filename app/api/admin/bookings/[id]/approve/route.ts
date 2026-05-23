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

        // Fetch the booking to approve
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

        // Approve: update status, set approved_by, unset approval_required
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'approved',
                approved_by: user.id,
                approval_required: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: `Failed to approve: ${updateError.message}` },
                { status: 500 }
            );
        }

        // Send notification to the booking owner
        await createNotification(
            supabase,
            booking.user_id,
            'booking_approved',
            'Booking Approved',
            `Your booking "${booking.title}" has been approved by an administrator.`
        );

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}