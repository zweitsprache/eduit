/* eduit-tutorial.jsx — scenes for the Edu-It Editor tutorial motion piece.
   Skeleton-wireframe UI, dazit design tokens. All motion from useScene(). */

const { SceneStage, useScene, Easing: E, clamp } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakToggle } = window;

const W = 1920, H = 1080;
const FONT = '"Encode Sans Semi Condensed", Arial, sans-serif';
const C = {
  navy: '#15172c', muted: '#777988', faint: '#8a8c98', line: '#d5d6dc',
  orange: '#cc6600', orangeH: '#b35a00', soft: '#f7f7f6', page: '#ffffff',
  desk: '#eceef1', skel: '#e4e5ec', skelD: '#d3d5df', skelL: '#f0f1f5',
  err: '#b42318', ok: '#027a48',
  tBlue: '#dcebf8', tBlueInk: '#2a71b9', tGreen: '#dff2e8', tGreenInk: '#269266',
  tOrange: '#fde4c3', tOrangeInk: '#c76400', tLav: '#ece6f8', tLavInk: '#5b4387',
  tYellow: '#f7efc9', tYellowInk: '#7b6600', tPeach: '#f7e2d7', tPeachInk: '#98451e',
};

/* ── three motion helpers — no easing or transform outside these ───────── */
const ph = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const MOTION = {
  enter: (t, dist = 26) => {
    const e = E.easeOutCubic(clamp(t, 0, 1));
    return { opacity: e, y: (1 - e) * dist };
  },
  draw: (t) => E.easeInOutCubic(clamp(t, 0, 1)),
  pop: (t) => 0.94 + 0.06 * E.easeOutBack(clamp(t, 0, 1)),
};

/* ── skeleton primitives ──────────────────────────────────────────────── */
const Bar = ({ w, h = 14, r = 4, tone = C.skel, style }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: tone, flex: 'none', ...style }}></div>
);
const Rows = ({ widths, h = 13, gap = 13, tone = C.skel, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
    {widths.map((w, i) => <Bar key={i} w={w} h={h} tone={tone} />)}
  </div>
);
const Chip = ({ w = 54, h = 26, tone = C.skel }) => <Bar w={w} h={h} r={999} tone={tone} />;
const Label = ({ children, size = 13, color = C.muted, weight = 700, style }) => (
  <div style={{ font: `${weight} ${size}px/1.2 ${FONT}`, color, letterSpacing: '.07em', textTransform: 'uppercase', ...style }}>{children}</div>
);

function Cursor({ x, y, down = 0, opacity = 1 }) {
  if (window.OM_CURSOR === false) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity, zIndex: 90, filter: 'drop-shadow(0 8px 16px rgba(21,23,44,.30))' }}>
      <svg width="40" height="46" viewBox="0 0 24 27" style={{ display: 'block', transform: `scale(${1 - 0.1 * down})`, transformOrigin: '4px 3px' }}>
        <path d="M4 3 L4 22 L9.3 17 L12.8 25 L16.6 23.3 L13.1 15.5 L20.4 15 Z" fill="#fff" stroke={C.navy} strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
      {down > 0.01 && (
        <div style={{
          position: 'absolute', left: -18, top: -16, width: 44, height: 44, borderRadius: '50%',
          border: `2px solid ${C.orange}`, opacity: 0.85 * (1 - down), transform: `scale(${0.4 + down * 1.4})`,
        }}></div>
      )}
    </div>
  );
}

function Caption({ text, show = 1, out = 0, sub }) {
  const m = MOTION.enter(show, 18);
  const vis = m.opacity * (1 - MOTION.draw(out));
  return (
    <div style={{
      position: 'absolute', left: 104, bottom: 92, zIndex: 80,
      opacity: vis, transform: `translateY(${m.y}px)`,
    }}>
      <div style={{ width: 96 * clamp(show * 1.4, 0, 1), height: 4, background: C.orange, marginBottom: 22 }}></div>
      <div style={{ font: `800 62px/1.05 ${FONT}`, letterSpacing: '-.035em', color: C.navy }}>{text}</div>
      {sub && <div style={{ marginTop: 12, font: `500 26px/1.3 ${FONT}`, color: C.muted }}>{sub}</div>}
    </div>
  );
}

function Lockup({ w = 520, rule = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <img src="assets/logo-eduit.svg" alt="eduit" style={{ width: w, display: 'block' }} />
      <div style={{ width: w * rule, height: 4, background: C.orange }}></div>
    </div>
  );
}

const Cam = ({ s = 1, x = 0, y = 0, ox = '50%', oy = '50%', children }) => (
  <div style={{ position: 'absolute', inset: 0, transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: `${ox} ${oy}` }}>{children}</div>
);

