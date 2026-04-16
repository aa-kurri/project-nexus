"use server";

import { z } from "zod";

import { type StaffCredential, type RegistrationOptions } from "./types";

// ── getRegistrationOptions ────────────────────────────────────────────────────
// Issues a fresh FIDO2 challenge for navigator.credentials.create().
// Challenge must be stored server-side (Redis/DB) and verified within 2 minutes.

import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  verifiedRegistrationResponse 
} from "@simplewebauthn/server";
import { redis, storeChallenge, getAndClearChallenge } from "@/lib/redis";
import { createClient } from "@/utils/supabase/server";

const RP_ID = process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost";
const RP_NAME = "Ayura OS";

export async function getRegistrationOptions(
  staffId: string,
): Promise<{ ok: boolean; options?: any; error?: string }> {
  if (!staffId) return { ok: false, error: "staffId is required" };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", staffId)
    .single();

  if (!profile) return { ok: false, error: "Profile not found" };

  const { data: existingKeys } = await supabase
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("staff_id", staffId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID:   RP_ID,
    userID: staffId,
    userName: profile.full_name,
    userDisplayName: profile.full_name,
    attestationType: "none",
    excludeCredentials: (existingKeys || []).map(k => ({
      id: Buffer.from(k.credential_id, 'base64url'),
      type: "public-key",
    })),
    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "preferred",
    },
  });

  // Store challenge in Redis
  await storeChallenge(staffId, options.challenge);

  return {
    ok: true,
    options,
  };
}

const RegisterSchema = z.object({
  staffId:       z.string().uuid(),
  registrationResponse: z.any(), // The full response from the browser
  deviceName:    z.string().max(120).optional(),
});

export async function registerStaffCredential(
  input: z.infer<typeof RegisterSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const expectedChallenge = await getAndClearChallenge(parsed.data.staffId);
  if (!expectedChallenge) return { ok: false, error: "Challenge expired or invalid" };

  try {
    const verification = await verifyRegistrationResponse({
      response: parsed.data.registrationResponse,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: "Verification failed" };
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const supabase = createClient();

    const { error } = await supabase.from("webauthn_credentials").insert({
      staff_id: parsed.data.staffId,
      credential_id: Buffer.from(credentialID).toString("base64url"),
      public_key_cbor: Buffer.from(credentialPublicKey).toString("base64url"),
      counter,
      device_name: parsed.data.deviceName || "Unknown Device",
    });

    if (error) throw error;

    return { ok: true };
  } catch (err: any) {
    console.error("WebAuthn Verification Error:", err);
    return { ok: false, error: err.message };
  }
}

// ── getEnrolledKeys ───────────────────────────────────────────────────────────

export async function getEnrolledKeys(
  staffId: string,
): Promise<StaffCredential[]> {
  if (!staffId) return [];

  // TODO: replace stub with real Supabase query
  // const { data } = await supabase
  //   .from("webauthn_credentials")
  //   .select("id, device_name, aaguid, transports, backed_up, created_at, last_used_at")
  //   .eq("staff_id", staffId)
  //   .order("created_at", { ascending: false })
  // return (data ?? []).map(r => ({
  //   id:         r.id,
  //   deviceName: r.device_name,
  //   aaguid:     r.aaguid,
  //   transports: r.transports,
  //   backedUp:   r.backed_up,
  //   createdAt:  r.created_at,
  //   lastUsedAt: r.last_used_at,
  // }))

  return [
    {
      id:          "00000000-0000-0000-0000-000000000010",
      deviceName:  "YubiKey 5C NFC",
      aaguid:      "2fc0579f-8113-47ea-b116-bb5a8db9202a",
      transports:  ["usb", "nfc"],
      backedUp:    false,
      createdAt:   "2026-04-12T09:00:00Z",
      lastUsedAt:  "2026-04-15T07:45:00Z",
    },
  ];
}

// ── revokeKey ─────────────────────────────────────────────────────────────────

export async function revokeKey(
  staffId: string,
  keyId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!staffId || !keyId) return { ok: false, error: "Missing parameters" };

  // TODO: replace stub with real delete + audit log
  // 1. const { data } = await supabase
  //      .from("webauthn_credentials")
  //      .select("credential_id")
  //      .eq("id", keyId)
  //      .eq("staff_id", staffId)
  //      .single()
  //    if (!data) return { ok: false, error: "Key not found" }
  // 2. await supabase.from("webauthn_credentials")
  //      .delete()
  //      .eq("id", keyId)
  //      .eq("staff_id", staffId)
  // 3. await supabase.from("staff_webauthn_events").insert({
  //      tenant_id:     jwt_tenant(),
  //      staff_id:      staffId,
  //      credential_id: data.credential_id,
  //      event_type:    "revoke_success",
  //      success:       true,
  //    })
  // 4. Invalidate any active sessions using this credential (Redis blacklist)

  await new Promise(r => setTimeout(r, 300));
  return { ok: true };
}
