/**
 * Ambient declarations for packages that ship after pnpm install.
 * Run: pnpm add expo-file-system @react-native-community/netinfo
 */

// Expo's Metro bundler replaces process.env.EXPO_PUBLIC_* at bundle time.
// Declare the global so TypeScript is satisfied without pulling in @types/node.
declare const process: { env: { [key: string]: string | undefined } };

declare module "expo-file-system" {
  /** Writable, persistent app document directory (null only in rare test envs). */
  export const documentDirectory: string | null;

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: "utf8" | "base64" }
  ): Promise<void>;

  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: "utf8" | "base64" }
  ): Promise<string>;

  export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
    md5?: string;
  }
  export function getInfoAsync(fileUri: string, options?: { md5?: boolean }): Promise<FileInfo>;

  export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
}

declare module "@react-native-community/netinfo" {
  export type NetInfoStateType =
    | "none"
    | "unknown"
    | "cellular"
    | "wifi"
    | "bluetooth"
    | "ethernet"
    | "wimax"
    | "vpn"
    | "other";

  export interface NetInfoState {
    type: NetInfoStateType;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: Record<string, unknown> | null;
  }

  export type NetInfoChangeHandler = (state: NetInfoState) => void;
  export type NetInfoUnsubscribe = () => void;

  const NetInfo: {
    addEventListener(listener: NetInfoChangeHandler): NetInfoUnsubscribe;
    fetch(): Promise<NetInfoState>;
    configure(configuration: Record<string, unknown>): void;
  };

  export default NetInfo;
}
