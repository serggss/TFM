import { useState, useEffect, useRef } from 'react';

function PartialDropdown({ options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isActive = options.some(o => o.value === selected);
  const current = options.find(o => o.value === selected);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`state-btn ${isActive ? 'active-partial' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        {current ? current.shortLabel : 'Partial'}
        <span style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '1px' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--color-partial)',
          borderRadius: '8px', minWidth: '320px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.85rem 1rem',
                background: selected === opt.value ? 'rgba(243,156,18,0.1)' : 'transparent',
                border: 'none',
                borderBottom: i < options.length - 1 ? '1px solid var(--border-color)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (selected !== opt.value) e.currentTarget.style.background = 'rgba(243,156,18,0.05)'; }}
              onMouseLeave={e => { if (selected !== opt.value) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: 600, fontSize: '0.85rem',
                color: selected === opt.value ? 'var(--color-partial)' : 'var(--text-primary)',
                marginBottom: '0.3rem',
              }}>
                <span style={{
                  fontSize: '0.55rem',
                  color: selected === opt.value ? 'var(--color-partial)' : 'transparent',
                }}>●</span>
                {opt.label}
              </div>
              <div style={{
                fontSize: '0.77rem', color: 'var(--text-muted)',
                lineHeight: 1.45, paddingLeft: '1rem',
              }}>
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PartialDropdown;
