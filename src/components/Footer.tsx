import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'DMCA', href: '/dmca' },
  { label: 'Privacy Policy', href: '/privacy' },
] as const;

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Top row: logo + links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Logo + tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 0 5px var(--accent))' }}
              >
                <polygon points="4,2 20,11 4,20" fill="var(--accent)" />
              </svg>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: 'var(--accent)',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 14px var(--accent), 0 0 32px rgba(0,245,212,0.3)',
                }}
              >
                AniStream
              </span>
            </Link>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                paddingLeft: '1.75rem',
              }}
            >
              Your gateway to anime
            </p>
          </div>

          {/* Footer nav links */}
          <nav
            aria-label="Footer navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}
          >
            {FOOTER_LINKS.map(({ label, href }, idx) => (
              <span key={href} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Link
                  href={href}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    transition: 'color 0.2s ease',
                  }}
                  className="footer-link"
                >
                  {label}
                </Link>
                {idx < FOOTER_LINKS.length - 1 && (
                  <span style={{ color: 'var(--border-subtle)', userSelect: 'none' }}>·</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-subtle)', opacity: 0.6 }} />

        {/* Bottom row: disclaimer + copyright */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              opacity: 0.65,
              maxWidth: '560px',
              lineHeight: 1.6,
            }}
          >
            AniStream does not host any files. All content is provided by third-party services.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              opacity: 0.45,
            }}
          >
            © 2026 AniStream
          </p>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--accent) !important; }
      `}</style>
    </footer>
  );
}