/* Office-style ribbon: tab strip + grouped controls with group labels */
function RibbonBtn({ w = 22, h = 22, tone = C.skel, r = 4 }) {
  return <Bar w={w} h={h} r={r} tone={tone} />;
}
function RibbonGroup({ label = 62, children, last = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', height: 68, borderRight: last ? 'none' : `1px solid ${C.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>{children}</div>
      <Bar w={label} h={7} r={2} tone={C.skelL} style={{ marginBottom: 2 }} />
    </div>
  );
}
function Ribbon() {
  const bigBtn = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <Bar w={28} h={28} r={5} tone={C.skelD} />
      <Bar w={30} h={6} r={2} tone={C.skel} />
    </div>
  );
  const stack = (n, w = 20) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {Array.from({ length: n }).map((_, i) => <Bar key={i} w={w} h={13} r={3} tone={C.skel} />)}
    </div>
  );
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, background: '#fff' }}>
      {/* tab strip */}
      <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 18px', background: C.soft, borderBottom: `1px solid ${C.line}` }}>
        {[46, 34, 52, 40, 58, 44, 36].map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 14px', height: i === 2 ? 30 : 26, borderRadius: '6px 6px 0 0',
            background: i === 2 ? '#fff' : 'transparent',
            border: i === 2 ? `1px solid ${C.line}` : 'none', borderBottom: i === 2 ? '1px solid #fff' : 'none',
            marginBottom: i === 2 ? -1 : 0,
          }}>
            <Bar w={w} h={8} r={2} tone={i === 2 ? C.skelD : C.skel} />
          </div>
        ))}
      </div>
      {/* ribbon body */}
      <div style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <RibbonGroup label={54}>{bigBtn}{stack(3, 22)}</RibbonGroup>
        <RibbonGroup label={38}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Bar w={104} h={20} r={4} tone={C.skelL} style={{ border: `1px solid ${C.line}` }} />
              <Bar w={40} h={20} r={4} tone={C.skelL} style={{ border: `1px solid ${C.line}` }} />
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: 8 }).map((_, i) => <RibbonBtn key={i} w={20} h={20} tone={i === 0 ? C.skelD : C.skel} />)}
            </div>
          </div>
        </RibbonGroup>
        <RibbonGroup label={58}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1].map(r => (
              <div key={r} style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: 6 }).map((_, i) => <RibbonBtn key={i} w={20} h={20} tone={C.skel} />)}
              </div>
            ))}
          </div>
        </RibbonGroup>
        <RibbonGroup label={46}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 74, height: 44, border: `1px solid ${C.line}`, borderRadius: 4, background: '#fff',
              padding: 7, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center',
            }}>
              <Bar w={44} h={i === 0 ? 9 : 7} r={2} tone={C.skelD} />
              <Bar w={58} h={5} r={2} tone={C.skel} />
              <Bar w={50} h={5} r={2} tone={C.skel} />
            </div>
          ))}
        </RibbonGroup>
        <RibbonGroup label={44}>{bigBtn}{bigBtn}</RibbonGroup>
        <RibbonGroup label={40}>{stack(2, 26)}{bigBtn}</RibbonGroup>
        <RibbonGroup label={36} last>{stack(3, 24)}</RibbonGroup>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: 6, paddingRight: 14 }}>
          <RibbonBtn w={20} h={20} tone={C.skelL} /><RibbonBtn w={20} h={20} tone={C.skelL} />
        </div>
      </div>
    </div>
  );
}

