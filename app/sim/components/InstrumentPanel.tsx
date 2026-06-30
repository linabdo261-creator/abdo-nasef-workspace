"use client";

import { memo } from "react";
import {
  RAD_TO_DEG,
  mToFeet,
  mpsToFpm,
  mpsToKnots,
  type EngineType,
  type FlightInstruments,
  type RigidBodyState,
} from "@/lib/sim";

export interface SpeedRefs {
  stallClean: number;
  stallLanding: number;
  maxFlap: number;
  neverExceed: number;
}

interface Props {
  instruments: FlightInstruments;
  state: RigidBodyState;
  rpm: number;
  n1: number;
  engineType: EngineType;
  speeds: SpeedRefs;
  lit: boolean;
}

const SIZE = 130;
const C = SIZE / 2;

function polar(r: number, angleDeg: number, cx = C, cy = C) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function Bezel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={C} cy={C} r={C - 1} fill="#0c0f16" stroke="#2b323f" strokeWidth={2} />
        {children}
      </svg>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
        {label}
      </span>
    </div>
  );
}

function Needle({ angle, length, width = 2.5, color = "#f4f5f7" }: {
  angle: number;
  length: number;
  width?: number;
  color?: string;
}) {
  const tip = polar(length, angle);
  const tail = polar(-12, angle);
  return (
    <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
  );
}

function ticks(count: number, rInner: number, rOuter: number, sweep = 360, start = 0) {
  const items = [];
  for (let i = 0; i <= count; i++) {
    const ang = start + (i / count) * sweep;
    const a = polar(rInner, ang);
    const b = polar(rOuter, ang);
    items.push(
      <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#69707d" strokeWidth={1} />,
    );
  }
  return items;
}

