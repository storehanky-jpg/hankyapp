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
function repRe(re, vers, nom) {
  const m = t.match(new RegExp(re.source, 'g'));
  const n = m ? m.length : 0;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(re, () => vers);
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

repRe(/eachDayOfInterval\(\{\s*start: startOfMonth\(today\),\s*end: today\s*\}\)/,
  "eachDayOfInterval({ start: periodRange.fromDate, end: periodRange.toDate })", 'graphique par jour');
rep("  }, [sales, bulkSales, shopSales]);", "  }, [sales, bulkSales, shopSales, periodRange]);", 'deps graphique jour');

repRe(/const monthSales = sales\.filter\(s => \{\s*const date = new Date\(s\.sale_date\);\s*return date\.getMonth\(\) === currentMonth && date\.getFullYear\(\) === currentYear;\s*\}\);/,
  "const monthSales = sales.filter(s => s.sale_date >= periodRange.from && s.sale_date <= periodRange.to);", 'repartition boites');
rep("  }, [sales]);", "  }, [sales, periodRange]);", 'deps repartition boites');

rep("const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');", "const monthStart = periodRange.from;", 'debut periode');
rep("const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');", "const monthEnd = periodRange.to;", 'fin periode');

rep("const fixedMonthly = fixedCharges.filter(c => c.is_active).reduce((sum, c) => {", "const fixedBase = fixedCharges.filter(c => c.is_active).reduce((sum, c) => {",