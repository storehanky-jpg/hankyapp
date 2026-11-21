const fs = require('fs');
console.log('DEBUT');
const stop = (m) => { console.log('ARRET : ' + m); process.exit(1); };
const D = (s) => Buffer.from(s, 'base64').toString('utf8');
const STATES = D([
'CiAgY29uc3QgW2VkaXRNdWx0LCBzZXRFZGl0TXVsdF0gPSB1c2VTdGF0ZTxSZWNpcGVUeXBlIHwgbnVsbD4obnVsbCk7CiAgY29u',
'c3QgW211bHREcmFmdCwgc2V0TXVsdERyYWZ0XSA9IHVzZVN0YXRlKCcnKTsKICBjb25zdCBbcHJvZERhdGUsIHNldFByb2REYXRl',
'XSA9IHVzZVN0YXRlKG5ldyBEYXRlKERhdGUubm93KCkgLSBuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCku',
'dG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCkpOwogIGNvbnN0IFtwcm9kQnVzeSwgc2V0UHJvZEJ1c3ldID0gdXNlU3RhdGUoZmFs',
'c2UpOwo='
].join(''));
const FUNCS = D([
'CgogIC8vIOKUgOKUgCBNdWx0aXBsaWNhdGV1cnMgcGFyIHJlY2V0dGUgKyBlbnZvaSBhIGxhIHByb2R1Y3Rpb24g4pSA4pSACiAg',
'dm9pZCBbdG9kYXlUb3RhbENvc3QsIHRvZGF5R2FuYWNoZUNvc3QsIGdhbmFjaGVEYWlseVF0eSwgc2V0R2FuYWNoZURhaWx5UXR5',
'LCBnYW5hY2hlQ29zdFBlckdyYW0sIFNjYWxlLCBDYWxjdWxhdG9yXTsKCiAgY29uc3Qgc2F2ZU11bHQgPSAoKSA9PiB7CiAgICBj',
'b25zdCB2ID0gcGFyc2VGbG9hdChtdWx0RHJhZnQucmVwbGFjZSgnLCcsICcuJykpOwogICAgaWYgKCFpc0Zpbml0ZSh2KSB8fCB2',
'IDw9IDApIHsKICAgICAgYWxlcnQoJ0VudHJlIHVuIG5vbWJyZSBzdXDDqXJpZXVyIMOgIDAgKGV4IDogMTAgb3UgNy41KS4nKTsK',
'ICAgICAgcmV0dXJuOwogICAgfQogICAgY29uc3QgciA9IE1hdGgucm91bmQodiAqIDEwMDApIC8gMTAwMDsKICAgIGlmIChlZGl0',
'TXVsdCA9PT0gJ2dhbmFjaGUnKSBzZXRHYW5hY2hlTXVsdGlwbGllcihyKTsgZWxzZSBzZXRNdWx0aXBsaWVyKHIpOwogICAgc2V0',
'RWRpdE11bHQobnVsbCk7CiAgfTsKCiAgY29uc3QgZGF5Q29xdWVHID0gYWN0aXZlQ29xdWVMaW5lcy5yZWR1Y2UoKHMsIGwpID0+',
'IHMgKyBsLnF1YW50aXR5LCAwKSAqIG11bHRpcGxpZXI7CiAgY29uc3QgZGF5R2FuYWNoZUcgPSBhY3RpdmVHYW5hY2hlTGluZXMu',
'cmVkdWNlKChzLCBsKSA9PiBzICsgbC5xdWFudGl0eSwgMCkgKiBnYW5hY2hlTXVsdGlwbGllcjsKICBjb25zdCB0b3RhbEtnRGF5',
'ID0gTWF0aC5yb3VuZCgoKGRheUNvcXVlRyArIGRheUdhbmFjaGVHKSAvIDEwMDApICogMTAwMCkgLyAxMDAwOwogIGNvbnN0IGNv',
'c3REYXkgPSBjb3F1ZVRvdGFsQ29zdCArIGdhbmFjaGVUb3RhbENvc3Q7CgogIGNvbnN0IHNlbmRUb1Byb2R1Y3Rpb24gPSBhc3lu',
'YyAoKSA9PiB7CiAgICBpZiAodG90YWxLZ0RheSA8PSAwIHx8IHByb2RCdXN5KSByZXR1cm47CiAgICBzZXRQcm9kQnVzeSh0cnVl',
'KTsKICAgIHRyeSB7CiAgICAgIGNvbnN0IG5vdGUgPSAnUmVjZXR0ZXMgOiBjb3F1ZXMgeCcgKyBtdWx0aXBsaWVyICsgJyDCtyBn',
'YW5hY2hlIHgnICsgZ2FuYWNoZU11bHRpcGxpZXI7CiAgICAgIGNvbnN0IGNvc3QgPSBNYXRoLnJvdW5kKGNvc3REYXkgKiAxMDAp',
'IC8gMTAwOwogICAgICBjb25zdCBtZXJnZWQ6IFJlY29yZDxzdHJpbmcsIHsgbWF0ZXJpYWxfaWQ6IHN0cmluZzsgcXVhbnRpdHk6',
'IG51bWJlcjsgdW5pdF9jb3N0OiBudW1iZXIgfT4gPSB7fTsKICAgICAgY29uc3QgYWRkTGluZXMgPSAobGluZXM6IFJlY2lwZUxp',
'bmVbXSwgbXVsdDogbnVtYmVyKSA9PiB7CiAgICAgICAgbGluZXMuZm9yRWFjaChsID0+IHsKICAgICAgICAgIGlmICghbC5tYXRl',
'cmlhbElkKSByZXR1cm47CiAgICAgICAgICBjb25zdCB1YyA9IGwudW5pdENvc3QgPz8gbC5kZWZhdWx0Q29zdCA/PyAwOwogICAg',
'ICAgICAgaWYgKCFtZXJnZWRbbC5tYXRlcmlhbElkXSkgbWVyZ2VkW2wubWF0ZXJpYWxJZF0gPSB7IG1hdGVyaWFsX2lkOiBsLm1h',
'dGVyaWFsSWQsIHF1YW50aXR5OiAwLCB1bml0X2Nvc3Q6IHVjIH07CiAgICAgICAgICBtZXJnZWRbbC5tYXRlcmlhbElkXS5xdWFu',
'dGl0eSArPSAobC5xdWFudGl0eSAqIG11bHQpIC8gMTAwMDsKICAgICAgICB9KTsKICAgICAgfTsKICAgICAgYWRkTGluZXMoYWN0',
'aXZlQ29xdWVMaW5lcywgbXVsdGlwbGllcik7CiAgICAgIGFkZExpbmVzKGFjdGl2ZUdhbmFjaGVMaW5lcywgZ2FuYWNoZU11bHRp',
'cGxpZXIpOwogICAgICBjb25zdCBtYXRzID0gT2JqZWN0LnZhbHVlcyhtZXJnZWQpLm1hcChtID0+ICh7IC4uLm0sIHF1YW50aXR5',
'OiBNYXRoLnJvdW5kKG0ucXVhbnRpdHkgKiAxMDAwKSAvIDEwMDAgfSkpOwogICAgICBjb25zdCBleGlzdGluZyA9IHByb2R1Y3Rp',
'b25CYXRjaGVzLmZpbmQoYiA9PiBiLmJhdGNoX2RhdGUgPT09IHByb2REYXRlICYmIChiLm5vdGVzIHx8ICcnKS5pbmRleE9mKCdS',
'ZWNldHRlcyA6JykgPT09IDApOwogICAgICBsZXQgc2F2ZWQ6IFByb2R1Y3Rpb25CYXRjaDsKICAgICAgaWYgKGV4aXN0aW5nKSB7',
'CiAgICAgICAgY29uc3QgdmFsID0gZXhpc3RpbmcucHJvZHVjdGlvbl92YWx1ZSB8fCAwOwogICAgICAgIHNhdmVkID0gYXdhaXQg',
'YXBpLnByb2R1Y3Rpb25CYXRjaFNlcnZpY2UudXBkYXRlKGV4aXN0aW5nLmlkLCB7CiAgICAgICAgICBiYXRjaF9kYXRlOiBwcm9k',
'RGF0ZSwgcGxhbm5lZF9xdWFudGl0eTogdG90YWxLZ0RheSwgcHJvZHVjZWRfcXVhbnRpdHk6IHRvdGFsS2dEYXksCiAgICAgICAg',
'ICBsb3N0X3F1YW50aXR5OiBleGlzdGluZy5sb3N0X3F1YW50aXR5LCBub3Rlczogbm90ZSwKICAgICAgICAgIHByb2R1Y3Rpb25f',
'Y29zdDogY29zdCwgcHJvZHVjdGlvbl92YWx1ZTogdmFsLCBwcm9maXQ6IHZhbCAtIGNvc3QsCiAgICAgICAgfSk7CiAgICAgICAg',
'YXdhaXQgYXBpLnByb2R1Y3Rpb25NYXRlcmlhbHNTZXJ2aWNlLmRlbGV0ZUJ5QmF0Y2goZXhpc3RpbmcuaWQpOwogICAgICB9IGVs',
'c2UgewogICAgICAgIHNhdmVkID0gYXdhaXQgYXBpLnByb2R1Y3Rpb25CYXRjaFNlcnZpY2UuY3JlYXRlKHsKICAgICAgICAgIGJh',
'dGNoX2RhdGU6IHByb2REYXRlLCBwbGFubmVkX3F1YW50aXR5OiB0b3RhbEtnRGF5LCBwcm9kdWNlZF9xdWFudGl0eTogdG90YWxL',
'Z0RheSwKICAgICAgICAgIGxvc3RfcXVhbnRpdHk6IDAsIG5vdGVzOiBub3RlLAogICAgICAgICAgcHJvZHVjdGlvbl9jb3N0OiBj',
'b3N0LCBwcm9kdWN0aW9uX3ZhbHVlOiAwLCBwcm9maXQ6IC1jb3N0LAogICAgICAgIH0pOwogICAgICB9CiAgICAgIGZvciAoY29u',
'c3QgbSBvZiBtYXRzKSB7CiAgICAgICAgYXdhaXQgYXBpLnByb2R1Y3Rpb25NYXRlcmlhbHNTZXJ2aWNlLmNyZWF0ZSh7CiAgICAg',
'ICAgICBiYXRjaF9pZDogc2F2ZWQuaWQsIG1hdGVyaWFsX2lkOiBtLm1hdGVyaWFsX2lkLCBxdWFudGl0eTogbS5xdWFudGl0eSwK',
'ICAgICAgICAgIHVuaXRfY29zdDogbS51bml0X2Nvc3QsIHRvdGFsX2Nvc3Q6IE1hdGgucm91bmQobS5xdWFudGl0eSAqIG0udW5p',
'dF9jb3N0ICogMTAwKSAvIDEwMCwKICAgICAgICB9KTsKICAgICAgfQogICAgICBjb25zdCB3aXRoTWF0czogUHJvZHVjdGlvbkJh',
'dGNoID0gewogICAgICAgIC4uLnNhdmVkLAogICAgICAgIG1hdGVyaWFsczogbWF0cy5tYXAoKG0sIGkpID0+ICh7CiAgICAgICAg',
'ICBpZDogJ3RlbXAtJyArIGksIGJhdGNoX2lkOiBzYXZlZC5pZCwgbWF0ZXJpYWxfaWQ6IG0ubWF0ZXJpYWxfaWQsIHF1YW50aXR5',
'OiBtLnF1YW50aXR5LAogICAgICAgICAgdW5pdF9jb3N0OiBtLnVuaXRfY29zdCwgdG90YWxfY29zdDogbS5xdWFudGl0eSAqIG0u',
'dW5pdF9jb3N0LCBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksCiAgICAgICAgICBtYXRlcmlhbDogcmF3TWF0',
'ZXJpYWxzLmZpbmQociA9PiByLmlkID09PSBtLm1hdGVyaWFsX2lkKSwKICAgICAgICB9KSksCiAgICAgIH07CiAgICAgIHNldFBy',
'b2R1Y3Rpb25CYXRjaGVzKGV4aXN0aW5nID8gcHJvZHVjdGlvbkJhdGNoZXMubWFwKGIgPT4gKGIuaWQgPT09IGV4aXN0aW5nLmlk',
'ID8gd2l0aE1hdHMgOiBiKSkgOiBbd2l0aE1hdHMsIC4uLnByb2R1Y3Rpb25CYXRjaGVzXSk7CiAgICAgIGFsZXJ0KCdQcm9kdWN0',
'aW9uIGVudm95w6llIDogJyArIHRvdGFsS2dEYXkudG9Mb2NhbGVTdHJpbmcoKSArICcga2cgbGUgJyArIHByb2REYXRlICsgJy4g',
'T3V2cmUgbGEgcGFnZSBQcm9kdWN0aW9uIHBvdXIgbGEgdm9pci4nKTsKICAgIH0gY2F0Y2ggKGVycikgewogICAgICBjb25zb2xl',
'LmVycm9yKGVycik7CiAgICAgIGNvbnN0IG1zZyA9IGVyciAmJiB0eXBlb2YgZXJyID09PSAnb2JqZWN0JyAmJiAnbWVzc2FnZScg',
'aW4gZXJyID8gU3RyaW5nKChlcnIgYXMgeyBtZXNzYWdlOiB1bmtub3duIH0pLm1lc3NhZ2UpIDogJ2VycmV1cic7CiAgICAgIGFs',
'ZXJ0KCJJbXBvc3NpYmxlIGQnZW52b3llciBsYSBwcm9kdWN0aW9uIDogIiArIG1zZyk7CiAgICB9CiAgICBzZXRQcm9kQnVzeShm',
'YWxzZSk7CiAgfTsK'
].join(''));
const CONTROL = D([
'ICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ibWwtNiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBiZy13aGl0ZS8yMCByb3Vu',
'ZGVkLXhsIHB4LTMgcHktMiI+CiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InRleHQtc20gZm9udC1tZWRpdW0iPk11',
'bHRpcGxpY2F0ZXVyIMOXPC9zcGFuPgogICAgICAgICAgICAgICAge2VkaXRNdWx0ID09PSBhY3RpdmVUYWIgPyAoCiAgICAgICAg',
'ICAgICAgICAgIDw+CiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgc3RlcD0iYW55IiBtaW49IjAiIHZh',
'bHVlPXttdWx0RHJhZnR9IG9uQ2hhbmdlPXtlID0+IHNldE11bHREcmFmdChlLnRhcmdldC52YWx1ZSl9IGNsYXNzTmFtZT0idy0y',
'MCBweC0yIHB5LTEgcm91bmRlZC1sZyB0ZXh0LWdyYXktOTAwIHRleHQtY2VudGVyIGZvbnQtYm9sZCIgLz4KICAgICAgICAgICAg',
'ICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25DbGljaz17c2F2ZU11bHR9IGNsYXNzTmFtZT0icHgtMyBweS0xIHJvdW5k',
'ZWQtbGcgYmctd2hpdGUgdGV4dC1ncmF5LTgwMCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQiPk9LPC9idXR0b24+CiAgICAgICAgICAg',
'ICAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uQ2xpY2s9eygpID0+IHNldEVkaXRNdWx0KG51bGwpfSBjbGFzc05hbWU9',
'InB4LTIgcHktMSB0ZXh0LXNtIHVuZGVybGluZSI+QW5udWxlcjwvYnV0dG9uPgogICAgICAgICAgICAgICAgICA8Lz4KICAgICAg',
'ICAgICAgICAgICkgOiAoCiAgICAgICAgICAgICAgICAgIDw+CiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0',
'ZXh0LTJ4bCBmb250LWJvbGQiPnthY3RpdmVUYWIgPT09ICdjb3F1ZScgPyBtdWx0aXBsaWVyIDogZ2FuYWNoZU11bHRpcGxpZXJ9',
'PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbkNsaWNrPXsoKSA9PiB7IHNldE11bHRE',
'cmFmdChTdHJpbmcoYWN0aXZlVGFiID09PSAnY29xdWUnID8gbXVsdGlwbGllciA6IGdhbmFjaGVNdWx0aXBsaWVyKSk7IHNldEVk',
'aXRNdWx0KGFjdGl2ZVRhYik7IH19IGNsYXNzTmFtZT0icHgtMyBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUvOTAgdGV4dC1ncmF5',
'LTgwMCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaG92ZXI6Ymctd2hpdGUiPk1vZGlmaWVyPC9idXR0b24+CiAgICAgICAgICAgICAg',
'ICAgIDwvPgogICAgICAgICAgICAgICAgKX0KICAgICAgICAgICAgICA8L2Rpdj4K'
].join(''));
const BLOCK = D([
'ICAgICAgICAgIHsvKiBQcm9kdWN0aW9uIGR1IGpvdXIgKi99CiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iYmctd2hpdGUgcm91',
'bmRlZC0yeGwgc2hhZG93LXNtIGJvcmRlciBib3JkZXItZ3JheS0xMDAgb3ZlcmZsb3ctaGlkZGVuIj4KICAgICAgICAgICAgPGRp',
'diBjbGFzc05hbWU9ImJnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNTAwIHRvLXB1cnBsZS02MDAgcC01IGZsZXggaXRlbXMt',
'Y2VudGVyIGdhcC0zIHRleHQtd2hpdGUiPgogICAgICAgICAgICAgIDxGbGFza0NvbmljYWwgc2l6ZT17MjJ9IC8+CiAgICAgICAg',
'ICAgICAgPGRpdj4KICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0iZm9udC1ib2xkIHRleHQtYmFzZSI+UHJvZHVjdGlvbiBk',
'dSBqb3VyPC9wPgogICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXhzIHRleHQtd2hpdGUvODAiPkNvcXVlcyDDl3tt',
'dWx0aXBsaWVyfSDCtyBHYW5hY2hlIMOXe2dhbmFjaGVNdWx0aXBsaWVyfSA6IGNlcyBkb25uw6llcyBwYXJ0ZW50IGRhbnMgbGEg',
'cGFnZSBQcm9kdWN0aW9uPC9wPgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRp',
'diBjbGFzc05hbWU9InAtNSBzcGFjZS15LTQiPgogICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJncmlkIGdyaWQtY29scy0y',
'IG1kOmdyaWQtY29scy00IGdhcC0zIj4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJiZy1hbWJlci01MCByb3VuZGVk',
'LXhsIHAtNCI+PHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtYW1iZXItNjAwIGZvbnQtbWVkaXVtIj5Db3F1ZXM8L3A+PHAgY2xh',
'c3NOYW1lPSJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LWFtYmVyLTcwMCI+e01hdGgucm91bmQoZGF5Q29xdWVHKS50b0xvY2FsZVN0',
'cmluZygpfSBnPC9wPjxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LWFtYmVyLTUwMCI+cmVjZXR0ZSDDl3ttdWx0aXBsaWVyfTwv',
'cD48L2Rpdj4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJiZy1yb3NlLTUwIHJvdW5kZWQteGwgcC00Ij48cCBjbGFz',
'c05hbWU9InRleHQtc20gdGV4dC1yb3NlLTYwMCBmb250LW1lZGl1bSI+R2FuYWNoZTwvcD48cCBjbGFzc05hbWU9InRleHQteGwg',
'Zm9udC1ib2xkIHRleHQtcm9zZS03MDAiPntNYXRoLnJvdW5kKGRheUdhbmFjaGVHKS50b0xvY2FsZVN0cmluZygpfSBnPC9wPjxw',
'IGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LXJvc2UtNTAwIj5yZWNldHRlIMOXe2dhbmFjaGVNdWx0aXBsaWVyfTwvcD48L2Rpdj4K',
'ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJiZy1ibHVlLTUwIHJvdW5kZWQteGwgcC00Ij48cCBjbGFzc05hbWU9InRl',
'eHQtc20gdGV4dC1ibHVlLTYwMCBmb250LW1lZGl1bSI+UXVhbnRpdMOpIHByb2R1aXRlPC9wPjxwIGNsYXNzTmFtZT0idGV4dC14',
'bCBmb250LWJvbGQgdGV4dC1ibHVlLTcwMCI+e3RvdGFsS2dEYXkudG9Mb2NhbGVTdHJpbmcoKX0ga2c8L3A+PHAgY2xhc3NOYW1l',
'PSJ0ZXh0LXhzIHRleHQtYmx1ZS01MDAiPmNvcXVlcyArIGdhbmFjaGU8L3A+PC9kaXY+CiAgICAgICAgICAgICAgICA8ZGl2IGNs',
'YXNzTmFtZT0iYmctZW1lcmFsZC01MCByb3VuZGVkLXhsIHAtNCI+PHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtZW1lcmFsZC02',
'MDAgZm9udC1tZWRpdW0iPkNvw7t0IG1hdGnDqHJlczwvcD48cCBjbGFzc05hbWU9InRleHQteGwgZm9udC1ib2xkIHRleHQtZW1l',
'cmFsZC03MDAiPntjb3N0RGF5LnRvRml4ZWQoMCl9IERBPC9wPjxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LWVtZXJhbGQtNTAw',
'Ij57dG90YWxLZ0RheSA+IDAgPyAoY29zdERheSAvIHRvdGFsS2dEYXkpLnRvRml4ZWQoMCkgOiAwfSBEQS9rZzwvcD48L2Rpdj4K',
'ICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iZmxleCBmbGV4LXdyYXAgaXRlbXMtZW5k',
'IGdhcC0zIj4KICAgICAgICAgICAgICAgIDxkaXY+CiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9ImJsb2NrIHRl',
'eHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xIj5EYXRlIGRlIHByb2R1Y3Rpb248L2xhYmVsPgogICAgICAgICAg',
'ICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgdmFsdWU9e3Byb2REYXRlfSBvbkNoYW5nZT17ZSA9PiBzZXRQcm9kRGF0ZShlLnRh',
'cmdldC52YWx1ZSl9IGNsYXNzTmFtZT0icHgtMyBweS0yIGJvcmRlciByb3VuZGVkLWxnIiAvPgogICAgICAgICAgICAgICAgPC9k',
'aXY+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25DbGljaz17c2VuZFRvUHJvZHVjdGlvbn0gZGlzYWJs',
'ZWQ9e3Byb2RCdXN5IHx8IHRvdGFsS2dEYXkgPD0gMH0KICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPSJweC01IHB5LTIgYmct',
'dmlvbGV0LTYwMCB0ZXh0LXdoaXRlIHJvdW5kZWQtbGcgaG92ZXI6YmctdmlvbGV0LTcwMCBkaXNhYmxlZDpvcGFjaXR5LTUwIGZv',
'bnQtbWVkaXVtIj4KICAgICAgICAgICAgICAgICAge3Byb2RCdXN5ID8gJ0Vudm9pLi4uJyA6ICdFbnZveWVyIMOgIGxhIHByb2R1',
'Y3Rpb24nfQogICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPHAgY2xh',
'c3NOYW1lPSJ0ZXh0LXhzIHRleHQtZ3JheS01MDAiPlNpIHVuIGxvdCDCqyBSZWNldHRlcyDCuyBleGlzdGUgZMOpasOgIMOgIGNl',
'dHRlIGRhdGUsIGlsIGVzdCBtaXMgw6Agam91ciAobGVzIHBlcnRlcyBkw6lqw6Agc2Fpc2llcyBzb250IGNvbnNlcnbDqWVzKS4g',
'U2lub24sIHVuIGxvdCBlc3QgY3LDqcOpLjwvcD4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8L2Rpdj4K'
].join(''));
const FP = 'src/pages/RecipePage.tsx';
if (!fs.existsSync(FP)) stop('RecipePage.tsx introuvable');
let t = fs.readFileSync(FP, 'utf8');
if (t.indexOf('sendToProduction') >= 0) stop('deja applique');
function count(s) { return t.split(s).length - 1; }
function need(s, nom) { const n = count(s); if (n !== 1) stop(nom + ' : ' + n + ' occurrence(s) au lieu de 1'); }
function swap(a, b, nom) { need(a, nom); const i = t.indexOf(a); t = t.slice(0, i) + b + t.slice(i + a.length); }

