import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/ot/availability
 *
 * Body:
 *   room        – e.g. "OT-1"
 *   surgeon_id  – profile UUID
 *   starts_at   – ISO 8601 string
 *   ends_at     – ISO 8601 string
 *   exclude_id  – (optional) ot_booking UUID to ignore (useful for edits)
 *
 * Response:
 *   { room_available: boolean, surgeon_available: boolean, conflicts: OtBooking[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room, surgeon_id, starts_at, ends_at, exclude_id } = body;

    if (!room || !surgeon_id || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: "room, surgeon_id, starts_at, ends_at are required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Auth guard
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build overlap filter: existing booking overlaps [starts_at, ends_at) if:
    //   existing.starts_at < req.ends_at AND existing.ends_at > req.starts_at
    let query = supabase
      .from("ot_bookings")
      .select(`
        id, room, surgeon_id, starts_at, ends_at, procedure_name, status,
        surgeon:surgeon_id ( full_name ),
        patient:patient_id ( full_name )
      `)
      .neq("status", "cancelled")
      .lt("starts_at", ends_at)
      .gt("ends_at", starts_at);

    if (exclude_id) {
      query = query.neq("id", exclude_id);
    }

    const { data: allConflicts, error } = await query;
    if (error) throw new Error(error.message);

    const conflicts = allConflicts ?? [];

    const roomConflicts    = conflicts.filter((b: any) => b.room === room);
    const surgeonConflicts = conflicts.filter((b: any) => b.surgeon_id === surgeon_id);

    return NextResponse.json({
      room_available:    roomConflicts.length === 0,
      surgeon_available: surgeonConflicts.length === 0,
      conflicts: {
        room:    roomConflicts,
        surgeon: surgeonConflicts,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