/* ── generic word-processor window (scenes 1–3) ───────────────────────── */
function WordDoc({ imgDX = 0, imgDY = 0, imgRot = 0, lift = 0, reflow = 0, grid = 0, gridBreak = 0, wall = 0, guides = 0, popover = 0, wobble = 0 }) {
  const baseLines = [430, 470, 390, 452, 300];
  const jumble = (w, i) => w + reflow * [-120, 90, -60, 130, -150][i % 5] + wobble * [22, -34, 18, -26, 30][i % 5];
  const overflowPx = 96 * gridBreak;
  return (
    <div style={{
      position: 'absolute', left: 90, top: 66, width: W - 180, height: H - 132,
      background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 40px 90px rgba(21,23,44,.14)',
    }}>
      <div style={{ height: 52, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: C.soft }}>
        {[0, 1, 2].map(i => <Bar key={i} w={11} h={11} r={999} tone={C.skelD} />)}
        <Bar w={210} h={14} tone={C.skelD} style={{ marginLeft: 18 }} />
      </div>
      <Ribbon />
      <div style={{ position: 'absolute', inset: '160px 0 0 0', background: C.desk, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: 604, height: 854, marginTop: 40, background: '#fff',
          boxShadow: '0 18px 44px rgba(21,23,44,.13)', overflow: 'visible', padding: '56px 60px',
        }}>
          <Bar w={330} h={26} tone={C.skelD} />
          <Rows widths={baseLines.map((w, i) => jumble(w, i))} style={{ marginTop: 26 }} />
          {/* dragged picture box */}
          <div style={{
            position: 'absolute', left: 60 + imgDX, top: 230 + imgDY, width: 240, height: 156,
            background: C.tBlue, border: `1.5px dashed ${lift > 0.05 ? C.orange : C.skelD}`,
            transform: `rotate(${imgRot}deg)`, boxShadow: lift > 0.05 ? '0 22px 40px rgba(21,23,44,.20)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
          }}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={C.tBlueInk} strokeWidth="1.5" opacity=".7">
              <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M4 18l5-5 4 4 3-3 4 4" />
            </svg>
          </div>
          <Rows widths={[452, 404, 470].map((w, i) => jumble(w, i + 2))} style={{ marginTop: 214 + 96 * reflow }} />
          {guides > 0.01 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: guides }}>
              <div style={{ position: 'absolute', left: 60 + imgDX, top: -20, bottom: -20, borderLeft: `1.5px dashed ${C.tBlueInk}` }}></div>
              <div style={{ position: 'absolute', left: 300 + imgDX, top: -20, bottom: -20, borderLeft: `1.5px dashed ${C.tBlueInk}` }}></div>
              <div style={{ position: 'absolute', top: 230 + imgDY, left: -20, right: -20, borderTop: `1.5px dashed ${C.orange}` }}></div>
            </div>
          )}
          {popover > 0.01 && (
            <div style={{
              position: 'absolute', left: 312 + imgDX, top: 214 + imgDY, background: '#fff',
              border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: '0 14px 30px rgba(21,23,44,.18)',
              padding: 9, display: 'flex', flexDirection: 'column', gap: 7, opacity: popover,
              transform: `scale(${MOTION.pop(popover)})`, transformOrigin: '0 0', zIndex: 8,
            }}>
              <Bar w={52} h={7} r={2} tone={C.skelD} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => <Bar key={i} w={22} h={22} r={4} tone={i === 1 ? C.tOrange : C.skel} />)}
              </div>
            </div>
          )}
          {/* complex layout attempt: grid that misaligns and overflows */}
          {grid > 0.01 && (
            <div style={{ marginTop: 34, opacity: MOTION.draw(grid) }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Array.from({ length: 6 }).map((_, r) => (
                  <div key={r} style={{ display: 'flex', gap: 3, transform: `translateX(${gridBreak * (r % 2 ? 26 : -18) * (r / 2)}px)` }}>
                    {Array.from({ length: 8 }).map((_, c) => (
                      <div key={c} style={{
                        width: 58 + (c === 7 ? overflowPx : 0), height: 44,
                        border: `1px solid ${gridBreak > 0.5 && (r + c) % 5 === 0 ? C.err : C.skelD}`,
                        background: (r + c) % 7 === 0 ? C.skelL : '#fff',
                        transform: `rotate(${gridBreak * (c % 3 - 1) * 0.7}deg)`,
                      }}></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* margin / limit wall */}
          {wall > 0.01 && (
            <div style={{ position: 'absolute', left: 544, top: 0, bottom: -40, width: 3, background: C.err, opacity: 0.9 * MOTION.draw(wall) }}>
              <div style={{ position: 'absolute', left: 3, top: 0, bottom: 0, width: 200 * MOTION.draw(wall), background: 'repeating-linear-gradient(135deg, rgba(180,35,24,.14) 0 10px, rgba(180,35,24,0) 10px 20px)' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── worksheet element glyphs (skeleton) ─────────────────────────────── */
function MCQGlyph({ p = 1, solutions = 0, w = 520 }) {
  const pick = 2;
  return (
    <div style={{ width: w, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bar w={26} h={26} r={999} tone={C.tOrange} />
        <Bar w={w * 0.62} h={16} tone={C.skelD} />
      </div>
      {[0, 1, 2, 3].map(i => {
        const t = MOTION.draw(ph(p, 0.1 + i * 0.13, 0.36 + i * 0.13));
        const isSol = solutions > 0.3 && i === pick;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.25 + 0.75 * t, transform: `translateX(${(1 - t) * 18}px)` }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSol ? C.orange : C.skelD}`,
              background: isSol ? C.orange : '#fff', flex: 'none',
            }}></div>
            <Bar w={(w - 60) * [0.72, 0.55, 0.8, 0.48][i]} h={14} tone={isSol ? C.tOrange : C.skel} />
          </div>
        );
      })}
    </div>
  );
}

function WordGridGlyph({ p = 1, solutions = 0, cell = 46 }) {
  const n = 8;
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: n }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: n }).map((_, c) => {
            const idx = r * n + c;
            const t = MOTION.draw(ph(p, 0.05 + (idx / (n * n)) * 0.45, 0.2 + (idx / (n * n)) * 0.45));
            const onWord = r === c && c > 0 && c < 6;
            const found = solutions > 0.3 && onWord;
            return (
              <div key={c} style={{
                width: cell, height: cell, borderRadius: 3,
                background: found ? C.tOrange : C.skelL, border: `1px solid ${found ? C.orange : C.skel}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: t,
              }}>
                <Bar w={cell * 0.34} h={cell * 0.34} r={2} tone={found ? C.tOrangeInk : C.skelD} />
              </div>
            );
          })}
        </div>
      ))}
      <div style={{
        position: 'absolute', left: cell * 0.5, top: cell * 0.5, width: MOTION.draw(ph(p, 0.55, 0.9)) * cell * 5 * 1.414,
        height: cell * 0.86, borderRadius: 999, border: `3px solid ${C.orange}`, transformOrigin: '0 50%',
        transform: 'rotate(45deg) translateY(-50%)', opacity: 0.9,
      }}></div>
    </div>
  );
}

function DominoGlyph({ p = 1, tw = 150 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[0, 1].map(row => (
        <div key={row} style={{ display: 'flex', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => {
            const idx = row * 4 + i;
            const t = MOTION.draw(ph(p, 0.06 + idx * 0.075, 0.3 + idx * 0.075));
            return (
              <div key={i} style={{
                width: tw, height: 96, background: '#fff', border: `1.5px solid ${C.skelD}`, borderRadius: 6,
                display: 'flex', overflow: 'hidden', opacity: t, transform: `scale(${MOTION.pop(t)})`,
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.tGreen }}>
                  <Bar w={tw * 0.34} h={12} tone={C.tGreenInk} style={{ opacity: .55 }} />
                </div>
                <div style={{ width: 1.5, background: C.skelD }}></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bar w={tw * 0.3} h={12} tone={C.skelD} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CardsGlyph({ p = 1, cw = 148 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cw}px)`, gap: 16 }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const t = MOTION.draw(ph(p, 0.05 + i * 0.055, 0.28 + i * 0.055));
        const flip = MOTION.draw(ph(p, 0.5 + i * 0.035, 0.72 + i * 0.035));
        const back = flip > 0.5;
        return (
          <div key={i} style={{
            width: cw, height: cw * 0.72, borderRadius: 8, border: `1.5px solid ${C.skelD}`,
            background: back ? C.tLav : '#fff', opacity: t,
            transform: `perspective(700px) rotateY(${flip * 180}deg) scale(${MOTION.pop(t)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'column',
          }}>
            <div style={{ transform: back ? 'rotateY(180deg)' : 'none', display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
              <Bar w={cw * 0.5} h={11} tone={back ? C.tLavInk : C.skelD} style={{ opacity: back ? .5 : 1 }} />
              <Bar w={cw * 0.32} h={9} tone={back ? C.tLavInk : C.skel} style={{ opacity: back ? .35 : 1 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerbTableGlyph({ p = 1, w = 560 }) {
  const rows = 7;
  return (
    <div style={{ width: w, border: `1px solid ${C.skelD}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', background: C.tYellow, borderBottom: `1px solid ${C.skelD}` }}>
        {[0.34, 0.33, 0.33].map((f, i) => (
          <div key={i} style={{ flex: f, padding: '14px 16px', borderRight: i < 2 ? `1px solid ${C.skelD}` : 'none' }}>
            <Bar w={w * f * 0.5} h={12} tone={C.tYellowInk} style={{ opacity: .5 }} />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => {
        const t = MOTION.draw(ph(p, 0.08 + r * 0.09, 0.3 + r * 0.09));
        return (
          <div key={r} style={{ display: 'flex', borderBottom: r < rows - 1 ? `1px solid ${C.skel}` : 'none', background: r % 2 ? C.soft : '#fff' }}>
            {[0.34, 0.33, 0.33].map((f, i) => (
              <div key={i} style={{ flex: f, padding: '11px 16px', borderRight: i < 2 ? `1px solid ${C.skel}` : 'none' }}>
                <Bar w={w * f * (i === 0 ? 0.46 : 0.62) * (0.4 + 0.6 * t)} h={11} tone={i === 0 ? C.skelD : C.skel} style={{ opacity: 0.3 + 0.7 * t }} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const GLYPHS = { mcq: MCQGlyph, grid: WordGridGlyph, domino: DominoGlyph, cards: CardsGlyph, verb: VerbTableGlyph };

/* ── Edu-It editor shell (skeleton) ──────────────────────────────────── */
function PageBlock({ kind, p = 1, solutions = 0, selected = false, dense = 0 }) {
  const inner = () => {
    if (kind === 'heading') return <Bar w={300} h={22} tone={C.skelD} />;
    if (kind === 'text') return <Rows widths={[440, 470, 410, 452, 300 + 140 * dense].slice(0, 4 + Math.round(dense))} h={11} gap={11} />;
    if (kind === 'mcq') return <div style={{ transform: 'scale(.78)', transformOrigin: '0 0', height: 148 }}><MCQGlyph p={p} solutions={solutions} w={560} /></div>;
    if (kind === 'grid') return <div style={{ transform: 'scale(.52)', transformOrigin: '0 0', height: 210 }}><WordGridGlyph p={p} solutions={solutions} /></div>;
    if (kind === 'verb') return <div style={{ transform: 'scale(.8)', transformOrigin: '0 0', height: 300 }}><VerbTableGlyph p={p} w={560} /></div>;
    if (kind === 'domino') return <div style={{ transform: 'scale(.46)', transformOrigin: '0 0', height: 106 }}><DominoGlyph p={p} /></div>;
    return null;
  };
  return (
    <div style={{
      position: 'relative', padding: '10px 12px', margin: '0 -12px',
      outline: selected ? `2px solid ${C.orange}` : 'none', borderRadius: 4,
      background: selected ? 'rgba(204,102,0,.04)' : 'transparent',
    }}>{inner()}</div>
  );
}

function EditorShell({
  blocks = [], p = 1, selected = -1, solutions = 0, level = 0, dense = 0,
  palette = 0, paletteScroll = 0, download = 0, pageLift = 0, chromeIn = 1, spinner = 0,
}) {
  const cm = MOTION.draw(chromeIn);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.desk, overflow: 'hidden' }}>
      {/* toolbar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 76, background: 'rgba(255,255,255,.96)',
        borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18, zIndex: 30,
        transform: `translateY(${(1 - cm) * -76}px)`,
      }}>
        <img src="assets/logo-eduit.svg" alt="eduit" style={{ height: 26, display: 'block' }} />
        <Bar w={190} h={15} tone={C.skel} />
        <div style={{ display: 'flex', gap: 8, marginLeft: 26 }}>
          {Array.from({ length: 9 }).map((_, i) => <Bar key={i} w={i % 3 === 2 ? 44 : 30} h={30} r={6} tone={C.skelL} />)}
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 16px', borderRadius: 6,
          border: `1px solid ${solutions > 0.15 ? C.orange : C.line}`,
          color: solutions > 0.15 ? C.orange : C.muted, font: `600 16px/1 ${FONT}`,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></svg>
          Lösungsblatt
        </div>
        <div id="pdfbtn" style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 20px', borderRadius: 6,
          background: C.orange, color: '#fff', font: `700 17px/1 ${FONT}`,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round"><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></svg>
          PDF
        </div>
      </div>

      {/* left sidebar */}
      <div style={{
        position: 'absolute', left: 0, top: 76, bottom: 0, width: 320, background: '#fff',
        borderRight: `1px solid ${C.line}`, padding: 24, zIndex: 20,
        transform: `translateX(${(1 - cm) * -320}px)`,
      }}>
        <Label>Dokument</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {blocks.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 6,
              border: `1px solid ${i === selected ? C.orange : C.line}`, background: i === selected ? 'rgba(204,102,0,.05)' : '#fff',
            }}>
              <Bar w={26} h={26} r={5} tone={C.skel} />
              <Bar w={120 + (i % 3) * 30} h={11} tone={C.skelD} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 6, border: `1px dashed ${C.line}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 5, background: C.tOrange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.tOrangeInk, font: `700 18px/1 ${FONT}` }}>+</div>
            <Bar w={96} h={11} tone={C.skel} />
          </div>
        </div>
      </div>

      {/* right sidebar */}
      <div style={{
        position: 'absolute', right: 0, top: 76, bottom: 0, width: 360, background: '#fff',
        borderLeft: `1px solid ${C.line}`, padding: 26, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 26,
        transform: `translateX(${(1 - cm) * 360}px)`,
      }}>
        <div>
          <Label>Sprachniveau</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'].map((l, i) => (
              <div key={l} style={{
                padding: '7px 14px', borderRadius: 999, font: `600 15px/1 ${FONT}`,
                border: `1px solid ${i === level ? C.orange : C.line}`,
                background: i === level ? C.orange : '#fff', color: i === level ? '#fff' : C.muted,
              }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: `600 17px/1 ${FONT}`, color: C.navy }}>Lösungen anzeigen</div>
          <div style={{
            width: 52, height: 28, borderRadius: 999, background: solutions > 0.15 ? C.orange : C.skelD,
            position: 'relative', transition: 'none',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: 3 + 24 * MOTION.draw(clamp(solutions * 3, 0, 1)),
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
            }}></div>
          </div>
        </div>
        <div style={{ height: 1, background: C.line }}></div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Bar w={110 + i * 24} h={11} tone={C.skelD} />
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, j) => <Bar key={j} w={92} h={30} r={5} tone={C.skelL} />)}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bar w={200} h={11} tone={C.skel} />
          <Bar w={308} h={38} r={6} tone={C.skelL} />
        </div>
      </div>

      {/* canvas + A4 page */}
      <div style={{ position: 'absolute', left: 320, right: 360, top: 76, bottom: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: 620, height: 877, marginTop: 44, background: '#fff',
          boxShadow: `0 ${18 + 14 * pageLift}px ${44 + 26 * pageLift}px rgba(21,23,44,.13)`,
          padding: '58px 60px', display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          {blocks.map((b, i) => (
            <PageBlock key={i} kind={b.kind} p={b.p == null ? p : b.p} solutions={solutions} selected={i === selected} dense={dense} />
          ))}
          {spinner > 0.01 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: spinner }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%', border: `4px solid ${C.skel}`, borderTopColor: C.orange,
                transform: `rotate(${spinner * 900}deg)`,
              }}></div>
            </div>
          )}
        </div>
      </div>

      {/* block palette modal */}
      {palette > 0.01 && <BlockPalette open={palette} scroll={paletteScroll} />}

      {/* download card */}
      {download > 0.01 && <DownloadCard p={download} />}
    </div>
  );
}

function BlockPalette({ open, scroll }) {
  const o = MOTION.draw(open);
  const rows = ['mcq', 'grid', 'domino', 'cards', 'verb', 'text', 'mcq', 'grid', 'cards', 'verb', 'domino', 'text', 'mcq', 'grid'];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: `rgba(21,23,44,${0.42 * o})`, backdropFilter: `blur(${2 * o}px)`, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 1020, marginTop: 132, background: '#fff', borderRadius: 14, border: `1px solid ${C.line}`,
        boxShadow: '0 40px 90px rgba(21,23,44,.30)', overflow: 'hidden',
        opacity: o, transform: `translateY(${(1 - o) * -26}px) scale(${MOTION.pop(open)})`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 78, borderBottom: `1px solid ${C.line}` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
          <Bar w={230} h={13} tone={C.skel} />
          <div style={{ flex: 1 }}></div>
          <div style={{ font: `700 17px/1 ${FONT}`, color: C.orange }}>112 Elemente</div>
        </div>
        <div style={{ height: 470, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: -scroll * 640, display: 'flex', flexDirection: 'column' }}>
            {rows.map((k, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px',
                background: i === 4 && scroll > 0.62 ? 'rgba(204,102,0,.06)' : '#fff',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 9, border: `1px solid ${C.line}`, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bar w={22} h={22} r={4} tone={C.skelD} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  <Bar w={190 + (i % 4) * 46} h={13} tone={C.skelD} />
                  <Bar w={320 + (i % 3) * 90} h={10} tone={C.skel} />
                </div>
                <Chip w={92} h={24} tone={C.skelL} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 46, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px' }}>
          {[64, 52, 60].map((w, i) => <Bar key={i} w={w} h={9} tone={C.skelL} />)}
        </div>
      </div>
    </div>
  );
}

function DownloadCard({ p }) {
  const e = MOTION.draw(p);
  return (
    <div style={{
      position: 'absolute', right: 396, top: 116, zIndex: 70, width: 400, background: '#fff',
      border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 30px 70px rgba(21,23,44,.24)',
      padding: 20, display: 'flex', gap: 18, alignItems: 'center',
      opacity: e, transform: `translateX(${(1 - e) * 40}px)`,
    }}>
      <div style={{ width: 74, height: 100, background: '#fff', border: `1px solid ${C.line}`, padding: 9, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Bar w={40} h={5} tone={C.skelD} />
        {[46, 52, 38, 50].map((w, i) => <Bar key={i} w={w} h={3} tone={i % 2 ? C.tOrange : C.skel} />)}
        <Bar w={30} h={3} tone={C.tOrange} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ font: `700 20px/1.2 ${FONT}`, color: C.navy }}>Lösungsblatt.pdf</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `500 16px/1 ${FONT}`, color: C.ok }}>
          <span style={{ font: `700 18px/1 ${FONT}` }}>✓</span> Heruntergeladen
        </div>
      </div>
    </div>
  );
}

/* ── element mosaic (scenes 7–8) ──────────────────────────────────────── */
const MOSAIC_KINDS = ['mcq', 'grid', 'domino', 'cards', 'verb', 'text', 'rows', 'table'];
function MiniTile({ kind, tone }) {
  const body = () => {
    if (kind === 'grid') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3 }}>
        {Array.from({ length: 25 }).map((_, i) => <div key={i} style={{ paddingTop: '100%', background: C.skelL, border: `1px solid ${C.skel}` }}></div>)}
      </div>
    );
    if (kind === 'mcq') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${C.skelD}` }}></div>
            <Bar w={i === 1 ? 76 : 104} h={7} />
          </div>
        ))}
      </div>
    );
    if (kind === 'domino') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1].map(r => (
          <div key={r} style={{ display: 'flex', gap: 7 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 30, border: `1px solid ${C.skelD}`, borderRadius: 3, display: 'flex' }}>
                <div style={{ flex: 1, background: tone }}></div>
                <div style={{ flex: 1 }}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
    if (kind === 'cards') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ paddingTop: '70%', borderRadius: 3, background: i % 3 === 1 ? tone : '#fff', border: `1px solid ${C.skelD}` }}></div>)}
      </div>
    );
    if (kind === 'verb' || kind === 'table') return (
      <div style={{ border: `1px solid ${C.skelD}`, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: 15, background: tone }}></div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', height: 15, borderTop: `1px solid ${C.skel}` }}>
            <div style={{ flex: 1, borderRight: `1px solid ${C.skel}` }}></div><div style={{ flex: 1 }}></div>
          </div>
        ))}
      </div>
    );
    if (kind === 'rows') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bar w={44} h={7} tone={C.skelD} /><Bar w={58} h={7} />
          </div>
        ))}
      </div>
    );
    return <Rows widths={[118, 96, 126, 84]} h={7} gap={9} />;
  };
  return (
    <div style={{ width: 210, height: 150, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 8, padding: 16, boxShadow: '0 8px 20px rgba(21,23,44,.06)', overflow: 'hidden' }}>
      {body()}
    </div>
  );
}

function Mosaic({ reveal = 1, cols = 9, rows = 7, centerKind }) {
  const tones = [C.tBlue, C.tGreen, C.tOrange, C.tLav, C.tYellow, C.tPeach];
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const dc = Math.max(Math.abs(c - (cols - 1) / 2), Math.abs(r - (rows - 1) / 2));
      const t = MOTION.draw(ph(reveal, 0.05 + dc * 0.1, 0.35 + dc * 0.1));
      const isCenter = centerKind && r === Math.floor(rows / 2) && c === Math.floor(cols / 2);
      tiles.push(
        <div key={i} style={{ opacity: t, transform: `scale(${0.88 + 0.12 * t})` }}>
          <MiniTile kind={isCenter ? centerKind : MOSAIC_KINDS[(i * 3 + r) % MOSAIC_KINDS.length]} tone={tones[(i + r) % tones.length]} />
        </div>
      );
    }
  }
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 210px)`, gap: 26,
    }}>{tiles}</div>
  );
}

/* ── scenes ───────────────────────────────────────────────────────────── */
function useTs(offset) {
  const { localTime } = useScene();
  const secs = Math.floor(offset + localTime);
  React.useEffect(() => {
    const el = document.querySelector('[data-om-exportable-video-with-duration-secs]');
    if (el) el.setAttribute('data-screen-label', `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`);
  }, [secs]);
}

/* 1 — 0:00 Word/Grafikprogramm: cursor fights the document (8s) */
function SceneMuehsam() {
  const { progress: p } = useScene();
  useTs(0);
  const caps = window.OM_CAPTIONS !== false;
  // three attempts at moving one picture box; each one snaps back and wrecks the text
  const pull = (a, b, c, d) => {
    const go = MOTION.draw(ph(p, a, b)), back = MOTION.draw(ph(p, c, d));
    return { on: go * (1 - back), held: go - back * go, grab: ph(p, a - 0.03, a) * (1 - ph(p, c - 0.02, c + 0.02)) };
  };
  const A = pull(0.10, 0.23, 0.26, 0.31);
  const B = pull(0.38, 0.49, 0.52, 0.565);
  const Cd = pull(0.62, 0.72, 0.75, 0.79);
  const lift = clamp(A.grab + B.grab + Cd.grab + A.on + B.on + Cd.on, 0, 1);
  const dx = A.on * -176 + B.on * 224 + Cd.on * -104;
  const dy = A.on * -122 + B.on * 92 + Cd.on * 158;
  const rot = A.on * -3.2 + B.on * 4.6 + Cd.on * -6;
  const reflow = clamp(0.32 + 0.46 * A.held + 0.5 * B.held + 0.54 * Cd.held, 0, 1);
  const grabbing = clamp(A.grab + B.grab + Cd.grab, 0, 1);
  const wobble = grabbing * Math.sin(p * 320) * 1.1;
  // camera: creeping push-in plus a jolt on every snap-back
  const jolt = (a) => ph(p, a, a + 0.015) * (1 - ph(p, a + 0.015, a + 0.075)) * Math.sin((p - a) * 620);
  const shake = (jolt(0.26) + jolt(0.52) + jolt(0.75)) * 13;
  const shakeY = (jolt(0.26) + jolt(0.52) + jolt(0.75)) * -7;
  const guides = clamp(A.on + B.on + Cd.on, 0, 1);
  const popover = ph(p, 0.31, 0.35) * (1 - ph(p, 0.45, 0.48));
  const settle = MOTION.draw(ph(p, 0.86, 0.96));
  const cx = 960 + dx * 0.92 * (1 - settle) + shake * 0.6, cy = 470 + dy * 0.92 * (1 - settle);
  const camS = 1 + 0.09 * MOTION.draw(p) + 0.02 * grabbing;
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.soft }}>
      <Cam s={camS} x={shake} y={shakeY} ox="46%" oy="52%">
        <WordDoc imgDX={dx} imgDY={dy} imgRot={rot} lift={lift} reflow={reflow} guides={guides} popover={popover} wobble={wobble} />
        <Cursor x={p < 0.06 ? 1620 - (1620 - cx) * MOTION.draw(ph(p, 0, 0.06)) : cx} y={p < 0.06 ? 900 - (900 - cy) * MOTION.draw(ph(p, 0, 0.06)) : cy} down={clamp(grabbing * 1.3, 0, 1)} />
      </Cam>
    </div>
  );
}

/* 2 — 0:08 beyond image+text: the layout collapses at the program's limits (7s) */
function SceneGrenzen() {
  const { progress: p } = useScene();
  useTs(8);
  const caps = window.OM_CAPTIONS !== false;
  const grid = ph(p, 0.06, 0.26);
  const gridBreak = MOTION.draw(ph(p, 0.3, 0.62));
  const wall = ph(p, 0.6, 0.8);
  const camS = 1.09 + 0.22 * MOTION.draw(ph(p, 0.1, 0.85));
  const cy = 470 + 180 * MOTION.draw(ph(p, 0.06, 0.3));
  const shake = ph(p, 0.62, 0.78) * (1 - ph(p, 0.78, 0.88)) * Math.sin(p * 260) * 5;
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.soft }}>
      <Cam s={camS} x={shake} ox="44%" oy="66%">
        <WordDoc imgDX={0} imgDY={0} reflow={0.32} grid={grid} gridBreak={gridBreak} wall={wall} />
        <Cursor x={960 + 130 * MOTION.draw(ph(p, 0.06, 0.34))} y={cy} down={ph(p, 0.1, 0.14) * (1 - ph(p, 0.2, 0.24))} />
      </Cam>
    </div>
  );
}

