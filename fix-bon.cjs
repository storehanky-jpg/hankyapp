const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/ChargesPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (!t.includes('advanceOf')) stop('le code des acomptes n est pas installe');
if (t.includes('acompteMonth')) stop('deja applique');
fs.writeFileSync('backup23-ChargesPage.tsx.txt', t);
function rep(de, vers, nom, optionnel) {
  const n = t.split(de).length - 1;
  if (n !== 1) {
    if (optionnel) { console.log('avertissement : ' + nom + ' non modifie (' + n + ' occurrence(s))'); return; }
    stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  }
  t = t.replace(de, () => vers);
}
rep('const laborMonthly = laborCosts', [
"const acompteMonth = variableExpenses",
"    .filter(e => {",
"      const dd = new Date(e.date);",
"      return (e.notes || '').startsWith('labor:') && dd.getMonth() === currentMonth && dd.getFullYear() === currentYear;",
"    })",
"    .reduce((sum, e) => sum + e.amount, 0);",
"",
"  const laborMonthly = laborCosts"
].join('\n'), 'definition acomptes du mois');
rep('.reduce((sum, l) => sum + l.total_cost - advanceOf(l), 0);', '.reduce((sum, l) => sum + l.total_cost - advanceOf(l), 0) + acompteMonth;', 'carte main d oeuvre');
rep('const totalChargesMonthly = fixedMonthly + variableMonthly + utilitiesMonthly + laborMonthly;', 'const totalChargesMonthly = fixedMonthly + variableMonthly + utilitiesMonthly + laborMonthly - acompteMonth;', 'total des charges');
rep('{variableMonthly.toLocaleString()} DZD', '{(variableMonthly - acompteMonth).toLocaleString()} DZD', 'carte depenses variables', true);
fs.writeFileSync(F, t);
console.log('OK : acomptes affiches dans la carte Main d oeuvre');