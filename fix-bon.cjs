const fs = require('fs');
console.log('DEBUT');
let out = '';
function bloc(f, a, b) {
  const L = fs.readFileSync(f, 'utf8').split('\n');
  out += '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n';
  for (let k = a - 1; k < Math.min(L.length, b); k++) out += (k + 1) + ': ' + L[k] + '\n';
}
function autour(f, re, avant, apres, max) {
  const L = fs.readFileSync(f, 'utf8').split('\n');
  let n = 0;
  L.forEach(function (l, i) {
    if (n < max && re.test(l)) {
      n++;
      out += '=== ' + f + ' motif ligne ' + (i + 1) + ' ===\n';
      for (let k = Math.max(0, i - avant); k <= Math.min(L.length - 1, i + apres); k++) out += (k + 1) + ': ' + L[k] + '\n';
    }
  });
}
const B = 'src/pages/BulkSalesPage.tsx';
const R = 'src/pages/ReportsPage.tsx';
autour(B, /const groupedSales = useMemo/, 1, 40, 1);
autour(B, /activeTab === 'ventes'/, 1, 30, 2);
autour(R, /dateRange/, 4, 10, 6);
bloc(R, 66, 93);
bloc(R, 410, 470);
if (out.length > 60000) out = out.slice(0, 60000);
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');