/* 3 — 0:15 Edu-It Editor: orange sweep wipes the mess away (3.5s) */
function SceneEduIt() {
  const { progress: p } = useScene();
  useTs(15);
  const sweep = MOTION.draw(ph(p, 0.06, 0.44));
  const mark = ph(p, 0.4, 0.68);
  const m = MOTION.enter(mark, 22);
  const camS = 1.31 - 0.31 * MOTION.draw(ph(p, 0.06, 0.5));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - MOTION.draw(ph(p, 0.1, 0.4)) }}>
        <Cam s={camS} ox="44%" oy="66%">
          <WordDoc reflow={0.32} grid={1} gridBreak={1} wall={1} />
        </Cam>
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: W * sweep, background: '#fff', zIndex: 10 }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 10, background: C.orange, opacity: sweep < 1 ? 1 : 0 }}></div>
      </div>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 26, opacity: m.opacity, transform: `translateY(${m.y}px)`,
      }}>
        <Lockup rule={MOTION.draw(ph(p, 0.5, 0.8))} />
      </div>
    </div>
  );
}

/* 4 — 0:18.5 the worksheet surface with live preview (3.5s) */
function SceneOberflaeche() {
  const { progress: p } = useScene();
  useTs(18.5);
  const caps = window.OM_CAPTIONS !== false;
  const chrome = ph(p, 0.14, 0.46);
  const markOut = 1 - MOTION.draw(ph(p, 0.06, 0.24));
  const blocks = [{ kind: 'heading' }, { kind: 'text' }, { kind: 'mcq', p: ph(p, 0.5, 0.86) }];
  const sel = p > 0.5 ? 2 : -1;
  const cx = 1180 - 180 * MOTION.draw(ph(p, 0.4, 0.62)), cy = 700 - 120 * MOTION.draw(ph(p, 0.4, 0.62));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <EditorShell blocks={blocks} chromeIn={chrome} selected={sel} pageLift={MOTION.draw(ph(p, 0.3, 0.6))} />
      <Cursor x={cx} y={cy} down={ph(p, 0.62, 0.66) * (1 - ph(p, 0.7, 0.74))} opacity={MOTION.draw(ph(p, 0.34, 0.46))} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', opacity: markOut, pointerEvents: 'none',
      }}>
        <div style={{ transform: `scale(${0.8 + 0.2 * markOut})` }}><Lockup /></div>
      </div>
    </div>
  );
}

