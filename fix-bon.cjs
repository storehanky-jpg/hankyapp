const fs = require('fs');
console.log('DEBUT A2');
const P = 'src/pages/RecipePage.tsx';
let t = fs.readFileSync(P, 'utf8');
if (!t.includes('ganacheMultiplier')) { console.log('ARRET : A1 absent'); process.exit(1); }
if (t.includes('Multiplicateur Ganache</h2>')) { console.log('ARRET : deja applique'); process.exit(0); }
const ancre = '{/* Sub-tabs Coque/Ganache */}';
if (!t.includes(ancre)) { console.log('ARRET : ancre introuvable'); process.exit(1); }
fs.writeFileSync('RecipePage.backup2.txt', t);
const L = [
'{/* Multiplicateur Ganache */}',
'          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">',
'            <div className="flex items-center gap-3 mb-4">',
'              <Layers size={24} className="text-rose-600" />',
'              <h2 className="text-lg font-semibold text-gray-900">Multiplicateur Ganache</h2>',
'            </div>',
'            <div className="flex items-center gap-4">',
'              <button onClick={() => setGanacheMultiplier(Math.max(0.5, ganacheMultiplier - 0.5))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors">-</button>',
'              <div className="flex-1 text-center">',
'                <input type="number" min="0.5" step="0.5" value={ganacheMultiplier} onChange={e => setGanacheMultiplier(Math.max(0.5, parseFloat(e.target.value) || 1))} className="w-32 text-center text-4xl font-bold text-rose-600 bg-transparent border-b-2 border-rose-300 focus:border-rose-500 outline-none" />',
'                <p className="text-gray-500 mt-1">fois la recette de base ganache</p>',
'              </div>',
'              <button onClick={() => setGanacheMultiplier(ganacheMultiplier + 0.5)} className="w-12 h-12 rounded-xl bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-2xl font-bold text-rose-600 transition-colors">+</button>',
'            </div>',
'            {(() => {',
'              const coqueG = activeCoqueLines.reduce((s, l) => s + l.quantity, 0) * multiplier;',
'              const needG = coqueG * 3500 / 4900;',
'              const baseG = activeGanacheLines.reduce((s, l) => s + l.quantity, 0);',
'              const adv = baseG > 0 ? Math.max(0.5, Math.round(needG / baseG * 100) / 100) : 0;',
'              return (',
'                <div className="mt-4 bg-rose-50 rounded-xl p-3 text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center gap-2">',
'                  <div className="flex-1">',
'                    Coques x{multiplier} = {Math.round(coqueG).toLocaleString()} g. Ganache nécessaire : <b>{Math.round(needG).toLocaleString()} g</b> (règle : 3500 g de ganache pour 4900 g de coques).',
'                    {baseG > 0 && <span> Recette ganache de base : {Math.round(baseG).toLocaleString()} g, donc multiplicateur conseillé : <b>x{adv}</b>.</span>}',
'                  </div>',
'                  {adv > 0 && <button onClick={() => setGanacheMultiplier(adv)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium">Appliquer x{adv}</button>}',
'                </div>',
'              );',
'            })()}',
'          </div>',
'',
'          ' + ancre
];
t = t.replace(ancre, () => L.join('\n'));
fs.writeFileSync(P, t);
console.log('OK A2 termine');