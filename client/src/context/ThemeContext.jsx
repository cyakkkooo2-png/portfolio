import { createContext, useContext, useState, useEffect } from 'react';
const C = createContext(null);

export function ThemeProvider({ children }) {
  const [t, s] = useState(null);
  useEffect(() => { fetch('/api/theme').then(r => r.json()).then(s).catch(() => {}); }, []);
  return <C.Provider value={t}>{children}</C.Provider>;
}

// Helper: get text from theme field (supports both old string and new {text} format)
export function txt(val, fb) {
  if (!val) return fb || '';
  return typeof val === 'string' ? val : (val.text || fb || '');
}

// Helper: get font style from theme field
export function fnt(val, df, ds, dc) {
  const family = (typeof val === 'object' && val?.font) || df || 'Inter';
  const size = (typeof val === 'object' && val?.size) || ds || 16;
  const color = (typeof val === 'object' && val?.color) || dc || '#111';
  const bold = (typeof val === 'object' && val?.bold) ? 700 : undefined;
  const italic = (typeof val === 'object' && val?.italic) ? 'italic' : undefined;
  const underline = (typeof val === 'object' && val?.underline) ? 'underline' : undefined;
  return {
    fontFamily: '"' + family + '"',
    fontSize: size + 'px',
    color,
    ...(bold ? { fontWeight: bold } : {}),
    ...(italic ? { fontStyle: italic } : {}),
    ...(underline ? { textDecoration: underline } : {}),
  };
}

export function useTheme() { return useContext(C); }
