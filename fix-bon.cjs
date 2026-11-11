const fs = require('fs');
console.log('DEBUT');
const sortie = [];
function parcourir(dossier) {
  for (const nom of fs.readdirSync(dossier)) {
    const chemin = dossier + '/' + nom;
    if (fs.statSync(chemin).isDirectory()) { parcourir(chemin); continue; }
    if (!chemin.endsWith('.tsx')) continue;
    const lignes = fs.readFileSync(chemin, 'utf8').split('\n');
    lignes.forEach((l, i) => {
      if (l.includes('type="number"')) {
        const reste = l.trim();
        const pos = reste.indexOf('type="number"');
        sortie.push(chemin + ' ligne ' + (i + 1) + ' : ' + reste.slice(Math.max(0, pos - 60), pos + 240));
      }
    });
  }
}
parcourir('src');
fs.writeFileSync('lecture-temp.txt', sortie.join('\n') + '\n');
console.log('OK', sortie.length, 'champs trouves');