function arc(rInner: number, v0: number, v1: number, toAngle: (v: number) => number, color: string) {
  const a0 = toAngle(v0);
  const a1 = toAngle(v1);
  const p0 = polar(rInner, a0);
  const p1 = polar(rInner, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return (
    <path
      d={`M ${p0.x} ${p0.y} A ${rInner} ${rInner} 0 ${large} 1 ${p1.x} ${p1.y}`}
      fill="none"
      stroke={color}
      strokeWidth={3}
    />
  );
}

function Airspeed({ ias, refs }: { ias: number; refs: SpeedRefs }) {
  const max = Math.ceil((refs.neverExceed * 1.12) / 20) * 20;
  const toAngle = (v: number) => -120 + (Math.min(Math.max(v, 0), max) / max) * 240;
  const greenTop = refs.neverExceed * 0.9;
  const labelStep = max <= 200 ? 40 : 80;
  const labels: number[] = [];
  for (let v = 0; v <= max; v += labelStep) labels.push(v);
  return (
    <Bezel label="Airspeed kt">
      {arc(C - 10, refs.stallLanding, refs.maxFlap, toAngle, "#cfd3da")}
      {arc(C - 10, refs.stallClean, greenTop, toAngle, "#3fa34d")}
      {arc(C - 10, greenTop, refs.neverExceed, toAngle, "#d9a441")}
      {arc(C - 10, refs.neverExceed, max, toAngle, "#cc3b3b")}
      {ticks(Math.round(max / 10), C - 16, C - 8)}
      {labels.map((v) => {
        const p = polar(C - 28, toAngle(v));
        return (
          <text key={v} x={p.x} y={p.y + 3} fontSize={8} fill="#c3c8d1" textAnchor="middle">
            {v}
          </text>
        );
      })}
      <Needle angle={toAngle(ias)} length={C - 22} color="#ffffff" />
      <circle cx={C} cy={C} r={4} fill="#cbd1da" />
    </Bezel>
  );
}

function N1Gauge({ n1 }: { n1: number }) {
  const max = 110;
  const toAngle = (v: number) => -120 + (Math.min(Math.max(v, 0), max) / max) * 240;
  return (
    <Bezel label="N1 %">
      {arc(C - 10, 0, 100, toAngle, "#3fa34d")}
      {arc(C - 10, 100, max, toAngle, "#cc3b3b")}
      {ticks(11, C - 16, C - 8, 240, -120)}
      {[0, 20, 40, 60, 80, 100].map((v) => {
        const p = polar(C - 28, toAngle(v));
        return (
          <text key={v} x={p.x} y={p.y + 3} fontSize={8} fill="#c3c8d1" textAnchor="middle">
            {v}
          </text>
        );
      })}
      <Needle angle={toAngle(n1)} length={C - 20} color="#ffffff" />
      <circle cx={C} cy={C} r={4} fill="#cbd1da" />
      <text x={C} y={C + 34} fontSize={10} fill="#7fe3a0" textAnchor="middle" fontFamily="monospace">
        {n1.toFixed(0)}%
      </text>
    </Bezel>
  );
}

function Attitude({ roll, pitch }: { roll: number; pitch: number }) {
  const rollDeg = roll * RAD_TO_DEG;
  const pitchPx = Math.max(-60, Math.min(60, pitch * RAD_TO_DEG)) * 1.6;
  return (
    <Bezel label="Attitude">
      <defs>
        <clipPath id="att-clip">
          <circle cx={C} cy={C} r={C - 6} />
        </clipPath>
      </defs>
      <g clipPath="url(#att-clip)">
        <g transform={`rotate(${-rollDeg} ${C} ${C})`}>
          <g transform={`translate(0 ${pitchPx})`}>
            <rect x={-C} y={-SIZE} width={SIZE * 2} height={SIZE * 2} fill="#3d83c4" />
            <rect x={-C} y={C} width={SIZE * 2} height={SIZE * 2} fill="#6b4a2b" />
            <line x1={-C} y1={C} x2={SIZE + C} y2={C} stroke="#ffffff" strokeWidth={2} />
            {[-30, -20, -10, 10, 20, 30].map((d) => {
              const y = C + d * 1.6;
              const w = d % 20 === 0 ? 26 : 14;
              return (
                <g key={d}>
                  <line x1={C - w} y1={y} x2={C + w} y2={y} stroke="#ffffff" strokeWidth={1} />
                </g>
              );
            })}
          </g>
        </g>
        <g transform={`rotate(${-rollDeg} ${C} ${C})`}>
          <polygon points={`${C},8 ${C - 5},18 ${C + 5},18`} fill="#f4d03f" />
        </g>
      </g>
      <line x1={C - 26} y1={C} x2={C - 8} y2={C} stroke="#f4d03f" strokeWidth={3} />
      <line x1={C + 8} y1={C} x2={C + 26} y2={C} stroke="#f4d03f" strokeWidth={3} />
      <circle cx={C} cy={C} r={2.5} fill="#f4d03f" />
    </Bezel>
  );
}

function Altimeter({ altFt }: { altFt: number }) {
  const hundreds = ((altFt % 1000) / 1000) * 360;
  const thousands = ((altFt % 10000) / 10000) * 360;
  return (
    <Bezel label="Altitude ft">
      {ticks(10, C - 16, C - 8)}
      {Array.from({ length: 10 }).map((_, i) => {
        const p = polar(C - 26, i * 36);
        return (
          <text key={i} x={p.x} y={p.y + 3} fontSize={9} fill="#c3c8d1" textAnchor="middle">
            {i}
          </text>
        );
      })}
      <Needle angle={thousands} length={C - 40} width={3.5} color="#dfe3ea" />
      <Needle angle={hundreds} length={C - 18} width={2} color="#ffffff" />
      <circle cx={C} cy={C} r={4} fill="#cbd1da" />
      <text x={C} y={C + 34} fontSize={11} fill="#7fe3a0" textAnchor="middle" fontFamily="monospace">
        {Math.round(altFt).toLocaleString()}
      </text>
    </Bezel>
  );
}

function Heading({ headingDeg }: { headingDeg: number }) {
  return (
    <Bezel label="Heading">
      <g transform={`rotate(${-headingDeg} ${C} ${C})`}>
        {Array.from({ length: 36 }).map((_, i) => {
          const ang = i * 10;
          const a = polar(C - 14, ang);
          const b = polar(C - 8, ang);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#69707d" strokeWidth={1} />;
        })}
        {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([lbl, ang]) => {
          const p = polar(C - 26, ang as number);
          return (
            <text key={lbl} x={p.x} y={(p.y as number) + 4} fontSize={11} fill="#f4f5f7" textAnchor="middle" transform={`rotate(${ang} ${p.x} ${p.y})`}>
              {lbl}
            </text>
          );
        })}
      </g>
      <polygon points={`${C},8 ${C - 5},18 ${C + 5},18`} fill="#f4d03f" />
      <line x1={C} y1={C - 16} x2={C} y2={C + 16} stroke="#f4d03f" strokeWidth={2} />
      <line x1={C - 12} y1={C} x2={C + 12} y2={C} stroke="#f4d03f" strokeWidth={2} />
      <text x={C} y={C + 34} fontSize={11} fill="#7fe3a0" textAnchor="middle" fontFamily="monospace">
        {String(Math.round(headingDeg) % 360).padStart(3, "0")}°
      </text>
    </Bezel>
  );
}

