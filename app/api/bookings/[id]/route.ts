import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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

        const { id } = params;

        // Fetch booking to verify ownership or admin
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('user_id, status')
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found.' },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isOwner = booking.user_id === user.id;
        const isAdmin = profile?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to cancel this booking.' },
                { status: 403 }
            );
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return NextResponse.json(
                { success: false, error: 'Booking is already cancelled or completed.' },
                { status: 400 }
            );
        }

        // Soft delete: update status to cancelled
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: `Failed to cancel booking: ${updateError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}