/* 5 — 0:22 over 100 elements: palette opens, one gets inserted (6s) */
function SceneElemente() {
  const { progress: p } = useScene();
  useTs(22);
  const caps = window.OM_CAPTIONS !== false;
  const open = ph(p, 0.17, 0.27) * (1 - ph(p, 0.62, 0.7));
  const scroll = MOTION.draw(ph(p, 0.24, 0.56));
  const inserted = ph(p, 0.7, 0.96);
  const blocks = [{ kind: 'heading' }, { kind: 'text' }, { kind: 'mcq', p: 1 }];
  if (p > 0.68) blocks.push({ kind: 'grid', p: inserted });
  const cx = 1000 + (150 - 1000) * MOTION.draw(ph(p, 0.02, 0.13))
    + (700 - 150) * MOTION.draw(ph(p, 0.28, 0.42)) + (640 - 700) * MOTION.draw(ph(p, 0.66, 0.8));
  const cy = 580 + (440 - 580) * MOTION.draw(ph(p, 0.02, 0.13))
    + (470 - 440) * MOTION.draw(ph(p, 0.28, 0.42)) + (700 - 470) * MOTION.draw(ph(p, 0.66, 0.8));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <EditorShell blocks={blocks} selected={p > 0.7 ? 3 : 2} palette={open} paletteScroll={scroll} />
      <Cursor x={cx} y={cy} down={ph(p, 0.15, 0.19) * (1 - ph(p, 0.23, 0.27)) + ph(p, 0.58, 0.62) * (1 - ph(p, 0.66, 0.7))} />
      {caps && <Caption text="Über 100 Elemente" show={ph(p, 0.3, 0.44)} out={ph(p, 0.56, 0.64)} />}
    </div>
  );
}

