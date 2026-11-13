const fs = require('fs');
console.log('DEBUT');
function lignes(f) { return fs.readFileSync(f, 'utf8').split('\n'); }
function cut(f, a, b) {
  const l = lignes(f);
  return '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n' + l.slice(a - 1, Math.min(b, l.length)).map((x, i) => (a + i) + ': ' + x).join('\n') + '\n';
}
function find(f, re, max) {
  const l = lignes(f);
  const o = ['=== ' + f + ' recherche ' + re + ' ==='];
  l.forEach((x, i) => { if (re.test(x) && o.length <= max) o.push((i + 1) + ': ' + x.trim().slice(0, 170)); });
  return o.join('\n') + '\n';
}
function compter(dossier, mots) {
  const o = ['=== utilisation de ' + mots.join(' / ') + ' dans ' + dossier + ' ==='];
  for (const nom of fs.readdirSync(dossier)) {
    const p = dossier + '/' + nom;
    if (fs.statSync(p).isDirectory() || !/\.(tsx|ts)$/.test(nom)) continue;
    const t = fs.readFileSync(p, 'utf8');
    const n = mots.map(m => t.split(m).length - 1);
    if (n.some(x => x > 0)) o.push(p + ' : ' + n.join(' / '));
  }
  return o.join('\n') + '\n';
}
const M = 'src/pages/MaterialsPage.tsx';
const B = 'src/pages/BulkSalesPage.tsx';
let s = '';
s += find(M, /function |const handle|useState|showPurchase|purchaseLines|PurchaseLine/, 90);
s += cut(M, 985, 1135);
s += find(M, /[dD]elete|remove/, 40);
s += cut(B, 1055, 1230);
s += cut(B, 470, 500);
s += find('src/services/api.ts', /[dD]elete/, 40);
s += compter('src/pages', ['purchases', 'bulkSales', 'bulk_sales', 'shopSales']);
s += compter('src/context', ['purchases', 'bulkSales', 'bulk_sales', 'shopSales']);
s += compter('src/lib', ['purchases', 'bulkSales', 'bulk_sales', 'shopSales']);
fs.writeFileSync('lecture-temp.txt', s);
console.log('OK', s.length, 'caracteres');