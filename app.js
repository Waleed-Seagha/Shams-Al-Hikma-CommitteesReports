(function(){
const C=window.SITE_CONFIG,$=id=>document.getElementById(id);
const demo=!C.WEB_APP_URL,cache={},E=[],TYPE={plan:"الخطة",min:"محضر الاجتماع"};
const RE=/^(الخطة\s*)?(?:للجنة|لجنة)\s*:\s*(.+)$/;
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const dark=h=>{if(!h)return false;const n=parseInt(h.slice(1),16);return ((n>>16)*.3+((n>>8)&255)*.59+(n&255)*.11)<110};
const sel={c:$("selCom"),t:$("selType"),m:$("selMonth")},fMonth=$("fMonth"),doc=$("doc");
let coms=[],printTitle="";

/* ---------- البيانات ---------- */
async function listSheets(){
  if(demo){const d=window.DEMO_DATA;d.forEach(s=>cache[s.title]=s);return d.map(s=>s.title)}
  const r=await fetch(C.WEB_APP_URL+"?action=list");
  if(!r.ok)throw new Error("تعذّر الاتصال بالشيت. تأكد من رابط النشر في config.js.");
  return await r.json();
}
async function loadSheet(title){
  if(cache[title])return cache[title];
  const r=await fetch(C.WEB_APP_URL+"?sheet="+encodeURIComponent(title));
  if(!r.ok)throw new Error("تعذّر تحميل الورقة: "+title);
  const s=await r.json();if(s.error)throw new Error("الورقة غير موجودة: "+title);
  return cache[title]=s;
}
// كل لجنة داخل الورقة = كتلة واحدة (صفحة A4)
function blocks(s){
  const st=[];
  s.cells.forEach((row,i)=>{for(let j=0;j<2;j++){const c=row[j]||{},m=c.v&&c.b&&RE.exec(c.v);if(m){st.push([i,m]);break}}});
  return st.map(([i,m],k)=>[k?i:0,k+1<st.length?st[k+1][0]-1:s.cells.length-1,m]);
}
function build(sheets){
  const all=C.COMMITTEES.map((c,i)=>({id:"c"+i,name:c.name,keys:c.keys}));
  sheets.forEach(s=>blocks(s).forEach(([a,b,m])=>{
    const nm=m[2].trim();let c=all.find(x=>x.keys.some(k=>nm.includes(k)));
    if(!c){c={id:"c"+all.length,name:nm,keys:[nm]};all.push(c)}
    E.push({c:c.id,t:m[1]?"plan":"min",s:s.title,a,b});
  }));
  coms=all.filter(c=>E.some(e=>e.c===c.id));
}

/* ---------- عرض الوثيقة ---------- */
function render(s,a,b){
  const tot=s.cols.reduce((x,y)=>x+y,0),skip={},span={};
  s.merges.forEach(([r1,c1,r2,c2])=>{if(r1<a||r1>b)return;r2=Math.min(r2,b);
    span[r1+","+c1]=[r2-r1+1,c2-c1+1];
    for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)if(r!==r1||c!==c1)skip[r+","+c]=1});
  let h='<table><colgroup>'+s.cols.map(w=>'<col style="width:'+(w/tot*100).toFixed(2)+'%">').join("")+'</colgroup>';
  for(let r=a;r<=b;r++){
    const blank=s.cells[r].every(x=>!x.v&&!x.bg);
    h+='<tr'+(blank?' class="gap"':'')+' style="height:calc('+s.rows[r]+'px*var(--rk))">';
    for(let c=0;c<6;c++){
      const k=r+","+c;if(skip[k])continue;
      const x=s.cells[r][c]||{},sp=span[k]||[1,1],st=[];
      if(x.bg)st.push("background:"+x.bg);
      const col=x.c||(dark(x.bg)?"#fff":"");if(col)st.push("color:"+col);
      if(x.b)st.push("font-weight:700");
      if(x.sz)st.push("font-size:calc("+Math.round(x.sz*1.33)+"px*var(--fk))");
      st.push("text-align:"+({left:"left",center:"center",right:"right"}[x.h]||"right"));
      h+='<td'+(sp[0]>1?' rowspan='+sp[0]:'')+(sp[1]>1?' colspan='+sp[1]:'')+(x.v||x.bg?(x.bg?' class="l"':''):' class="e"')+' style="'+st.join(";")+'">'+(x.v?esc(x.v):"")+'</td>';
    }
    h+="</tr>";
  }
  return '<article class="paper"><header class="lh"><img src="logo.jpg" alt="مؤسسة شمس الحكمة"></header>'+h+'</table></article>';
}
function empty(msg){doc.innerHTML='<div class="empty no-print"><p>'+msg+'</p></div>';$("printBtn").hidden=true}
function show(user){
  const c=coms.find(x=>x.id===sel.c.value),t=sel.t.value,m=sel.m.value;
  if(!c||!t||!m){empty("ستظهر الوثيقة هنا بعد اختيار اللجنة ونوع الوثيقة والشهر.");return}
  const e=E.find(x=>x.c===c.id&&x.t===t&&x.s===m);
  doc.innerHTML=render(cache[m],e.a,e.b);
  printTitle=TYPE[t]+" - "+c.name+(fMonth.hidden?"":" - "+m);
  $("printBtn").hidden=false;
  history.replaceState(null,"","#"+new URLSearchParams({c:c.name,t:t,m:m}));
  if(user)doc.firstElementChild.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});
}