/* 6 — 0:28 rapid-fire element types, full frame each (6s) */
function SceneTypen() {
  const { progress: p } = useScene();
  useTs(28);
  const caps = window.OM_CAPTIONS !== false;
  const beats = [
    { key: 'mcq', label: 'Multiple-Choice', scale: 1.9, El: MCQGlyph },
    { key: 'grid', label: 'Wortgitter', scale: 1.55, El: WordGridGlyph },
    { key: 'domino', label: 'Dominospiel', scale: 1.35, El: DominoGlyph },
    { key: 'cards', label: 'Lernkarten', scale: 1.45, El: CardsGlyph },
    { key: 'verb', label: 'Verbtabelle', scale: 1.55, El: VerbTableGlyph },
  ];
  const zoomIn = MOTION.draw(ph(p, 0, 0.13));
  const seg = 1 / beats.length;
  const idx = Math.min(beats.length - 1, Math.floor(p / seg));
  const lp = clamp((p - idx * seg) / seg, 0, 1);
  const b = beats[idx];
  const drift = 1 + 0.05 * MOTION.draw(lp);
  const blocks = [{ kind: 'heading' }, { kind: 'text' }, { kind: 'mcq', p: 1 }, { kind: 'grid', p: 1 }];
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      {zoomIn < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - zoomIn }}>
          <Cam s={1 + 1.6 * zoomIn} ox="50%" oy="34%"><EditorShell blocks={blocks} selected={3} /></Cam>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: zoomIn }}>
        <div style={{ transform: `scale(${b.scale * drift})` }}>
          <b.El p={idx === 0 ? clamp(lp * 1.35, 0, 1) : lp} />
        </div>
      </div>
      {caps && (
        <div style={{ position: 'absolute', left: 104, bottom: 96, zIndex: 80, opacity: MOTION.draw(ph(p, 0.13, 0.2)) * (1 - MOTION.draw(ph(p, 0.95, 1))) }}>
          <div style={{ width: 72, height: 4, background: C.orange, marginBottom: 18 }}></div>
          <div style={{ font: `800 52px/1.05 ${FONT}`, letterSpacing: '-.035em', color: C.navy }}>{b.label}</div>
        </div>
      )}
    </div>
  );
}

