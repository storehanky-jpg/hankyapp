const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };

const A = 'src/services/api.ts';
let api = fs.readFileSync(A, 'utf8');
const lb = api.indexOf('export const laborCostsService');
if (lb < 0) stop('service main d oeuvre introuvable');
let le = api.indexOf('export const ', lb + 10);
if (le < 0) le = api.length;
let apiChange = false;
if (!/async update\(/.test(api.slice(lb, le))) {
  const cands = [['fixedChargesService', 'FixedCharge', 'fixed_charges'], ['variableExpensesService', 'VariableExpense', 'variable_expenses'], ['utilitiesService', 'Utility', 'utilities']];
  let methode = null;
  for (const c of cands) {
    const si = api.indexOf('export const ' + c[0]);
    if (si < 0) continue;
    let se = api.indexOf('export const ', si + 10);
    if (se < 0) se = api.length;
    const bl = api.slice(si, se);
    const us = bl.indexOf('async update(');
    if (us < 0) continue;
    const e1 = bl.indexOf('\n  },', us);
    const e2 = bl.indexOf('\n  }\n', us);
    let ee = -1;
    if (e1 >= 0 && (e2 < 0 || e1 < e2)) ee = e1; else if (e2 >= 0) ee = e2;
    if (ee < 0) continue;
    let m = bl.slice(us, ee) + '\n  }';
    m = m.split(c[1]).join('LaborCost').split(c[2]).join('labor_costs');
    if (/fixed|variable|utilit|expense/i.test(m)) continue;
    methode = m;
    break;
  }
  if (!methode) {
    fs.writeFileSync('lecture-temp.txt', api.slice(0, 20000));
    stop('methode update modele introuvable (api.ts ecrit dans lecture-temp.txt, envoie-le moi)');
  }
  const di = api.indexOf('async delete(', lb);
  if (di < 0) stop('methode delete introuvable');
  api = api.slice(0, di) + methode + ',\n\n  ' + api.slice(di);
  apiChange = true;
}

const F = 'src/pages/ChargesPage.tsx';
const T = 'src/types/index.ts';
let t = fs.readFileSync(F, 'utf8');
let ty = fs.readFileSync(T, 'utf8');
if (t.includes('acompteTarget')) stop('deja applique');
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

const ti = ty.indexOf('export interface LaborCost {');
if (ti < 0) stop('type LaborCost introuvable');
const te = ty.indexOf('\n}', ti);
if (te < 0) stop('fin du type LaborCost introuvable');
if (!ty.slice(ti, te).includes('advance_paid')) ty = ty.slice(0, te) + '\n  advance_paid?: number;' + ty.slice(te);

const s = t.indexOf('{/* Labor Costs */}');
if (s < 0 || t.split('{/* Labor Costs */}').length - 1 !== 1) stop('bloc Labor Costs introuvable');
const idxA = t.indexOf('>Actions</th>', s);
const jTh = idxA < 0 ? -1 : t.lastIndexOf('<th', idxA);
const idxT = t.indexOf('{labor.total_cost.toLocaleString(', s);
const endTd = idxT < 0 ? -1 : t.indexOf('</td>', idxT) + 5;
const idxB = t.indexOf('<button onClick={() => handleDelete(labor.id)}', s);
if (jTh < 0 || idxA - jTh > 250 || endTd < 5 || idxB < 0) stop('reperes du tableau main d oeuvre introuvables');

fs.writeFileSync('backup18-ChargesPage.tsx.txt', t);
fs.writeFileSync('backup18-types.ts.txt', fs.readFileSync(T, 'utf8'));
fs.writeFileSync('backup18-api.ts.txt', fs.readFileSync(A, 'utf8'));

const boutons = "<button type='button' onClick={() => { setAcompteTarget(labor); setAcompteAmount(labor.advance_paid || 0); }} className='px-2.5 py-1 mr-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg'>Acompte</button>\n                        <button type='button' onClick={() => openEditLabor(labor)} className='px-2.5 py-1 mr-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg'>Modifier</button>\n                        ";
t = t.slice(0, idxB) + boutons + t.slice(idxB);

const tds = "\n                    <td className='px-4 py-3 text-right text-emerald-600'>{(labor.advance_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</td>\n                    <td className='px-4 py-3 text-right font-medium text-red-600'>{Math.max(0, labor.total_cost - (labor.advance_paid || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</td>";
t = t.slice(0, endTd) + tds + t.slice(endTd);

const ths = "<th className='px-4 py-3 text-right text-sm font-medium text-gray-600'>Acompte</th>\n                  <th className='px-4 py-3 text-right text-sm font-medium text-gray-600'>Reste à payer</th>\n                  ";
t = t.slice(0, jTh) + ths + t.slice(jTh);

const modals = [
"{acompteTarget && (",
"          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>",
"            <div className='bg-white rounded-2xl w-full max-w-md p-6 space-y-4'>",
"              <div className='flex items-center justify-between'>",
"                <h3 className='text-lg font-bold text-gray-900'>Acompte - {acompteTarget.employee_name}</h3>",
"                <button type='button' onClick={() => setAcompteTarget(null)} className='text-sm text-gray-400 hover:text-gray-600'>Fermer</button>",
"              </div>",
"              <div className='text-sm text-gray-600'>Salaire total : <strong>{acompteTarget.total_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong></div>",
"              <div>",
"                <label className='block text-sm font-medium text-gray-700 mb-1'>Acompte total verse (DZD)</label>",
"                <input type='number' step='any' min='0' value={acompteAmount || ''} onChange={e => setAcompteAmount(parseFloat(e.target.value) || 0)} className='w-full px-3 py-2 border rounded-lg' />",
"              </div>",
"              <div className='bg-amber-50 p-3 rounded-lg text-sm text-amber-800'>Reste à payer : <strong>{Math.max(0, acompteTarget.total_cost - acompteAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong></div>",
"              <div className='flex justify-end gap-2'>",
"                <button type='button' onClick={() => setAcompteTarget(null)} className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg'>Annuler</button>",
"                <button type='button' onClick={handleSaveAcompte} className='px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600'>Enregistrer</button>",
"              </div>",
"            </div>",
"          </div>",
"        )}",
"",
"        {editLaborItem && (",
"          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>",
"            <div className='bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[95vh] overflow-y-auto'>",
"              <div className='flex items-center justify-between'>",
"                <h3 className='text-lg font-bold text-gray-900'>Modifier - {editLaborItem.employee_name}</h3>",
"                <button type='button' onClick={() => setEditLaborItem(null)} className='text-sm text-gray-400 hover:text-gray-600'>Fermer</button>",
"              </div>",
"              <div>",
"                <label className='block text-sm font-medium text-gray-700 mb-1'>Nom de l employe</label>",
"                <input type='text' value={editLaborForm.employee_name} onChange={e => setEditLaborForm({ ...editLaborForm, employee_name: e.target.value })} className='w-full px-3 py-2 border rounded-lg' />",
"              </div>",
"              <div>",
"                <label className='block text-sm font-medium text-gray-700 mb-1'>Salaire mensuel (optionnel, divise par 26 jours)</label>",
"                <input type='number' step='any' min='0' value={editLaborMonthly || ''} onChange={e => { const m = parseFloat(e.target.value) || 0; setEditLaborMonthly(m); setEditLaborForm({ ...editLaborForm, daily_wage: m / 26 }); }} placeholder='ex : 45000' className='w-full px-3 py-2 border rounded-lg' />",
"              </div>",
"              <div className='grid grid-cols-2 gap-4'>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Salaire/jour (DZD)</label>",
"                  <input type='number' step='any' min='0' value={editLaborForm.daily_wage} onChange={e => setEditLaborForm({ ...editLaborForm, daily_wage: parseFloat(e.target.value) || 0 })} className='w-full px-3 py-2 border rounded-lg' />",
"                </div>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Jours travailles</label>",
"                  <input type='number' min='0' max='31' value={editLaborForm.worked_days} onChange={e => setEditLaborForm({ ...editLaborForm, worked_days: parseInt(e.target.value) || 0 })} className='w-full px-3 py-2 border rounded-lg' />",
"                </div>",
"              </div>",
"              <div className='grid grid-cols-2 gap-4'>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Mois</label>",
"                  <select value={editLaborForm.period_month} onChange={e => setEditLaborForm({ ...editLaborForm, period_month: parseInt(e.target.value) })} className='w-full px-3 py-2 border rounded-lg'>",
"                    {Array.from({ length: 12 }, (_, i) => (<option key={i} value={i + 1}>{new Date(0, i).toLocaleDateString('fr', { month: 'long' })}</option>))}",
"                  </select>",
"                </div>",
"                <div>",
"                  <label className='block text-sm font-medium text-gray-700 mb-1'>Annee</label>",
"                  <input type='number' min='2020' max='2030' value={editLaborForm.period_year} onChange={e => setEditLaborForm({ ...editLaborForm, period_year: parseInt(e.target.value) || new Date().getFullYear() })} className='w-full px-3 py-2 border rounded-lg' />",
"                </div>",
"              </div>",
"              <div className='bg-amber-50 p-3 rounded-lg text-sm text-amber-800'>Total : <strong>{(Math.round(editLaborForm.daily_wage * editLaborForm.worked_days * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</strong></div>",
"              <div className='flex justify-end gap-2'>",
"                <button type='button' onClick={() => setEditLaborItem(null)} className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg'>Annuler</button>",
"                <button type='button' onClick={handleSaveEditLabor} className='px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600'>Enregistrer</button>",
"              </div>",
"            </div>",
"          </div>",
"        )}",
"",
"        {/* Labor Costs */}"
].join('\n');
t = t.slice(0, s) + modals + t.slice(s + '{/* Labor Costs */}'.length);

const handlers = [
"const handleSaveAcompte = async () => {",
"    if (!acompteTarget) return;",
"    try {",
"      const value = Math.min(Math.max(0, acompteAmount), acompteTarget.total_cost);",
"      const updated = await api.laborCostsService.update(acompteTarget.id, { advance_paid: value });",
"      setLaborCosts(laborCosts.map(l => l.id === acompteTarget.id ? { ...l, ...updated, advance_paid: value } : l));",
"      setAcompteTarget(null);",
"    } catch (error) {",
"      console.error('Error saving advance:', error);",
"      alert('Erreur lors de l enregistrement de l acompte.');",
"    }",
"  };",
"",
"  const openEditLabor = (l: LaborCost) => {",
"    setEditLaborItem(l);",
"    setEditLaborForm({ employee_name: l.employee_name, daily_wage: l.daily_wage, worked_days: l.worked_days, period_month: l.period_month, period_year: l.period_year });",
"    setEditLaborMonthly(0);",
"  };",
"",
"  const handleSaveEditLabor = async () => {",
"    if (!editLaborItem) return;",
"    try {",
"      const total_cost = Math.round(editLaborForm.daily_wage * editLaborForm.worked_days * 100) / 100;",
"      const advance_paid = Math.min(editLaborItem.advance_paid || 0, total_cost);",
"      const updated = await api.laborCostsService.update(editLaborItem.id, { ...editLaborForm, total_cost, advance_paid });",
"      setLaborCosts(laborCosts.map(l => l.id === editLaborItem.id ? { ...l, ...updated, ...editLaborForm, total_cost, advance_paid } : l));",
"      setEditLaborItem(null);",
"    } catch (error) {",
"      console.error('Error saving labor edit:', error);",
"      alert('Erreur lors de la modification de l employe.');",
"    }",
"  };",
"",
"  const openModal = (item?: FixedCharge | VariableExpense | Utility | LaborCost) => {"
].join('\n');
rep("const openModal = (item?: FixedCharge | VariableExpense | Utility | LaborCost) => {", handlers, 'fonctions acompte et modification');

rep("const [laborForm, setLaborForm] = useState({", [
"const [acompteTarget, setAcompteTarget] = useState<LaborCost | null>(null);",
"  const [acompteAmount, setAcompteAmount] = useState(0);",
"  const [editLaborItem, setEditLaborItem] = useState<LaborCost | null>(null);",
"  const [editLaborMonthly, setEditLaborMonthly] = useState(0);",
"  const [editLaborForm, setEditLaborForm] = useState({ employee_name: '', daily_wage: 0, worked_days: 0, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });",
"  const [laborForm, setLaborForm] = useState({"
].join('\n'), 'etats');

if (apiChange) fs.writeFileSync(A, api);
fs.writeFileSync(F, t);
fs.writeFileSync(T, ty);
console.log('OK : methode update ' + (apiChange ? 'ajoutee' : 'deja presente') + ', boutons Acompte et Modifier, colonnes Acompte / Reste a payer');