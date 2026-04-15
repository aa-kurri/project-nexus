"use server";

import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StaffCredential {
  id:          string;
  deviceName:  string | null;
  aaguid:      string | null;
  transports:  string[] | null;
  backedUp:    boolean;
  createdAt:   string;
  lastUsedAt:  string | null;
}

export interface RegistrationOptions {
  challenge:    string;   // base64url-encoded random challenge
  rpId:         string;   // relying party ID (hostname)
  rpName:       string;
  userId:       string;   // base64url-encoded staff UUID
  userName:     string;   // staff email or name
  userDisplayName: string;
  excludeCredentialIds: string[];   // prevent re-registering existing keys
  timeout:      number;
}

// ── getRegistrationOptions ────────────────────────────────────────────────────
// Issues a fresh FIDO2 challenge for navigator.credentials.create().
// Challenge must be stored server-side (Redis/DB) and verified within 2 minutes.

export async function getRegistrationOptions(
  staffId: string,
): Promise<{ ok: boolean; options?: RegistrationOptions; error?: string }> {
  if (!staffId) return { ok: false, error: "staffId is required" };

  // TODO: replace stub with full server-side implementation
  // 1. const { data: profile } = await supabase
  //      .from("profiles")
  //      .select("id, full_name, email")
  //      .eq("id", staffId)
  //      .single()
  // 2. const challenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")
  // 3. await redis.set(`webauthn:reg:challenge:${staffId}`, challenge, { ex: 120 })
  // 4. const { data: existing } = await supabase
  //      .from("webauthn_credentials")
  //      .select("credential_id")
  //      .eq("staff_id", staffId)
  // 5. return { ok: true, options: {
  //      challenge,
  //      rpId:    new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname,
  //      rpName:  "Ayura OS",
  //      userId:  Buffer.from(staffId).toString("base64url"),
  //      userName: profile.email,
  //      userDisplayName: profile.full_name,
  //      excludeCredentialIds: existing.map(c => c.credential_id),
  //      timeout: 60_000,
  //    }}

  return {
    ok: true,
    options: {
      challenge:            "STUB_CHALLENGE_REPLACE_WITH_CRYPTO_RANDOM_32_BYTES",
      rpId:                 "localhost",
      rpName:               "Ayura OS",
      userId:               Buffer.from(staffId).toString("base64url"),
      userName:             "doctor@ayura.health",
      userDisplayName:      "Dr. Staff Member",
      excludeCredentialIds: [],
      timeout:              60_000,
    },
  };
}

// ── registerStaffCredential ───────────────────────────────────────────────────
// Persists a verified FIDO2 credential. Full server-side verification via
// @simplewebauthn/server must replace the stub before production.

const RegisterSchema = z.object({
  staffId:       z.string().uuid(),
  credentialId:  z.string().min(1).max(512),
  publicKeyCbor: z.string().min(1),
  counter:       z.number().int().nonneg(),
  deviceName:    z.string().max(120).optional(),
  aaguid:        z.string().optional(),
  transports:    z.array(z.string()).optional(),
  backedUp:      z.boolean().optional(),
  // Raw authenticator response for server-side verification
  attestationObject: z.string().optional(),
  clientDataJSON:    z.string().optional(),
});

export async function registerStaffCredential(
  input: z.infer<typeof RegisterSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // TODO: replace stub with full @simplewebauthn/server verification
  // 1. const expectedChallenge = await redis.getdel(`webauthn:reg:challenge:${parsed.data.staffId}`)
  //    if (!expectedChallenge) return { ok: false, error: "Challenge expired or not found" }
  // 2. const verification = await verifyRegistrationResponse({
  //      response: {
  //        id:       parsed.data.credentialId,
  //        rawId:    parsed.data.credentialId,
  //        response: {
  //          attestationObject: parsed.data.attestationObject!,
  //          clientDataJSON:    parsed.data.clientDataJSON!,
  //        },
  //        type: "public-key",
  //      },
  //      expectedChallenge,
  //      expectedOrigin: process.env.NEXT_PUBLIC_SITE_URL!,
  //      expectedRPID:   new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname,
  //      requireUserVerification: true,
  //    })
  // 3. if (!verification.verified) return { ok: false, error: "WebAuthn verification failed" }
  // 4. const { credentialID, credentialPublicKey, counter, aaguid, credentialBackedUp,
  //            credentialDeviceType } = verification.registrationInfo!
  // 5. await supabase.from("webauthn_credentials").insert({
  //      tenant_id:       jwt_tenant(),
  //      staff_id:        parsed.data.staffId,
  //      credential_id:   base64url.encode(credentialID),
  //      public_key_cbor: base64url.encode(credentialPublicKey),
  //      counter,
  //      device_name:     parsed.data.deviceName,
  //      aaguid:          aaguid ? uuidify(aaguid) : null,
  //      transports:      parsed.data.transports ?? [],
  //      backed_up:       credentialBackedUp,
  //    })
  // 6. await supabase.from("staff_webauthn_events").insert({
  //      tenant_id:     jwt_tenant(),
  //      staff_id:      parsed.data.staffId,
  //      credential_id: base64url.encode(credentialID),
  //      event_type:    "register_success",
  //      success:       true,
  //      rp_id:         new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname,
  //    })
  // 7. Update profiles.fido2_public_key with latest key for quick auth checks

  await new Promise(r => setTimeout(r, 400));
  return { ok: true };
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
