/**
 * Robust Native Browser and PWA Notification utility helper.
 * Solves the issue where 'new Notification()' is ignored or throws error on mobile browsers (Android and iOS).
 */

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    });
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  
  try {
    // Some browsers still use callback-based requestPermission
    const status = await Notification.requestPermission();
    return status;
  } catch (e) {
    // Fallback for older browsers
    return new Promise((resolve) => {
      Notification.requestPermission((status) => {
        resolve(status);
      });
    });
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "default";
  }
  return Notification.permission;
}

export async function triggerNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser.");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission is not granted. Current state:", Notification.permission);
    return false;
  }

  // Ensure absolute path or standard fallback for the notification icon
  const mergedOptions: any = {
    icon: "/pwa-192x192.svg",
    badge: "/pwa-192x192.svg",
    vibrate: [200, 100, 200],
    ...options
  };

  // 1. Primary method: Service Worker registration (Required for mobile Android & iOS, and general standalone PWA)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, mergedOptions);
        return true;
      }
    } catch (e) {
      console.error("Service Worker showNotification failed, trying fallback:", e);
    }
  }

  // 2. Secondary method: Standard window Notification constructor (Fallback for desktop or old browsers)
  try {
    new Notification(title, mergedOptions);
    return true;
  } catch (e) {
    console.error("Standard Notification constructor failed:", e);
    return false;
  }
}
