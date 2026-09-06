import type { MotionOptions } from './animator';
import type { MotionSpec } from './motion-spec';

function escapeScript(value: string): string {
  return value.replaceAll('</script>', '<\\/script>');
}

export function buildStandaloneHtml(
  svgMarkup: string,
  options: MotionOptions,
  motionSpec: MotionSpec | null = null,
): string {
  const optionsPayload = escapeScript(JSON.stringify(options));
  const specPayload = escapeScript(JSON.stringify(motionSpec));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Animated SVG</title>
<style>
  html,body{margin:0;min-height:100%;background:#08111f;color:#fff;font-family:Inter,system-ui,sans-serif}
  body{display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
  .stage{width:min(900px,100%);aspect-ratio:16/10;display:grid;place-items:center;background:#0b172b;border:1px solid #29466f;border-radius:24px;overflow:hidden}
  svg{width:88%;height:88%;overflow:visible}
  [data-animator-target="true"]{transform-box:fill-box;transform-origin:center}
</style>
</head>
<body>
  <div class="stage">${svgMarkup}</div>
<script>
const options=${optionsPayload};
const motionSpec=${specPayload};
const svg=document.querySelector('svg');
const elements=[...svg.querySelectorAll('[data-animator-target="true"]')];
const duration=Math.max(.15,options.duration)*1000;
const iterations=options.loop?Infinity:1;
function cssEase(value){
  const map={
    'none':'linear','linear':'linear','sine.in':'ease-in','sine.out':'ease-out','sine.inOut':'ease-in-out',
    'power1.in':'ease-in','power1.out':'ease-out','power1.inOut':'ease-in-out',
    'power2.in':'cubic-bezier(.55,.085,.68,.53)','power2.out':'cubic-bezier(.25,.46,.45,.94)',
    'power2.inOut':'cubic-bezier(.455,.03,.515,.955)','back.out':'cubic-bezier(.175,.885,.32,1.275)'
  };
  return map[value]||'ease-in-out';
}
function reveal(){elements.forEach((el,i)=>el.animate([{opacity:0,transform:'scale('+(1-options.intensity*.16)+')'},{opacity:1,transform:'scale(1)'}],{duration,delay:i*Math.min(80,duration/Math.max(elements.length,8)),easing:'cubic-bezier(.2,.8,.2,1)',fill:'both',iterations}));}
function floatMotion(){const amp=4+options.intensity*18;elements.forEach((el,i)=>el.animate([{transform:'translateY(0) rotate(0deg)'},{transform:'translateY('+((i%2?1:-1)*amp)+'px) rotate('+((i%3-1)*(0.5+options.intensity*2.5))+'deg)'},{transform:'translateY(0) rotate(0deg)'}],{duration:duration*2,delay:i*35,easing:'ease-in-out',iterations}));}
function drawPreset(){elements.forEach((el,i)=>{if(typeof el.getTotalLength!=='function')return;const len=Math.max(1,el.getTotalLength());const fill=el.getAttribute('fill')||getComputedStyle(el).fill;const stroke=el.getAttribute('stroke')||getComputedStyle(el).stroke;el.style.stroke=stroke&&stroke!=='none'?stroke:fill;el.style.strokeDasharray=String(len);el.style.strokeDashoffset=String(len);el.style.fillOpacity='0';el.animate([{strokeDashoffset:len,fillOpacity:0},{strokeDashoffset:0,fillOpacity:0,offset:.72},{strokeDashoffset:0,fillOpacity:fill&&fill!=='none'?1:0}],{duration,delay:i*Math.min(70,duration/Math.max(elements.length,10)),easing:'ease-in-out',fill:'forwards',iterations});});}
function transformFor(effect,values){
  if(effect==='translate')return 'translate('+(values.x||0)+'px,'+(values.y||0)+'px)';
  if(effect==='rotate')return 'rotate('+(values.rotation||0)+'deg)';
  if(effect==='scale'||effect==='pulse')return 'scale('+(values.scale==null?1:values.scale)+')';
  return 'none';
}
function animateDraw(el,track,specIterations){
  if(typeof el.getTotalLength!=='function')return;
  const len=Math.max(1,el.getTotalLength());
  const fill=el.getAttribute('fill')||getComputedStyle(el).fill;
  const stroke=el.getAttribute('stroke')||getComputedStyle(el).stroke;
  el.style.stroke=stroke&&stroke!=='none'?stroke:fill;
  el.style.strokeDasharray=String(len);
  el.style.fillOpacity='0';
  el.animate([
    {strokeDashoffset:len,fillOpacity:0},
    {strokeDashoffset:0,fillOpacity:0,offset:.72},
    {strokeDashoffset:0,fillOpacity:fill&&fill!=='none'?1:0}
  ],{
    duration:Math.max(120,track.duration*1000),delay:Math.max(0,track.delay*1000),
    easing:cssEase(track.ease),fill:'both',iterations:specIterations,
    direction:track.yoyo?'alternate':'normal'
  });
}
function animateSpec(spec){
  const specIterations=spec.loop?Infinity:1;
  spec.tracks.forEach(track=>{
    const id=String(track.target||'').replace(/^#/,'');
    if(!id)return;
    const el=document.getElementById(id);
    if(!el||!svg.contains(el))return;
    if(track.effect==='draw'){animateDraw(el,track,specIterations);return;}
    const from=track.from||{};const to=track.to||{};
    const fromFrame={};const toFrame={};
    if(track.effect==='opacity'){
      fromFrame.opacity=from.opacity==null?1:from.opacity;
      toFrame.opacity=to.opacity==null?1:to.opacity;
    }else if(track.effect==='pulse'){
      fromFrame.transform=transformFor(track.effect,from);
      toFrame.transform=transformFor(track.effect,to);
      fromFrame.opacity=from.opacity==null?1:from.opacity;
      toFrame.opacity=to.opacity==null?1:to.opacity;
    }else{
      fromFrame.transform=transformFor(track.effect,from);
      toFrame.transform=transformFor(track.effect,to);
    }
    el.animate([fromFrame,toFrame],{
      duration:Math.max(120,track.duration*1000),delay:Math.max(0,track.delay*1000),
      easing:cssEase(track.ease),fill:'both',iterations:specIterations,
      direction:track.yoyo?'alternate':'normal'
    });
  });
}
if(motionSpec&&Array.isArray(motionSpec.tracks)&&motionSpec.tracks.length){animateSpec(motionSpec);}
else if(options.preset==='draw')drawPreset();else if(options.preset==='float')floatMotion();else reveal();
</script>
</body>
</html>`;
}

export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
