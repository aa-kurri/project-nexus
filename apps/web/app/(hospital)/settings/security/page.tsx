"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Key,
  ShieldCheck,
  Usb,
  Wifi,
  Bluetooth,
  Smartphone,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CloudIcon,
} from "lucide-react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import WebAuthnSetup from "@/components/auth/WebAuthnSetup";
import { cn } from "@/lib/utils";
import {
  getEnrolledKeys,
  revokeKey,
  type StaffCredential,
} from "./actions";

// ── Demo staff ID (replace with real auth session) ────────────────────────────
const STUB_STAFF_ID = "00000000-0000-0000-0000-000000000001";

// ── Helpers ───────────────────────────────────────────────────────────────────

function transportIcon(transport: string) {
  switch (transport) {
    case "usb":      return <Usb        className="h-3 w-3" />;
    case "nfc":      return <Wifi       className="h-3 w-3" />;
    case "ble":      return <Bluetooth  className="h-3 w-3" />;
    case "internal": return <Smartphone className="h-3 w-3" />;
    default:         return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
      {label}
    </p>
  );
}

// ── CredentialRow ─────────────────────────────────────────────────────────────

function CredentialRow({
  cred,
  onRevoke,
  revoking,
}: {
  cred:     StaffCredential;
  onRevoke: (id: string) => void;
  revoking: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      {/* Icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-[hsl(220_13%_9%)]">
        <Key className="h-4 w-4 text-[#0F766E]" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-fg">
          {cred.deviceName ?? "Unnamed key"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Added {formatDate(cred.createdAt)}
          {cred.lastUsedAt && ` · Last used ${formatDate(cred.lastUsedAt)}`}
        </p>

        {/* Transport + backup badges */}
        {((cred.transports?.length ?? 0) > 0 || cred.backedUp) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {cred.transports?.map(t => (
              <Badge
                key={t}
                variant="outline"
                className="flex items-center gap-1 border-[#0F766E]/30 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
              >
                {transportIcon(t)} {t.toUpperCase()}
              </Badge>
            ))}
            {cred.backedUp && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-400"
              >
                <CloudIcon className="h-2.5 w-2.5" /> Passkey
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Revoke */}
      <button
        onClick={() => onRevoke(cred.id)}
        disabled={revoking}
        title="Remove key"
        className="mt-0.5 rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {revoking
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Trash2  className="h-4 w-4" />
        }
      </button>
    </div>
  );
}

// ── SecurityPage ──────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [keys, setKeys]             = useState<StaffCredential[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showSetup, setShowSetup]   = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [pending, startTx]          = useTransition();

  // ── Load enrolled keys ─────────────────────────────────────────────────────

  useEffect(() => {
    void getEnrolledKeys(STUB_STAFF_ID).then(data => {
      setKeys(data);
      setLoading(false);
    });
  }, []);

  // ── Revoke ─────────────────────────────────────────────────────────────────

  function handleRevoke(keyId: string) {
    setRevokingId(keyId);
    setError(null);
    startTx(async () => {
      const res = await revokeKey(STUB_STAFF_ID, keyId);
      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== keyId));
      } else {
        setError(res.error ?? "Failed to remove key.");
      }
      setRevokingId(null);
    });
  }

  // ── Setup complete ─────────────────────────────────────────────────────────

  function handleSetupComplete(deviceName: string) {
    setShowSetup(false);
    // Optimistically prepend the new key; a real implementation would refetch
    setKeys(prev => [
      {
        id:         crypto.randomUUID(),
        deviceName,
        aaguid:     null,
        transports: null,
        backedUp:   false,
        createdAt:  new Date().toISOString(),
        lastUsedAt: null,
      },
      ...prev,
    ]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <TopBar title="Hardware Key Security" />

      <ScrollArea className="flex-1">
        <main className="mx-auto max-w-lg space-y-5 p-6 pb-12">

          {/* ── Story badge ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
            <span className="text-sm font-medium text-fg">Zero-Trust Hardware Key Pairing</span>
            <Badge
              variant="outline"
              className="ml-auto border-[#0F766E]/40 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
            >
              S-AUTH-HWKEY
            </Badge>
          </div>

          {/* ── What is this ────────────────────────────────────────────── */}
          <Card className="p-4">
            <p className="text-sm text-muted">
              Hardware keys (YubiKey, Touch ID, Windows Hello) give you phishing-resistant
              FIDO2 login. Each key creates a unique cryptographic keypair — your private key
              never leaves your device.
            </p>
          </Card>

          {/* ── Enrolled keys ───────────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <SectionHeader label="Enrolled keys" />
              {!showSetup && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => { setShowSetup(true); setError(null); }}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add key
                </Button>
              )}
            </div>

            <Card className={cn("px-4", showSetup && "rounded-b-none border-b-0")}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
                </div>
              ) : keys.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Key className="mx-auto h-8 w-8 text-muted/40" />
                  <p className="text-sm text-muted">No hardware keys registered yet.</p>
                  <p className="text-xs text-muted/60">
                    Add a key below to enable passwordless login.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {keys.map(k => (
                    <CredentialRow
                      key={k.id}
                      cred={k}
                      onRevoke={handleRevoke}
                      revoking={revokingId === k.id && pending}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* ── Registration wizard (inline) ──────────────────────────── */}
            {showSetup && (
              <Card className="rounded-t-none border-t border-dashed border-[#0F766E]/30 bg-[hsl(220_13%_9%)] p-6">
                <WebAuthnSetup
                  staffId={STUB_STAFF_ID}
                  onComplete={handleSetupComplete}
                  onCancel={() => setShowSetup(false)}
                />
              </Card>
            )}
          </div>

          {/* ── Error ───────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Zero-Trust notice ────────────────────────────────────────── */}
          <p className="text-center text-[10px] text-muted">
            All key registrations and revocations are written to the immutable{" "}
            <span className="font-mono">staff_webauthn_events</span> table for Zero-Trust
            audit compliance. Removing a key immediately invalidates its sign-in ability.
          </p>

        </main>
      </ScrollArea>
    </>
  );
}
