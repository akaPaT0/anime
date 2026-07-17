interface SkeletonGridProps {
  count?: number;
}

export default function SkeletonGrid({ count = 12 }: SkeletonGridProps) {
  return (
    <div className="anime-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Poster placeholder */}
          <div
            className="skeleton"
            style={{ aspectRatio: '2 / 3', width: '100%' }}
          />

          {/* Title lines */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              className="skeleton"
              style={{ height: '14px', borderRadius: '4px', width: '85%' }}
            />
            <div
              className="skeleton"
              style={{ height: '12px', borderRadius: '4px', width: '55%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