function VerticalSpeed({ fpm }: { fpm: number }) {
  const v = Math.max(-2000, Math.min(2000, fpm));
  const toAngle = (x: number) => 270 + (x / 2000) * 90;
  return (
    <Bezel label="Vert Speed">
      {ticks(8, C - 16, C - 8, 180, 180)}
      {[-2, -1, 0, 1, 2].map((k) => {
        const p = polar(C - 28, toAngle(k * 1000));
        return (
          <text key={k} x={p.x} y={p.y + 3} fontSize={8} fill="#c3c8d1" textAnchor="middle">
            {Math.abs(k)}
          </text>
        );
      })}
      <Needle angle={toAngle(v)} length={C - 18} color="#ffffff" />
      <circle cx={C} cy={C} r={4} fill="#cbd1da" />
    </Bezel>
  );
}

function TurnCoordinator({ turnRate, slip }: { turnRate: number; slip: number }) {
  const bank = Math.max(-30, Math.min(30, turnRate * RAD_TO_DEG * 2));
  const ballX = C + Math.max(-14, Math.min(14, slip * 60));
  return (
    <Bezel label="Turn Coord">
      <g transform={`rotate(${bank} ${C} ${C})`}>
        <line x1={C - 34} y1={C} x2={C - 12} y2={C} stroke="#dfe3ea" strokeWidth={3} />
        <line x1={C + 12} y1={C} x2={C + 34} y2={C} stroke="#dfe3ea" strokeWidth={3} />
        <circle cx={C} cy={C} r={4} fill="#dfe3ea" />
        <line x1={C} y1={C} x2={C} y2={C - 10} stroke="#dfe3ea" strokeWidth={3} />
      </g>
      <rect x={C - 20} y={C + 26} width={40} height={12} rx={6} fill="#11151d" stroke="#2b323f" />
      <line x1={C - 6} y1={C + 26} x2={C - 6} y2={C + 38} stroke="#3a414e" />
      <line x1={C + 6} y1={C + 26} x2={C + 6} y2={C + 38} stroke="#3a414e" />
      <circle cx={ballX} cy={C + 32} r={4} fill="#e8e8e8" />
    </Bezel>
  );
}

function Tachometer({ rpm }: { rpm: number }) {
  const max = 3000;
  const toAngle = (v: number) => -120 + (Math.min(Math.max(v, 0), max) / max) * 240;
  return (
    <Bezel label="Tach RPM">
      {arc(C - 10, 2000, 2700, toAngle, "#3fa34d")}
      {arc(C - 10, 2700, max, toAngle, "#cc3b3b")}
      {ticks(6, C - 16, C - 8, 240, -120)}
      {[0, 1, 2, 3].map((k) => {
        const p = polar(C - 28, toAngle(k * 1000));
        return (
          <text key={k} x={p.x} y={p.y + 3} fontSize={9} fill="#c3c8d1" textAnchor="middle">
            {k}
          </text>
        );
      })}
      <Needle angle={toAngle(rpm)} length={C - 20} color="#ffffff" />
      <circle cx={C} cy={C} r={4} fill="#cbd1da" />
      <text x={C} y={C + 34} fontSize={10} fill="#7fe3a0" textAnchor="middle" fontFamily="monospace">
        {Math.round(rpm)}
      </text>
    </Bezel>
  );
}

function InstrumentPanelInner({
  instruments,
  state,
  rpm,
  n1,
  engineType,
  speeds,
  lit,
}: Props) {
  return (
    <div
      className="grid grid-cols-3 gap-2 rounded-lg border border-gray-800 bg-[#070a10] p-3"
      style={{ filter: lit ? "none" : "brightness(0.55)" }}
    >
      <Airspeed ias={mpsToKnots(instruments.indicatedAirspeed)} refs={speeds} />
      <Attitude roll={state.roll} pitch={state.pitch} />
      <Altimeter altFt={mToFeet(state.altitude)} />
      <TurnCoordinator turnRate={state.r} slip={instruments.beta} />
      <Heading headingDeg={state.heading * RAD_TO_DEG} />
      <VerticalSpeed fpm={mpsToFpm(instruments.verticalSpeed)} />
      <div className="col-span-3 flex justify-center">
        {engineType === "turbofan" ? <N1Gauge n1={n1} /> : <Tachometer rpm={rpm} />}
      </div>
    </div>
  );
}

export const InstrumentPanel = memo(InstrumentPanelInner);
