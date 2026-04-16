/**
 * Security types for the hospital staff.
 */

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
