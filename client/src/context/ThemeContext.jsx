import { createContext, useContext, useEffect, useState } from 'react';

const C = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    fetch('/api/theme').then((r) => r.json()).then(setTheme).catch(() => {});
  }, []);

  return <C.Provider value={theme}>{children}</C.Provider>;
}

export function txt(val, fallback) {
  if (!val) return fallback || '';
  return typeof val === 'string' ? val : (val.text || fallback || '');
}

export function fnt(val, df, ds, dc) {
  const family = (typeof val === 'object' && val?.font) || df || 'Inter';
  const size = (typeof val === 'object' && val?.size) || ds || 16;
  const color = (typeof val === 'object' && val?.color) || dc || '#111';
  return {
    fontFamily: `"${family}"`,
    fontSize: `${size}px`,
    color,
    ...(val?.bold ? { fontWeight: 700 } : {}),
    ...(val?.italic ? { fontStyle: 'italic' } : {}),
    ...(val?.underline ? { textDecoration: 'underline' } : {}),
  };
}

export function RichText({ value, fallback, className = '', style = {}, as: Tag = 'span', forceColor }) {
  const text = txt(value, fallback);
  const base = typeof value === 'object' ? value : {};
  const chars = Array.from(text);
  const charStyles = Array.isArray(base.chars) ? base.chars : [];
  const baseStyle = {
    ...(base.font ? { fontFamily: `"${base.font}"` } : {}),
    ...(base.size ? { fontSize: `${base.size}px` } : {}),
    ...(base.color ? { color: base.color } : {}),
    ...(base.bold ? { fontWeight: 700 } : {}),
    ...(base.italic ? { fontStyle: 'italic' } : {}),
    ...(base.underline ? { textDecoration: 'underline' } : {}),
    ...style,
    ...(forceColor ? { color: forceColor } : {}),
  };

  if (!charStyles.some(Boolean)) {
    return <Tag className={className} style={baseStyle}>{text}</Tag>;
  }

  return (
    <Tag className={className} style={baseStyle}>
      {chars.map((char, i) => {
        const cs = charStyles[i] || {};
        const spanStyle = {
          ...(cs.font ? { fontFamily: `"${cs.font}"` } : {}),
          ...(cs.size ? { fontSize: `${cs.size}px` } : {}),
          ...(cs.color ? { color: cs.color } : {}),
          ...(cs.bold ? { fontWeight: 700 } : {}),
          ...(cs.italic ? { fontStyle: 'italic' } : {}),
          ...(cs.underline ? { textDecoration: 'underline' } : {}),
          ...(forceColor ? { color: forceColor } : {}),
        };
        return <span key={`${char}-${i}`} style={spanStyle}>{char}</span>;
      })}
    </Tag>
  );
}

export function useTheme() {
  return useContext(C);
}
