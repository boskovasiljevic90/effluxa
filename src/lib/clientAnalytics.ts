export function trackClientEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", eventName, params || {});
  }

  if (window.clarity) {
    window.clarity("event", eventName);
  }
}
