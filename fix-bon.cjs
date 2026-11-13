const fs = require('fs');
console.log('DEBUT');
const f = 'src/pages/BulkSalesPage.tsx';
const lignes = fs.readFileSync(f, 'utf8').split('\n');
const motifs = ['boite20', 'SALE_TYPES', 'emptyLine', 'newLine', 'addLine', 'setLines', 'saleLines', 'useState<SaleLine'];
const dejaVu = new Set();
const sortie = [];
lignes.forEach((l, i) => {
  if (motifs.some(m => l.includes(m))) {
    for (let k = Math.max(0, i - 1); k <= Math.min(lignes.length - 1, i + 1); k++) {
      if (!dejaVu.has(k)) {
        dejaVu.add(k);
        sortie.push((k + 1) + ': ' + lignes[k].trim().slice(0, 220));
      }
    }
    sortie.push('-----');
  }
});
fs.writeFileSync('lecture-temp.txt', sortie.join('\n') + '\n');
console.log('OK', sortie.length, 'lignes');