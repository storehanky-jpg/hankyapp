const fs = require('fs');
console.log('DEBUT');
let out = '';
const dir = 'src/pages';
const pages = fs.readdirSync(dir).filter(function (f) { return f.endsWith('.tsx'); });
const cible = pages.filter(function (f) { return fs.readFileSync(dir + '/' + f, 'utf8').indexOf('daily_wage') >= 0 || fs.readFileSync(dir + '/' + f, 'utf8').indexOf('days_worked') >= 0; });
out += 'Pages concernees : ' + cible.join(', ') + '\n\n';
cible.forEach(function (f) {
  const L = fs.readFileSync(dir + '/' + f, 'utf8').split('\n');
  const keep = new Set();
  L.forEach(function (l, i) {
    if (/labor|Labor|daily_wage|days_worked|employee|Main d/.test(l)) { for (let k = Math.max(0, i - 3); k <= Math.min(L.length - 1, i + 5); k++) keep.add(k); }
  });
  out += '=== ' + f + ' (' + L.length + ' lignes) ===\n';
  let prev = -2;
  Array.from(keep).sort(function (x, y) { return x - y; }).forEach(function (i) {
    if (i !== prev + 1) out += '...\n';
    out += (i + 1) + ': ' + L[i] + '\n';
    prev = i;
  });
});
const types = fs.readFileSync('src/types/index.ts', 'utf8').split('\n');
out += '\n=== types : LaborCost ===\n';
types.forEach(function (l, i) { if (/LaborCost/.test(l)) { for (let k = i; k < Math.min(types.length, i + 16); k++) out += (k + 1) + ': ' + types[k] + '\n'; } });
const mig = 'supabase/migrations';
if (fs.existsSync(mig)) {
  fs.readdirSync(mig).forEach(function (f) {
    const s = fs.readFileSync(mig + '/' + f, 'utf8');
    if (s.indexOf('labor_costs') >= 0) out += '\n=== migration ' + f + ' ===\n' + s.slice(0, 1800) + '\n';
  });
} else { out += '\n(pas de dossier supabase/migrations)\n'; }
if (out.length > 60000) out = out.slice(0, 60000);
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');