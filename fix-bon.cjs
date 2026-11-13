const fs = require('fs');
console.log('DEBUT');
const b = fs.readFileSync('backup8-BulkSalesPage.tsx.txt', 'utf8');
if (b.includes('orphanStats')) { console.log('ARRET : sauvegarde incorrecte'); process.exit(1); }
fs.writeFileSync('src/pages/BulkSalesPage.tsx', b);
console.log('OK : page remise comme avant, encadre jaune supprime');