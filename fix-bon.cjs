const fs = require('fs');
console.log('DEBUT');
let nettoye = 0;
for (const nom of fs.readdirSync('src/pages')) {
  if (!nom.endsWith('.tsx')) continue;
  const p = 'src/pages/' + nom;
  const avant = fs.readFileSync(p, 'utf8');
  const lg = avant.split('\n');
  let change = false;
  const apres = lg.map(l => {
    if (l.includes('type="number" step="any"') && l.includes('step={')) {
      change = true; nettoye++;
      return l.replace(' step="any"', '');
    }
    return l;
  });
  if (change) {
    fs.writeFileSync('backup2-' + nom + '.txt', avant);
    fs.writeFileSync(p, apres.join('\n'));
  }
}
console.log('doublons nettoyes : ' + nettoye);
function lignes(f) { return fs.readFileSync(f, 'utf8').split('\n'); }
function cut(f, a, b) {
  const l = lignes(f);
  return '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n' + l.slice(a - 1, Math.min(b, l.length)).map((x, i) => (a + i) + ': ' + x).join('\n') + '\n';
}
function find(f, re, max) {
  const l = lignes(f);
  const o = ['=== ' + f + ' recherche ' + re + ' ==='];
  l.forEach((x, i) => { if (re.test(x) && o.length <= max) o.push((i + 1) + ': ' + x.trim().slice(0, 200)); });
  return o.join('\n') + '\n';
}
const M = 'src/pages/MaterialsPage.tsx';
const B = 'src/pages/BulkSalesPage.tsx';
let s = '';
s += cut(B, 1025, 1056);
s += cut(M, 925, 986);
s += cut(M, 85, 104);
s += cut(M, 133, 204);
s += cut(M, 229, 270);
s += find(M, /groupedPurchases|purchaseFormTotal|dropdownMaterials|purchaseResteAPayer/, 30);
s += find('src/pages/Dashboard.tsx', /purchases|bulkSales|shopSales|sales\b|charges|labor/i, 50);
s += find('src/pages/ReportsPage.tsx', /purchases|bulkSales|shopSales|sales\b/i, 30);
s += find('src/context/AppContext.tsx', /purchases|Purchases|bulkSales|BulkSales/, 40);
fs.writeFileSync('lecture-temp.txt', s);
console.log('OK', s.length, 'caracteres');