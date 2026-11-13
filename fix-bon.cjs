const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const B = 'src/pages/BulkSalesPage.tsx';
const R = 'src/pages/ReportsPage.tsx';
const D = 'src/pages/Dashboard.tsx';
let tb = fs.readFileSync(B, 'utf8');
let tr = fs.readFileSync(R, 'utf8');
let td = fs.readFileSync(D, 'utf8');
if (tb.includes('resolveCustomerId')) stop('deja applique');
fs.writeFileSync('backup9-BulkSalesPage.tsx.txt', tb);
fs.writeFileSync('backup9-ReportsPage.tsx.txt', tr);
fs.writeFileSync('backup9-Dashboard.tsx.txt', td);

const fonc = [
"const resolveCustomerId = (cid: string | null | undefined, cname: string | null | undefined): string => {",
"    if (cid && customers.some(c => c.id === cid)) return cid;",
"    const clean = (x: string | null | undefined) => (x || '').toLowerCase().replace(/n\\/p/g, '').replace(/['\u2019.]/g, '').replace(/\\s+/g, ' ').trim();",
"    const n = clean(cname);",
"    if (n.length >= 3) {",
"      const exact = customers.filter(c => clean(c.name) === n);",
"      if (exact.length === 1) return exact[0].id;",
"      const part = customers.filter(c => { const cn = clean(c.name); return cn.length >= 3 && (cn.includes(n) || n.includes(cn)); });",
"      if (part.length === 1) return part[0].id;",
"    }",
"    return cid || cname || '';",
"  };",
"  const matchSel = (cid: string | null | undefined, cname: string | null | undefined) => resolveCustomerId(cid, cname) === selectedCustomerId;",
"",
"  const customerSales"
].join('\n');
const nCS = tb.split('const customerSales').length - 1;
if (nCS !== 1) stop('customerSales : ' + nCS + ' occurrence(s)');
tb = tb.replace('const customerSales', () => fonc);

const re = /(\w+)\.customer_id === selectedCustomerId \|\| \1\.customer_name === selectedCustomer\?\.name/g;
const nm = (tb.match(re) || []).length;
if (nm < 1) stop('filtres des ventes client introuvables');
tb = tb.replace(re, (x, v) => 'matchSel(' + v + '.customer_id, ' + v + '.customer_name)');

const cle = "const key = cid || cname || '';";
if (tb.split(cle).length - 1 !== 1) stop('ligne key introuvable');
tb = tb.replace(cle, () => 'const key = resolveCustomerId(cid, cname);');
fs.writeFileSync(B, tb);

const reRow = /<tr className="bg-emerald-50">(\s*)<td className="px-4 py-3 font-bold text-emerald-800">Chiffre d'Affaires Global/;
if (!reRow.test(tr)) stop('ligne CA Global des rapports introuvable');
tr = tr.replace(reRow, (x, sp) => '<tr className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-600">Ventes magasin</td><td className="px-4 py-3 text-right font-medium text-emerald-600">+{shopRevenue.toLocaleString()} DZD</td></tr>\n              ' + x);
const sub1 = 'Vrac: {bulkRevenue.toLocaleString()}</p>';
if (tr.split(sub1).length - 1 === 1) tr = tr.replace(sub1, () => 'Vrac: {bulkRevenue.toLocaleString()} \u00b7 Magasin: {shopRevenue.toLocaleString()}</p>');
fs.writeFileSync(R, tr);

const sub2 = 'Vrac: ${bulkAmountMonth.toLocaleString()} DZD`';
if (td.split(sub2).length - 1 === 1) td = td.replace(sub2, () => 'Vrac: ${bulkAmountMonth.toLocaleString()} \u00b7 Magasin: ${shopAmountMonth.toLocaleString()} DZD`');
fs.writeFileSync(D, td);

console.log('OK : ' + nm + ' filtres client, ventes rattachees, ligne Magasin ajoutee');