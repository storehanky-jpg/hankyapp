const fs = require('fs');
console.log('DEBUT');
let out = '';
function walk(d) {
  let r = [];
  fs.readdirSync(d).forEach(function (f) {
    const p = d + '/' + f;
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (/\.(ts|tsx)$/.test(f)) r.push(p);
  });
  return r;
}
walk('src').forEach(function (f) {
  const L = fs.readFileSync(f, 'utf8').split('\n');
  L.forEach(function (l, i) {
    if (/laborCostsService|materialPurchasesService/.test(l) && /(export|const)/.test(l) && !/api\./.test(l)) {
      out += '=== ' + f + ' ligne ' + (i + 1) + ' ===\n';
      for (let k = i; k < Math.min(L.length, i + 14); k++) out += (k + 1) + ': ' + L[k] + '\n';
    }
  });
});
fs.writeFileSync('lecture-temp.txt', out);
console.log('OK ' + out.length + ' caracteres');