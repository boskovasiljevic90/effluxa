"use client";

import { useEffect } from "react";
import { normalizeReferralCode, REFERRAL_COOKIE } from "@/lib/referrals";

const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export default function ReferralCapture() {
  useEffect(() => {
    const code = normalizeReferralCode(
      new URLSearchParams(window.location.search).get("ref")
    );

    if (!code) return;

    const hasExistingReferral = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(`${REFERRAL_COOKIE}=`));

    if (hasExistingReferral) return;

    document.cookie = [
      `${REFERRAL_COOKIE}=${encodeURIComponent(code)}`,
      `Max-Age=${REFERRAL_COOKIE_MAX_AGE}`,
      "Path=/",
      "SameSite=Lax",
    ].join("; ");
  }, []);

  return null;
}
