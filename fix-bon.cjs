const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
if (fs.existsSync('src/lib')) stop('src/lib existe deja, rien n est modifie');
const base = 'https://raw.githubusercontent.com/storehanky-jpg/hankyapp/main/src/components/lib/';
const names = ['supabase.ts', 'syncEngine.ts', 'offlineDb.ts', 'storage.ts', 'formatters.ts', 'deliveryNote.ts'];
(async () => {
  const got = {};
  for (const n of names) {
    let r;
    try { r = await fetch(base + n); } catch (e) { stop('telechargement impossible : ' + n + ' (' + e.message + ')'); }
    if (!r.ok) stop('erreur ' + r.status + ' pour ' + n);
    const txt = await r.text();
    if (txt.length < 100) stop('fichier trop court : ' + n);
    got[n] = txt;
  }
  if (got['supabase.ts'].indexOf('createClient') < 0) stop('supabase.ts inattendu');
  fs.mkdirSync('src/lib', { recursive: true });
  names.forEach(n => fs.writeFileSync('src/lib/' + n, got[n]));
  console.log('OK : src/lib recree : ' + names.join(', '));
})();