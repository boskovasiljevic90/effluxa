"use client";

import Link from "next/link";
import { useState } from "react";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="public-header">
      <Link href="/" className="public-brand" onClick={closeMenu} aria-label="Effluxa home">
        <img src="/brand/effluxa-wordmark.svg" alt="Effluxa" />
      </Link>

      <nav className="public-desktop-nav">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">
          <button
            style={{
              padding: "12px 20px",
              borderRadius: "14px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Start Free
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
          <Link href="/#how-it-works" onClick={closeMenu}>How it works</Link>
          <Link href="/#pricing" onClick={closeMenu}>Pricing</Link>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>
          <Link href="/login" onClick={closeMenu}>Login</Link>
          <Link href="/signup" className="public-mobile-cta" onClick={closeMenu}>
            Start Free
          </Link>
        </nav>
      )}
    </header>
  );
}
