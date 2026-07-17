'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface EpisodeListProps {
  animeId: number;
  totalEpisodes: number;
  currentEp: number;
  subOrDub: 'sub' | 'dub';
}

const RANGE_SIZE = 100;

function buildRanges(total: number): { label: string; start: number; end: number }[] {
  const ranges: { label: string; start: number; end: number }[] = [];
  for (let start = 1; start <= total; start += RANGE_SIZE) {
    const end = Math.min(start + RANGE_SIZE - 1, total);
    ranges.push({ label: `${start}–${end}`, start, end });
  }
  return ranges;
}

export default function EpisodeList({
  animeId,
  totalEpisodes,
  currentEp,
  subOrDub,
}: EpisodeListProps) {
  const router = useRouter();
  const hasRanges = totalEpisodes > RANGE_SIZE;

  const ranges = useMemo(() => (hasRanges ? buildRanges(totalEpisodes) : []), [totalEpisodes, hasRanges]);

  const initialRange = useMemo(() => {
    if (!hasRanges) return 0;
    return ranges.findIndex((r) => currentEp >= r.start && currentEp <= r.end);
  }, [ranges, currentEp, hasRanges]);

  const [activeRange, setActiveRange] = useState<number>(Math.max(0, initialRange));
  const [filter, setFilter] = useState('');

  const rangeStart = hasRanges ? ranges[activeRange].start : 1;
  const rangeEnd = hasRanges ? ranges[activeRange].end : totalEpisodes;

  const episodes = useMemo(() => {
    const all = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);
    if (!filter.trim()) return all;
    const n = parseInt(filter.trim(), 10);
    if (isNaN(n)) return all;
    return all.filter((ep) => ep === n);
  }, [rangeStart, rangeEnd, filter]);

  function navigate(ep: number) {
    router.push(`/watch/${animeId}/${ep}?dub=${subOrDub === 'dub'}`);
  }

  function toggleDub() {
    const next = subOrDub === 'sub' ? 'dub' : 'sub';
    router.push(`/watch/${animeId}/${currentEp}?dub=${next === 'dub'}`);
  }

  return (
    <div className="episode-list-section">
      {/* Header row */}
      <div className="section-heading">
        <h2>Episodes</h2>
        <button
          onClick={toggleDub}
          className="dub-toggle-btn"
          aria-label={`Switch to ${subOrDub === 'sub' ? 'dub' : 'sub'}`}
        >
          <span className={subOrDub === 'sub' ? 'active-lang' : ''}>SUB</span>
          <span className="lang-divider">/</span>
          <span className={subOrDub === 'dub' ? 'active-lang' : ''}>DUB</span>
        </button>
      </div>

      {/* Episode search */}
      <div className="ep-search-wrap">
        <input
          type="number"
          min={1}
          max={totalEpisodes}
          placeholder="Jump to episode…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && hasRanges) {
              const idx = ranges.findIndex((r) => n >= r.start && n <= r.end);
              if (idx !== -1) setActiveRange(idx);
            }
          }}
          className="ep-search-input"
        />
      </div>

      {/* Range tabs */}
      {hasRanges && (
        <div className="ep-range-tabs" role="tablist" aria-label="Episode ranges">
          {ranges.map((r, idx) => (
            <button
              key={r.label}
              role="tab"
              aria-selected={activeRange === idx}
              onClick={() => {
                setActiveRange(idx);
                setFilter('');
              }}
              className={`ep-range-tab${activeRange === idx ? ' active' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Episode list */}
      <div className="episode-list-wrap">
        {episodes.length === 0 ? (
          <p className="ep-empty">No episode found.</p>
        ) : (
          episodes.map((ep) => (
            <button
              key={ep}
              onClick={() => navigate(ep)}
              className={`ep-item${ep === currentEp ? ' active' : ''}`}
              aria-current={ep === currentEp ? 'true' : undefined}
            >
              <span className="ep-number">EP {ep}</span>
              <span className="ep-label">Episode {ep}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
