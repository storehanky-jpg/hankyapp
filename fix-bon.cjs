const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const FC = 'src/pages/ChargesPage.tsx';
const FD = 'src/pages/Dashboard.tsx';
const FR = 'src/pages/ReportsPage.tsx';
const FA = 'src/context/AppContext.tsx';
let c = fs.readFileSync(FC, 'utf8');
let d = fs.readFileSync(FD, 'utf8');
let r = fs.readFileSync(FR, 'utf8');
let a = fs.readFileSync(FA, 'utf8');
if (c.includes('advanceOf')) stop('deja applique');
if (!c.includes('api.variableExpensesService.create')) stop('service des depenses variables introuvable dans la page Charges');
function repIn(txt, de, vers, nom) {
  const n = txt.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  return txt.replace(de, () => vers);
}

const sumOld = '.reduce((sum, l) => sum + l.total_cost, 0)';
d = repIn(d, sumOld, ".reduce((sum, l) => sum + l.total_cost - variableExpenses.filter(e => e.notes === 'labor:' + l.id).reduce((s2, e) => s2 + e.amount, 0), 0)", 'tableau de bord');
a = repIn(a, sumOld, ".reduce((sum, l) => sum + l.total_cost - state.variableExpenses.filter(e => e.notes === 'labor:' + l.id).reduce((s2, e) => s2 + e.amount, 0), 0)", 'contexte');
r = repIn(r, 'return sum + l.total_cost * (differenceInCalendarDays(db, da) + 1) / me.getDate();',
  "return sum + (l.total_cost - variableExpenses.filter(e => e.notes === 'labor:' + l.id).reduce((s2, e) => s2 + e.amount, 0)) * (differenceInCalendarDays(db, da) + 1) / me.getDate();", 'rapports');
c = repIn(c, sumOld, '.reduce((sum, l) => sum + l.total_cost - advanceOf(l), 0)', 'carte main d oeuvre');

c = repIn(c, "{(labor.advance_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", "{advanceOf(labor).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", 'colonne acompte');
c = repIn(c, "{Math.max(0, labor.total_cost - (labor.advance_paid || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", "{Math.max(0, labor.total_cost - advanceOf(labor)).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD", 'colonne reste');
c = repIn(c, "setAcompteTarget(labor); setAcompteAmount(labor.advance_paid || 0);", "setAcompteTarget(labor); setAcompteAmount(0); setAcompteDate(format(new Date(), 'yyyy-MM-dd'));", 'bouton acompte');
c = repIn(c, "const advance_paid = Math.min(editLaborItem.advance_paid || 0, total_cost);\n", "", 'modification : acompte max');
c = repIn(c, "{ ...editLaborForm, total_cost, advance_paid });", "{ ...editLaborForm, total_cost });", 'modification : envoi');
c = repIn(c, "...editLaborForm, total_cost, advance_paid } : l));", "...editLaborForm, total_cost } : l));", 'modification : etat');
c = repIn(c, "const [acompteAmount, setAcompteAmount] = useState(0);", "const [acompteAmount, setAcompteAmount] = useState(0);\n  const [acompteDate, setAcompteDate] = useState(format(new Date(), 'yyyy-MM-dd'));", 'etat date acompte');

