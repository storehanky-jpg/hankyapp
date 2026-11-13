const fs = require('fs');
console.log('DEBUT');
const fichiers = ['src/pages/Dashboard.tsx', 'src/pages/ReportsPage.tsx', 'src/context/AppContext.tsx'];
const re = /totalSales|amount_paid|is_paid|totalRevenue|Revenue|shopAmount|boxAmount|bulkAmount|profit|\.filter\(/i;
let out = '';
fichiers.forEach(function (f) {
  if (!fs.existsSync(f)) { out += '=== ' + f + ' absent ===\n'; return; }
  const L = fs.readFileSync(f, 'utf8').split('\n');
  const keep = new Set();
  L.forEach(function (l, i) {
    if (re.test(l)) { for (let k = Math.max(0, i - 2); k <= Math.min(L.length - 1, i + 3); k++) keep.add(k); }
  });
  out += '=== ' + f + ' ===\n';
  let prev = -2;
  Array.from(keep).sort(function (a, b) { return a - b; }).forEach(function (i) {
    if (i !== prev + 1) out += '...\n';
    out += (i + 1) + ': ' + L[i] + '\n';
    prev = i;
  });
});
if (out.length > 70000) out = out.slice(0, 70000);
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');