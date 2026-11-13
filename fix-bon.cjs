const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const F = 'src/pages/BulkSalesPage.tsx';
let t = fs.readFileSync(F, 'utf8');
if (t.includes('orphanStats')) stop('deja applique');
fs.writeFileSync('backup8-BulkSalesPage.tsx.txt', t);

const a = t.indexOf('const allCustomerStats = useMemo(() => {');
const endTxt = '}, [bulkSales, sales, shopSales]);';
const b = t.indexOf(endTxt, a);
if (a < 0 || b < 0) stop('bloc des stats introuvable');

const bloc = [
"const allCustomerStats = useMemo(() => {",
"    const map: Record<string, { total: number; paid: number; reste: number; count: number; label?: string }> = {};",
"    const norm = (x: string | undefined) => (x || '').trim().toLowerCase();",
"    const resolve = (cid: string | undefined, cname: string | undefined) => {",
"      if (cid && customers.some(c => c.id === cid)) return cid;",
"      const n = norm(cname);",
"      if (n) {",
"        const f = customers.find(c => norm(c.name) === n);",
"        if (f) return f.id;",
"      }",
"      return cid || cname || '';",
"    };",
"    const addSale = (cid: string | undefined, cname: string | undefined, total: number, paid: number) => {",
"      const key = resolve(cid, cname);",
"      if (!key) return;",
"      if (!map[key]) map[key] = { total: 0, paid: 0, reste: 0, count: 0, label: cname };",
"      map[key].total += total;",
"      map[key].paid += paid;",
"      map[key].reste = map[key].total - map[key].paid;",
"      map[key].count++;",
"    };",
"    bulkSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));",
"    sales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));",
"    shopSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));",
"    return map;",
"  }, [bulkSales, sales, shopSales, customers]);",
"",
"  const orphanStats = useMemo(() => {",
"    return Object.keys(allCustomerStats)",
"      .filter(k => !customers.some(c => c.id === k))",
"      .map(k => ({ key: k, ...allCustomerStats[k] }));",
"  }, [allCustomerStats, customers]);"
].join('\n');
t = t.slice(0, a) + bloc + t.slice(b + endTxt.length);

function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}
rep('const stats = allCustomerStats[customer.id] || allCustomerStats[customer.name] || { total: 0, paid: 0, reste: 0, count: 0 };',
    'const stats = allCustomerStats[customer.id] || { total: 0, paid: 0, reste: 0, count: 0 };', 'carte client');

const boite = [
'{orphanStats.length > 0 && (',
'        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">',
'          <p className="text-sm font-semibold text-amber-800 mb-2">Ventes sans client reconnu (comptees dans le total)</p>',
'          {orphanStats.map(o => (',
'            <p key={o.key} className="text-sm text-amber-700">{o.label || o.key} : {o.count} vente(s) - total {o.total.toLocaleString()} DA - reste {o.reste.toLocaleString()} DA</p>',
'          ))}',
'        </div>',
'      )}',
'',
'      {/* Search */}'
].join('\n');
rep('{/* Search */}', boite, 'zone recherche');

fs.writeFileSync(F, t);
console.log('OK : ventes rattachees aux clients, encadre jaune pour les ventes sans client');