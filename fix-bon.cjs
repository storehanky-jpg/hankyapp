const fs = require('fs');
console.log('DEBUT');
const cibles = [
  ['src/pages/BulkSalesPage.tsx', 976, 'factureItemForm.quantity'],
  ['src/pages/BulkSalesPage.tsx', 981, 'factureItemForm.unit_price'],
  ['src/pages/BulkSalesPage.tsx', 1097, 'line.quantity'],
  ['src/pages/BulkSalesPage.tsx', 1102, 'line.unit_price'],
  ['src/pages/SalesPage.tsx', 721, 'sel.quantity'],
  ['src/pages/SalesPage.tsx', 727, 'sel.unit_price'],
  ['src/pages/SalesPage.tsx', 773, 'saleForm.amount_paid'],
  ['src/pages/MaterialsPage.tsx', 890, 'supplierPurchaseForm.quantity'],
  ['src/pages/MaterialsPage.tsx', 896, 'supplierPurchaseForm.unit_cost'],
  ['src/pages/MaterialsPage.tsx', 903, 'supplierPurchaseForm.amount_paid'],
  ['src/pages/MaterialsPage.tsx', 944, 'materialForm.unit_cost'],
  ['src/pages/MaterialsPage.tsx', 1031, 'line.quantity'],
  ['src/pages/MaterialsPage.tsx', 1037, 'line.unit_cost'],
  ['src/pages/MaterialsPage.tsx', 1089, 'purchaseForm.amount_paid'],
  ['src/pages/CustomerDetailPage.tsx', 388, 'form.unit_price'],
  ['src/pages/CustomersPage.tsx', 433, 'p.unit_price']
];
const fichiers = {};
for (const [f] of cibles) {
  if (!fichiers[f]) fichiers[f] = fs.readFileSync(f, 'utf8').split('\n');
}
for (const [f, n, marque] of cibles) {
  const l = fichiers[f][n - 1];
  if (l === undefined || !l.includes('type="number"') || !l.includes(marque)) {
    console.log('ARRET : ligne inattendue ' + f + ' ' + n);
    process.exit(1);
  }
}
for (const f of Object.keys(fichiers)) {
  fs.writeFileSync('backup-' + f.split('/').pop() + '.txt', fs.readFileSync(f, 'utf8'));
}
let total = 0;
for (const [f, n] of cibles) {
  let l = fichiers[f][n - 1];
  if (l.includes("step={line.type === 'vrac' ? '0.1' : '1'}")) {
    l = l.replace("'0.1'", "'any'");
  } else if (l.includes("step={product.unit === 'kg' ? '0.5' : '1'}")) {
    l = l.replace("'0.5'", "'any'");
  } else if (/step="[^"]*"/.test(l)) {
    l = l.replace(/step="[^"]*"/, 'step="any"');
  } else {
    l = l.replace('type="number"', 'type="number" step="any"');
  }
  fichiers[f][n - 1] = l;
  total++;
}
for (const f of Object.keys(fichiers)) {
  fs.writeFileSync(f, fichiers[f].join('\n'));
}
console.log('OK : ' + total + ' champs corriges dans ' + Object.keys(fichiers).length + ' fichiers');