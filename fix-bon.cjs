const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const api = fs.readFileSync('src/services/api.ts', 'utf8');
const ai = api.indexOf('export const laborCostsService');
if (ai < 0) stop('service main d oeuvre introuvable');
let ae = api.indexOf('export const ', ai + 10);
if (ae < 0) ae = api.length;
const blocApi = api.slice(ai, ae);
if (!/async update\(/.test(blocApi)) {
  fs.writeFileSync('lecture-temp.txt', blocApi);
  stop('pas de methode update dans laborCostsService (le service est ecrit dans lecture-temp.txt, envoie-le moi)');
}

const F = 'src/pages/ChargesPage.tsx';
const T = 'src/types/index.ts';
let t = fs.readFileSync(F, 'utf8');
let ty = fs.readFileSync(T, 'utf8');
if (t.includes('acompteTarget')) stop('deja applique');
fs.writeFileSync('backup17-ChargesPage.tsx.txt', t);
fs.writeFileSync('backup17-types.ts.txt', ty);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

const ti = ty.indexOf('export interface LaborCost {');
if (ti < 0) stop('type LaborCost introuvable');
const te = ty.indexOf('\n}', ti);
if (te < 0 || ty.slice(ti, te).includes('advance_paid')) stop('type LaborCost inattendu');
ty = ty.slice(0, te) + '\n  advance_paid?: number;' + ty.slice(te);

const s = t.indexOf('{/* Labor Costs */}');
if (s < 0 || t.split('{/* Labor Costs */}').length - 1 !== 1) stop('bloc Labor Costs introuvable');
const idxA = t.indexOf('>Actions</th>', s);
const jTh = idxA < 0 ? -1 : t.lastIndexOf('<th', idxA);
const idxT = t.indexOf('{labor.total_cost.toLocaleString(', s);
const endTd = idxT < 0 ? -1 : t.indexOf('</td>', idxT) + 5;
const idxB = t.indexOf('<button onClick={() => handleDelete(labor.id)}', s);
if (jTh < 0 || idxA - jTh > 250 || endTd < 5 || idxB < 0) stop('reperes du tableau main d oeuvre introuvables');

const bouton = "<button type='button' onClick={() => { setAcompteTarget(labor); setAcompteAmount(labor.advance_paid || 0); }} className='px-2.5 py-1 mr-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg'>Acompte</button>\n                        ";
t = t.slice(0, idxB) + bouton + t.slice(idxB);

const tds = "\n                    <td className='px-4 py-3 text-right text-emerald-600'>{(labor.advance_paid || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</td>\n                    <td className='px-4 py-3 text-right font-medium text-red-600'>{Math.max(0, labor.total_cost - (labor.advance_paid || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} DZD</td>";
t = t.slice(0, endTd) + tds + t.slice(endTd);

const ths = "<th className='px-4 py-3 text-right text-sm font-medium text-gray-600'>Acompte</th>\n                  <th className='px-4 py-3 text-right text-sm font-medium text-gray-600'>Reste à payer</th>\n                  ";
t = t.slice(0, jTh) + ths + t.slice(jTh);

const modal = [
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
"        {/* Labor Costs */}"
].join('\n');
t = t.slice(0, s) + modal + t.slice(s + '{/* Labor Costs */}'.length);

const handler = [
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
"  const openModal = (item?: FixedCharge | VariableExpense | Utility | LaborCost) => {"
].join('\n');
rep("const openModal = (item?: FixedCharge | VariableExpense | Utility | LaborCost) => {", handler, 'fonction acompte');

rep("const [laborForm, setLaborForm] = useState({",
  "const [acompteTarget, setAcompteTarget] = useState<LaborCost | null>(null);\n  const [acompteAmount, setAcompteAmount] = useState(0);\n  const [laborForm, setLaborForm] = useState({", 'etats acompte');

fs.writeFileSync(F, t);
fs.writeFileSync(T, ty);
console.log('OK : bouton Acompte et colonnes Acompte / Reste a payer ajoutes');