window.PC=window.PC||{};
/* Money = integer minor units (cents, 2 decimals). Blank expected = ignored; blank received = no transfer (0). */
PC.calc={
/* -> {blank:true} | {value} | {error}. Accepts 1234.56, 1,234.56, -5.00, (5.00), $5, -$5, $-5. Rejects 1,23 / 1.234 / 1e5 / 0,123. */
parseAmount(raw){let s=String(raw??'').trim();if(s==='')return{blank:true};let neg=false,sg=false;const par=/^\((.*)\)$/.exec(s);
if(par){neg=true;s=par[1].trim()}else if(s[0]=='-'||s[0]=='+'){neg=s[0]=='-';sg=true;s=s.slice(1).trim()}
s=s.replace(/^[$€£]\s*/,'');if(!par&&!sg&&s[0]=='-'){neg=true;s=s.slice(1)}
const m=/^([1-9]\d{0,2}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(s);
if(!m)return{error:`"${raw}" is not a valid amount. Use 1234.56 or 1,234.56 (max 2 decimals; negatives as -5.00 or (5.00)).`};
const v=BigInt(m[1].replace(/,/g,''))*100n+BigInt((m[2]||'').padEnd(2,'0')||'0');
if(v>BigInt(Number.MAX_SAFE_INTEGER))return{error:`"${raw}" is too large to calculate safely.`};const n=Number(v);return{value:neg&&n?-n:n}},
mapErrors(m,h){const R={id:'Payout ID',exp:'Expected amount',rec:'Received amount',cur:'Currency'},e=[],ok=v=>Number.isInteger(v)&&v>=0&&v<h.length,seen={};
['id','exp','rec'].forEach(k=>{if(!ok(m[k]))e.push(`Choose a column for ${R[k]}.`)});if(m.cur!==''&&m.cur!=null&&!ok(m.cur))e.push('The Currency column is invalid.');
Object.keys(R).forEach(k=>{if(ok(m[k]))(seen[m[k]]=seen[m[k]]||[]).push(R[k])});
Object.keys(seen).forEach(i=>{if(seen[i].length>1)e.push(`Column "${h[i]||'Column '+(+i+1)}" is selected for ${seen[i].join(' and ')}. Each field needs its own column.`)});return e},
run(rows,m,defCur,lines,headers){const errors=[],g=new Map(),curs=new Set(),E=(row,msg)=>errors.push({row,msg}),S=Number.isSafeInteger;
if(!rows.length)return{errors:[{row:0,msg:'The file has no data rows.'}]};
const me=this.mapErrors(m,headers||rows[0]||[]);if(me.length)return{errors:me.map(x=>({row:0,msg:x}))};
const hasCur=m.cur!==''&&m.cur!=null;if(!hasCur&&!/^[A-Z]{3}$/.test(defCur||''))return{errors:[{row:0,msg:'Choose a valid currency.'}]};
rows.forEach((r,i)=>{const n=lines?lines[i]:i+2,id=(r[m.id]||'').trim(),e=this.parseAmount(r[m.exp]),x=this.parseAmount(r[m.rec]);
if(!id){E(n,'Missing payout ID');return}
if(e.error)E(n,'Expected amount: '+e.error);if(x.error)E(n,'Received amount: '+x.error);
let c='';if(hasCur){c=(r[m.cur]||'').trim().toUpperCase();if(!c){E(n,'Missing currency');return}if(!/^[A-Z]{3}$/.test(c)){E(n,`Invalid currency code "${r[m.cur]}"`);return}}
let p=g.get(id);if(!p)g.set(id,p={id,exp:null,rec:0,cur:c});
if(c){if(p.cur&&p.cur!==c)E(n,`Payout ${id} has different currencies (${p.cur}, ${c})`);p.cur=p.cur||c;curs.add(c)}
if(e.value!==undefined){if(p.exp===null)p.exp=e.value;else if(p.exp!==e.value)E(n,`Payout ${id} has conflicting expected amounts`)}
if(x.value!==undefined){p.rec+=x.value;if(!S(p.rec))E(n,`Payout ${id}: received total is too large to calculate safely`)}});
if(curs.size>1)E(0,`Multiple currencies found (${[...curs].join(', ')}). Reconcile one currency per file.`);
g.forEach(p=>{if(p.exp===null)E(0,`Payout ${p.id} has no expected amount`)});
if(errors.length)return{errors};
const payouts=[...g.values()].map(p=>{const d=p.exp-p.rec;return{id:p.id,exp:p.exp,rec:p.rec,diff:d,status:d===0?'Matched':d>0?'Short':'Extra'}});
const t={exp:0,rec:0,diff:0,Matched:0,Short:0,Extra:0};payouts.forEach(p=>{t.exp+=p.exp;t.rec+=p.rec;t.diff+=p.diff;t[p.status]++});
if(!S(t.exp)||!S(t.rec)||!S(t.diff)||payouts.some(p=>!S(p.diff)))return{errors:[{row:0,msg:'Totals are too large to calculate safely.'}]};
return{errors,payouts,totals:t,cur:[...curs][0]||defCur}}};
