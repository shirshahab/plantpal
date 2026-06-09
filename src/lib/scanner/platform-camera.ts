export function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera permission denied. Allow camera access in your browser settings, or upload a photo instead.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No camera found on this device. Upload a photo instead.";
      case "NotReadableError":
      case "TrackStartError":
        return "Camera is in use by another app. Close it and try again, or upload a photo.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "Could not use the rear camera. Try switching cameras or upload a photo.";
      case "SecurityError":
        return "Camera access requires a secure connection (HTTPS). Upload a photo instead.";
      case "AbortError":
        return "Camera was interrupted. Try again or upload a photo.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Could not open the camera. Upload a photo instead.";
}

export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!isGetUserMediaSupported()) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch {
    return [];
  }
}

export function rearCameraConstraints(): MediaStreamConstraints {
  return {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };
}

export function deviceCameraConstraints(deviceId: string): MediaStreamConstraints {
  return {
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };
}

export function facingCameraConstraints(
  facingMode: "environment" | "user"
): MediaStreamConstraints {
  return {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };
}

/** Prefer a rear/environment camera when device labels are available. */
export function pickPreferredRearDeviceId(devices: MediaDeviceInfo[]): string | null {
  if (devices.length === 0) return null;

  const rear = devices.find((device) =>
    /back|rear|environment|trás|arrière/i.test(device.label)
  );
  if (rear?.deviceId) return rear.deviceId;

  // Many phones list the rear camera last once labels are exposed.
  return devices[devices.length - 1]?.deviceId ?? devices[0]?.deviceId ?? null;
}

export function isLikelyRearCamera(device: MediaDeviceInfo): boolean {
  return /back|rear|environment|trás|arrière/i.test(device.label);
}
