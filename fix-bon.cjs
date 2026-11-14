const fs = require('fs');
console.log('DEBUT');
let out = '';
function bloc(f, a, b) {
  if (!fs.existsSync(f)) { out += '=== ' + f + ' absent ===\n'; return; }
  const L = fs.readFileSync(f, 'utf8').split('\n');
  out += '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n';
  for (let k = a - 1; k < Math.min(L.length, b); k++) out += (k + 1) + ': ' + L[k] + '\n';
}
function motifs(f, re, avant, apres) {
  if (!fs.existsSync(f)) { out += '=== ' + f + ' absent ===\n'; return; }
  const L = fs.readFileSync(f, 'utf8').split('\n');
  const keep = new Set();
  L.forEach(function (l, i) { if (re.test(l)) { for (let k = Math.max(0, i - avant); k <= Math.min(L.length - 1, i + apres); k++) keep.add(k); } });
  out += '=== ' + f + ' (motifs) ===\n';
  let prev = -2;
  Array.from(keep).sort(function (x, y) { return x - y; }).forEach(function (i) {
    if (i !== prev + 1) out += '...\n';
    out += (i + 1) + ': ' + L[i] + '\n';
    prev = i;
  });
}
bloc('src/pages/ReportsPage.tsx', 1, 45);
bloc('src/pages/ReportsPage.tsx', 173, 198);
const re = /period|Period|dateFrom|dateTo|startDate|endDate|type=.date./;
motifs('src/pages/BulkSalesPage.tsx', re, 3, 6);
motifs('src/pages/CustomerDetailPage.tsx', re, 3, 6);
motifs('src/pages/MaterialsPage.tsx', /Historique Achats|groupedPurchases = /, 2, 14);
if (out.length > 60000) out = out.slice(0, 60000);
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');