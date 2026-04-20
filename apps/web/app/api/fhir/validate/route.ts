import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface ValidationError {
  field: string;
  message: string;
}

/**
 * POST /api/fhir/validate
 *
 * Validates a FHIR R4 Patient resource against the ABDM HIP profile.
 *
 * Required fields:
 *   resourceType  – must be "Patient"
 *   identifier[]  – at least one with system "https://healthid.ndhm.gov.in" (ABHA ID)
 *   name[0]       – must have text OR (given + family)
 *   gender        – "male" | "female" | "other" | "unknown"
 *   birthDate     – ISO date YYYY-MM-DD
 *
 * Response:
 *   200 { valid: true }
 *   200 { valid: false, errors: [{ field, message }] }
 *   400 { error: "..." }   – body is not valid JSON or missing resourceType
 *   401 { error: "Unauthorized" }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth guard
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

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const errors: ValidationError[] = [];

    // 1. resourceType
    if (body.resourceType !== "Patient") {
      return NextResponse.json(
        { error: `resourceType must be "Patient", got "${body.resourceType ?? "(missing)"}"`  },
        { status: 400 }
      );
    }

    // 2. ABHA identifier
    const ABHA_SYSTEM = "https://healthid.ndhm.gov.in";
    const identifiers: any[] = Array.isArray(body.identifier) ? body.identifier : [];
    const hasAbha = identifiers.some(
      (id) => typeof id === "object" && id.system === ABHA_SYSTEM && id.value
    );
    if (!hasAbha) {
      errors.push({
        field: "identifier",
        message: `At least one identifier with system "${ABHA_SYSTEM}" (ABHA ID) is required`,
      });
    }

    // 3. name
    const names: any[] = Array.isArray(body.name) ? body.name : [];
    if (names.length === 0) {
      errors.push({ field: "name", message: "At least one name entry is required" });
    } else {
      const first = names[0];
      const hasText   = typeof first?.text === "string" && first.text.trim().length > 0;
      const hasGiven  = Array.isArray(first?.given) && first.given.length > 0;
      const hasFamily = typeof first?.family === "string" && first.family.trim().length > 0;
      if (!hasText && !(hasGiven && hasFamily)) {
        errors.push({
          field: "name[0]",
          message: "name must have either text, or both given and family",
        });
      }
    }

    // 4. gender
    const VALID_GENDERS = ["male", "female", "other", "unknown"];
    if (!VALID_GENDERS.includes(body.gender)) {
      errors.push({
        field: "gender",
        message: `gender must be one of: ${VALID_GENDERS.join(", ")}`,
      });
    }

    // 5. birthDate — YYYY-MM-DD
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof body.birthDate !== "string" || !ISO_DATE_RE.test(body.birthDate)) {
      errors.push({
        field: "birthDate",
        message: "birthDate must be a valid date in YYYY-MM-DD format",
      });
    } else {
      const d = new Date(body.birthDate);
      if (isNaN(d.getTime()) || d > new Date()) {
        errors.push({
          field: "birthDate",
          message: "birthDate must be a valid past date",
        });
      }
    }

    if (errors.length === 0) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
