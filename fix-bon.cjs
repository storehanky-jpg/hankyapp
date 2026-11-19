const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const FP = 'src/pages/BulkSalesPage.tsx';
if (!fs.existsSync(FP)) stop('BulkSalesPage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('generateFacture') < 0) stop('la facture par periode n est pas installee');
if (t.indexOf('docsKind') >= 0) stop('deja applique');
function count(s) { return t.split(s).length - 1; }
function need(s, nom) { const n = count(s); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); }
function swap(a, b, nom) { need(a, nom); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }

// 1. Une seule ligne par vente
const spanOpen = '<span className="font-medium text-gray-900" title={group.productSummary}>';
need(spanOpen, 'cellule produit');
const si = t.indexOf(spanOpen);
const ex = '{group.productSummary}';
const ei = t.indexOf(ex, si + spanOpen.length);
if (ei < 0 || ei - si > 250) stop('texte du produit introuvable');
t = t.slice(0, ei) + "{group.items.length > 1 ? group.items[0].label + ' x' + group.items[0].quantity + (group.items[0].type === 'vrac' ? ' kg' : '') + ' + ' + (group.items.length - 1) + ' autre(s)' : group.productSummary}" + t.slice(ei + ex.length);
swap(spanOpen, '<span className="block max-w-[280px] truncate whitespace-nowrap font-medium text-gray-900" title={group.productSummary}>', 'style cellule produit');

// 2. Retirer le bouton Copies de l'en-tete
need('<button onClick={openDocs}', 'bouton Copies');
const bi = t.indexOf('<button onClick={openDocs}');
const bl = t.lastIndexOf('\n', bi);
const be = t.indexOf('</button>', bi) + 9;
if (be < 9) stop('fin du bouton Copies introuvable');
t = t.slice(0, bl) + t.slice(be);

// 3. Afficher : Bon / Facture a droite de Ventes - Tarifs
need('<Tag size={15} /> Tarifs', 'onglet Tarifs');
const ti = t.indexOf('<Tag size={15} /> Tarifs');
const te = t.indexOf('</button>', ti) + 9;
if (te < 9) stop('fin de l onglet Tarifs introuvable');
const add = "\n          <span className='ml-3 pl-3 border-l border-gray-200 text-sm text-gray-500 whitespace-nowrap'>Afficher</span>"
  + "\n          <button onClick={() => openDocs('bon')} className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50'>"
  + "\n            <FileText size={15} /> Bon"
  + "\n          </button>"
  + "\n          <button onClick={() => openDocs('facture')} className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50'>"
  + "\n            <FileCheck size={15} /> Facture"
  + "\n          </button>";
t = t.slice(0, te) + add + t.slice(te);

// 4. Liste filtree selon Bon / Facture
swap('const [showDocs, setShowDocs] = useState(false);', "const [showDocs, setShowDocs] = useState(false);\n  const [docsKind, setDocsKind] = useState('facture');", 'etat copies');
swap('const openDocs = async () => {', 'const openDocs = async (kind: string) => {\n    setDocsKind(kind);', 'fonction copies');
swap('{docsList.map(d => (', "{docsList.filter(d => d.doc_type === docsKind).map(d => (", 'liste des copies');
swap('{docsList.length === 0 &&', '{docsList.filter(d => d.doc_type === docsKind).length === 0 &&', 'message liste vide');
swap('Copies - {selectedCustomer.name}', "{docsKind === 'facture' ? 'Factures' : 'Bons'} - {selectedCustomer.name}", 'titre copies');

fs.writeFileSync('backup25-BulkSalesPage.tsx.txt', fs.readFileSync(FP, 'utf8'));
fs.writeFileSync(FP, t);
console.log('OK : ventes sur une ligne, Afficher Bon / Facture ajoute');