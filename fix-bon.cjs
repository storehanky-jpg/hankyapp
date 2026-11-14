const fs = require('fs');
console.log('DEBUT');
const F = 'src/pages/MaterialsPage.tsx';
let t = fs.readFileSync(F, 'utf8');
const de = 's = startOfWeek(ref, { weekStartsOn: 6 }); e = addDays(s, 6);';
if (t.split(de).length - 1 !== 1) { console.log('ARRET : le script des statistiques n est pas encore applique (ou deja corrige)'); process.exit(1); }
fs.writeFileSync('backup12-MaterialsPage.tsx.txt', t);
t = t.replace(de, () => 's = startOfWeek(ref, { weekStartsOn: 6 }); e = addDays(s, 5);');
fs.writeFileSync(F, t);
console.log('OK : semaine du samedi au jeudi');