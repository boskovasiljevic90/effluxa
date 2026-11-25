"use client";

import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("effluxa_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("effluxa_cookie_consent", "accepted");
    window.location.reload();
  }

  function reject() {
    localStorage.setItem("effluxa_cookie_consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Privacy preferences">
      <div>
        <div className="cookie-consent-title">Privacy preferences</div>
        <p className="cookie-consent-text">
          Effluxa uses analytics cookies to understand product usage and improve the service.
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-accept" onClick={accept}>
          Accept
        </button>
        <button type="button" className="cookie-consent-reject" onClick={reject}>
          Reject
        </button>
      </div>
    </div>
  );
}
