const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/MaterialsPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('statsRefDate')) stop('deja applique');
fs.writeFileSync('backup11-MaterialsPage.tsx.txt', t);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}

rep("isAfter } from 'date-fns';", "isAfter, endOfMonth, endOfYear, addDays } from 'date-fns';", 'import');

rep("const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year'>('month');",
  [
  "const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');",
  "  const [statsRefDate, setStatsRefDate] = useState(format(new Date(), 'yyyy-MM-dd'));",
  "  const [statsFrom, setStatsFrom] = useState('');",
  "  const [statsTo, setStatsTo] = useState('');"
  ].join('\n'), 'etats');

const a = t.indexOf('const statsData = useMemo(() => {');
const endTxt = '}, [materialPurchases, statsPeriod]);';
const b = t.indexOf(endTxt, a);
if (a < 0 || b < 0) stop('bloc statsData introuvable');
const bloc = [
"const statsRange = useMemo(() => {",
"    const ref = statsRefDate ? new Date(statsRefDate + 'T12:00:00') : new Date();",
"    let s: Date;",
"    let e: Date;",
"    if (statsPeriod === 'week') { s = startOfWeek(ref, { weekStartsOn: 6 }); e = addDays(s, 5); }",
"    else if (statsPeriod === 'month') { s = startOfMonth(ref); e = endOfMonth(ref); }",
"    else if (statsPeriod === 'year') { s = startOfYear(ref); e = endOfYear(ref); }",
"    else { s = statsFrom ? new Date(statsFrom + 'T12:00:00') : startOfMonth(ref); e = statsTo ? new Date(statsTo + 'T12:00:00') : ref; }",
"    return { from: format(s, 'yyyy-MM-dd'), to: format(e, 'yyyy-MM-dd') };",
"  }, [statsPeriod, statsRefDate, statsFrom, statsTo]);",
"  void isAfter;",
"",
"  const statsData = useMemo(() => {",
"    const periodPurchases = materialPurchases.filter(p => {",
"      const d = (p.purchase_date || '').slice(0, 10);",
"      return d >= statsRange.from && d <= statsRange.to;",
"    });",
"    const byMaterial: Record<string, { name: string; quantity: number; cost: number; unit: string }> = {};",
"    for (const p of periodPurchases) {",
"      const key = p.material_id;",
"      if (!byMaterial[key]) {",
"        byMaterial[key] = { name: p.material?.name || 'Inconnu', quantity: 0, cost: 0, unit: p.material?.unit || 'kg' };",
"      }",
"      byMaterial[key].quantity += p.quantity;",
"      byMaterial[key].cost += p.total_cost;",
"    }",
"    const chartData = Object.values(byMaterial)",
"      .sort((x, y) => y.quantity - x.quantity)",
"      .map(d => ({ name: d.name, Quantité: d.quantity, Coût: d.cost, unit: d.unit }));",
"    const totalQuantity = chartData.reduce((s, d) => s + d.Quantité, 0);",
"    const totalCost = chartData.reduce((s, d) => s + d.Coût, 0);",
"    return { chartData, totalQuantity, totalCost, count: periodPurchases.length };",
"  }, [materialPurchases, statsRange]);"
].join('\n');
t = t.slice(0, a) + bloc + t.slice(b + endTxt.length);

rep("{(['week', 'month', 'year'] as const).map(p => (", "{(['week', 'month', 'year', 'custom'] as const).map(p => (", 'boutons');
rep("{p === 'week' ? 'Cette semaine' : p === 'month' ? 'Ce mois' : 'Cette année'}", "{p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Du ... au ...'}", 'libelles');
rep("statsPeriod === 'week' ? 'semaine' : statsPeriod === 'month' ? 'mois' : 'année'", "statsPeriod === 'week' ? 'semaine' : statsPeriod === 'month' ? 'mois' : statsPeriod === 'year' ? 'année' : 'période'", 'titre carte');

const idx = t.indexOf('<BarChart3 size={20}');
if (idx < 0 || t.split('<BarChart3 size={20}').length - 1 !== 1) stop('icone stats introuvable ou multiple');
const gTxt = '<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">';
const g = t.lastIndexOf(gTxt, idx);
if (g < 0) stop('grille des stats introuvable');
const ctrl = [
"<div className='flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3'>",
"            {statsPeriod === 'custom' ? (",
"              <>",
"                <label className='text-sm text-gray-600'>Du <input type='date' value={statsFrom} onChange={e => setStatsFrom(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"                <label className='text-sm text-gray-600'>Au <input type='date' value={statsTo} onChange={e => setStatsTo(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"              </>",
"            ) : (",
"              <label className='text-sm text-gray-600'>Choisir la date <input type='date' value={statsRefDate} onChange={e => setStatsRefDate(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"            )}",
"            <span className='text-sm font-medium text-amber-700'>Du {format(new Date(statsRange.from + 'T12:00:00'), 'EEE dd/MM/yyyy', { locale: fr })} au {format(new Date(statsRange.to + 'T12:00:00'), 'EEE dd/MM/yyyy', { locale: fr })}</span>",
"          </div>",
"          "
].join('\n');
t = t.slice(0, g) + ctrl + t.slice(g);

fs.writeFileSync(F, t);
console.log('OK : statistiques achats avec calendrier, semaine samedi a jeudi, periode libre');