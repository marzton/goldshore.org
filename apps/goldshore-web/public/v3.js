/* ══ STARFIELD ══════════════════════════════ */
(function(){
  const c=document.getElementById('starfield');
  const ctx=c.getContext('2d');
  let W,H,stars=[],shooters=[];

  function resize(){ W=c.width=innerWidth; H=c.height=innerHeight; }

  function initStars(){
    stars=[];
    for(let i=0;i<240;i++){
      stars.push({
        x:Math.random()*W, y:Math.random()*H,
        r:Math.random()*1.1+0.1,
        o:Math.random()*0.55+0.08,
        f:Math.random()*0.018,
        p:Math.random()*Math.PI*2,
        hue: Math.random()<0.08 ? 'rgba(220,190,130,' :
             Math.random()<0.04 ? 'rgba(130,160,200,' : 'rgba(236,232,220,'
      });
    }
  }

  let t=0;
  function draw(){
    ctx.clearRect(0,0,W,H);
    t+=0.008;

    /* nebula wisps — warm, not cold */
    const g1=ctx.createRadialGradient(W*.65,H*.35,0,W*.65,H*.35,380);
    g1.addColorStop(0,'rgba(160,72,32,0.03)'); g1.addColorStop(1,'transparent');
    ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);

    const g2=ctx.createRadialGradient(W*.2,H*.7,0,W*.2,H*.7,260);
    g2.addColorStop(0,'rgba(100,80,60,0.025)'); g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);

    /* stars */
    stars.forEach(s=>{
      const fl=Math.sin(t*38*s.f+s.p)*0.25+0.75;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=s.hue+(s.o*fl)+')';
      ctx.fill();
    });

    /* shooters */
    if(shooters.length<2 && Math.random()<0.002){
      shooters.push({
        x:Math.random()*W, y:Math.random()*H*.4,
        vx:3.5+Math.random()*4, vy:1.2+Math.random()*2,
        len:70+Math.random()*80, life:1
      });
    }
    shooters=shooters.filter(s=>s.life>0);
    shooters.forEach(s=>{
      ctx.save();
      const gr=ctx.createLinearGradient(s.x,s.y,s.x-s.vx*s.len/5,s.y-s.vy*s.len/5);
      gr.addColorStop(0,`rgba(236,232,220,${s.life*.8})`);
      gr.addColorStop(1,'transparent');
      ctx.strokeStyle=gr; ctx.lineWidth=1.2;
      ctx.globalAlpha=s.life;
      ctx.beginPath(); ctx.moveTo(s.x,s.y);
      ctx.lineTo(s.x-s.vx*s.len/5,s.y-s.vy*s.len/5);
      ctx.stroke(); ctx.restore();
      s.x+=s.vx; s.y+=s.vy; s.life-=0.013;
    });

    ctx.globalAlpha=1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize',()=>{resize();initStars();});
  resize(); initStars(); draw();
})();

/* ══ PARALLAX ═══════════════════════════════ */
(function(){
  const pDeep=document.getElementById('pDeep');
  const pMid=document.getElementById('pMid');
  let ticking=false;

  window.addEventListener('scroll',()=>{
    if(!ticking){
      requestAnimationFrame(()=>{
        const sy=window.scrollY;
        if(pDeep) pDeep.style.transform=`translateY(${sy*0.12}px)`;
        if(pMid)  pMid.style.transform =`translateY(${sy*0.22}px)`;
        ticking=false;
      });
      ticking=true;
    }
  });
})();

/* ══ COORDINATES HUD — live scroll ══════════ */
(function(){
  const lat=document.getElementById('coordLat');
  const lng=document.getElementById('coordLng');
  const sec=document.getElementById('coordSec');
  if(!lat) return;

  const baseLat=40.7127;
  const baseLng=-74.006;

  let frame=0;
  function tick(){
    frame++;
    const sy=window.scrollY;
    const prog=sy/(document.body.scrollHeight-window.innerHeight);

    const la=baseLat+prog*0.02;
    const lo=baseLng-prog*0.01;

    const laD=Math.floor(la);
    const laM=Math.floor((la-laD)*60);
    const laS=Math.floor(((la-laD)*60-laM)*60);

    const loD=Math.floor(Math.abs(lo));
    const loM=Math.floor((Math.abs(lo)-loD)*60);
    const loS=Math.floor(((Math.abs(lo)-loD)*60-loM)*60);

    lat.textContent=`${laD}°${String(laM).padStart(2,'0')}′${String(laS).padStart(2,'0')}″N`;
    lng.textContent=`${loD}°${String(loM).padStart(2,'0')}′${String(loS).padStart(2,'0')}″W`;

    if(frame%60===0){
      const v=`GS·LAB·v2.${String(frame%99).padStart(2,'0')}`;
      sec.textContent=v;
    }

    requestAnimationFrame(tick);
  }
  tick();
})();

