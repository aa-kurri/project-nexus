"use server";

import {
  getLockSettings as getLockSettingsAction,
  saveBiometricSettings as saveBiometricSettingsAction,
  registerWebAuthnCredential as registerWebAuthnCredentialAction,
  getBiometricChallenge as getBiometricChallengeAction,
  getEnrolledDevices as getEnrolledDevicesAction,
  revokeDevice as revokeDeviceAction,
} from "@/app/(patient)/lock/actions";

export const getLockSettings = getLockSettingsAction;
export const saveBiometricSettings = saveBiometricSettingsAction;
export const registerWebAuthnCredential = registerWebAuthnCredentialAction;
export const getBiometricChallenge = getBiometricChallengeAction;
export const getEnrolledDevices = getEnrolledDevicesAction;
export const revokeDevice = revokeDeviceAction;
