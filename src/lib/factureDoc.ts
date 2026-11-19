// Facture : modele identique a la facture papier (Patisserie Hanky macarons), sans cachet

export interface FactureLine {
  label: string;
  quantityText: string;
  unitPrice: number;
  total: number;
}

const FACTURE_FOOTER: string[] = [
  'Adresse : N\u00b0 01 Khraissia ville N\u00b0 B 04 RDC Alger',
  'R.C. Nr. 16/00 -4952474A17 / NIF 181160204104102 / Nr. Article 16560193011 TEL 0782144675',
];

const ORDER = ['boite20', 'boite10', 'boite6', 'vrac'];
const LABELS: Record<string, string> = {
  boite20: 'BOITE DE 20 PCS',
  boite10: 'BOITE DE 10 PCS',
  boite6: 'BOITE DE 06 PCS',
  vrac: 'MACARONS EN VRAC',
};

const UNITS = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF', 'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX SEPT', 'DIX HUIT', 'DIX NEUF'];
const TENS = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE'];

function below100(n: number, final: boolean): string {
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return TENS[t];
    return TENS[t] + (u === 1 ? ' ET UN' : ' ' + UNITS[u]);
  }
  if (n < 80) {
    const u = n - 60;
    return 'SOIXANTE' + (u === 11 ? ' ET ' : ' ') + UNITS[u];
  }
  if (n === 80) return final ? 'QUATRE VINGTS' : 'QUATRE VINGT';
  return 'QUATRE VINGT ' + UNITS[n - 80];
}

function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = '';
  if (h > 0) {
    out = h === 1 ? 'CENT' : UNITS[h] + ' CENT';
    if (r === 0 && h > 1 && final) out += 'S';
  }
  if (r > 0) out += (out ? ' ' : '') + below100(r, final);
  return out;
}

export function integerInWords(n: number): string {
  if (n === 0) return 'ZERO';
  const parts: string[] = [];
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;
  if (millions > 0) parts.push(below1000(millions, false) + (millions > 1 ? ' MILLIONS' : ' MILLION'));
  if (thousands > 0) parts.push(thousands === 1 ? 'MILLE' : below1000(thousands, false) + ' MILLE');
  if (rest > 0) parts.push(below1000(rest, true));
  return parts.join(' ');
}

export function amountInWords(amount: number): string {
  const cents = Math.round(amount * 100);
  const whole = Math.floor(cents / 100);
  const dec = cents % 100;
  let out = integerInWords(whole) + ' DA';
  if (dec > 0) out += ' ET ' + integerInWords(dec) + ' CENTIMES';
  return out;
}

export function buildFactureLines(items: { type: string; quantity: number; unit_price: number; total_amount: number }[]): FactureLine[] {
  const merged = new Map<string, { type: string; quantity: number; unit_price: number; total: number }>();
  for (const it of items) {
    if (!LABELS[it.type]) continue;
    const key = it.type + '|' + it.unit_price;
    const cur = merged.get(key);
    if (cur) {
      cur.quantity += it.quantity;
      cur.total += it.total_amount;
    } else {
      merged.set(key, { type: it.type, quantity: it.quantity, unit_price: it.unit_price, total: it.total_amount });
    }
  }
  const lines: FactureLine[] = [];
  merged.forEach(m => {
    const qText = m.type === 'vrac'
      ? m.quantity.toFixed(3).replace('.', ',') + ' KG'
      : String(Math.round(m.quantity)) + (m.quantity > 1 ? ' BOITES' : ' BOITE');
    lines.push({ label: LABELS[m.type], quantityText: qText, unitPrice: m.unit_price, total: Math.round(m.total * 100) / 100 });
  });
  const rank = (l: FactureLine) => ORDER.findIndex(k => LABELS[k] === l.label);
  return lines.sort((a, b) => rank(a) - rank(b) || a.unitPrice - b.unitPrice);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso: string, sep: string): string {
  const p = iso.slice(0, 10).split('-');
  return p[2] + sep + p[1] + sep + p[0];
}