swap("import type { RecipeItem } from '../types';", "import type { RecipeItem, ProductionBatch } from '../types';", 'import types');
swap('const { rawMaterials, recipeConfig, recipeItems, setRecipeItems, setRawMaterials } = useApp();', 'const { rawMaterials, recipeConfig, recipeItems, setRecipeItems, setRawMaterials, productionBatches, setProductionBatches } = useApp();', 'contexte');
swap('const [chocMultiplier, setChocMultiplier] = useState(1);', 'const [chocMultiplier, setChocMultiplier] = useState(1);' + STATES.trimEnd(), 'etats');
swap('const totalGanacheG = chocGanacheLines.reduce((s, l) => s + l.qtyG, 0);', 'const totalGanacheG = chocGanacheLines.reduce((s, l) => s + l.qtyG, 0);' + FUNCS.trimEnd(), 'fonctions');

need('{/* Multiplicateur */}', 'bloc multiplicateurs');
need('{/* Sub-tabs Coque/Ganache */}', 'sous-onglets');
const m1 = t.indexOf('{/* Multiplicateur */}');
const m2 = t.indexOf('{/* Sub-tabs Coque/Ganache */}');
const seg = t.slice(m1, m2);
if (m2 < m1 || seg.indexOf('Multiplicateur Coques') < 0 || seg.indexOf('Multiplicateur Ganache') < 0) stop('blocs multiplicateurs inattendus');
t = t.slice(0, m1) + t.slice(m2);

