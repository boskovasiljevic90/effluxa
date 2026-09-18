"use client";

import { useEffect } from "react";
import {
  ACQUISITION_COOKIE,
  ACQUISITION_COOKIE_MAX_AGE,
  buildAcquisitionAttribution,
} from "@/lib/acquisition";

export default function AcquisitionCapture() {
  useEffect(() => {
    if (localStorage.getItem("effluxa_cookie_consent") !== "accepted") return;

    const hasExistingAttribution = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(`${ACQUISITION_COOKIE}=`));

    if (hasExistingAttribution) return;

    const attribution = buildAcquisitionAttribution(
      window.location.search,
      window.location.pathname
    );

    if (!attribution) return;

    document.cookie = [
      `${ACQUISITION_COOKIE}=${encodeURIComponent(JSON.stringify(attribution))}`,
      `Max-Age=${ACQUISITION_COOKIE_MAX_AGE}`,
      "Path=/",
      "SameSite=Lax",
    ].join("; ");
  }, []);

  return null;
}
