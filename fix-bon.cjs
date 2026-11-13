const fs = require('fs');
console.log('DEBUT');
function lignes(f) { return fs.readFileSync(f, 'utf8').split('\n'); }
function cut(f, a, b) {
  const l = lignes(f);
  a = Math.max(1, a);
  return '=== ' + f + ' lignes ' + a + '-' + b + ' ===\n' + l.slice(a - 1, Math.min(b, l.length)).map((x, i) => (a + i) + ': ' + x).join('\n') + '\n';
}
function find(f, re, max) {
  const l = lignes(f);
  const o = ['=== ' + f + ' recherche ' + re + ' ==='];
  l.forEach((x, i) => { if (re.test(x) && o.length <= max) o.push((i + 1) + ': ' + x.trim().slice(0, 200)); });
  return o.join('\n') + '\n';
}
function ctx(f, re, avant, apres) {
  const l = lignes(f);
  const i = l.findIndex(x => re.test(x));
  if (i < 0) return '=== ' + f + ' : ' + re + ' introuvable ===\n';
  return cut(f, i + 1 - avant, i + 1 + apres);
}
let s = '';
s += cut('src/pages/Dashboard.tsx', 18, 100);
s += cut('src/pages/ReportsPage.tsx', 45, 70);
s += cut('src/pages/ReportsPage.tsx', 114, 165);
s += find('src/context/AppContext.tsx', /shopSales|ShopSales|supplier|Supplier/, 40);
s += find('src/services/api.ts', /supplierPurchasesService|suppliersService|shopSalesService|async getAll/, 60);
s += ctx('src/types/index.ts', /interface SupplierPurchase/, 1, 22);
s += ctx('src/types/index.ts', /interface ShopSale/, 1, 16);
s += cut('src/pages/MaterialsPage.tsx', 338, 372);
s += find('src/pages/MaterialsPage.tsx', /supplierPurchases|setSupplierPurchases|getBySupplier/, 30);
fs.writeFileSync('lecture-temp.txt', s);
console.log('OK', s.length, 'caracteres');