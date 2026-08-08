import React from 'react';
import { MOTION, arrive, clamp, pulse, track } from './motion';
import { CUES, TOTAL_SECONDS } from './scenes';

/* ---------- design constants (authored at 1920x1080) ---------- */

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const H = 170; // piece height
const R = 48; // knob radius
const STEM_W = 380; // the Stamm piece never changes width
const END_W = 340; // the Endung piece never changes width either
const FS = 76; // base label size

const INK = {
  stemBg: '#c5dcf1',
  stemInk: '#2a71b9',
  endBg: '#f6cd9d',
  endInk: '#a65300',
  proBg: '#ece6f8',
  proInk: '#5b4387',
};

const B = CUES.beispiele;
const K = CUES.konjugation;

/* ---------- primitives ---------- */

function piecePath(w: number, h: number, rn: number, rt: number): string {
  const cy = h / 2;
  let d = `M 0 0 L ${w} 0 `;
  if (rt > 0.3) {
    d += `L ${w} ${cy - rt} A ${rt} ${rt} 0 0 1 ${w} ${cy + rt} `;
  }
  d += `L ${w} ${h} L 0 ${h} `;
  if (rn > 0.3) {
    d += `L 0 ${cy + rn} A ${rn} ${rn} 0 0 0 0 ${cy - rn} `;
  }
  return d + 'Z';
}

interface PieceProps {
  x: number;
  w: number;
  bg: string;
  rn?: number;
  rt?: number;
  opacity?: number;
  scale?: number;
  origin?: string;
  children?: React.ReactNode;
}

const Piece: React.FC<PieceProps> = ({
  x, w, bg, rn = 0, rt = 0, opacity = 1, scale = 1, origin = '50% 50%', children,
}) => {
  const sw = w + (rt > 0.3 ? rt : 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: -H / 2,
        width: sw,
        height: H,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: origin,
      }}
    >
      <svg
        width={sw}
        height={H}
        viewBox={`0 0 ${sw} ${H}`}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      >
        <path
          d={piecePath(w, H, rn, rt)}
          fill={bg}
          stroke="#ffffff"
          strokeWidth={11}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: w,
          height: H,
          transform: `translateX(${rn / 2}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export interface LabelItem {
  text: string;
  /** seconds at which this label takes over the piece */
  at: number;
  fs?: number;
}

const Labels: React.FC<{ T: number; w: number; items: LabelItem[]; color: string }> = ({
  T, w, items, color,
}) => (
  <>
    {items.map((it, i) => {
      const next = i + 1 < items.length ? items[i + 1].at : Number.MAX_SAFE_INTEGER;
      const inP = MOTION.enter({ from: 0, to: 1, start: it.at, end: it.at + 0.34 })(T);
      const outP = MOTION.enter({ from: 0, to: 1, start: next, end: next + 0.28 })(T);
      const op = clamp(inP - outP, 0, 1);
      if (op <= 0.003) return null;
      const dy = (1 - inP) * 26 - outP * 26;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: w,
            height: H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: op,
            transform: `translateY(${dy}px)`,
            color,
            fontSize: it.fs || FS,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {it.text}
        </div>
      );
    })}
  </>
);

const ExampleRow: React.FC<{
  T: number;
  y: number;
  stem: string;
  stemAt: number;
  stemIn: (T: number) => number;
  endIn: (T: number) => number;
  stemPulseAt: number;
  pulseAt: number;
  exit: number;
}> = ({ T, y, stem, stemAt, stemIn, endIn, stemPulseAt, pulseAt, exit }) => {
  const dxStem = stemIn(T);
  const dxEnd = endIn(T);
  const p = pulse(pulseAt)(T);
  const ps = pulse(stemPulseAt)(T);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(600px, ${y + exit * 46}px)`,
        opacity: 1 - exit,
      }}
    >
      <Piece x={dxStem} w={STEM_W} rt={R} bg={INK.stemBg} scale={1 + 0.035 * ps} origin="100% 50%">
        <Labels T={T} w={STEM_W} items={[{ text: stem, at: stemAt }]} color={INK.stemInk} />
      </Piece>
      <Piece x={STEM_W + dxEnd} w={END_W} rn={R} bg={INK.endBg} scale={1 + 0.055 * p} origin="0% 50%">
        <Labels T={T} w={END_W} items={[{ text: 'en', at: stemAt }]} color={INK.endInk} />
      </Piece>
    </div>
  );
};