/* ---------- القوائم المنسدلة ---------- */
function opts(el,ph,list){
  el.innerHTML='<option value="">'+ph+'</option>'+list.map(([v,l])=>'<option value="'+esc(v)+'">'+esc(l)+'</option>').join("");
  el.disabled=!list.length;
}
function onCom(){
  const id=sel.c.value,ts=["plan","min"].filter(t=>E.some(e=>e.c===id&&e.t===t));
  opts(sel.t,id?"اختر نوع الوثيقة":"اختر اللجنة أولاً",ts.map(t=>[t,TYPE[t]]));
  if(ts.length===1)sel.t.value=ts[0];
  onType();
}
function onType(user){
  const id=sel.c.value,t=sel.t.value,ms=[...new Set(E.filter(e=>e.c===id&&e.t===t).map(e=>e.s))];
  opts(sel.m,t?"اختر الشهر":"اختر نوع الوثيقة أولاً",ms.map(m=>[m,m]));
  if(ms.length===1)sel.m.value=ms[0];
  fMonth.hidden=t==="plan"&&ms.length===1;   // الخطة ورقة واحدة: لا حاجة لاختيار الشهر
  show(user);
}
sel.c.onchange=()=>{onCom();show(true)};
sel.t.onchange=()=>onType(true);
sel.m.onchange=()=>show(true);

/* ---------- الطباعة ---------- */
$("printBtn").onclick=()=>window.print();
let old="";
addEventListener("beforeprint",()=>{old=document.title;if(printTitle)document.title=printTitle});
addEventListener("afterprint",()=>{document.title=old||C.TITLE});

/* ---------- البدء ---------- */
(async function(){
  $("siteTitle").textContent=C.TITLE;document.title=C.TITLE;
  empty("جارٍ تحميل البيانات…");
  try{
    const names=(await listSheets()).filter(n=>demo||!C.HIDE_SHEETS.includes(n));
    const r=await Promise.allSettled(names.map(loadSheet));
    const ok=r.filter(x=>x.status==="fulfilled").map(x=>x.value);
    if(!ok.length)throw (r[0]&&r[0].reason)||new Error("لا توجد أوراق لعرضها.");
    build(ok);
    if(!coms.length)throw new Error("لم يُعثر على لجان في الشيت. تأكد من عناوين اللجان.");
    if(demo){$("notice").hidden=false;$("notice").textContent="نسخة تجريبية: تُعرض بيانات الملف المرفوع. لربط الموقع بغوغل شيت مباشرة اتبع ملف README."}
    opts(sel.c,"اختر اللجنة",coms.map(c=>[c.id,c.name]));
    empty("ستظهر الوثيقة هنا بعد اختيار اللجنة ونوع الوثيقة والشهر.");
    const p=new URLSearchParams(location.hash.slice(1)),c=coms.find(x=>x.name===p.get("c"));
    if(c){sel.c.value=c.id;onCom();
      if([...sel.t.options].some(o=>o.value===p.get("t"))){sel.t.value=p.get("t");onType();
        if([...sel.m.options].some(o=>o.value===p.get("m"))){sel.m.value=p.get("m");show()}}}
  }catch(e){
    sel.c.innerHTML='<option value="">تعذّر التحميل</option>';
    $("status").hidden=false;$("status").textContent=e.message;empty("تعذّر تحميل البيانات.");
  }
})();
})();
