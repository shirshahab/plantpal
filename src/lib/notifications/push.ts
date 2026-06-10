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
