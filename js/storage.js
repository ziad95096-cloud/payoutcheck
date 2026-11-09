window.PC=window.PC||{};
PC.store={K:'payoutcheck.v1',
/* Raw stored array; unreadable JSON is backed up to K+'.corrupt' instead of being lost. */
raw(){let s=null;try{s=localStorage.getItem(this.K)}catch(e){return[]}if(s==null)return[];
try{const a=JSON.parse(s);if(Array.isArray(a))return a}catch(e){}try{localStorage.setItem(this.K+'.corrupt',s)}catch(e){}return[]},
/* Validates a record and recomputes diff/status/totals from stored integers; null if unusable. */
norm(r){if(!r||typeof r!=='object'||typeof r.id!=='string'||!r.id||!Array.isArray(r.payouts)||!/^[A-Z]{3}$/.test(r.cur))return null;const si=Number.isSafeInteger,ps=[];
for(const p of r.payouts){if(!p||typeof p.id!=='string'||!si(p.exp)||!si(p.rec))return null;const d=p.exp-p.rec;if(!si(d))return null;ps.push({id:p.id,exp:p.exp,rec:p.rec,diff:d,status:d===0?'Matched':d>0?'Short':'Extra'})}
const t={exp:0,rec:0,diff:0,Matched:0,Short:0,Extra:0};for(const p of ps){t.exp+=p.exp;t.rec+=p.rec;t.diff+=p.diff;t[p.status]++}
if(!si(t.exp)||!si(t.rec)||!si(t.diff))return null;return{id:r.id,at:Number.isFinite(r.at)?r.at:0,file:String(r.file??'Unknown file'),cur:r.cur,payouts:ps,totals:t}},
/* Valid records only; .hidden = number of unreadable records (kept in storage, not deleted). */
list(){const a=this.raw(),v=a.map(x=>this.norm(x)).filter(Boolean);v.hidden=a.length-v.length;return v},
save(rec){const n=this.norm(rec);if(!n)return false;try{const a=this.raw();a.unshift(n);localStorage.setItem(this.K,JSON.stringify(a));return true}catch(e){return false}},
remove(id){try{localStorage.setItem(this.K,JSON.stringify(this.raw().filter(x=>!(x&&x.id===id))));return true}catch(e){return false}}};
