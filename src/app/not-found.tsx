import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        fontSize: '6rem',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 900,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
      }}>
        404
      </div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', color: 'var(--text-primary)' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.7 }}>
        The anime you&apos;re looking for doesn&apos;t exist or has been removed. Try searching for something else.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn-accent">
          Go Home
        </Link>
        <Link href="/search" className="btn-ghost">
          Browse Anime
        </Link>
      </div>
    </div>
  );
}
