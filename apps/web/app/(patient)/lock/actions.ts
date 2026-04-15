"use server";

import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LockSettings {
  lockEnabled:    boolean;
  hasBiometric:   boolean;
  hasPin:         boolean;
  lockTimeoutMin: number;
  patientName:    string;
}

export interface EnrolledDevice {
  id:         string;
  deviceName: string | null;
  createdAt:  string;
  lastUsedAt: string | null;
}

// ── getLockSettings ───────────────────────────────────────────────────────────

export async function getLockSettings(): Promise<LockSettings> {
  // TODO: replace stub with real Supabase query
  // 1. const { data: { user } } = await supabase.auth.getUser()
  // 2. const { data: settings } = await supabase
  //      .from("patient_biometric_settings")
  //      .select("lock_enabled, lock_timeout_min, pin_hash, patients(full_name)")
  //      .eq("patient_id", user.id)
  //      .maybeSingle()
  // 3. const { count } = await supabase
  //      .from("patient_webauthn_credentials")
  //      .select("id", { count: "exact", head: true })
  //      .eq("patient_id", user.id)
  // 4. return {
  //      lockEnabled:    settings?.lock_enabled ?? false,
  //      hasBiometric:   (count ?? 0) > 0,
  //      hasPin:         !!settings?.pin_hash,
  //      lockTimeoutMin: settings?.lock_timeout_min ?? 5,
  //      patientName:    settings?.patients?.full_name ?? "Patient",
  //    }

  return {
    lockEnabled:    false, // false on first launch → setup wizard
    hasBiometric:   false,
    hasPin:         false,
    lockTimeoutMin: 5,
    patientName:    "Aryan Mehra",
  };
}

// ── verifyPin ─────────────────────────────────────────────────────────────────

const VerifyPinSchema = z.object({
  patientId: z.string().uuid(),
  pin:       z.string().length(6).regex(/^\d{6}$/),
});

export async function verifyPin(
  patientId: string,
  pin: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = VerifyPinSchema.safeParse({ patientId, pin });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  // TODO: replace stub with real bcrypt comparison
  // 1. const { data } = await supabase
  //      .from("patient_biometric_settings")
  //      .select("pin_hash")
  //      .eq("patient_id", patientId)
  //      .single()
  // 2. const ok = await bcrypt.compare(pin, data.pin_hash)
  // 3. await supabase.from("patient_lock_events").insert({
  //      tenant_id:  jwt_tenant(),
  //      patient_id: patientId,
  //      event_type: ok ? "unlock_pin" : "unlock_failed",
  //      method:     "pin",
  //      success:    ok,
  //      ip_address: request.ip,
  //      user_agent: request.headers["user-agent"],
  //    })
  // 4. return { ok }

  await new Promise(r => setTimeout(r, 300));
  return { ok: true };
}

// ── saveBiometricSettings ─────────────────────────────────────────────────────

const SaveSettingsSchema = z.object({
  patientId:      z.string().uuid(),
  lockEnabled:    z.boolean(),
  lockTimeoutMin: z.union([
    z.literal(1),
    z.literal(5),
    z.literal(15),
    z.literal(30),
  ]),
  // PIN must be hashed server-side; client sends raw PIN only during setup
  rawPin:         z.string().length(6).regex(/^\d{6}$/).optional(),
});

export async function saveBiometricSettings(
  input: z.infer<typeof SaveSettingsSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = SaveSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // TODO: replace stub with real upsert
  // 1. const pinHash = parsed.data.rawPin
  //      ? await bcrypt.hash(parsed.data.rawPin, 12)
  //      : undefined
  // 2. await supabase.from("patient_biometric_settings").upsert({
  //      tenant_id:        jwt_tenant(),
  //      patient_id:       parsed.data.patientId,
  //      lock_enabled:     parsed.data.lockEnabled,
  //      lock_timeout_min: parsed.data.lockTimeoutMin,
  //      ...(pinHash ? { pin_hash: pinHash } : {}),
  //    }, { onConflict: "tenant_id,patient_id" })
  // 3. await supabase.from("patient_lock_events").insert({
  //      tenant_id:  jwt_tenant(),
  //      patient_id: parsed.data.patientId,
  //      event_type: parsed.data.rawPin ? "setup_pin" : "change_pin",
  //      method:     "pin",
  //      success:    true,
  //    })

  await new Promise(r => setTimeout(r, 400));
  return { ok: true };
}