/* 7 — 0:34 pull back: no limits (2.5s) */
function SceneKeineGrenzen() {
  const { progress: p } = useScene();
  useTs(34);
  const caps = window.OM_CAPTIONS !== false;
  const out = MOTION.draw(ph(p, 0.06, 0.76));
  const s = 4.0 - 3.28 * out;
  const hold = 1 - MOTION.draw(ph(p, 0.05, 0.24));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      <Cam s={s} ox="50%" oy="50%">
        <Mosaic reveal={clamp(0.1 + p * 1.5, 0, 1)} centerKind="verb" />
      </Cam>
      {hold > 0.01 && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center', opacity: hold,
        }}>
          <div style={{ transform: `scale(${1.6275 * (1 - 0.16 * MOTION.draw(ph(p, 0, 0.24)))})` }}>
            <VerbTableGlyph p={1} />
          </div>
        </div>
      )}
    </div>
  );
}

/* 8 — 0:36.5 niveaugerecht auf Knopfdruck (4s) */
function SceneNiveau() {
  const { progress: p } = useScene();
  useTs(36.5);
  const caps = window.OM_CAPTIONS !== false;
  const collapse = MOTION.draw(ph(p, 0.03, 0.26));
  const spin = ph(p, 0.46, 0.56) * (1 - ph(p, 0.64, 0.72));
  const dense = MOTION.draw(ph(p, 0.66, 0.86));
  const level = p < 0.42 ? 0 : 5;
  const blocks = [{ kind: 'heading' }, { kind: 'text' }, { kind: 'mcq', p: 1 }, { kind: 'verb', p: dense }];
  const cx = 1620 + 60 * MOTION.draw(ph(p, 0.28, 0.42)), cy = 300;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: MOTION.draw(ph(p, 0.16, 0.34)) }}>
        <EditorShell blocks={blocks} level={level} dense={dense} spinner={spin} />
        <Cursor x={cx} y={cy} down={ph(p, 0.4, 0.44) * (1 - ph(p, 0.48, 0.52))} opacity={MOTION.draw(ph(p, 0.24, 0.36))} />
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - collapse, pointerEvents: 'none' }}>
        <Cam s={0.72 - 0.42 * collapse} ox="50%" oy="50%"><Mosaic reveal={1} /></Cam>
      </div>
    </div>
  );
}

