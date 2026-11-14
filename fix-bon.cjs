const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/ChargesPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('laborMonthlySalary')) stop('deja applique');
fs.writeFileSync('backup16-ChargesPage.tsx.txt', t);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

rep("const [laborForm, setLaborForm] = useState({", "const [laborMonthlySalary, setLaborMonthlySalary] = useState(0);\n  const [laborForm, setLaborForm] = useState({", 'etat salaire mensuel');

rep("setLaborForm({ employee_name: '', daily_wage: 0, worked_days: 0, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });",
  "setLaborForm({ employee_name: '', daily_wage: 0, worked_days: 0, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });\n    setLaborMonthlySalary(0);", 'remise a zero');

rep("const total_cost = laborForm.daily_wage * laborForm.worked_days;", "const total_cost = Math.round(laborForm.daily_wage * laborForm.worked_days * 100) / 100;", 'calcul du total');

rep("{(laborForm.daily_wage * laborForm.worked_days).toLocaleString()} DZD", "{(Math.round(laborForm.daily_wage * laborForm.worked_days * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", 'total du formulaire');

rep("{labor.daily_wage.toLocaleString()} DZD", "{labor.daily_wage.toLocaleString(undefined, { maximumFractionDigits: 3 })} DZD", 'salaire par jour affiche');
rep("{labor.total_cost.toLocaleString()} DZD", "{labor.total_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", 'total affiche');

const i = t.indexOf('value={laborForm.daily_wage}');
if (i < 0) stop('champ salaire par jour introuvable');
const j = t.lastIndexOf('type="number"', i);
if (j < 0 || i - j > 400) stop('type number du salaire introuvable');
t = t.slice(0, j) + 'type="number" step="any"' + t.slice(j + 13);

const k = t.indexOf('value={laborForm.employee_name}');
if (k < 0) stop('champ nom employe introuvable');
const g = t.indexOf('<div className="grid grid-cols-2 gap-4">', k);
if (g < 0) stop('grille salaire introuvable');
const bloc = [
"<div>",
"                    <label className='block text-sm font-medium text-gray-700 mb-1'>Salaire mensuel (optionnel, divise par 26 jours)</label>",
"                    <input type='number' step='any' min='0' value={laborMonthlySalary || ''} onChange={e => { const m = parseFloat(e.target.value) || 0; setLaborMonthlySalary(m); setLaborForm({ ...laborForm, daily_wage: m / 26 }); }} placeholder='ex : 45000' className='w-full px-3 py-2 border rounded-lg' />",
"                  </div>",
"                  "
].join('\n');
t = t.slice(0, g) + bloc + t.slice(g);

fs.writeFileSync(F, t);
console.log('OK : salaire mensuel exact ajoute a Main d oeuvre');