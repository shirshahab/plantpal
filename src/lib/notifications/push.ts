/**
 * Local push helpers. Uses the service worker registration when available
 * (required on Android/installed PWAs) and falls back to the Notification
 * constructor on desktop browsers.
 */

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function showLocalNotification(
  title: string,
  body: string,
  href: string = "/dashboard"
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;

  const options: NotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `plantpal-${href}`,
    data: { href },
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Register this device for server push (infrastructure for future web-push /
 * Expo backends). Subscribes via the PushManager when a VAPID public key is
 * configured and stores the subscription in `user_push_tokens`. No-op when
 * permission isn't granted or push isn't available — never throws.
 */
export async function registerPushToken(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  if (!("serviceWorker" in navigator)) return false;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false; // web-push backend not configured yet

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.pushManager) return false;

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));

    const res = await fetch("/api/notifications/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "web-push", token: JSON.stringify(sub.toJSON()) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
