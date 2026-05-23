import { createClient } from '@/lib/supabase/server';
import { processBooking } from '@/lib/booking-engine';
import { NextRequest, NextResponse } from 'next/server';

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

        const formData = await request.json();
        const result = await processBooking(supabase, user.id, formData);

        if (!result.success) {
            const statusMap: Record<string, number> = {
                AUTH_ERROR: 403,
                VALIDATION_ERROR: 400,
                CAPACITY_ERROR: 400,
                CONFLICT_ERROR: 409,
                DATABASE_ERROR: 500,
            };
            return NextResponse.json(
                { success: false, error: result.error, code: result.code },
                { status: statusMap[result.code || 'DATABASE_ERROR'] || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bookingId: result.bookingId,
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { success: false, error: `Server error: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}