/** dazit wordmark, inlined so there is no asset-path dependency. */
const Logo: React.FC = () => (
  <div style={{ position: 'absolute', right: 154, bottom: 86, width: 132, opacity: 0.9 }}>
    <svg viewBox="0 0 871.56 277.7" width={132} height={42}>
      <path fill="#4f6899" d="M0,186.61184c0-51.17285,30.02148-91.08789,79.48926-91.08789,20.46924,0,38.55078,6.82227,50.1499,19.78613-.34082-3.07031-.68213-18.42188-.68213-27.63281v-49.46777h76.41895v235.39746h-73.68994v-18.08105c-9.55225,12.62207-28.99805,22.1748-52.19678,22.1748C30.02148,277.7007,0,237.78566,0,186.61184ZM131.34521,186.27102c0-19.44629-12.28174-30.02148-26.95166-30.02148-14.32812,0-27.29248,10.5752-27.29248,30.02148,0,20.12793,12.96436,30.7041,27.29248,30.7041,14.66992,0,26.95166-10.57617,26.95166-30.7041Z" />
      <path fill="#4f6899" d="M220.75342,186.61184c0-51.17285,30.02197-91.08789,79.48926-91.08789,20.46875,0,40.25586,7.16406,52.19629,22.1748v-18.08105h73.68945v173.98926h-73.68945v-18.08105c-9.55176,12.62207-28.99805,22.1748-52.19629,22.1748-49.46729,0-79.48926-39.91504-79.48926-91.08887ZM352.09814,186.27102c0-19.44629-12.28223-30.02148-26.95117-30.02148-14.32861,0-27.29248,10.5752-27.29248,30.02148,0,20.12793,12.96387,30.7041,27.29248,30.7041,14.66895,0,26.95117-10.57617,26.95117-30.7041Z" />
      <path fill="#4f6899" d="M760.34491,210.83449v-53.2207h-23.54004v-57.99609h23.54004v-61.40822h76.41895v61.40822h34.79785v57.99609h-34.79785v46.73828c0,9.55273,4.43457,12.62305,13.9873,12.62305,6.14062,0,11.94043-1.02344,17.05762-3.07031l3.75293,57.31445c-9.89355,3.41113-26.26953,6.48145-45.71484,6.48145-46.05664,0-65.50195-21.83398-65.50195-66.86621Z" />
      <polygon fill="#cc6600" points="639.27069 215.61086 538.60175 215.61086 609.56268 142.26223 609.56268 99.6177 448.53732 99.6177 448.53732 157.61379 511.30978 157.61379 445.12521 234.37355 445.12521 273.60695 639.27069 273.60695 680.12177 273.60695 715.68964 273.60695 715.68964 103.02883 639.27069 103.02883 639.27069 215.61086" />
      <circle fill="#cc6600" cx="677.48016" cy="38.20945" r="38.20946" />
    </svg>
  </div>
);

/* ---------- public component ---------- */

export interface VerbPartsProps {
  /** Current frame. Required for pure rendering; the editor supplies it. */
  frame?: number;
  fps?: number;
  durationInFrames?: number;
  /** Output size. The 1920x1080 design is scaled to fit. */
  width?: number;
  height?: number;
  /** Verb stem shown on the blue piece. */
  stem?: string;
  showLogo?: boolean;
  fontFamily?: string;
  backgroundColor?: string;
}

/**
 * Pure renderer: output depends only on props. No hooks, no context,
 * no side effects — mountable in any React tree.
 */