// ── registerWebAuthnCredential ────────────────────────────────────────────────

const RegisterCredentialSchema = z.object({
  patientId:     z.string().uuid(),
  credentialId:  z.string().min(1),
  publicKeyCbor: z.string().min(1),
  deviceName:    z.string().max(120).optional(),
  aaguid:        z.string().optional(),
});

export async function registerWebAuthnCredential(
  input: z.infer<typeof RegisterCredentialSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = RegisterCredentialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // TODO: replace stub with @simplewebauthn/server verification + DB insert
  // 1. const verification = await verifyRegistrationResponse({
  //      response:          parsedCredential,
  //      expectedChallenge: await redis.getdel(`webauthn:challenge:${patientId}`),
  //      expectedOrigin:    process.env.NEXT_PUBLIC_SITE_URL!,
  //      expectedRPID:      new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname,
  //    })
  // 2. if (!verification.verified) return { ok: false, error: "WebAuthn verification failed" }
  // 3. const { credentialID, credentialPublicKey, counter } = verification.registrationInfo!
  // 4. await supabase.from("patient_webauthn_credentials").insert({
  //      tenant_id:       jwt_tenant(),
  //      patient_id:      parsed.data.patientId,
  //      credential_id:   base64url.encode(credentialID),
  //      public_key_cbor: base64url.encode(credentialPublicKey),
  //      counter,
  //      device_name:     parsed.data.deviceName,
  //      aaguid:          parsed.data.aaguid,
  //    })
  // 5. await supabase.from("patient_lock_events").insert({ event_type: "setup_biometric", method: "webauthn", success: true, ... })

  await new Promise(r => setTimeout(r, 300));
  return { ok: true };
}

// ── getBiometricChallenge ─────────────────────────────────────────────────────

export async function getBiometricChallenge(
  patientId: string,
): Promise<{ challenge: string; credentialIds: string[] }> {
  // TODO: replace stub with real challenge generation
  // 1. const challenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")
  // 2. await redis.set(`webauthn:challenge:${patientId}`, challenge, { ex: 120 })
  // 3. const { data: creds } = await supabase
  //      .from("patient_webauthn_credentials")
  //      .select("credential_id")
  //      .eq("patient_id", patientId)
  // 4. return { challenge, credentialIds: creds.map(c => c.credential_id) }

  return {
    challenge:     "STUB_CHALLENGE_REPLACE_WITH_CRYPTO_RANDOM",
    credentialIds: [],
  };
}

// ── getEnrolledDevices ────────────────────────────────────────────────────────

export async function getEnrolledDevices(
  patientId: string,
): Promise<EnrolledDevice[]> {
  // TODO: replace stub with real Supabase query
  // const { data } = await supabase
  //   .from("patient_webauthn_credentials")
  //   .select("id, device_name, created_at, last_used_at")
  //   .eq("patient_id", patientId)
  //   .order("created_at", { ascending: false })
  // return data ?? []

  return [
    {
      id:         "00000000-0000-0000-0000-000000000001",
      deviceName: "iPhone 16 · Face ID",
      createdAt:  "2026-04-10T08:23:00Z",
      lastUsedAt: "2026-04-15T07:11:00Z",
    },
  ];
}

// ── revokeDevice ──────────────────────────────────────────────────────────────

export async function revokeDevice(
  patientId: string,
  credentialId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!patientId || !credentialId) {
    return { ok: false, error: "Missing parameters" };
  }

  // TODO: replace stub with real delete + audit log
  // 1. await supabase.from("patient_webauthn_credentials")
  //      .delete()
  //      .eq("patient_id", patientId)
  //      .eq("id", credentialId)
  // 2. await supabase.from("patient_lock_events").insert({ event_type: "revoke_credential", method: "webauthn", success: true, ... })

  await new Promise(r => setTimeout(r, 300));
  return { ok: true };
}
