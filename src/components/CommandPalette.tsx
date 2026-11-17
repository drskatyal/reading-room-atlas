import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GLOBAL_SEARCH_ENTRIES } from '../data/modulesCatalog';
import type { ModuleId, SearchEntry } from '../types/radiology';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectEntry: (moduleId: ModuleId, presetAction?: string) => void;
}

export function CommandPalette({ open, onClose, onSelectEntry }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOBAL_SEARCH_ENTRIES.slice(0, 12);
    return GLOBAL_SEARCH_ENTRIES.filter((entry) => {
      const hay = `${entry.title} ${entry.subtitle} ${entry.category} ${entry.keywords.join(' ')}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 14);
  }, [query]);

  if (!open) return null;

  const choose = (entry: SearchEntry) => {
    onSelectEntry(entry.moduleId, entry.presetAction);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Global Radiology Search"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <Search size={16} style={{ color: 'var(--accent-brass)' }} />
          <input
            ref={inputRef}
            id="command-palette-input"
            className="palette-input"
            type="text"
            placeholder="Search modules, signs (Double PCL, SSCD, 7-Up), TI-RADS, LI-RADS, SRU..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && results[selectedIdx]) {
                e.preventDefault();
                choose(results[selectedIdx]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
            <X size={14} />
          </button>
        </div>

        <div className="palette-list">
          {results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching radiology structures, signs, or calculators found.
            </div>
          ) : (
            results.map((entry, idx) => (
              <button
                key={entry.id}
                type="button"
                className={`palette-item ${idx === selectedIdx ? 'selected' : ''}`}
                onClick={() => choose(entry)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {entry.subtitle}
                  </div>
                </div>
                <span className="module-tab-mod">{entry.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