export const VerbParts: React.FC<VerbPartsProps> = ({
  frame = 0,
  fps = 30,
  width = CANVAS_W,
  height = CANVAS_H,
  stem = 'koch',
  showLogo = true,
  fontFamily = "'Encode Sans Semi Condensed', system-ui, sans-serif",
  backgroundColor = '#ffffff',
}) => {
  const T = frame / fps;
  const total = TOTAL_SECONDS;
  const fit = Math.min(width / CANVAS_W, height / CANVAS_H);

  // hero pair: scale and position of the group
  const S = track([[0, 1.75], [B + 0.15, 1.75], [B + 1.55, 1], [K + 0.6, 1], [K + 2.0, 1.25]])(T);
  const gy = track([[0, 540], [B + 0.15, 540], [B + 1.55, 314], [K + 0.6, 314], [K + 2.0, 540]])(T);

  const stemDx = arrive(-880, 0.3, 1.55)(T);
  const endDx = arrive(920, 1.55, 2.85)(T);
  const proDx = arrive(-720, K + 1.8, K + 3.0)(T);
  const knob = MOTION.move({ from: 0, to: R, start: K + 1.9, end: K + 2.6 })(T);
  const proOp = MOTION.enter({ from: 0, to: 1, start: K + 1.75, end: K + 2.1 })(T);

  const endW = track([[0, 470], [B + 0.55, 470], [B + 1.05, END_W]])(T);
  const proW = 520;
  // how much of the pronoun piece counts toward group width, so centring never jumps
  const proIn = MOTION.move({ from: 0, to: 1, start: K + 0.6, end: K + 2.2 })(T);
  const gx = CANVAS_W / 2 - ((STEM_W + endW) * S) / 2 + proIn * (proW / 2) * S;

  // stem-swap beats: ich koch/wohn/lern, du koch/wohn/lern, er-sie-es koch/wohn/lern
  const stemBeats = [K + 5.4, K + 7.8, K + 10.4, K + 12.8, K + 15.2, K + 17.8, K + 20.2, K + 22.6];
  const stemWords = ['wohn', 'lern', stem, 'wohn', 'lern', stem, 'wohn', 'lern'];
  const stemItems: LabelItem[] = [
    { text: 'Stamm', at: 0.3 },
    { text: stem, at: B + 0.6 },
    ...stemBeats.map((t, i) => ({ text: stemWords[i], at: t })),
  ];

  const endPulse =
    pulse(B + 5.55)(T) + pulse(K + 3.0)(T) + pulse(K + 10.4)(T) + pulse(K + 17.8)(T);
  const stemPulse = stemBeats.reduce((a, t) => a + pulse(t)(T), pulse(B + 5.2)(T));
  const proPulse = pulse(K + 10.4)(T) + pulse(K + 17.8)(T);

  const exitAll = MOTION.move({ from: 0, to: 1, start: K + 26.0, end: K + 27.1 })(T);
  const camS = track([[0, 1], [total, 1.018]])(T);
  const camY = track([[0, 0], [total, -12]])(T);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        background: backgroundColor,
        overflow: 'hidden',
        fontFamily,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: (width - CANVAS_W * fit) / 2,
          top: (height - CANVAS_H * fit) / 2,
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${fit})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${camY}px) scale(${camS})`,
            transformOrigin: '50% 50%',
          }}
        >
          <ExampleRow
            T={T}
            y={540}
            stem="wohn"
            stemAt={B + 1.6}
            stemIn={arrive(-1420, B + 1.6, B + 2.9)}
            endIn={arrive(1460, B + 1.85, B + 3.15)}
            stemPulseAt={B + 5.9}
            pulseAt={B + 6.25}
            exit={MOTION.move({ from: 0, to: 1, start: K + 0.2, end: K + 1.1 })(T)}
          />
          <ExampleRow
            T={T}
            y={766}
            stem="lern"
            stemAt={B + 3.0}
            stemIn={arrive(-1420, B + 3.0, B + 4.3)}
            endIn={arrive(1460, B + 3.25, B + 4.55)}
            stemPulseAt={B + 6.6}
            pulseAt={B + 6.95}
            exit={MOTION.move({ from: 0, to: 1, start: K + 0.35, end: K + 1.25 })(T)}
          />

          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${gx}px, ${gy - exitAll * 40}px) scale(${S})`,
              transformOrigin: '0 0',
              opacity: 1 - exitAll,
            }}
          >
            <Piece
              x={-proW + proDx}
              w={proW}
              rt={knob}
              bg={INK.proBg}
              opacity={proOp}
              scale={1 + 0.05 * proPulse}
              origin="100% 50%"
            >
              <Labels
                T={T}
                w={proW}
                items={[
                  { text: 'ich', at: K + 1.7 },
                  { text: 'du', at: K + 10.4 },
                  { text: 'er / sie / es', at: K + 17.8 },
                ]}
                color={INK.proInk}
              />
            </Piece>

            <Piece
              x={stemDx}
              w={STEM_W}
              rn={knob}
              rt={R}
              bg={INK.stemBg}
              scale={1 + 0.035 * stemPulse}
              origin="100% 50%"
            >
              <Labels T={T} w={STEM_W} items={stemItems} color={INK.stemInk} />
            </Piece>

            <Piece
              x={STEM_W + endDx}
              w={endW}
              rn={R}
              bg={INK.endBg}
              scale={1 + 0.055 * endPulse}
              origin="0% 50%"
            >
              <Labels
                T={T}
                w={endW}
                items={[
                  { text: 'Endung', at: 1.55 },
                  { text: 'en', at: B + 0.65 },
                  { text: 'e', at: K + 3.0 },
                  { text: 'st', at: K + 10.4 },
                  { text: 't', at: K + 17.8 },
                ]}
                color={INK.endInk}
              />
            </Piece>
          </div>
        </div>
        {showLogo ? <Logo /> : null}
      </div>
    </div>
  );
};

export default VerbParts;
