/**
 * Security types for the patient route group.
 */

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
