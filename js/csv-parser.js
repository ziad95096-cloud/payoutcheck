window.PC=window.PC||{};
PC.csv={MAX:5*1024*1024,
validateFile(f){if(!/\.csv$/i.test(f.name)&&!/csv|excel|text\/plain/.test(f.type))return'Please choose a .csv file.';if(f.size>this.MAX)return'File is larger than 5 MB.';if(!f.size)return'The file is empty.';return''},
/* Returns {rows, lines}; lines[i] = line number where record i starts (multiline-safe). Handles BOM, CRLF/LF/CR, quotes, "" escapes. */
parse(t){t=t.replace(/^\uFEFF/,'');const rows=[],lines=[];let r=[],c='',q=false,ln=1,st=1;
const end=()=>{r.push(c);c='';if(r.some(v=>v.trim()!=='')){rows.push(r);lines.push(st)}r=[]};
for(let i=0;i<t.length;i++){const ch=t[i];
if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else{if(ch=='\n')ln++;c+=ch}}
else if(ch=='"'){if(c==='')q=true;else c+=ch}
else if(ch==','){r.push(c);c=''}
else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;end();ln++;st=ln}
else c+=ch}
if(q)throw new Error('Unclosed quote in CSV.');if(c!==''||r.length)end();return{rows,lines}},
/* Every data row must have the same number of cells as the header. */
validateRows(rows,lines){const n=rows[0].length,e=[];rows.forEach((r,i)=>{if(i&&r.length!==n)e.push({row:lines[i],msg:`Expected ${n} cells but found ${r.length} (${Math.abs(r.length-n)} ${r.length<n?'missing':'extra'})`})});return e},
/* Text fields: neutralise spreadsheet formulas (=,+,-,@, tab, CR, also after leading spaces), then quote per RFC 4180. */
field(v){v=String(v??'');if(/^\s*[=+\-@]/.test(v)||/^[\t\r]/.test(v))v="'"+v;return/[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v},
/* Numbers are formatted here from integer cents and never pass through field(), so -100 stays -1.00. */
amt(m){const a=Math.abs(m);return(m<0?'-':'')+Math.floor(a/100)+'.'+String(a%100).padStart(2,'0')},
exportResults(p,cur){return['payout_id,expected,received,difference,status,currency'].concat(p.map(x=>[this.field(x.id),this.amt(x.exp),this.amt(x.rec),this.amt(x.diff),this.field(x.status),this.field(cur)].join(','))).join('\r\n')+'\r\n'}};
