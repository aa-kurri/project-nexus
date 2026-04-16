"use server";

// Re-export all actions from the lock actions file so the settings page
// has a single import and the lock page keeps its own co-located copy.
export {
  getLockSettings,
  saveBiometricSettings,
  registerWebAuthnCredential,
  getBiometricChallenge,
  getEnrolledDevices,
  revokeDevice,
} from "@/app/(patient)/lock/actions";
