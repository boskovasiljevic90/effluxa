"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { normalizeReferralCode } from "@/lib/referrals";
import EffluxaBrand from "@/components/EffluxaBrand";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupHref, setSignupHref] = useState("/signup");

  useEffect(() => {
    const referralCode = normalizeReferralCode(
      new URLSearchParams(window.location.search).get("ref")
    );

    if (referralCode) {
      setSignupHref(`/signup?ref=${encodeURIComponent(referralCode)}`);
    }
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="public-header">
      <Link href="/" className="public-brand" onClick={closeMenu} aria-label="Effluxa home">
        <EffluxaBrand />
      </Link>

      <nav className="public-desktop-nav">
        <Link href="/instant">Free check</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/for-accounting-firms">For Companies</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Login</Link>
        <Link href={signupHref}>
          <button className="public-primary-cta">
            Free check
          </button>
        </Link>
      </nav>

      <button
        type="button"
        className="public-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="public-mobile-menu"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        <span>{menuOpen ? "Close" : "Menu"}</span>
      </button>

      {menuOpen && (
        <nav id="public-mobile-menu" className="public-mobile-menu" aria-label="Mobile navigation">
          <Link href="/instant" onClick={closeMenu}>Free check</Link>
          <Link href="/#how-it-works" onClick={closeMenu}>How it works</Link>
          <Link href="/for-accounting-firms" onClick={closeMenu}>For Companies</Link>
          <Link href="/resources" onClick={closeMenu}>Resources</Link>
          <Link href="/#pricing" onClick={closeMenu}>Pricing</Link>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>
          <Link href="/login" onClick={closeMenu}>Login</Link>
          <Link href={signupHref} className="public-mobile-cta" onClick={closeMenu}>
            Start Free
          </Link>
        </nav>
      )}
    </header>
  );
}
