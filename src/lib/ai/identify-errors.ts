import type { IdentificationProvider, AIResponseSource } from "@/lib/types/ai";

export interface IdentifyDebugLog {
  openaiKeyConfigured: boolean;
  plantnetKeyConfigured: boolean;
  plantIdKeyConfigured: boolean;
  imageCount: number;
  imageBytes: number[];
  responseSource: AIResponseSource | null;
  identificationProvider: IdentificationProvider | null;
  fallbackReason: string | null;
  openaiRawPreview: string | null;
  openaiError: string | null;
  plantnetRawPreview: string | null;
  plantnetError: string | null;
  failureStep: string | null;
}

export class IdentificationFailedError extends Error {
  readonly debug: IdentifyDebugLog;

  constructor(message: string, debug: IdentifyDebugLog) {
    super(message);
    this.name = "IdentificationFailedError";
    this.debug = debug;
  }
}

export function logIdentifyDebug(route: string, debug: IdentifyDebugLog): void {
  console.info(`[${route}] identify debug`, {
    openaiKeyConfigured: debug.openaiKeyConfigured,
    plantnetKeyConfigured: debug.plantnetKeyConfigured,
    plantIdKeyConfigured: debug.plantIdKeyConfigured,
    imageCount: debug.imageCount,
    imageBytes: debug.imageBytes,
    responseSource: debug.responseSource,
    identificationProvider: debug.identificationProvider,
    fallbackReason: debug.fallbackReason,
    openaiError: debug.openaiError,
    plantnetError: debug.plantnetError,
    failureStep: debug.failureStep,
    openaiRawPreview: debug.openaiRawPreview,
    plantnetRawPreview: debug.plantnetRawPreview,
  });
}
