const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/MaterialsPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('histPeriod')) stop('deja applique');
fs.writeFileSync('backup13-MaterialsPage.tsx.txt', t);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

rep("const [statsTo, setStatsTo] = useState('');", [
"const [statsTo, setStatsTo] = useState('');",
"  const [histPeriod, setHistPeriod] = useState<'all' | 'week' | 'month' | 'year' | 'custom'>('all');",
"  const [histRef, setHistRef] = useState(format(new Date(), 'yyyy-MM-dd'));",
"  const [histFrom, setHistFrom] = useState('');",
"  const [histTo, setHistTo] = useState('');"
].join('\n'), 'etats');

const bloc = [
"const histRange = useMemo(() => {",
"    if (histPeriod === 'all') return null;",
"    const ref = histRef ? new Date(histRef + 'T12:00:00') : new Date();",
"    let s: Date;",
"    let e: Date;",
"    if (histPeriod === 'week') { s = startOfWeek(ref, { weekStartsOn: 6 }); e = addDays(s, 5); }",
"    else if (histPeriod === 'month') { s = startOfMonth(ref); e = endOfMonth(ref); }",
"    else if (histPeriod === 'year') { s = startOfYear(ref); e = endOfYear(ref); }",
"    else { s = histFrom ? new Date(histFrom + 'T12:00:00') : startOfMonth(ref); e = histTo ? new Date(histTo + 'T12:00:00') : ref; }",
"    return { from: format(s, 'yyyy-MM-dd'), to: format(e, 'yyyy-MM-dd') };",
"  }, [histPeriod, histRef, histFrom, histTo]);",
"  const inHist = (d: string) => {",
"    if (!histRange) return true;",
"    const x = (d || '').slice(0, 10);",
"    return x >= histRange.from && x <= histRange.to;",
"  };",
"",
"  const groupedPurchases = useMemo(() => {"
].join('\n');
rep('const groupedPurchases = useMemo(() => {', bloc, 'groupedPurchases');

const a = t.indexOf('const groupedPurchases = useMemo(() => {');
const j = t.indexOf('\n  }, [', a);
if (j < 0) stop('fin de groupedPurchases introuvable');
const k = t.indexOf(']);', j);
if (k < 0) stop('dependances introuvables');
const vide = t.charAt(k - 1) === '[';
t = t.slice(0, k) + (vide ? 'histRange' : ', histRange') + t.slice(k);

rep('for (const p of filteredPurchases) {', 'for (const p of filteredPurchases.filter(q => inHist(q.purchase_date))) {', 'boucle achats');

const re = /(\{activeTab === 'purchases' && \(\s*<div className="space-y-3">)/;
if (!re.test(t)) stop('debut onglet achats introuvable');
const barre = [
"",
"          <div className='flex flex-wrap items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-3'>",
"            {(['all', 'week', 'month', 'year', 'custom'] as const).map(p => (",
"              <button key={p} type='button' onClick={() => setHistPeriod(p)} className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' + (histPeriod === p ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}>{p === 'all' ? 'Tout' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Du ... au ...'}</button>",
"            ))}",
"            {histPeriod === 'custom' ? (",
"              <>",
"                <label className='text-sm text-gray-600'>Du <input type='date' value={histFrom} onChange={e => setHistFrom(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"                <label className='text-sm text-gray-600'>Au <input type='date' value={histTo} onChange={e => setHistTo(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"              </>",
"            ) : histPeriod !== 'all' ? (",
"              <label className='text-sm text-gray-600'>Choisir la date <input type='date' value={histRef} onChange={e => setHistRef(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"            ) : null}",
"            {histRange && <span className='text-sm font-medium text-amber-700'>Du {format(new Date(histRange.from + 'T12:00:00'), 'EEE dd/MM/yyyy', { locale: fr })} au {format(new Date(histRange.to + 'T12:00:00'), 'EEE dd/MM/yyyy', { locale: fr })}</span>}",
"            <span className='ml-auto text-sm text-gray-500'>{groupedPurchases.length} jour(s) - total {groupedPurchases.reduce((s, g) => s + g.total, 0).toLocaleString()} DZD</span>",
"          </div>"
].join('\n');
t = t.replace(re, (x) => x + barre);

fs.writeFileSync(F, t);
console.log('OK : filtre de periode ajoute a Historique Achats');