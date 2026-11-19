const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = (s) => Buffer.from(s, 'base64').toString('utf8');
const FAC = D([
'ICAgICAgY29uc3QgY3VzdCA9IHNlbGVjdGVkQ3VzdG9tZXI7CiAgICAgIGNvbnN0IHBmID0gZmFjRnJvbTsKICAgICAgY29uc3Qg',
'cHQgPSBmYWNUbzsKICAgICAgY29uc3QgdG90ID0gZmFjVG90YWw7CiAgICAgIHNldFNob3dGYWN0dXJlUGVyaW9kKGZhbHNlKTsK',
'ICAgICAgcHJpbnRIVE1MKGh0bWwsIGFzeW5jICgpID0+IHsKICAgICAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdMYSBmYWN0dXJl',
'IGEtdC1lbGxlIGJpZW4gw6l0w6kgaW1wcmltw6llID9cblxuT0sgOiBlbnJlZ2lzdHJlciBsYSBjb3BpZSBldCBnYXJkZXIgbGUg',
'bnVtw6lyb1xuQW5udWxlciA6IG5lIHJpZW4gZW5yZWdpc3RyZXInKSkgcmV0dXJuOwogICAgICAgIHRyeSB7CiAgICAgICAgICBj',
'b25zdCB7IGRhdGE6IGV4IH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKCdkb2N1bWVudHMnKS5zZWxlY3QoJ2lkJykuZXEoJ2RvY190',
'eXBlJywgJ2ZhY3R1cmUnKS5lcSgnbnVtYmVyJywgbnVtKS5saW1pdCgxKTsKICAgICAgICAgIGlmIChleCAmJiBleC5sZW5ndGgg',
'PiAwKSB7IGFsZXJ0KCdDZSBudW3DqXJvIGRlIGZhY3R1cmUgZXhpc3RlIGTDqWrDoCA6IGxhIGNvcGllIG5cJ2EgcGFzIMOpdMOp',
'IGVucmVnaXN0csOpZS4nKTsgcmV0dXJuOyB9CiAgICAgICAgICBjb25zdCB7IGVycm9yOiBlMiB9ID0gYXdhaXQgc3VwYWJhc2Uu',
'ZnJvbSgnZG9jdW1lbnRzJykuaW5zZXJ0KHsKICAgICAgICAgICAgZG9jX3R5cGU6ICdmYWN0dXJlJywgbnVtYmVyOiBudW0sIGRv',
'Y19kYXRlOiB0b2RheUlTTygpLAogICAgICAgICAgICBjdXN0b21lcl9pZDogY3VzdC5pZCwgY3VzdG9tZXJfbmFtZTogY3VzdC5u',
'YW1lLAogICAgICAgICAgICBwZXJpb2RfZnJvbTogcGYsIHBlcmlvZF90bzogcHQsIHRvdGFsOiB0b3QsIGh0bWwsCiAgICAgICAg',
'ICB9KTsKICAgICAgICAgIGlmIChlMikgdGhyb3cgZTI7CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgY29uc29sZS5l',
'cnJvcihlKTsKICAgICAgICAgIGFsZXJ0KCJJbXBvc3NpYmxlIGQnZW5yZWdpc3RyZXIgbGEgY29waWUgOiAiICsgZXJyVGV4dChl',
'KSk7CiAgICAgICAgfQogICAgICB9KTsK'
].join(''));
const BON = D([
'ICAgIGNvbnN0IG51bUZpbmFsID0gbnVtIGFzIG51bWJlcjsKICAgIGNvbnN0IHRvdGFsQm9uID0gbGluZXMucmVkdWNlKChzLCBp',
'KSA9PiBzICsgaS50b3RhbF9hbW91bnQsIDApOwogICAgcHJpbnRIVE1MKGh0bWwsICgpID0+IHsKICAgICAgaWYgKHdpbmRvdy5j',
'b25maXJtKCdMZSBib24gYS10LWlsIGJpZW4gw6l0w6kgaW1wcmltw6kgP1xuXG5PSyA6IGVucmVnaXN0cmVyIGxhIGNvcGllXG5B',
'bm51bGVyIDogbmUgcmllbiBlbnJlZ2lzdHJlcicpKSB7CiAgICAgICAgdm9pZCBzYXZlRG9jQ29weSgnYm9uJywgbnVtRmluYWws',
'IGdyb3VwLnNhbGVfZGF0ZSwgaHRtbCwgdG90YWxCb24pOwogICAgICB9CiAgICB9KTsK'
].join(''));
const DEL = D([
'ICBjb25zdCBkZWxldGVEb2MgPSBhc3luYyAoaWQ6IHN0cmluZykgPT4gewogICAgaWYgKCF3aW5kb3cuY29uZmlybSgnU3VwcHJp',
'bWVyIGNldHRlIGNvcGllID8gQ2V0dGUgYWN0aW9uIGVzdCBkw6lmaW5pdGl2ZS4nKSkgcmV0dXJuOwogICAgY29uc3QgeyBlcnJv',
'ciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbSgnZG9jdW1lbnRzJykuZGVsZXRlKCkuZXEoJ2lkJywgaWQpOwogICAgaWYgKGVycm9y',
'KSB7CiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpOwogICAgICBhbGVydCgnSW1wb3NzaWJsZSBkZSBzdXBwcmltZXIgOiAnICsg',
'ZXJyVGV4dChlcnJvcikpOwogICAgICByZXR1cm47CiAgICB9CiAgICBzZXREb2NzTGlzdChkb2NzTGlzdC5maWx0ZXIoZCA9PiBk',
'LmlkICE9PSBpZCkpOwogIH07Cgo='
].join(''));
const FP = 'src/pages/BulkSalesPage.tsx';
if (!fs.existsSync(FP)) stop('BulkSalesPage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('deleteDoc') >= 0) stop('deja applique');
if (t.indexOf('docsKind') < 0) stop('l affichage Bon / Facture n est pas installe');
function count(s) { return t.split(s).length - 1; }
function need(s, nom) { const n = count(s); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); }
function swap(a, b, nom) { need(a, nom); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }

