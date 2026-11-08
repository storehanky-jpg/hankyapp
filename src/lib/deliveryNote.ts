// Bon de livraison : modèle identique au bon papier (Patisserie Hanky macarons)

export interface BonLine {
  articleNo: string;
  barcode: string;
  label: string;
  unitPrice: number;
  quantityText: string;
}

// Dernier numéro de bon déjà utilisé sur papier : le prochain sera BON_START + 1 (077)
export const BON_START = 76;

export const COMPANY_FOOTER: string[] = [
  'Address N° 01 khraissia ville N° B 04 RDC Alger',
  'R.C. N° 16/00-4952474A17 / NIF 181160204104102',
];

const ARTICLES: Record<string, { no: string; barcode: string; label: string }> = {
  vrac: { no: '001', barcode: '', label: 'MACARON EN VRAC' },
  boite20: { no: '002', barcode: '6132238100055', label: 'BOITE 20/PCS' },
  boite10: { no: '003', barcode: '6132238100048', label: 'BOITE 10/PCS' },
  boite6: { no: '004', barcode: '6132238100031', label: 'BOITE 06/PCS' },
};

// Lit un numéro de bon écrit sous la forme 77 ou 077 (ignore tout autre texte)
export function readBonNumber(value?: string | null): number | null {
  if (!value) return null;
  const m = /^\s*0*(\d{1,4})\s*$/.exec(String(value));
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n > 0 ? n : null;
}

export function nextBonNumber(existing: (string | null | undefined)[]): number {
  let max = BON_START;
  for (const v of existing) {
    const n = readBonNumber(v);
    if (n !== null && n > max) max = n;
  }
  return max + 1;
}

export function formatBonNumber(n: number): string {
  return String(n).padStart(3, '0');
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildBonLines(items: { type: string; quantity: number; unit_price: number }[]): BonLine[] {
  const merged = new Map<string, { type: string; quantity: number; unit_price: number }>();
  for (const it of items) {
    if (!ARTICLES[it.type]) continue;
    const key = it.type + '|' + it.unit_price;
    const cur = merged.get(key);
    if (cur) cur.quantity += it.quantity;
    else merged.set(key, { type: it.type, quantity: it.quantity, unit_price: it.unit_price });
  }
  const lines: BonLine[] = [];
  merged.forEach(m => {
    const a = ARTICLES[m.type];
    const quantityText = m.type === 'vrac'
      ? `${m.quantity.toFixed(3)} kg`
      : `${String(m.quantity).padStart(2, '0')} ${m.quantity > 1 ? 'BOITES' : 'BOITE'}`;
    lines.push({ articleNo: a.no, barcode: a.barcode, label: a.label, unitPrice: m.unit_price, quantityText });
  });
  return lines.sort((x, y) => x.articleNo.localeCompare(y.articleNo));
}

export function buildBonLivraisonHTML(opts: {
  number: number;
  dateISO: string;
  clientName: string;
  clientCity: string;
  lines: BonLine[];
}): string {
  const num = formatBonNumber(opts.number);
  const date = formatDate(opts.dateISO);
  const rows = opts.lines.map(l => `<tr>
      <td>${esc(l.articleNo)}</td>
      <td>${esc(l.barcode)}</td>
      <td>${esc(l.label)}</td>
      <td class="c">${l.unitPrice.toFixed(2)}</td>
      <td class="c">${esc(l.quantityText)}</td>
    </tr>`).join('');
  const footer = COMPANY_FOOTER.map(t => `<div>${esc(t)}</div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Bon de livraison N° ${num}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; font-size: 18px; }
    .page { min-height: 255mm; display: flex; flex-direction: column; padding: 6mm 10mm; }
    .top { font-size: 26px; line-height: 1.35; }
    .date { text-align: right; margin-top: 14mm; font-size: 22px; }
    .client { text-align: center; font-weight: bold; font-size: 24px; line-height: 1.5; margin-top: 16mm; text-transform: uppercase; }
    .frame { border: 2px solid #000; text-align: center; padding: 6px; margin-top: 12mm; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6mm; }
    th, td { border: 2px solid #000; padding: 8px 6px; font-size: 18px; }
    th { text-align: center; font-weight: bold; }
    td.c { text-align: center; }
    .footer { margin-top: auto; padding: 0 0 10mm 20mm; font-size: 22px; line-height: 1.5; }
  </style></head><body><div class="page">
    <div class="top">Patisserie<br/>Hanky macarons</div>
    <div class="date">Alger ${date}</div>
    <div class="client">${esc(opts.clientName)}${opts.clientCity ? '<br/>' + esc(opts.clientCity) : ''}</div>
    <div class="frame">Bon de livraison N° ${num}_ ${date}</div>
    <table>
      <thead><tr><th>N° ARTICLE</th><th>CODE A BARRE</th><th>LIBELLE</th><th>PU</th><th>QUANTITÉS</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">${footer}</div>
  </div></body></html>`;
}