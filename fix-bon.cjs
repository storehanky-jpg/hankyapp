const fs = require('fs');
console.log('DEBUT');
function cut(f, a, b) {
  const l = fs.readFileSync(f, 'utf8').split('\n');
  return '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n' + l.slice(a - 1, Math.min(b, l.length)).map((x, i) => (a + i) + ': ' + x).join('\n') + '\n';
}
let s = '';
s += cut('src/pages/Dashboard.tsx', 102, 160);
s += cut('src/pages/Dashboard.tsx', 345, 385);
s += cut('src/pages/ReportsPage.tsx', 70, 125);
fs.writeFileSync('lecture-temp.txt', s);
console.log('OK', s.length, 'caracteres');