swap('const printHTML = (html: string) => {', 'const printHTML = (html: string, onDone?: () => void) => {', 'signature impression');
swap('try { iframe.contentWindow?.print(); } catch (e) { console.error(e); }', 'try { iframe.contentWindow?.print(); } catch (e) { console.error(e); }\n      if (onDone) setTimeout(onDone, 400);', 'fin impression');

const facOld = "      const { error } = await supabase.from('documents').insert({\n        doc_type: 'facture', number: num, doc_date: todayISO(),\n        customer_id: selectedCustomer.id, customer_name: selectedCustomer.name,\n        period_from: facFrom, period_to: facTo, total: facTotal, html,\n      });\n      if (error) throw error;\n      setShowFacturePeriod(false);\n      printHTML(html);\n";
swap(facOld, FAC, 'enregistrement facture');

const bonOld = "    void saveDocCopy('bon', num, group.sale_date, html, lines.reduce((s, i) => s + i.total_amount, 0));\n    printHTML(html);\n";
swap(bonOld, BON, 'enregistrement bon');

swap('const openDocs = async (kind: string) => {', DEL + 'const openDocs = async (kind: string) => {', 'fonction supprimer');

const rb = "<button onClick={() => { if (d.html) printHTML(d.html); }}";
need(rb, 'bouton reimprimer');
const ri = t.indexOf(rb);
const re = t.indexOf('</button>', ri) + 9;
if (re < 9) stop('fin du bouton reimprimer introuvable');
const btn = t.slice(ri, re);
const del = "\n                    <button onClick={() => deleteDoc(d.id)} className='flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100'>\n                      <Trash2 size={14} /> Supprimer\n                    </button>";
t = t.slice(0, ri) + "<div className='flex gap-2'>\n                    " + btn + del + "\n                    </div>" + t.slice(re);

fs.writeFileSync('backup26-BulkSalesPage.tsx.txt', fs.readFileSync(FP, 'utf8'));
fs.writeFileSync(FP, t);
console.log('OK : copie enregistree seulement apres confirmation d impression, bouton Supprimer ajoute');
