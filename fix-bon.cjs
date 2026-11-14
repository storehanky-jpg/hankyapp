const fs = require('fs');
console.log('DEBUT');
const f = 'src/pages/MaterialsPage.tsx';
const L = fs.readFileSync(f, 'utf8').split('\n');
let out = '=== lignes contenant stat ===\n';
const re = /stat/i;
L.forEach(function (l, i) { if (re.test(l) && !/payment_status|STATUS_|paymentStatus/.test(l)) out += (i + 1) + ': ' + l + '\n'; });
const reTab = /activeTab === ['"](stats|statistics|statistiques|stat)['"]/;
let d = -1;
L.forEach(function (l, i) { if (d < 0 && reTab.test(l)) d = i; });
out += '\n=== onglet stats a partir de la ligne ' + (d + 1) + ' ===\n';
if (d >= 0) {
  for (let k = Math.max(0, d - 3); k < Math.min(L.length, d + 170); k++) out += (k + 1) + ': ' + L[k] + '\n';
}
out += '\n=== debut du composant (etats) ===\n';
let s = -1;
L.forEach(function (l, i) { if (s < 0 && /export default function MaterialsPage/.test(l)) s = i; });
if (s >= 0) for (let k = s; k < Math.min(L.length, s + 45); k++) out += (k + 1) + ': ' + L[k] + '\n';
if (out.length > 60000) out = out.slice(0, 60000);
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');