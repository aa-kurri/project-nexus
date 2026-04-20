import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { apiLimiter } from "@/lib/rate-limit";

/**
 * GET /api/ot/bookings?date=YYYY-MM-DD
 *
 * Returns all OT bookings for the given date (tenant-scoped via RLS).
 * Defaults to today if no date param supplied.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = apiLimiter.check(`ot-get:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const { searchParams } = req.nextUrl;
    const dateParam = searchParams.get("date");

    const date = dateParam ?? new Date().toISOString().slice(0, 10);
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd   = `${date}T23:59:59.999Z`;

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("ot_bookings")
      .select(`
        id, room, procedure_name, starts_at, ends_at, status, notes,
        surgeon:surgeon_id       ( id, full_name ),
        anaesthetist:anaesthetist_id ( id, full_name ),
        patient:patient_id       ( id, full_name )
      `)
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
      .order("starts_at", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ bookings: data ?? [], date });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/ot/bookings
 *
 * Create a new OT booking. Automatically checks availability first and
 * rejects if there's a room or surgeon conflict.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = apiLimiter.check(`ot-post:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const body = await req.json();
    const {
      room, surgeon_id, anaesthetist_id, patient_id,
      procedure_name, starts_at, ends_at, notes,
    } = body;

    if (!room || !surgeon_id || !procedure_name || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: "room, surgeon_id, procedure_name, starts_at, ends_at are required" },
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Inline conflict check before insert
    const { data: conflicts } = await supabase
      .from("ot_bookings")
      .select("id, room, surgeon_id, starts_at, ends_at, procedure_name")
      .neq("status", "cancelled")
      .lt("starts_at", ends_at)
      .gt("ends_at", starts_at);

    const roomConflict    = (conflicts ?? []).find((b: any) => b.room === room);
    const surgeonConflict = (conflicts ?? []).find((b: any) => b.surgeon_id === surgeon_id);

    if (roomConflict || surgeonConflict) {
      return NextResponse.json(
        {
          error: "Scheduling conflict",
          room_conflict:    roomConflict    ?? null,
          surgeon_conflict: surgeonConflict ?? null,
        },
        { status: 409 }
      );
    }

    // Fetch tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const { data: booking, error: insertErr } = await supabase
      .from("ot_bookings")
      .insert({
        tenant_id:       profile.tenant_id,
        room,
        surgeon_id,
        anaesthetist_id: anaesthetist_id ?? null,
        patient_id:      patient_id      ?? null,
        procedure_name,
        starts_at,
        ends_at,
        notes:           notes           ?? null,
        status:          "scheduled",
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ booking }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
