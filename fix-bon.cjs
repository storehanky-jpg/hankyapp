const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/ReportsPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('periodRange')) stop('deja applique');
fs.writeFileSync('backup15-ReportsPage.tsx.txt', t);
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}
function seg(repere, debut, fin, vers, doit, nom) {
  const n = t.split(repere).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) du repere');
  const s = t.indexOf(repere);
  const i = t.indexOf(debut, s);
  if (i < 0) stop(nom + ' : debut introuvable');
  const e0 = t.indexOf(fin, i);
  if (e0 < 0) stop(nom + ' : fin introuvable');
  const e = e0 + fin.length;
  if (!t.slice(i, e).includes(doit)) stop(nom + ' : contenu inattendu');
  t = t.slice(0, i) + vers + t.slice(e);
}

rep("import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';",
  "import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, subDays, startOfWeek, startOfYear, endOfYear, addDays, differenceInCalendarDays } from 'date-fns';", 'import');

rep("const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');", [
"const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');",
"  const [repRef, setRepRef] = useState(format(new Date(), 'yyyy-MM-dd'));",
"  const [repFrom, setRepFrom] = useState('');",
"  const [repTo, setRepTo] = useState('');"
].join('\n'), 'etats');

const a = t.indexOf('const dateRange = useMemo(() => {');
const endTxt = '}, [selectedPeriod]);';
const b = t.indexOf(endTxt, a);
if (a < 0 || b < 0) stop('bloc dateRange introuvable');
const bloc = [
"const periodRange = useMemo(() => {",
"    const ref = repRef ? new Date(repRef + 'T12:00:00') : new Date();",
"    let s: Date;",
"    let e: Date;",
"    if (selectedPeriod === 'week') { s = startOfWeek(ref, { weekStartsOn: 6 }); e = addDays(s, 5); }",
"    else if (selectedPeriod === 'month') { s = startOfMonth(ref); e = endOfMonth(ref); }",
"    else if (selectedPeriod === 'year') { s = startOfYear(ref); e = endOfYear(ref); }",
"    else { s = repFrom ? new Date(repFrom + 'T12:00:00') : startOfMonth(ref); e = repTo ? new Date(repTo + 'T12:00:00') : ref; }",
"    if (e < s) e = s;",
"    const fromDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());",
"    const toDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());",
"    let factor = 0;",
"    let cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);",
"    while (cur <= toDate) {",
"      const monthEndD = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);",
"      const da = cur > fromDate ? cur : fromDate;",
"      const db = monthEndD < toDate ? monthEndD : toDate;",
"      if (db >= da) factor += (differenceInCalendarDays(db, da) + 1) / monthEndD.getDate();",
"      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);",
"    }",
"    return { from: format(fromDate, 'yyyy-MM-dd'), to: format(toDate, 'yyyy-MM-dd'), fromDate, toDate, factor };",
"  }, [selectedPeriod, repRef, repFrom, repTo]);",
"  void subDays;",
"  void currentMonth;",
"  void currentYear;"
].join('\n');
t = t.slice(0, a) + bloc + t.slice(b + endTxt.length);

seg('eachDayOfInterval({', 'eachDayOfInterval({', '})', 'eachDayOfInterval({ start: periodRange.fromDate, end: periodRange.toDate })', 'startOfMonth(today)', 'graphique par jour');
rep("  }, [sales, bulkSales, shopSales]);", "  }, [sales, bulkSales, shopSales, periodRange]);", 'deps graphique jour');

seg('const monthSales = sales.filter(s => {', 'const monthSales = sales.filter(s => {', '});', 'const monthSales = sales.filter(s => s.sale_date >= periodRange.from && s.sale_date <= periodRange.to);', 'currentMonth', 'repartition boites');
rep("  }, [sales]);", "  }, [sales, periodRange]);", 'deps repartition boites');

rep("const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');", "const monthStart = periodRange.from;", 'debut periode');
rep("const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');", "const monthEnd = periodRange.to;", 'fin periode');

rep("const fixedMonthly = fixedCharges.filter(c => c.is_active).reduce((sum, c) => {", "const fixedBase = fixedCharges.filter(c => c.is_active).reduce((sum, c) => {", 'charges fixes base');
rep("const variableMonthly = variableExpenses", "const fixedMonthly = fixedBase * periodRange.factor;\n\n  const variableMonthly = variableExpenses", 'charges fixes prorata');

seg('const variableMonthly = variableExpenses', '.filter(e => {', '})', ".filter(e => { const d = (e.date || '').slice(0, 10); return d >= monthStart && d <= monthEnd; })", 'currentMonth', 'depenses variables');
seg('const utilitiesMonthly = utilities', '.filter(u => {', '})', ".filter(u => { const d = (u.period_start || '').slice(0, 10); return d >= monthStart && d <= monthEnd; })", 'currentMonth', 'gaz electricite');
seg('const laborMonthly = laborCosts', 'const laborMonthly = laborCosts', '0);',
  "const laborMonthly = laborCosts.reduce((sum, l) => { const ms = new Date(l.period_year, l.period_month - 1, 1); const me = new Date(l.period_year, l.period_month, 0); const da = ms > periodRange.fromDate ? ms : periodRange.fromDate; const db = me < periodRange.toDate ? me : periodRange.toDate; if (db < da) return sum; return sum + l.total_cost * (differenceInCalendarDays(db, da) + 1) / me.getDate(); }, 0);",
  'currentMonth', 'main oeuvre');

rep("{(['week', 'month', 'year'] as const).map(period => (", "{(['week', 'month', 'year', 'custom'] as const).map(period => (", 'boutons');
rep("{period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}", "{period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : period === 'year' ? 'Année' : 'Du ... au ...'}", 'libelles');

const ctrl = [
"<div className='flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3'>",
"        {selectedPeriod === 'custom' ? (",
"          <>",
"            <label className='text-sm text-gray-600'>Du <input type='date' value={repFrom} onChange={e => setRepFrom(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"            <label className='text-sm text-gray-600'>Au <input type='date' value={repTo} onChange={e => setRepTo(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"          </>",
"        ) : (",
"          <label className='text-sm text-gray-600'>Choisir la date <input type='date' value={repRef} onChange={e => setRepRef(e.target.value)} className='ml-1 px-2 py-1 border rounded-lg text-sm' /></label>",
"        )}",
"        <span className='text-sm font-medium text-amber-700'>Du {format(periodRange.fromDate, 'EEE dd/MM/yyyy', { locale: fr })} au {format(periodRange.toDate, 'EEE dd/MM/yyyy', { locale: fr })}</span>",
"      </div>",
"",
"      {/* KPIs */}"
].join('\n');
rep('{/* KPIs */}', ctrl, 'zone KPIs');

fs.writeFileSync(F, t);
console.log('OK : rapports avec Semaine sam-jeu, calendrier et periode Du-au');