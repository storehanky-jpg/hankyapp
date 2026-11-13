const fs = require('fs');
console.log('DEBUT');
function cut(f, a, b) {
  const l = fs.readFileSync(f, 'utf8').split('\n');
  return '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n' + l.slice(a - 1, Math.min(b, l.length)).map((x, i) => (a + i) + ': ' + x).join('\n') + '\n';
}
const M = 'src/pages/MaterialsPage.tsx';
let s = '';
s += cut(M, 28, 40);
s += cut(M, 200, 232);
s += cut(M, 385, 440);
s += cut(M, 545, 640);
s += cut('src/services/api.ts', 78, 135);
fs.writeFileSync('lecture-temp.txt', s);
console.log('OK', s.length, 'caracteres');