/* 9 — 0:40.5 Lösungsblatt herunterladen (3.5s) */
function SceneLoesung() {
  const { progress: p } = useScene();
  useTs(40.5);
  const caps = window.OM_CAPTIONS !== false;
  const sol = ph(p, 0.16, 0.34);
  const dl = ph(p, 0.62, 0.8);
  const blocks = [{ kind: 'heading' }, { kind: 'text' }, { kind: 'mcq', p: 1 }, { kind: 'verb', p: 1 }];
  const cx = 1680 - 8 * MOTION.draw(ph(p, 0.38, 0.58));
  const cy = 300 - 258 * MOTION.draw(ph(p, 0.38, 0.58));
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      <EditorShell blocks={blocks} level={5} dense={1} solutions={sol} download={dl} />
      <Cursor x={cx} y={cy} down={ph(p, 0.1, 0.14) * (1 - ph(p, 0.2, 0.24)) + ph(p, 0.56, 0.6) * (1 - ph(p, 0.66, 0.7))} />
    </div>
  );
}

const SCENE_MAP = {
  'Muehsam': SceneMuehsam,
  'Grenzen': SceneGrenzen,
  'EduIt': SceneEduIt,
  'Oberflaeche': SceneOberflaeche,
  'Elemente': SceneElemente,
  'Typen': SceneTypen,
  'KeineGrenzen': SceneKeineGrenzen,
  'Niveau': SceneNiveau,
  'Loesungsblatt': SceneLoesung,
};

function EduitTutorial() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, captions: true, cursor: true });
  window.OM_CAPTIONS = t.captions !== false;
  window.OM_CURSOR = t.cursor !== false;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', fontFamily: FONT }}>
      <SceneStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#ffffff">
        {SCENE_MAP}
      </SceneStage>
      <TweaksPanel>
        <TweakSection label="Video" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        <TweakToggle label="Text-Einblendungen" value={t.captions} onChange={(v) => setTweak('captions', v)} />
        <TweakToggle label="Mauszeiger" value={t.cursor} onChange={(v) => setTweak('cursor', v)} />
      </TweaksPanel>
    </div>
  );
}

window.EduitTutorial = EduitTutorial;
