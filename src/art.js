/* 原創簡筆插圖（viewBox 0 0 120 80） */
const EYE = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r + 1.4}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${r}" fill="#1b1b1b"/>`;
const ART = {
  boxfish: `<path d="M98 40 L114 28 L114 52 Z" fill="#e8c23a" stroke="#6b5310" stroke-width="1.5"/>
    <rect x="26" y="22" width="74" height="38" rx="14" fill="#f2d33f" stroke="#6b5310" stroke-width="1.8"/>
    <path d="M60 60 L66 70 L72 60" fill="#e8c23a" stroke="#6b5310" stroke-width="1.5"/>
    ${[[44, 34], [58, 30], [72, 34], [86, 30], [52, 46], [66, 48], [80, 46], [92, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#22201a"/>`).join('')}
    ${EYE(36, 34, 3)}<path d="M26 44 q-4 2 0 4" stroke="#6b5310" stroke-width="1.8" fill="none"/>`,
  clownfish: `<path d="M92 40 L112 26 L108 40 L112 54 Z" fill="#f07a1c" stroke="#222" stroke-width="1.6"/>
    <ellipse cx="58" cy="40" rx="38" ry="20" fill="#f6861f" stroke="#222" stroke-width="1.8"/>
    <path d="M44 21 Q49 40 44 59" stroke="#222" stroke-width="9" fill="none"/><path d="M44 21 Q49 40 44 59" stroke="#fff" stroke-width="6" fill="none"/>
    <path d="M70 22 Q76 40 70 58" stroke="#222" stroke-width="9" fill="none"/><path d="M70 22 Q76 40 70 58" stroke="#fff" stroke-width="6" fill="none"/>
    <path d="M50 21 Q60 8 76 22" fill="#f6861f" stroke="#222" stroke-width="1.6"/>
    ${EYE(30, 36, 3)}<path d="M21 45 q4 3 8 1" stroke="#222" stroke-width="1.5" fill="none"/>`,
  dolphin: `<path d="M8 46 Q18 40 30 40 Q46 24 76 28 Q100 32 106 44 L116 34 L114 50 L118 62 L104 54 Q84 60 56 56 Q36 54 24 48 Q14 50 8 46Z" fill="#8aa3b5" stroke="#3b5263" stroke-width="1.8"/>
    <path d="M30 47 Q56 54 92 50" stroke="#dfe8ee" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M62 28 Q70 10 80 12 Q74 20 76 29Z" fill="#7891a3" stroke="#3b5263" stroke-width="1.6"/>
    <path d="M58 52 Q62 64 70 66 Q66 58 68 52" fill="#7891a3" stroke="#3b5263" stroke-width="1.4"/>${EYE(32, 41, 2)}`,
  shark: `<path d="M6 44 Q20 32 46 32 Q78 30 98 38 L114 20 L110 42 L116 62 L98 48 Q74 58 44 56 Q18 54 6 44Z" fill="#8b98a3" stroke="#39434b" stroke-width="1.8"/>
    <path d="M10 46 Q30 54 60 54 Q84 54 96 47 Q76 50 44 49 Q22 48 10 46Z" fill="#f2f4f5"/>
    <path d="M50 32 L62 8 L70 33Z" fill="#7c8994" stroke="#39434b" stroke-width="1.6"/>
    <path d="M50 54 L60 70 L64 54Z" fill="#7c8994" stroke="#39434b" stroke-width="1.4"/>
    <path d="M34 38 v10 M38 37 v11 M42 37 v11" stroke="#39434b" stroke-width="1.3"/>
    ${EYE(22, 39, 2)}<path d="M10 47 L22 48 L13 50" fill="#fff" stroke="#39434b" stroke-width="1"/>`,
  seal: `<path d="M14 54 Q12 38 30 32 Q44 28 60 36 Q84 46 104 50 L116 42 L114 58 L100 58 Q70 62 40 60 Q18 62 14 54Z" fill="#a7a299" stroke="#4f4a42" stroke-width="1.8"/>
    ${[[50, 42], [62, 46], [74, 50], [86, 52], [56, 54], [70, 56], [42, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#5f5a51"/>`).join('')}
    <path d="M48 58 Q46 70 56 70 Q56 62 58 59" fill="#958f86" stroke="#4f4a42" stroke-width="1.4"/>
    ${EYE(26, 40, 2.8)}<circle cx="16" cy="45" r="2.2" fill="#2b2925"/><path d="M14 48 l-6 2 M14 49 l-6 5 M17 49 l-3 6" stroke="#4f4a42" stroke-width="1"/>`,
  humpback: `<path d="M4 40 Q10 28 34 28 Q70 26 96 38 L112 26 L110 42 L116 56 L96 46 Q70 58 34 56 Q8 54 4 40Z" fill="#33536d" stroke="#1b2f3f" stroke-width="1.8"/>
    <path d="M8 46 Q30 56 60 54" stroke="#cfdde8" stroke-width="1.6" fill="none"/><path d="M10 50 Q30 58 56 57" stroke="#cfdde8" stroke-width="1.4" fill="none"/>
    <path d="M40 52 Q46 72 70 76 Q60 66 54 52Z" fill="#e6edf2" stroke="#1b2f3f" stroke-width="1.4"/>
    <path d="M78 33 l6 -6 l3 8Z" fill="#33536d" stroke="#1b2f3f" stroke-width="1.2"/>
    ${[14, 20, 28].map(x => `<circle cx="${x}" cy="33" r="1.5" fill="#9fb4c4"/>`).join('')}${EYE(22, 40, 1.8)}`,
  jelly: `<path d="M30 40 Q30 10 60 10 Q90 10 90 40 Q84 44 78 40 Q72 44 66 40 Q60 44 54 40 Q48 44 42 40 Q36 44 30 40Z" fill="#f2a7c8" fill-opacity=".85" stroke="#a24a77" stroke-width="1.8"/>
    <path d="M42 20 Q50 14 58 16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
    ${[38, 48, 58, 68, 78].map((x, i) => `<path d="M${x} 42 q${i % 2 ? 6 : -6} 8 0 16 q${i % 2 ? -6 : 6} 8 0 16" stroke="#c45f93" stroke-width="2" fill="none"/>`).join('')}
    <path d="M54 42 q-2 14 4 26 M64 42 q4 14 -2 28" stroke="#e7c2d6" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  urchin: `${Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2, r1 = 18, r2 = 34; return `<line x1="${60 + Math.cos(a) * r1}" y1="${44 + Math.sin(a) * r1 * .8}" x2="${60 + Math.cos(a) * r2}" y2="${44 + Math.sin(a) * r2 * .8}" stroke="#4a2a6b" stroke-width="2.2" stroke-linecap="round"/>`; }).join('')}
    <ellipse cx="60" cy="46" rx="22" ry="17" fill="#6b3f96" stroke="#3a1f55" stroke-width="1.8"/><ellipse cx="54" cy="40" rx="6" ry="3" fill="#9a77bd"/>
    <path d="M10 70 Q40 62 60 66 Q86 70 112 64 L112 80 L10 80Z" fill="#c9a86b" opacity=".6"/>`,
  orca: `<path d="M4 42 Q12 30 36 30 Q70 28 96 38 L112 24 L110 42 L116 58 L96 46 Q72 58 36 56 Q8 54 4 42Z" fill="#1d1f22" stroke="#000" stroke-width="1.5"/>
    <path d="M60 30 L66 4 L74 31Z" fill="#1d1f22" stroke="#000" stroke-width="1.4"/>
    <ellipse cx="26" cy="37" rx="7" ry="3" fill="#fff"/>
    <path d="M8 46 Q24 56 50 54 Q42 50 30 50 Q16 48 8 46Z" fill="#fff"/>
    <path d="M60 52 Q70 58 84 50 Q72 50 60 52Z" fill="#fff"/>
    <path d="M78 34 Q84 32 88 36 Q82 38 78 34Z" fill="#c9ced3"/>
    <path d="M38 54 Q40 68 52 72 Q48 62 48 54Z" fill="#1d1f22" stroke="#000" stroke-width="1.2"/>`,
  penguin: `<ellipse cx="60" cy="44" rx="22" ry="30" fill="#1f2328" stroke="#000" stroke-width="1.5"/>
    <ellipse cx="60" cy="50" rx="14" ry="22" fill="#fbfbf7"/><circle cx="60" cy="20" r="13" fill="#1f2328"/>
    <ellipse cx="60" cy="26" rx="8" ry="6" fill="#fbfbf7"/>
    <path d="M58 22 L70 25 L58 28Z" fill="#f29a2e" stroke="#9a5a12" stroke-width="1"/>${EYE(56, 18, 1.6)}
    <path d="M38 36 Q28 52 34 64 Q40 52 42 42Z" fill="#1f2328"/><path d="M82 36 Q92 52 86 64 Q80 52 78 42Z" fill="#1f2328"/>
    <path d="M50 74 l-8 3 h12Z M70 74 l8 3 h-12Z" fill="#f29a2e" stroke="#9a5a12" stroke-width="1"/>`,
  puffer: `${Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2; return `<line x1="${58 + Math.cos(a) * 25}" y1="${40 + Math.sin(a) * 25}" x2="${58 + Math.cos(a) * 31}" y2="${40 + Math.sin(a) * 31}" stroke="#7a6a2b" stroke-width="1.8" stroke-linecap="round"/>`; }).join('')}
    <path d="M84 40 L104 28 L100 40 L104 52Z" fill="#e4d58c" stroke="#7a6a2b" stroke-width="1.5"/>
    <circle cx="58" cy="40" r="26" fill="#efe1a0" stroke="#7a6a2b" stroke-width="1.8"/>
    <path d="M34 46 Q58 70 82 46 Q58 58 34 46Z" fill="#fffbe8"/>
    ${[[64, 26], [72, 32], [56, 22], [74, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#8a7a3a"/>`).join('')}
    ${EYE(42, 34, 3.4)}<ellipse cx="32" cy="42" rx="3" ry="2.4" fill="#c46b5a"/>`,
  crab: `<g stroke="#4b1f4f" stroke-width="2.2" stroke-linecap="round">${[-1, 1].map(s => [0, 1, 2].map(k => `<path d="M${60 + s * 18} ${50 + k * 5} q${s * 14} ${2 + k * 2} ${s * 22} ${14 + k * 3}" fill="none"/>`).join('')).join('')}</g>
    <path d="M42 40 Q30 26 22 30 Q14 26 16 18 Q24 20 26 26 Q30 20 36 22 Q40 30 46 38" fill="#8a3f8f" stroke="#4b1f4f" stroke-width="1.6"/>
    <path d="M78 40 Q90 26 98 30 Q106 26 104 18 Q96 20 94 26 Q90 20 84 22 Q80 30 74 38" fill="#8a3f8f" stroke="#4b1f4f" stroke-width="1.6"/>
    <ellipse cx="60" cy="50" rx="24" ry="15" fill="#9b4ea0" stroke="#4b1f4f" stroke-width="1.8"/>
    <path d="M44 46 q4 -3 8 0 M56 44 q4 -3 8 0 M68 46 q4 -3 8 0" stroke="#c99acd" stroke-width="1.6" fill="none"/>
    <line x1="54" y1="36" x2="52" y2="28" stroke="#4b1f4f" stroke-width="2"/><line x1="66" y1="36" x2="68" y2="28" stroke="#4b1f4f" stroke-width="2"/>${EYE(52, 27, 2)}${EYE(68, 27, 2)}`,
  seahorse: `<path d="M64 10 Q78 8 80 18 L94 20 L80 26 Q78 32 72 34 Q82 42 80 54 Q78 64 68 66 Q60 68 60 74 Q62 80 70 78 Q74 76 72 72" fill="none" stroke="#b5651d" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M64 10 Q78 8 80 18 L94 20 L80 26 Q78 32 72 34 Q82 42 80 54 Q78 64 68 66 Q60 68 60 74 Q62 80 70 78 Q74 76 72 72" fill="none" stroke="#f0a04b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M58 36 Q50 44 60 50" stroke="#e8c27a" stroke-width="3" fill="none"/>
    <path d="M64 8 l-2 -6 l5 4 l2 -5 l2 6" stroke="#b5651d" stroke-width="1.6" fill="none"/>${EYE(72, 17, 2)}
    <path d="M24 80 Q30 50 22 20 M34 80 Q42 56 38 30" stroke="#5aa05a" stroke-width="3" fill="none"/>`,
  turtle: `<path d="M86 38 Q100 30 106 40 Q100 50 86 44Z" fill="#9ccf7a" stroke="#3e6b2a" stroke-width="1.6"/>
    <path d="M34 26 Q20 12 8 16 Q14 28 32 34Z M34 56 Q22 72 10 70 Q16 58 32 50Z M74 28 Q86 16 92 22 Q86 30 76 34Z M74 54 Q86 66 92 60 Q86 52 76 48Z" fill="#9ccf7a" stroke="#3e6b2a" stroke-width="1.6"/>
    <ellipse cx="56" cy="41" rx="32" ry="20" fill="#5f8f3e" stroke="#33561f" stroke-width="2"/>
    <path d="M56 24 L66 32 L62 44 L50 44 L46 32Z M46 32 L30 34 M66 32 L82 34 M62 44 L74 54 M50 44 L38 54 M56 24 V21" stroke="#c9dca0" stroke-width="1.6" fill="none"/>${EYE(100, 38, 1.8)}`,
  ray: `<path d="M60 14 Q74 28 110 40 Q76 48 62 60 Q58 62 56 60 Q44 48 10 40 Q46 28 60 14Z" fill="#a08870" stroke="#4e3c2b" stroke-width="1.8"/>
    <path d="M58 58 Q60 70 76 78" stroke="#4e3c2b" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M66 70 l5 -1 l-2 4" fill="#4e3c2b"/>
    ${[[46, 34], [70, 34], [54, 44], [66, 44], [38, 40], [80, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#6c5644"/>`).join('')}${EYE(54, 26, 1.8)}${EYE(66, 26, 1.8)}`,
  squid: `<path d="M60 4 L74 18 L68 18 Q72 34 70 48 L50 48 Q48 34 52 18 L46 18Z" fill="#e9a07f" stroke="#8a4630" stroke-width="1.8"/>
    ${[48, 53, 58, 63, 68, 72].map((x, i) => `<path d="M${x} 48 q${i % 2 ? 3 : -3} 10 ${i % 2 ? -1 : 1} 20" stroke="#d98864" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}
    <path d="M52 48 q-8 16 -16 28 M68 48 q8 16 16 28" stroke="#d98864" stroke-width="2" fill="none"/>
    ${[[58, 24], [63, 32], [56, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#b4573b"/>`).join('')}${EYE(53, 44, 2.6)}${EYE(67, 44, 2.6)}`,
  kelp: `<path d="M10 80 Q50 74 110 80Z" fill="#c9a86b" opacity=".6"/>
    ${[[30, '#3f7d3a'], [58, '#4f9446'], [86, '#3f7d3a']].map(([x, c], i) => `<path d="M${x} 80 Q${x - 8} 60 ${x} 44 Q${x + 8} 28 ${x} 6" stroke="${c}" stroke-width="3" fill="none"/>
      ${[18, 34, 50, 64].map((y, k) => `<path d="M${x} ${y + i * 3} q${k % 2 ? 14 : -14} -2 ${k % 2 ? 18 : -18} -10 q${k % 2 ? -6 : 6} 8 ${k % 2 ? -18 : 18} 10Z" fill="${c}" opacity=".9"/>`).join('')}<circle cx="${x + (i % 2 ? -4 : 4)}" cy="${30 + i * 8}" r="2.6" fill="#a3c96a"/>`).join('')}`,
  plankton: `${[[30, 30, 12], [64, 24, 9], [90, 44, 13], [44, 58, 10], [76, 64, 7]].map(([x, y, r], i) => i % 2 ?
    `<g transform="translate(${x} ${y})"><path d="M${-r} 0 L0 ${-r * .6} L${r} 0 L0 ${r * .6}Z" fill="#9fd29a" stroke="#3d7a3a" stroke-width="1.4"/><line x1="${-r * .6}" y1="0" x2="${r * .6}" y2="0" stroke="#3d7a3a"/></g>` :
    `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#b9e3a6" stroke="#3d7a3a" stroke-width="1.4"/>${Array.from({ length: 8 }, (_, k) => `<line x1="0" y1="0" x2="${Math.cos(k * .785) * r * .8}" y2="${Math.sin(k * .785) * r * .8}" stroke="#3d7a3a" stroke-width=".8"/>`).join('')}</g>`).join('')}
    <circle cx="104" cy="16" r="9" fill="none" stroke="var(--muted)" stroke-width="2"/><line x1="110" y1="22" x2="116" y2="28" stroke="var(--muted)" stroke-width="3"/>`,
  person: `<circle cx="60" cy="22" r="12" fill="#f6d7b8" stroke="#7a5a3a" stroke-width="1.5"/><path d="M40 72 Q40 40 60 38 Q80 40 80 72Z" fill="var(--sea)"/>`
};
function art(k, label) { return `<svg viewBox="0 0 120 80" role="img" aria-label="${label || ''}"><rect width="120" height="80" rx="10" fill="var(--sea-soft)"/>${ART[k] || ''}</svg>`; }