/* ══ RADAR ═══════════════════════════════════ */
(function(){
  const c=document.getElementById('radarCanvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height,cx=W/2,cy=H/2,R=W/2-2;
  let angle=0;

  const blips=[
    {a:0.8,r:0.55,sev:'h',sz:3},{a:2.1,r:0.72,sev:'m',sz:2.5},
    {a:3.7,r:0.38,sev:'m',sz:2.5},{a:4.9,r:0.82,sev:'l',sz:2},
    {a:1.4,r:0.90,sev:'l',sz:2},{a:5.5,r:0.60,sev:'h',sz:3},
  ];

  const col={
    h:'rgba(160,72,56,',
    m:'rgba(140,110,40,',
    l:'rgba(80,100,80,'
  };

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#06060a';
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill();

    [0.25,0.5,0.75,1].forEach(f=>{
      ctx.beginPath(); ctx.arc(cx,cy,R*f,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.04)';
      ctx.lineWidth=0.5; ctx.stroke();
    });

    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.stroke();

    for(let i=0;i<20;i++){
      const f=i/20;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,R,angle-f*0.45,angle-(f+0.05)*0.45);
      ctx.closePath();
      ctx.fillStyle=`rgba(160,72,32,${0.065*(1-f)})`;
      ctx.fill();
    }

    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(angle)*R,cy+Math.sin(angle)*R);
    ctx.strokeStyle='rgba(160,72,32,0.55)'; ctx.lineWidth=1; ctx.stroke();

    blips.forEach(b=>{
      const bx=cx+Math.cos(b.a)*R*b.r;
      const by=cy+Math.sin(b.a)*R*b.r;
      const pulse=(Math.sin(Date.now()*0.0018+b.a)+1)*0.5;

      ctx.beginPath(); ctx.arc(bx,by,b.sz+pulse*5,0,Math.PI*2);
      ctx.strokeStyle=col[b.sev]+`${0.22*(1-pulse)})`;
      ctx.lineWidth=0.8; ctx.stroke();

      ctx.beginPath(); ctx.arc(bx,by,b.sz,0,Math.PI*2);
      ctx.fillStyle=col[b.sev]+'0.85)'; ctx.fill();
    });

    ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2);
    ctx.fillStyle='rgba(160,72,32,0.6)'; ctx.fill();

    angle+=0.009;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══ PRICE CHART ═════════════════════════════ */
(function(){
  const canvas=document.getElementById('chartCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const pts=[]; let v=510;
  for(let i=0;i<60;i++){ v+=(Math.random()-0.455)*2.5; pts.push(v); }
  const mn=Math.min(...pts)-2,mx=Math.max(...pts)+2;
  const toY=v=>H-((v-mn)/(mx-mn))*(H-10)-5;
  const toX=i=>(i/(pts.length-1))*W;

  ctx.clearRect(0,0,W,H);

  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(61,107,74,0.14)');
  grad.addColorStop(1,'rgba(61,107,74,0)');
  ctx.beginPath();
  ctx.moveTo(toX(0),toY(pts[0]));
  pts.forEach((p,i)=>ctx.lineTo(toX(i),toY(p)));
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  ctx.fillStyle=grad; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(toX(0),toY(pts[0]));
  pts.forEach((p,i)=>ctx.lineTo(toX(i),toY(p)));
  ctx.strokeStyle='rgba(61,107,74,0.75)';
  ctx.lineWidth=1.2; ctx.stroke();

  const lx=toX(pts.length-1),ly=toY(pts[pts.length-1]);
  ctx.beginPath(); ctx.arc(lx,ly,2.5,0,Math.PI*2);
  ctx.fillStyle='rgba(61,107,74,0.9)'; ctx.fill();
})();

/* ══ HOVER GLOW on buttons ═══════════════════ */
document.querySelectorAll('.btn-hero-primary,.btn-primary,.btn-form,.btn-cta').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const x=e.clientX-r.left, y=e.clientY-r.top;
    btn.style.setProperty('--mx',x+'px');
    btn.style.setProperty('--my',y+'px');
  });
});

/* ══ REVEAL OBSERVER ═════════════════════════ */
const io=new IntersectionObserver(
  es=>es.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible');}),
  {threshold:0.08}
);
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ══ MODAL ═══════════════════════════════════ */
function openModal()  { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal').addEventListener('click',function(e){ if(e.target===this) closeModal(); });
