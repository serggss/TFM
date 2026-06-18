import { useState } from 'react';

function CurlCommand({ command }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
      borderRadius: '6px', overflow: 'hidden', marginTop: '0.75rem',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          curl — pegar en terminal o importar en Postman
        </span>
        <button onClick={copy} style={{
          padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer',
          border: `1px solid ${copied ? 'var(--color-fixed)' : 'var(--color-accent)'}`,
          borderRadius: '4px', background: 'transparent',
          color: copied ? 'var(--color-fixed)' : 'var(--color-accent)',
          fontWeight: 600, transition: 'all 0.2s',
        }}>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: '0.75rem', fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem', color: 'var(--color-accent)', whiteSpace: 'pre-wrap',
        wordBreak: 'break-all', lineHeight: 1.5,
      }}>
        {command}
      </pre>
    </div>
  );
}

export default CurlCommand;
