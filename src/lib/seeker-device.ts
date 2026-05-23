import { Platform } from "react-native";

type AndroidPlatformConstants = {
  Brand?: unknown;
  Fingerprint?: unknown;
  Manufacturer?: unknown;
  Model?: unknown;
  Release?: unknown;
};

export type SeekerDeviceInfo = {
  brand: string | null;
  fingerprint: string | null;
  isSeekerDevice: boolean;
  manufacturer: string | null;
  model: string | null;
  release: string | null;
};

function readPlatformConstant(name: keyof AndroidPlatformConstants) {
  const value = (Platform.constants as AndroidPlatformConstants)[name];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function getSeekerDeviceInfo(): SeekerDeviceInfo {
  const model = readPlatformConstant("Model");

  return {
    brand: readPlatformConstant("Brand"),
    fingerprint: readPlatformConstant("Fingerprint"),
    isSeekerDevice: Platform.OS === "android" && model === "Seeker",
    manufacturer: readPlatformConstant("Manufacturer"),
    model,
    release: readPlatformConstant("Release"),
  };
}

