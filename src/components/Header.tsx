'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import InstantSearch from './InstantSearch';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Browse', href: '/search' },
  { label: 'Trending', href: '/search?sort=popularity' },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]);
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
          >
            <polygon points="4,2 20,11 4,20" fill="var(--accent)" />
          </svg>
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.375rem',
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
              textShadow: '0 0 18px var(--accent), 0 0 40px rgba(0,245,212,0.35)',
            }}
          >
            AniStream
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search & Mobile controls container */}
        <div style={{ display: 'none', alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: 'flex-end' }} className="desktop-actions">
          <InstantSearch />
        </div>

        {/* Mobile menu burger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="mobile-burger"
          aria-label="Toggle navigation menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav panel dropdown */}
      {menuOpen && (
        <div
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
          }}
          className="mobile-panel"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
              style={{ width: 'fit-content' }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', width: '100%' }}>
            <InstantSearch />
          </div>
        </div>
      )}

      {/* Breakpoint styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
        }
        @media (max-width: 768px) {
          .mobile-burger { display: block !important; }
          .mobile-panel { display: flex !important; }
        }
      `}} />
    </header>
  );
}
