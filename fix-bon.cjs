const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = 'src/pages/Dashboard.tsx';
const R = 'src/pages/ReportsPage.tsx';
let d = fs.readFileSync(D, 'utf8');
let r = fs.readFileSync(R, 'utf8');
if (d.includes('shopAmt') || r.includes('dayShop')) stop('deja applique');
function rep(t, de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  return t.replace(de, () => vers);
}
function barre(t, nom) {
  const re = /<Bar dataKey="vrac"[^>]*\/>/;
  const m = t.match(re);
  if (!m) { console.log('info : barre vrac non trouvee dans ' + nom + ' (graphique inchange)'); return t; }
  const copie = m[0].replace('dataKey="vrac"', 'dataKey="magasin"').replace(/fill="[^"]*"/, 'fill="#f43f5e"').replace(/name="[^"]*"/, 'name="Magasin"');
  console.log('barre magasin ajoutee dans ' + nom);
  return t.replace(m[0], () => m[0] + '\n              ' + copie);
}
fs.writeFileSync('backup5-Dashboard.tsx.txt', d);
fs.writeFileSync('backup5-ReportsPage.tsx.txt', r);

d = rep(d, 'const bulkAmt = bulkSales.filter(s => s.sale_date === dayStr).reduce((sum, s) => sum + s.total_amount, 0);',
  'const bulkAmt = bulkSales.filter(s => s.sale_date === dayStr).reduce((sum, s) => sum + s.total_amount, 0);\n    const shopAmt = shopSales.filter(s => s.sale_date === dayStr).reduce((sum, s) => sum + s.total_amount, 0);', 'dashboard graphique 1');
d = rep(d, 'ventes: boxAmt + bulkAmt', 'magasin: shopAmt,\n      ventes: boxAmt + bulkAmt + shopAmt', 'dashboard graphique 2');
const reListe = /(\.\.\.bulkSales\.slice\(0, 3\)\.map\(s => \(\{[^\n]*\}\)\))(\s*\n\s*\]\s*\n\s*\.sort)/;
if (!reListe.test(d)) stop('dashboard ventes recentes introuvable');
d = d.replace(reListe, (x, p1, p2) => p1 + ",\n                  ...shopSales.slice(0, 3).map(s => ({ date: s.sale_date, type: 'magasin' as const, detail: `${s.quantity} pcs × ${s.price_per_piece.toLocaleString()} DZD`, amount: s.total_amount }))" + p2);
d = rep(d, "{item.type === 'boite' ? 'Boîte' : 'Vrac'}", "{item.type === 'boite' ? 'Boîte' : item.type === 'magasin' ? 'Magasin' : 'Vrac'}", 'dashboard etiquette');
d = rep(d, "item.type === 'boite' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'", "item.type === 'boite' ? 'bg-amber-100 text-amber-700' : item.type === 'magasin' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'", 'dashboard couleur');
d = rep(d, '{sales.length === 0 && bulkSales.length === 0 && (', '{sales.length === 0 && bulkSales.length === 0 && shopSales.length === 0 && (', 'dashboard liste vide');
d = barre(d, 'Dashboard');

r = rep(r, 'const dayBulk = bulkSales.filter(s => s.sale_date === dayStr);', 'const dayBulk = bulkSales.filter(s => s.sale_date === dayStr);\n      const dayShop = shopSales.filter(s => s.sale_date === dayStr);', 'rapports jour 1');
r = rep(r, 'vrac: dayBulk.reduce((sum, s) => sum + s.total_amount, 0),', 'vrac: dayBulk.reduce((sum, s) => sum + s.total_amount, 0),\n        magasin: dayShop.reduce((sum, s) => sum + s.total_amount, 0),', 'rapports jour 2');
r = rep(r, 'transactions: daySales.length + dayBulk.length', 'transactions: daySales.length + dayBulk.length + dayShop.length', 'rapports transactions');
r = rep(r, '}, [sales, bulkSales]);', '}, [sales, bulkSales, shopSales]);', 'rapports dependances');
r = barre(r, 'ReportsPage');

fs.writeFileSync(D, d);
fs.writeFileSync(R, r);
console.log('OK : graphiques et ventes recentes mis a jour');