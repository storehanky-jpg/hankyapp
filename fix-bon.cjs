const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const M = 'src/pages/MaterialsPage.tsx';
const B = 'src/pages/BulkSalesPage.tsx';
if (!fs.existsSync('nouvel-achat.txt')) stop('nouvel-achat.txt absent');
const jsx = fs.readFileSync('nouvel-achat.txt', 'utf8').trim();
if (!jsx.startsWith('{/* Multi-line Purchase Modal */}') || !jsx.includes('handlePurchaseSubmit')) stop('nouvel-achat.txt incomplet ou vide');

let m = fs.readFileSync(M, 'utf8');
let b = fs.readFileSync(B, 'utf8');
if (m.includes('Cliquez sur une matière première dans la liste de gauche')) stop('achat deja applique');

const debut = m.indexOf('{/* Multi-line Purchase Modal */}');
const finMarque = '\n    </div>\n  );\n}';
const fin = m.lastIndexOf(finMarque);
if (debut < 0 || fin < debut) stop('bloc achat introuvable');
const ancien = m.slice(debut, fin);
if (!ancien.includes('handlePurchaseSubmit') || !ancien.includes("Enregistrer l'achat") || ancien.length < 3000 || ancien.length > 14000) stop('bloc achat inattendu (' + ancien.length + ')');

const reB1 = /(\{showSaleModal && \(\s*<div className="fixed inset-0 bg-black\/50 flex items-center justify-center z-50 p-4">\s*<div className="bg-white rounded-2xl w-full )max-w-2xl( shadow-xl )max-h-\[90vh\]( overflow-y-auto">)/;
const reB2 = /<div className="flex justify-end gap-2 pt-1">(\s*<button type="button" onClick=\{\(\) => setShowSaleModal\(false\)\})/;
if (!reB1.test(b)) stop('fenetre vente client introuvable');
if (!reB2.test(b)) stop('boutons vente client introuvables');

fs.writeFileSync('backup3-MaterialsPage.tsx.txt', m);
fs.writeFileSync('backup3-BulkSalesPage.tsx.txt', b);

m = m.slice(0, debut) + jsx + m.slice(fin);
const initVide = "lines: [emptyPurchaseLine(rawMaterials[0]?.id || '')],";
const nbInit = m.split(initVide).length - 1;
m = m.split(initVide).join('lines: [],');
const ancreSubmit = 'const handlePurchaseSubmit = async (e: React.FormEvent) => {';
if (!m.includes(ancreSubmit)) stop('ancre handlePurchaseSubmit introuvable');
m = m.replace(ancreSubmit, () => 'void addPurchaseLine;\n  void onPurchaseMaterialSelect;\n  void emptyPurchaseLine;\n\n  ' + ancreSubmit);

b = b.replace(reB1, (x, p1, p2, p3) => p1 + 'max-w-3xl' + p2 + 'max-h-[95vh]' + p3);
b = b.replace(reB2, (x, p1) => '<div className="flex justify-end gap-2 pt-2 pb-1 sticky bottom-0 bg-white border-t -mx-4 px-4 mt-2">' + p1);

fs.writeFileSync(M, m);
fs.writeFileSync(B, b);
console.log('OK : fenetre achat remplacee, ' + nbInit + ' initialisations vides, fenetre client agrandie');
for (const nom of ['Plus', 'Search', 'Trash2', 'X']) {
  console.log('icone ' + nom + ' utilisee : ' + (m.split('<' + nom + ' ').length - 1) + ' fois');
}