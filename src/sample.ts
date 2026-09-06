export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 360">
  <defs>
    <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8fc8ff"/>
      <stop offset="1" stop-color="#476dff"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g fill="none" stroke="#274a78" stroke-width="1" opacity=".45">
    <circle cx="260" cy="180" r="128"/>
    <circle cx="260" cy="180" r="88"/>
    <path d="M70 180H450M260 30V330"/>
  </g>
  <path d="M86 245C142 210 167 166 205 112" stroke="#5d93ff" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 12" fill="none"/>
  <g id="bird" filter="url(#softGlow)">
    <path d="M210 190C180 147 180 112 198 76C247 101 279 132 295 177C314 143 350 119 399 114C388 159 361 190 322 205C350 209 381 225 407 251C365 260 329 252 298 229C275 260 241 280 194 284C207 247 226 220 250 202C232 205 219 201 210 190Z" fill="url(#wing)"/>
    <path d="M250 202C273 190 289 181 295 177C306 190 315 199 322 205C309 214 301 222 298 229C281 218 265 209 250 202Z" fill="#f7fbff"/>
    <circle cx="327" cy="180" r="6" fill="#07111f"/>
    <path d="M339 185L366 193L340 201Z" fill="#f0b85a"/>
  </g>
  <g fill="#79baff">
    <circle cx="86" cy="245" r="5"/><circle cx="136" cy="213" r="4"/><circle cx="174" cy="165" r="4"/><circle cx="205" cy="112" r="5"/>
  </g>
</svg>`;