swap('<p className="text-xs text-white/80">Recette de base par lot · multiplicateur x{activeTab === \'coque\' ? multiplier : ganacheMultiplier}</p>', '<p className="text-xs text-white/80">Recette de base par lot</p>', 'sous-titre banniere');
need('<div className="ml-auto text-right">', 'poids banniere');
const wi = t.indexOf('<div className="ml-auto text-right">');
const wl = t.lastIndexOf('\n', wi) + 1;
t = t.slice(0, wl) + CONTROL + t.slice(wl);

swap('<p className="text-xs text-rose-500">pour x{multiplier}</p>', '<p className="text-xs text-rose-500">pour x{ganacheMultiplier}</p>', 'carte ganache');

need('{/* Calcul du jour */}', 'calcul du jour');
need('{/* ════════ CHOCOLAT TAB ════════ */}', 'onglet chocolat');
const c1 = t.indexOf('{/* Calcul du jour */}');
const ch = t.indexOf('{/* ════════ CHOCOLAT TAB ════════ */}');
const c2 = t.lastIndexOf('        </>', ch);
if (c1 < 0 || c2 < c1) stop('fin du calcul du jour introuvable');
t = t.slice(0, c1) + BLOCK.trimEnd() + '\n' + t.slice(c2);

fs.writeFileSync('backup28-RecipePage.tsx.txt', fs.readFileSync(FP, 'utf8'));
fs.writeFileSync(FP, t);
console.log('OK : multiplicateurs par recette, bouton Modifier et envoi a la production installes');