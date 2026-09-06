import type { MotionOptions } from './animator';

function escapeScript(value: string): string {
  return value.replaceAll('</script>', '<\\/script>');
}

export function buildStandaloneHtml(svgMarkup: string, options: MotionOptions): string {
  const payload = escapeScript(JSON.stringify(options));
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
</style>
</head>
<body>
  <div class="stage">${svgMarkup}</div>
<script>
const options=${payload};
const svg=document.querySelector('svg');
const elements=[...svg.querySelectorAll('[data-animator-target="true"]')];
const duration=Math.max(.15,options.duration)*1000;
const iterations=options.loop?Infinity:1;
function reveal(){elements.forEach((el,i)=>el.animate([{opacity:0,transform:'scale('+(1-options.intensity*.16)+')'},{opacity:1,transform:'scale(1)'}],{duration,delay:i*Math.min(80,duration/Math.max(elements.length,8)),easing:'cubic-bezier(.2,.8,.2,1)',fill:'both',iterations}));}
function floatMotion(){const amp=4+options.intensity*18;elements.forEach((el,i)=>el.animate([{transform:'translateY(0) rotate(0deg)'},{transform:'translateY('+((i%2?1:-1)*amp)+'px) rotate('+((i%3-1)*(0.5+options.intensity*2.5))+'deg)'},{transform:'translateY(0) rotate(0deg)'}],{duration:duration*2,delay:i*35,easing:'ease-in-out',iterations}));}
function draw(){elements.forEach((el,i)=>{if(typeof el.getTotalLength!=='function')return;const len=Math.max(1,el.getTotalLength());const fill=el.getAttribute('fill')||getComputedStyle(el).fill;const stroke=el.getAttribute('stroke')||getComputedStyle(el).stroke;el.style.stroke=stroke&&stroke!=='none'?stroke:fill;el.style.strokeDasharray=String(len);el.style.strokeDashoffset=String(len);el.style.fillOpacity='0';el.animate([{strokeDashoffset:len,fillOpacity:0},{strokeDashoffset:0,fillOpacity:0,offset:.72},{strokeDashoffset:0,fillOpacity:fill&&fill!=='none'?1:0}],{duration,delay:i*Math.min(70,duration/Math.max(elements.length,10)),easing:'ease-in-out',fill:'forwards',iterations});});}
if(options.preset==='draw')draw();else if(options.preset==='float')floatMotion();else reveal();
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
