export const PATENTE_LABELS: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
  6: 'P6',
};

export const PATENTE_DESCRICAO: Record<number, string> = {
  1: 'Aprendiz (<10 presenças)',
  2: 'Iniciado (≥10)',
  3: 'Veterano (≥50)',
  4: 'Mestre (≥100)',
  5: 'Lenda (≥200)',
  6: 'Ícone (≥300)',
};

export function patenteClass(patente: number | undefined | null): string {
  const p = Math.min(6, Math.max(1, patente ?? 1));
  return `rank-pill rank-${p}`;
}

export function campoTypeLabel(tipo: string): string {
  if (tipo === 'booleano') return 'sim/não';
  return tipo;
}

export function formatPhoneBR(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function iniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ['ac-gold', 'ac-felt', 'ac-red', 'ac-wood', 'ac-dark', 'ac-teal'];

export function avatarColor(seed: number | string): string {
  const n =
    typeof seed === 'number'
      ? seed
      : seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function hojeBR(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}/${d.getFullYear()}`;
}

export function isoParaBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function brParaISO(br: string): string {
  const [d, m, y] = br.split('/');
  if (!d || !m || !y) return br;
  return `${y}-${m}-${d}`;
}

export function dataLonga(date = new Date()): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return `${dias[date.getDay()]}, ${hojeBR()}`;
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const data = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}/${d.getFullYear()}`;
  const hora = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(
    2,
    '0'
  )}`;
  return `${data} · ${hora}`;
}
