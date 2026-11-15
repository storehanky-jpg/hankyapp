const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/Dashboard.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('laborAutoBusy')) stop('deja applique');
if (!t.includes('laborCosts')) stop('laborCosts absent du tableau de bord');
fs.writeFileSync('backup19-Dashboard.tsx.txt', t);

let lines = t.split('\n');
const ri = lines.findIndex(function (l) { return l.startsWith('import') && l.includes("from 'react'"); });
if (ri < 0) stop('import react introuvable');
let rl = lines[ri];
const ob = rl.indexOf('{');
if (ob >= 0) {
  const cb = rl.indexOf('}', ob);
  const names = rl.slice(ob + 1, cb).split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; });
  if (names.indexOf('useEffect') < 0) names.push('useEffect');
  if (names.indexOf('useRef') < 0) names.push('useRef');
  rl = rl.slice(0, ob + 1) + ' ' + names.join(', ') + ' ' + rl.slice(cb);
} else {
  rl = rl.replace(" from 'react'", ", { useEffect, useRef } from 'react'");
}
lines[ri] = rl;
if (!t.includes("services/api'")) lines.splice(ri + 1, 0, "import * as api from '../services/api';");
t = lines.join('\n');

const ui = t.indexOf('useApp()');
if (ui < 0) stop('useApp introuvable');
const us = t.indexOf(';', ui);
if (us < 0) stop('fin de useApp introuvable');

const code = [
"",
"  const { setLaborCosts: setLaborCostsAuto } = useApp();",
"  const laborAutoBusy = useRef(false);",
"  useEffect(() => {",
"    if (laborAutoBusy.current) return;",
"    if (!laborCosts || laborCosts.length === 0) return;",
"    const now = new Date();",
"    const lastDayThis = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();",
"    let ty = now.getFullYear();",
"    let tm = now.getMonth() + 1;",
"    if (now.getDate() !== lastDayThis) { tm = tm - 1; if (tm === 0) { tm = 12; ty = ty - 1; } }",
"    const key = ty + '-' + tm;",
"    let startVal = '';",
"    let doneVal = '';",
"    try {",
"      startVal = localStorage.getItem('laborAutoStart') || '';",
"      if (!startVal) { startVal = String(now.getFullYear() * 12 + (now.getMonth() + 1)); localStorage.setItem('laborAutoStart', startVal); }",
"      doneVal = localStorage.getItem('laborAutoDone') || '';",
"    } catch (e) { return; }",
"    if (ty * 12 + tm < parseInt(startVal, 10)) return;",
"    if (doneVal === key) return;",
"    laborAutoBusy.current = true;",
"    try { localStorage.setItem('laborAutoDone', key); } catch (e) { console.error(e); }",
"    (async () => {",
"      try {",
"        const fresh = await api.laborCostsService.getAll();",
"        const byEmp: Record<string, typeof fresh> = {};",
"        fresh.forEach(l => { const k = (l.employee_name || '').trim().toLowerCase(); if (!byEmp[k]) byEmp[k] = []; byEmp[k].push(l); });",
"        const created: typeof fresh = [];",
"        for (const k of Object.keys(byEmp)) {",
"          const rows = byEmp[k];",
"          if (rows.some(r => r.period_month === tm && r.period_year === ty)) continue;",
"          let last = rows[0];",
"          rows.forEach(r => { if (r.period_year * 12 + r.period_month > last.period_year * 12 + last.period_month) last = r; });",
"          const gap = ty * 12 + tm - (last.period_year * 12 + last.period_month);",
"          if (gap < 1 || gap > 3) continue;",
"          const total = Math.round(last.daily_wage * last.worked_days * 100) / 100;",
"          const c = await api.laborCostsService.create({ employee_name: last.employee_name, daily_wage: last.daily_wage, worked_days: last.worked_days, period_month: tm, period_year: ty, total_cost: total, advance_paid: 0 });",
"          created.push(c);",
"        }",
"        if (created.length > 0) setLaborCostsAuto([...created, ...fresh]);",
"      } catch (e) {",
"        console.error('Auto labor error:', e);",
"      } finally {",
"        laborAutoBusy.current = false;",
"      }",
"    })();",
"  }, [laborCosts]);"
].join('\n');
t = t.slice(0, us + 1) + code + t.slice(us + 1);

fs.writeFileSync(F, t);
console.log('OK : salaires generes automatiquement le dernier jour du mois');