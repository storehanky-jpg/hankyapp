const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = 'src/pages/Dashboard.tsx';
const R = 'src/pages/ReportsPage.tsx';
let d = fs.readFileSync(D, 'utf8');
let r = fs.readFileSync(R, 'utf8');
if (d.includes('shopAmountToday') || r.includes('shopRevenue')) stop('deja applique');
function rep(t, de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  return t.replace(de, () => vers);
}
fs.writeFileSync('backup4-Dashboard.tsx.txt', d);
fs.writeFileSync('backup4-ReportsPage.tsx.txt', r);

d = rep(d, 'const { sales, bulkSales, productionBatches, materialPurchases', 'const { sales, bulkSales, shopSales, productionBatches, materialPurchases', 'dashboard contexte');
d = rep(d, 'const totalSalesToday = boxAmountToday + bulkAmountToday;',
  'const shopAmountToday = shopSales.filter(s => s.sale_date === todayStr).reduce((sum, s) => sum + s.total_amount, 0);\n  const totalSalesToday = boxAmountToday + bulkAmountToday + shopAmountToday;', 'dashboard jour');
d = rep(d, 'const totalSalesMonth = boxAmountMonth + bulkAmountMonth;',
  'const shopAmountMonth = shopSales.filter(s => {\n    const date = new Date(s.sale_date);\n    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;\n  }).reduce((sum, s) => sum + s.total_amount, 0);\n  const totalSalesMonth = boxAmountMonth + bulkAmountMonth + shopAmountMonth;', 'dashboard mois');

r = rep(r, 'const { sales, bulkSales, materialPurchases, fixedCharges', 'const { sales, bulkSales, shopSales, materialPurchases, fixedCharges', 'rapports contexte');
r = rep(r, '+ monthBulkSales.reduce((sum, s) => sum + s.total_amount, 0);',
  '+ monthBulkSales.reduce((sum, s) => sum + s.total_amount, 0)\n                    + shopSales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd).reduce((sum, s) => sum + s.total_amount, 0);', 'rapports 12 mois');
r = rep(r, '}, [sales, bulkSales, materialPurchases]);', '}, [sales, bulkSales, shopSales, materialPurchases]);', 'rapports dependances');
r = rep(r, 'const totalRevenue = boxRevenue + bulkRevenue;',
  'const shopRevenue = shopSales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd).reduce((sum, s) => sum + s.total_amount, 0);\n  const totalRevenue = boxRevenue + bulkRevenue + shopRevenue;', 'rapports mois');

fs.writeFileSync(D, d);
fs.writeFileSync(R, r);
console.log('OK : ventes magasin ajoutees au Tableau de bord et aux Rapports');