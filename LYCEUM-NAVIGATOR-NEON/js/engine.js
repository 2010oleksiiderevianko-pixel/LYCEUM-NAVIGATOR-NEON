// Модель будівлі, пошук приміщень і маршрутизація (Dijkstra).
(function(){const LN=window.LN;
const LAT={a:'а',b:'в',e:'е',o:'о',p:'р',c:'с',x:'х',k:'к',m:'м',h:'н',t:'т',i:'і'};
LN.norm=s=>String(s||'').toLowerCase().replace(/[a-z]/g,c=>LAT[c]||c).replace(/кабінет|каб\.?|ауд\.?|аудиторія|кімната/g,'').replace(/[^0-9а-яіїєґ]/g,'');
const FL=id=>LN.FLOORS.find(F=>F.id===id);
LN.floorName=id=>{const F=FL(id);return F?LN.BUILDINGS.find(b=>b.id===F.b).name+' · '+F.level+' поверх':'Невідомий поверх'};
function build(){const nodes={},adj={},rooms=[],ents=[],geo={};const link=(u,v,w)=>{if(!nodes[u]||!nodes[v])return;(adj[u]=adj[u]||[]).push([v,w]);(adj[v]=adj[v]||[]).push([u,w])};
LN.FLOORS.forEach(F=>{const g=geo[F.id]={paths:[],links:[],zones:F.zones||[],rooms:[],ids:[]},id=s=>F.id+':'+s;
const add=(k,x,y,type,name)=>{const n={id:id(k),f:F.id,x,y,type,name:name||''};nodes[n.id]=n;g.ids.push(n.id);return n};
const edge=(a,b,thick)=>{if(!nodes[a]||!nodes[b])return;link(a,b,Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y));if(!thick)g.links.push([a,b])};
const chain=ids=>ids.forEach((v,i)=>{if(i)edge(ids[i-1],v,true)});
const main=F.corr.map((p,i)=>add('c'+i,p[0],p[1],'pt').id);chain(main);g.paths.push(main);
(F.branches||[]).forEach((b,k)=>{const ids=b.pts.map((p,j)=>add('b'+k+':'+j,p[0],p[1],'pt').id),from=id(b.from);edge(from,ids[0],true);chain(ids);g.paths.push([from,...ids])});
Object.entries(F.exits||{}).forEach(([k,nm])=>{const n=nodes[id(k)];if(n){n.type='exit';n.name=nm}});
(F.stairs||[]).forEach(s=>{const n=add('s:'+s.n,s.x,s.y,'stairs',s.n);edge(n.id,id(s.to))});
(F.rooms||[]).forEach(r=>{const p=nodes[id(r.at)];if(!p)return;const gp=r.gap??1.8,w=r.w,h=r.h;let rx,ry,dx=p.x,dy=p.y;
if(r.side==='d'){rx=p.x+(r.ox||0)-w/2;ry=p.y+gp;dy=ry}else if(r.side==='u'){rx=p.x+(r.ox||0)-w/2;ry=p.y-gp-h;dy=p.y-gp}else if(r.side==='r'){rx=p.x+gp;ry=p.y+(r.oy||0)-h/2;dx=rx}else{rx=p.x-gp-w;ry=p.y+(r.oy||0)-h/2;dx=p.x-gp}
const n=add(r.n,dx,dy,'room',r.title||'Кабінет '+r.n);edge(n.id,p.id);const room={id:n.id,f:F.id,num:r.n,name:n.name,label:r.kind==='hall'?r.title:r.n,kind:r.kind||'room',rect:{x:rx,y:ry,w,h},note:r.note||'',verified:false};rooms.push(room);g.rooms.push(room);ents.push({id:n.id,name:n.name,value:n.name,f:F.id,keys:[LN.norm(r.n),LN.norm(n.name),...(r.alias||[]).map(LN.norm)]})});
g.ids.forEach(i=>{const n=nodes[i];if(n.type==='exit'||n.type==='stairs')ents.push({id:i,name:n.name,value:n.name+' · '+LN.floorName(F.id),f:F.id,keys:[LN.norm(n.name)]})});
});
LN.LINKS.forEach(([a,b])=>link(a,b,10));return{nodes,adj,rooms,ents,geo}}
const M=LN.M=build();
LN.find=q=>{const k=LN.norm(q);if(!k)return{err:'Введіть назву або номер приміщення.'};let m=M.ents.filter(e=>e.keys.includes(k)||LN.norm(e.value)===k);if(!m.length)m=M.ents.filter(e=>e.keys.some(x=>x.includes(k))||LN.norm(e.value).includes(k));if(m.length===1)return{ent:m[0]};if(!m.length)return{err:'Приміщення «'+q.trim()+'» не знайдено.'};return{err:'Уточніть запит: '+m.slice(0,5).map(e=>e.value).join('; ')+(m.length>5?'…':'')}};
LN.route=(a,b)=>{if(!M.nodes[a]||!M.nodes[b])return null;const d={},pv={},Q=new Set(Object.keys(M.nodes));Q.forEach(i=>d[i]=Infinity);d[a]=0;while(Q.size){let u=null;for(const i of Q)if(u===null||d[i]<d[u])u=i;if(u===null||d[u]===Infinity)break;Q.delete(u);if(u===b)break;for(const[v,w]of M.adj[u]||[])if(Q.has(v)&&d[u]+w<d[v]){d[v]=d[u]+w;pv[v]=u}}if(d[b]===Infinity)return null;const p=[];for(let c=b;c;c=pv[c])p.unshift(c);return{path:p,len:d[b]}};
LN.steps=path=>{const out=[];let i=0;while(i<path.length){const f=M.nodes[path[i]].f;let j=i;while(j+1<path.length&&M.nodes[path[j+1]].f===f)j++;out.push({f,from:M.nodes[path[i]],to:M.nodes[path[j]],i,j});i=j+1}return out};
LN.level=f=>FL(f).level;LN.floor=FL;
})();