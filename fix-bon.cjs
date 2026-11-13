const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const M = 'src/pages/MaterialsPage.tsx';
let t = fs.readFileSync(M, 'utf8');
if (t.includes('openEditPurchase')) stop('deja applique');
function rep(de, vers, nom) {
  const n = t.split(de).length - 1;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(de, () => vers);
}
function repRe(re, fn, nom) {
  const n = (t.match(new RegExp(re.source, 'g')) || []).length;
  if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1');
  t = t.replace(re, fn);
}
fs.writeFileSync('backup6-MaterialsPage.tsx.txt', t);

repRe(/interface PurchaseLine \{\s*material_id: string;/, () => 'interface PurchaseLine {\n  id?: string;\n  material_id: string;', 'interface');
rep('const [showPurchaseModal, setShowPurchaseModal] = useState(false);', 'const [showPurchaseModal, setShowPurchaseModal] = useState(false);\n  const [editingPurchaseGroup, setEditingPurchaseGroup] = useState<MaterialPurchase[] | null>(null);', 'etat');

const openEdit = [
"const openEditPurchase = (group: { purchases: MaterialPurchase[]; purchase_date: string; payment_status: PaymentStatus; amount_paid: number }) => {",
"    const first = group.purchases[0];",
"    setEditingPurchaseGroup(group.purchases);",
"    setMaterialSearch('');",
"    setPurchaseForm({",
"      purchase_date: group.purchase_date,",
"      invoice_number: first?.invoice_number || '',",
"      notes: first?.notes || '',",
"      payment_status: group.payment_status,",
"      amount_paid: group.amount_paid,",
"      lines: group.purchases.map(p => ({ id: p.id, material_id: p.material_id, quantity: p.quantity, unit_cost: p.unit_cost })),",
"    });",
"    setShowPurchaseModal(true);",
"  };",
"",
"  const openNewPurchase = () => {",
"    setEditingPurchaseGroup(null);"
].join('\n');
rep('const openNewPurchase = () => {', openEdit, 'ouverture');

const editSubmit = [
"const handleEditPurchaseSubmit = async () => {",
"    if (!editingPurchaseGroup) return;",
"    try {",
"      const total_cost = purchaseFormTotal;",
"      const amount_paid = purchaseForm.payment_status === 'paid' ? total_cost",
"        : purchaseForm.payment_status === 'partial' ? purchaseForm.amount_paid : 0;",
"      const groupId = editingPurchaseGroup[0]?.purchase_group_id || `PURGRP-${Date.now()}`;",
"      const keptIds = new Set(purchaseForm.lines.map(l => l.id).filter(Boolean));",
"      const removed = editingPurchaseGroup.filter(p => !keptIds.has(p.id));",
"      for (const p of removed) {",
"        await api.materialPurchasesService.delete(p.id);",
"      }",
"      const result: MaterialPurchase[] = [];",
"      for (const line of purchaseForm.lines) {",
"        const lineTotal = line.quantity * line.unit_cost;",
"        const lineAmountPaid = purchaseForm.payment_status === 'paid' ? lineTotal",
"          : purchaseForm.payment_status === 'partial' ? (total_cost > 0 ? (amount_paid / total_cost) * lineTotal : 0) : 0;",
"        const fields = {",
"          material_id: line.material_id,",
"          quantity: line.quantity,",
"          unit_cost: line.unit_cost,",
"          total_cost: lineTotal,",
"          purchase_date: purchaseForm.purchase_date,",
"          invoice_number: purchaseForm.invoice_number || undefined,",
"          notes: purchaseForm.notes || undefined,",
"          payment_status: purchaseForm.payment_status,",
"          amount_paid: lineAmountPaid,",
"          purchase_group_id: groupId,",
"        };",
"        const saved = line.id",
"          ? await api.materialPurchasesService.update(line.id, fields)",
"          : await api.materialPurchasesService.create(fields);",
"        const material = rawMaterials.find(m => m.id === line.material_id);",
"        result.push({ ...saved, material });",
"        const before = editingPurchaseGroup.find(p => p.id === line.id);",
"        if (!before || before.unit_cost !== line.unit_cost) {",
"          await api.rawMaterialsService.update(line.material_id, { unit_cost: line.unit_cost, last_purchase_date: purchaseForm.purchase_date });",
"        }",
"      }",
"      const oldIds = new Set(editingPurchaseGroup.map(p => p.id));",
"      setMaterialPurchases([...result, ...materialPurchases.filter(p => !oldIds.has(p.id))]);",
"      setShowPurchaseModal(false);",
"      setEditingPurchaseGroup(null);",
"      setMaterialSearch('');",
"    } catch (error) {",
"      console.error('Error editing purchase:', error);",
"      alert('Erreur lors de la modification de cet achat.');",
"    }",
"  };",
"",
"  void addPurchaseLine;"
].join('\n');
rep('void addPurchaseLine;', editSubmit, 'fonction modification');

repRe(/(const handlePurchaseSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*if \(purchaseForm\.lines\.length === 0\) return;)/, (x, p1) => p1 + '\n    if (editingPurchaseGroup) { await handleEditPurchaseSubmit(); return; }', 'soumission');

rep('<h2 className="text-lg font-semibold">Nouvel Achat</h2>', "<h2 className=\"text-lg font-semibold\">{editingPurchaseGroup ? 'Modifier l’achat' : 'Nouvel Achat'}</h2>", 'titre');
repRe(/(disabled:opacity-50">\s*)Enregistrer l'achat(\s*<\/button>)/, (x, p1, p2) => p1 + "{editingPurchaseGroup ? 'Enregistrer les modifications' : \"Enregistrer l'achat\"}" + p2, 'bouton enregistrer');

const nbFermer = t.split('onClick={() => setShowPurchaseModal(false)}').length - 1;
t = t.split('onClick={() => setShowPurchaseModal(false)}').join('onClick={() => { setShowPurchaseModal(false); setEditingPurchaseGroup(null); }}');

rep('<button onClick={() => handleDeletePurchaseGroup(group.key)}', '<button onClick={() => openEditPurchase(group)}\n                      className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg" title="Modifier">Modifier</button>\n                    <button onClick={() => handleDeletePurchaseGroup(group.key)}', 'bouton modifier');

rep('const handleUpdateGroupPaymentStatus = async (groupKey: string, status: PaymentStatus, amountPaid?: number) => {', 'const handleUpdateGroupPaymentStatus = async (groupKey: string, status: PaymentStatus, amountPaid?: number) => {\n    const updatedMap: Record<string, MaterialPurchase> = {};', 'paiement groupe 1');
rep('setMaterialPurchases(prev => prev.map(x => x.id === p.id ? updated : x));', 'updatedMap[p.id] = updated;', 'paiement groupe 2');
repRe(/(\n    \} catch \(error\) \{\n      console\.error\('Error updating payment status:')/, (x, p1) => '\n      setMaterialPurchases(materialPurchases.map(x => updatedMap[x.id] ?? x));' + p1, 'paiement groupe 3');

fs.writeFileSync(M, t);
console.log('OK : bouton Modifier ajoute a l historique des achats (' + nbFermer + ' fermetures de fenetre mises a jour)');