function money(n: number): string {
  return n.toFixed(2) + ' DA';
}

export function buildFactureHTML(opts: {
  number: number;
  dateISO: string;
  periodFrom: string;
  periodTo: string;
  clientName: string;
  clientAddress: string;
  rc?: string;
  nif?: string;
  nis?: string;
  lines: FactureLine[];
}): string {
  const num = String(opts.number).padStart(2, '0');
  const dDot = fmtDate(opts.dateISO, '.');
  const total = Math.round(opts.lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  const rows = opts.lines.map(l => '<tr><td>' + esc(l.label) + '</td><td class="c">' + esc(l.quantityText) + '</td><td class="c">' + money(l.unitPrice) + '</td><td class="c">' + money(l.total) + '</td></tr>').join('');
  const idLine1 = opts.rc ? '<div>R.C. ' + esc(opts.rc) + '</div>' : '';
  const idParts: string[] = [];
  if (opts.nif) idParts.push('NIF ' + esc(opts.nif));
  if (opts.nis) idParts.push('NIS ' + esc(opts.nis));
  const idLine2 = idParts.length ? '<div>' + idParts.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') + '</div>' : '';
  const footer = FACTURE_FOOTER.map(t => '<div>' + esc(t) + '</div>').join('');
  return '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Facture N° ' + num + '</title><style>'
    + '@page { size: A4; margin: 12mm; } * { box-sizing: border-box; }'
    + "body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; font-size: 17px; }"
    + '.page { min-height: 255mm; display: flex; flex-direction: column; padding: 6mm 10mm; }'
    + '.top { font-size: 24px; line-height: 1.35; font-weight: bold; }'
    + '.who { font-size: 20px; }'
    + '.date { text-align: right; font-size: 20px; margin-top: -26px; }'
    + '.client { text-align: center; font-size: 17px; line-height: 1.7; margin-top: 14mm; text-transform: uppercase; }'
    + '.frame { border: 2px solid #000; text-align: center; padding: 4px; margin-top: 8mm; font-size: 18px; }'
    + 'table { width: 100%; border-collapse: collapse; margin-top: 6mm; }'
    + 'th, td { border: 2px solid #000; padding: 8px 6px; font-size: 17px; }'
    + 'th { text-align: center; font-weight: bold; } td.c { text-align: center; }'
    + '.sum { margin-top: 14mm; font-size: 19px; font-weight: bold; line-height: 1.6; }'
    + '.footer { margin-top: auto; border-top: 2px solid #000; padding-top: 6mm; text-align: center; font-size: 14px; line-height: 1.6; }'
    + '</style></head><body><div class="page">'
    + '<div class="top">Pâtisserie<br/>Hanky macarons</div>'
    + '<div class="who">HANK YAHIA</div>'
    + '<div class="date">Alger le ' + dDot + '</div>'
    + '<div class="client"><div>' + esc(opts.clientName) + '</div>' + (opts.clientAddress ? '<div>' + esc(opts.clientAddress) + '</div>' : '') + idLine1 + idLine2 + '</div>'
    + '<div class="frame">FACTURE Nr ' + num + '_' + dDot + '</div>'
    + '<table><thead><tr><th style="width:34%">Du ' + fmtDate(opts.periodFrom, '/') + '<br/>AU ' + fmtDate(opts.periodTo, '/') + '</th><th>QUE</th><th>PU</th><th>TOTAL</th></tr></thead>'
    + '<tbody>' + rows + '<tr><td class="c"><b>TOTAL</b></td><td></td><td></td><td class="c"><b>' + money(total) + '</b></td></tr></tbody></table>'
    + '<div class="sum">Arrête la présente facture a la somme de<br/>' + esc(amountInWords(total)) + '</div>'
    + '<div class="footer">' + footer + '</div>'
    + '</div></body></html>';
}