const ms = c.indexOf('{acompteTarget && (');
const me = c.indexOf('{editLaborItem && (');
if (ms < 0 || me < ms) stop('fenetre acompte introuvable');
const modal = [
"{acompteTarget && (",
"          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>",
"            <div className='bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[95vh] overflow-y-auto'>",
"              <div className='flex items-center justify-between'>",
"                <h3 className='text-lg font-bold text-gray-900'>Acompte - {acompteTarget.employee_name}</h3>",
"                <button type='button' onClick={() => setAcompteTarget(null)} className='text-sm text-gray-400 hover:text-gray-600'>Fermer</button>",
"              </div>",
"              <div className='text-sm text-gray-600'>Salaire total : <strong>{acompteTarget.total_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong> - Deja verse : <strong>{advanceOf(acompteTarget).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong></div>",
"              {variableExpenses.filter(e => e.notes === 'labor:' + acompteTarget.id).map(e => (",
"                <div key={e.id} className='flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2'>",
"                  <span>{e.date} - {e.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</span>",
"                  <button type='button' onClick={() => handleDeleteAcompte(e.id)} className='text-xs text-red-600 hover:underline'>Supprimer</button>",
"                </div>",
"              ))}",
"              <div className='grid grid-cols-2 gap-4'>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Nouvel acompte (DZD)</label>",
"                  <input type='number' step='any' min='0' value={acompteAmount || ''} onChange={e => setAcompteAmount(parseFloat(e.target.value) || 0)} className='w-full px-3 py-2 border rounded-lg' />",
"                </div>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Date</label>",
"                  <input type='date' value={acompteDate} onChange={e => setAcompteDate(e.target.value)} className='w-full px-3 py-2 border rounded-lg' />",
"                </div>",
"              </div>",
"              <div className='bg-amber-50 p-3 rounded-lg text-sm text-amber-800'>Reste à payer après cet acompte : <strong>{Math.max(0, acompteTarget.total_cost - advanceOf(acompteTarget) - acompteAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong></div>",
"              <div className='flex justify-end gap-2'>",
"                <button type='button' onClick={() => setAcompteTarget(null)} className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg'>Annuler</button>",
"                <button type='button' onClick={handleSaveAcompte} className='px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600'>Enregistrer l acompte</button>",
"              </div>",
"            </div>",
"          </div>",
"        )}",
"",
"        "
].join('\n');
c = c.slice(0, ms) + modal + c.slice(me);

const hs = c.indexOf('const handleSaveAcompte = async () => {');
const he = c.indexOf('const openEditLabor = (l: LaborCost) => {');
if (hs < 0 || he < hs) stop('fonction acompte introuvable');
const hand = [
"const advanceOf = (l: LaborCost) => variableExpenses.filter(e => e.notes === 'labor:' + l.id).reduce((s2, e) => s2 + e.amount, 0);",
"",
"  const handleSaveAcompte = async () => {",
"    if (!acompteTarget || acompteAmount <= 0) return;",
"    const reste = acompteTarget.total_cost - advanceOf(acompteTarget);",
"    if (acompteAmount > reste) { alert('Le montant depasse le reste a payer.'); return; }",
"    try {",
"      const created = await api.variableExpensesService.create({ name: 'Acompte - ' + acompteTarget.employee_name, amount: acompteAmount, date: acompteDate, category: 'Acompte salaire', notes: 'labor:' + acompteTarget.id });",
"      setVariableExpenses([created, ...variableExpenses]);",
"      setAcompteTarget(null);",
"      setAcompteAmount(0);",
"    } catch (error) {",
"      console.error('Error saving advance:', error);",
"      alert('Erreur lors de l enregistrement de l acompte.');",
"    }",
"  };",
"",
"  const handleDeleteAcompte = async (id: string) => {",
"    try {",
"      await api.variableExpensesService.delete(id);",
"      setVariableExpenses(variableExpenses.filter(e => e.id !== id));",
"    } catch (error) {",
"      console.error('Error deleting advance:', error);",
"    }",
"  };",
"",
"  "
].join('\n');
c = c.slice(0, hs) + hand + c.slice(he);

fs.writeFileSync('backup22-ChargesPage.tsx.txt', fs.readFileSync(FC, 'utf8'));
fs.writeFileSync('backup22-Dashboard.tsx.txt', fs.readFileSync(FD, 'utf8'));
fs.writeFileSync('backup22-ReportsPage.tsx.txt', fs.readFileSync(FR, 'utf8'));
fs.writeFileSync('backup22-AppContext.tsx.txt', fs.readFileSync(FA, 'utf8'));
fs.writeFileSync(FC, c);
fs.writeFileSync(FD, d);
fs.writeFileSync(FR, r);
fs.writeFileSync(FA, a);
console.log('OK : acompte = depense immediate, salaire du mois = reste a payer');