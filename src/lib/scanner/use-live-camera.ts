"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deviceCameraConstraints,
  facingCameraConstraints,
  getCameraErrorMessage,
  isGetUserMediaSupported,
  listVideoInputs,
  rearCameraConstraints,
} from "@/lib/scanner/platform-camera";

export type LiveCameraPhase = "idle" | "starting" | "live" | "error";

interface UseLiveCameraOptions {
  enabled?: boolean;
}

export function useLiveCamera({ enabled = true }: UseLiveCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const facingModeRef = useRef<"environment" | "user">("environment");
  const switchIndexRef = useRef(0);

  const [phase, setPhase] = useState<LiveCameraPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    await video.play();
  }, []);

  const startStream = useCallback(async () => {
    if (!enabled) {
      stopStream();
      setPhase("idle");
      return;
    }

    if (!isGetUserMediaSupported()) {
      stopStream();
      setPhase("error");
      setError("Camera not supported in this browser. Upload a photo instead.");
      setCanSwitchCamera(false);
      return;
    }

    setPhase("starting");
    setError(null);
    stopStream();

    const constraints = deviceIdRef.current
      ? deviceCameraConstraints(deviceIdRef.current)
      : rearCameraConstraints();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      await attachStream(stream);

      const videoInputs = await listVideoInputs();
      setDevices(videoInputs);
      setCanSwitchCamera(videoInputs.length > 1);
      setPhase("live");
    } catch (initialError) {
      if (!deviceIdRef.current) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia(
            facingCameraConstraints(facingModeRef.current)
          );
          streamRef.current = fallbackStream;
          await attachStream(fallbackStream);
          const videoInputs = await listVideoInputs();
          setDevices(videoInputs);
          setCanSwitchCamera(videoInputs.length > 1);
          setPhase("live");
          return;
        } catch {
          /* fall through */
        }
      }

      stopStream();
      setPhase("error");
      setError(getCameraErrorMessage(initialError));
      setCanSwitchCamera(false);
    }
  }, [attachStream, enabled, stopStream]);

  const switchCamera = useCallback(async () => {
    if (devices.length > 1) {
      switchIndexRef.current = (switchIndexRef.current + 1) % devices.length;
      deviceIdRef.current = devices[switchIndexRef.current]?.deviceId ?? null;
    } else {
      deviceIdRef.current = null;
      facingModeRef.current =
        facingModeRef.current === "environment" ? "user" : "environment";
    }
    await startStream();
  }, [devices, startStream]);

  useEffect(() => {
    if (!enabled) {
      stopStream();
      setPhase("idle");
      return;
    }

    void startStream();
    return () => stopStream();
  }, [enabled, startStream, stopStream]);

  useEffect(() => {
    if (!enabled) return;

    function onVisibilityChange() {
      if (document.hidden) {
        stopStream();
        setPhase("idle");
        return;
      }
      void startStream();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled, startStream, stopStream]);

  return {
    videoRef,
    phase,
    error,
    devices,
    canSwitchCamera: canSwitchCamera || devices.length > 1,
    switchCamera,
    restart: startStream,
    stop: stopStream,
    isSupported: isGetUserMediaSupported(),
  };
}
