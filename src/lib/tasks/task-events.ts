export const LESSON_COMPLETED_EVENT = "plantpal-lesson-completed";
export const PHOTO_UPLOADED_EVENT = "plantpal-photo-uploaded";
export const HEALTH_SCAN_EVENT = "plantpal-health-scan";

export function dispatchLessonCompleted(lessonId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LESSON_COMPLETED_EVENT, { detail: { lessonId } })
  );
}

export function dispatchPhotoUploaded(plantId: string, photoType: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PHOTO_UPLOADED_EVENT, { detail: { plantId, photoType } })
  );
}

export function dispatchHealthScan(plantId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HEALTH_SCAN_EVENT, { detail: { plantId: plantId ?? null } })
  );
}
