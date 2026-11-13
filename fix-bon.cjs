const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const M = 'src/pages/MaterialsPage.tsx';
let t = fs.readFileSync(M, 'utf8');
if (t.includes('editPurchaseId')) stop('deja applique');
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}
fs.writeFileSync('backup7-MaterialsPage.tsx.txt', t);

rep('const [showPurchaseModal, setShowPurchaseModal] = useState(false);',
  'const [showPurchaseModal, setShowPurchaseModal] = useState(false);\n  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);\n  const [editPurchaseQty, setEditPurchaseQty] = useState(0);\n  const [editPurchaseCost, setEditPurchaseCost] = useState(0);', 'etat');

const fonctions = [
"const startEditPurchaseItem = (p: MaterialPurchase) => {",
"    setEditPurchaseId(p.id);",
"    setEditPurchaseQty(p.quantity);",
"    setEditPurchaseCost(p.unit_cost);",
"  };",
"",
"  const handleSavePurchaseItem = async (p: MaterialPurchase) => {",
"    try {",
"      const total = editPurchaseQty * editPurchaseCost;",
"      const paid = p.payment_status === 'paid' ? total : p.payment_status === 'partial' ? Math.min(p.amount_paid || 0, total) : 0;",
"      const updated = await api.materialPurchasesService.update(p.id, { quantity: editPurchaseQty, unit_cost: editPurchaseCost, total_cost: total, amount_paid: paid });",
"      if (editPurchaseCost !== p.unit_cost) {",
"        await api.rawMaterialsService.update(p.material_id, { unit_cost: editPurchaseCost, last_purchase_date: p.purchase_date });",
"      }",
"      setMaterialPurchases(materialPurchases.map(x => x.id === p.id ? { ...updated, material: p.material } : x));",
"      setEditPurchaseId(null);",
"    } catch (error) {",
"      console.error('Error saving purchase item:', error);",
"      alert('Erreur lors de la modification de cet article.');",
"    }",
"  };",
"",
"  const handleDeleteMaterial = async (id: string) => {"
].join('\n');
rep('const handleDeleteMaterial = async (id: string) => {', fonctions, 'fonctions');

const reListe = /\{isMulti && \(\s*(<div className="space-y-2 mb-3">)/;
if (!reListe.test(t)) stop('liste des produits introuvable');
t = t.replace(reListe, (x, p1) => '{(\n                      ' + p1);

rep('<span className="text-xs text-gray-500 ml-2">× {p.quantity} {p.material?.unit}</span>',
  '{editPurchaseId === p.id ? (<input type="number" step="any" min="0" value={editPurchaseQty} onChange={e => setEditPurchaseQty(parseFloat(e.target.value) || 0)} className="ml-2 w-24 px-2 py-1 border rounded text-sm text-right" />) : (<span className="text-xs text-gray-500 ml-2">× {p.quantity} {p.material?.unit}</span>)}', 'quantite');
rep('<span className="text-sm text-gray-600">{p.unit_cost.toLocaleString()} DZD/{p.material?.unit}</span>',
  '{editPurchaseId === p.id ? (<input type="number" step="any" min="0" value={editPurchaseCost} onChange={e => setEditPurchaseCost(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded text-sm text-right" />) : (<span className="text-sm text-gray-600">{p.unit_cost.toLocaleString()} DZD/{p.material?.unit}</span>)}', 'prix');

const total = [
'<span className="text-sm font-bold text-gray-900">{editPurchaseId === p.id ? (editPurchaseQty * editPurchaseCost).toLocaleString() : p.total_cost.toLocaleString()} DZD</span>',
'                            {editPurchaseId === p.id ? (',
'                              <>',
'                                <button type="button" onClick={() => handleSavePurchaseItem(p)} className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg">Enregistrer</button>',
'                                <button type="button" onClick={() => setEditPurchaseId(null)} className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>',
'                              </>',
'                            ) : (',
'                              <>',
'                                <button type="button" onClick={() => startEditPurchaseItem(p)} className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg">Modifier</button>',
'                                <button type="button" onClick={() => handleDeletePurchase(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={14} /></button>',
'                              </>',
'                            )}'
].join('\n');
rep('<span className="text-sm font-bold text-gray-900">{p.total_cost.toLocaleString()} DZD</span>', total, 'total et boutons');

fs.writeFileSync(M, t);
console.log('OK : boutons Modifier et Supprimer ajoutes sur chaque article des achats');