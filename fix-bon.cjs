const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const FP = 'src/pages/RecipePage.tsx';
if (!fs.existsSync(FP)) stop('RecipePage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('syncChocMat') >= 0) stop('deja applique');
if (t.indexOf('effYieldG') < 0) stop('installez d abord le script du rendement automatique');
const a = "const costPerKg = yieldKg > 0 && totalIngCost > 0 ? totalIngCost / yieldKg : 0;";
const n = t.split(a).length - 1;
if (n !== 1) stop('ligne trouvee ' + n + ' fois');
const add = `

  // Le prix de revient du chocolat maison alimente la matiere "Chocolat maison" (utilisable dans la recette de ganache)
  const syncChocBusy = React.useRef(false);
  useEffect(() => {
    const cost = Math.round(costPerKg * 100) / 100;
    if (!(cost > 0) || syncChocBusy.current || !navigator.onLine) return;
    const syncChocMat = async () => {
      syncChocBusy.current = true;
      try {
        const mat = rawMaterials.find(m => m.name.trim().toLowerCase() === 'chocolat maison');
        if (mat) {
          if (Math.abs(mat.unit_cost - cost) > 0.5) {
            const upd = await api.rawMaterialsService.update(mat.id, { unit_cost: cost });
            setRawMaterials(rawMaterials.map(m => (m.id === mat.id ? { ...m, ...upd } : m)));
          }
        } else {
          const created = await api.rawMaterialsService.create({ name: 'Chocolat maison', unit: 'kg', unit_cost: cost, supplier: '' } as Parameters<typeof api.rawMaterialsService.create>[0]);
          setRawMaterials([...rawMaterials, created]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    syncChocMat().finally(() => { syncChocBusy.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costPerKg, rawMaterials.length]);`;
fs.writeFileSync('backup34-RecipePage.tsx.txt', t);
t = t.replace(a, a + add);
fs.writeFileSync(FP, t);
console.log('OK : le prix du chocolat maison alimente la recette de ganache');